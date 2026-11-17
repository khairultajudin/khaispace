-- ==============================================================================
-- KHAI SPACE HUB — PHASE 6 SECURITY REMEDIATION MIGRATION (OPTION B)
-- ==============================================================================
-- Migration: 20261116144728_phase6_privilege_and_profile_remediation.sql
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- Applied: 2026-11-16 (Phase 6 closure)
-- ==============================================================================

-- Section 1A: Existing-Object Privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_note_type_change() FROM PUBLIC, anon, authenticated;

-- Minimal table grants for `authenticated` (Option B: profiles SELECT + column-level UPDATE only)
GRANT SELECT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invitations TO authenticated;
GRANT SELECT, UPDATE ON public.workspace_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_notes TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;

-- Read-only SELECT grants on the 3 security_invoker=true financial views
GRANT SELECT ON public.view_overall_finance_kpis TO authenticated;
GRANT SELECT ON public.view_project_finance_summary TO authenticated;
GRANT SELECT ON public.view_monthly_financial_trends TO authenticated;

-- Section 1B: Future-Object Default Privileges (postgres)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Section 2: Option B Profile Protection & Authoritative Log Identity
ALTER POLICY "Users insert own profile" ON public.profiles WITH CHECK (false);

GRANT UPDATE (full_name, display_name, bio, location, timezone, avatar_initials)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profiles_email_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email
     AND current_user NOT IN ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role') THEN
    RAISE EXCEPTION 'Security Violation: profiles.email cannot be modified by client roles'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profiles_email_immutability() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_protect_profiles_email
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_email_immutability();

CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_normalized_email text;
BEGIN
  IF NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  v_normalized_email := LOWER(TRIM(NEW.email));

  IF char_length(v_normalized_email) > 255 THEN
    RAISE EXCEPTION 'Email exceeds maximum length of 255 characters'
      USING ERRCODE = '22001';
  END IF;

  UPDATE public.profiles
  SET email = v_normalized_email::varchar(255)
  WHERE id = NEW.id
    AND email IS DISTINCT FROM v_normalized_email::varchar(255);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

CREATE OR REPLACE FUNCTION public.log_workspace_activity(
  p_workspace_id uuid,
  p_action varchar(255),
  p_entity_type varchar(50),
  p_entity_id uuid,
  p_category varchar(50),
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  new_log_id uuid;
  caller_id uuid := auth.uid();
  caller_email text;
  caller_role public.member_role;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to log activity.';
  END IF;

  SELECT role INTO caller_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = caller_id AND status = 'Active';

  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not an active member of workspace %.', p_workspace_id;
  END IF;

  IF caller_role NOT IN ('Owner', 'Administrator') AND p_action LIKE 'admin.%' THEN
    RAISE EXCEPTION 'Unauthorized: Non-administrators cannot log administrative events.';
  END IF;

  SELECT LOWER(TRIM(email)) INTO caller_email FROM auth.users WHERE id = caller_id;

  INSERT INTO public.activity_logs (
    workspace_id, user_id, actor_email, actor_role, action,
    entity_type, entity_id, category, metadata, created_at
  ) VALUES (
    p_workspace_id, caller_id, caller_email, caller_role::text, p_action,
    p_entity_type, p_entity_id, p_category, p_metadata, now()
  )
  RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$;
