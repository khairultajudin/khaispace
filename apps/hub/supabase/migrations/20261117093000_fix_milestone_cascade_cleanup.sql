-- ==============================================================================
-- KHAI SPACE HUB — MIGRATION: FIX MILESTONE / PROJECT / WORKSPACE CASCADE CLEANUP
-- ==============================================================================
-- Migration: 20261117093000_fix_milestone_cascade_cleanup.sql
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- Root Cause:
--   During project or workspace deletion cascades, `tasks` rows with a non-NULL
--   `milestone_id` triggered `handle_milestone_deletion_cleanup()` (or
--   `fk_task_milestone_ws ON DELETE SET NULL`) AFTER the parent `projects` row
--   was already removed, causing `UPDATE public.tasks SET milestone_id = NULL`
--   to fail `fk_task_project_ws`.
-- Fix:
--   1. `handle_project_deletion_cleanup()` clears `tasks.milestone_id` while
--      the parent `projects` row still exists.
--   2. `handle_workspace_deletion_authorization()` clears `tasks.milestone_id`
--      for the workspace while `workspaces` and `projects` still exist.
--   3. `handle_milestone_deletion_cleanup()` skips updating `tasks` if the
--      parent `projects` row no longer exists (project-cascade case).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_project_deletion_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF current_setting('app.deleting_workspace_id', true) = OLD.workspace_id::text THEN
    RETURN OLD;
  END IF;

  UPDATE public.tasks
  SET milestone_id = NULL
  WHERE workspace_id = OLD.workspace_id
    AND project_id = OLD.id
    AND milestone_id IS NOT NULL;

  UPDATE public.financial_transactions
  SET project_id = NULL
  WHERE workspace_id = OLD.workspace_id AND project_id = OLD.id;

  UPDATE public.ai_subscriptions
  SET assigned_project_id = NULL
  WHERE workspace_id = OLD.workspace_id AND assigned_project_id = OLD.id;

  UPDATE public.workspace_notes
  SET project_id = NULL
  WHERE workspace_id = OLD.workspace_id AND project_id = OLD.id;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_milestone_deletion_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF current_setting('app.deleting_workspace_id', true) = OLD.workspace_id::text THEN
    RETURN OLD;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE workspace_id = OLD.workspace_id AND id = OLD.project_id
  ) THEN
    RETURN OLD;
  END IF;

  UPDATE public.tasks
  SET milestone_id = NULL
  WHERE workspace_id = OLD.workspace_id AND milestone_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_workspace_deletion_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = OLD.id
      AND user_id = auth.uid()
      AND role = 'Owner'
      AND status = 'Active'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the verified workspace Owner can delete a workspace.';
  END IF;

  PERFORM set_config('app.deleting_workspace_id', OLD.id::text, true);

  UPDATE public.tasks
  SET milestone_id = NULL
  WHERE workspace_id = OLD.id
    AND milestone_id IS NOT NULL;

  RETURN OLD;
END;
$$;
