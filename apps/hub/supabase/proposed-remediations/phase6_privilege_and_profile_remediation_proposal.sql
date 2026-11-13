-- ==============================================================================
-- KHAI SPACE HUB — PROPOSED REMEDIATION SQL (PHASE 6.1.2)
-- STATUS: NOT DEPLOYED — OWNER REVIEW REQUIRED
-- ==============================================================================
-- Target (when approved): khai-space-hub (dpicdhjaabfjbvppmsxk)
-- Do NOT execute automatically. Do NOT register as a migration without approval.
-- Do NOT modify the original deployed migration:
--   apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- SECTION 1: REVOKE EXCESSIVE `authenticated` DEFAULT PRIVILEGES & REAPPLY MINIMAL GRANTS
-- ------------------------------------------------------------------------------
-- Expected Impact:
--   1. Revokes Supabase default ALL privileges (specifically TRUNCATE, REFERENCES,
--      TRIGGER, and unauthorized INSERT/UPDATE/DELETE) from `authenticated`, `anon`,
--      and `PUBLIC` across all 12 public tables and 3 public financial views.
--   2. Revokes unnecessary EXECUTE on the two SECURITY INVOKER trigger functions
--      (`handle_updated_at()`, `prevent_note_type_change()`).
--   3. Reapplies minimal table/view grants matching the RLS & RPC security model.
--   Note: `authenticated` does not inherit from `anon` or any higher role; `PUBLIC`
--   has zero grants. `postgres` retains table ownership.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_note_type_change() FROM PUBLIC, anon, authenticated;

-- Minimal table grants for `authenticated`
GRANT SELECT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
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

-- ------------------------------------------------------------------------------
-- SECTION 2: PROTECT `public.profiles.email` & AUTHORITATIVE LOG IDENTITY
-- ------------------------------------------------------------------------------
-- Chosen Design:
--   1. Column-level UPDATE grant on `public.profiles` excluding `id`, `email`,
--      `created_at`, and `updated_at`. Any `UPDATE profiles SET email = ...` by
--      `authenticated` fails at the SQL privilege layer (42501 insufficient_privilege).
--   2. SECURITY INVOKER BEFORE UPDATE trigger `protect_profiles_email_immutability()`:
--      Uses SECURITY INVOKER (NOT SECURITY DEFINER) so `current_user` reflects the
--      actual calling role (`authenticated`/`anon`), rather than the function owner.
--      Blocks email changes by client roles while permitting trusted `postgres` /
--      `auth.users` synchronization.
--   3. Controlled `auth.users` -> `public.profiles` email synchronization trigger
--      (`sync_profile_email_from_auth()`) so verified auth email changes propagate
--      automatically without opening client-side `profiles.email` writes.
--   4. Hardened `log_workspace_activity()` email lookup to read directly from
--      `auth.users` (authoritative identity) rather than `public.profiles`.

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, display_name, bio, location, timezone, avatar_initials)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profiles_email_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email
     AND current_user IN ('authenticated', 'anon') THEN
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
  v_clean_email varchar(255);
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL AND TRIM(NEW.email) != '' THEN
    v_clean_email := SUBSTRING(LOWER(TRIM(NEW.email)) FROM 1 FOR 255);
    UPDATE public.profiles
    SET email = v_clean_email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

-- Harden log_workspace_activity() to read authoritative email from auth.users
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

COMMIT;

-- ------------------------------------------------------------------------------
-- SECTION 3: MIGRATION HISTORY RECONCILIATION PROCEDURE (MANUAL CLI / GIT ONLY)
-- ------------------------------------------------------------------------------
-- Local file:  apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql
-- Remote DB:   supabase_migrations.schema_migrations (version = '20261113024551',
--              name = 'phase6_initial_schema_and_rls')
--
-- Safest Option (Zero Remote Mutation):
--   git mv apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql \
--          apps/hub/supabase/migrations/20261113024551_phase6_initial_schema_and_rls.sql
--   Then commit & deploy this remediation as a new timestamped migration.

-- ------------------------------------------------------------------------------
-- SECTION 4: POST-REMEDIATION VERIFICATION QUERIES (RUN AFTER OWNER APPROVAL)
-- ------------------------------------------------------------------------------
-- 1. Execute apps/hub/supabase/tests/01_schema_catalog_validation.sql (update expected function/trigger counts for new sync/protection functions if applied)
-- 2. Execute apps/hub/supabase/tests/03_privilege_assertions_test.sql (expect PASS)
-- 3. Verify `authenticated` UPDATE on `profiles.email` fails with 42501 (`insufficient_privilege`)
-- 4. Verify `authenticated` UPDATE on `profiles.full_name, display_name, bio` succeeds (`ROW_COUNT = 1`)
-- 5. Verify `auth.users.email` update propagates to `public.profiles.email`
