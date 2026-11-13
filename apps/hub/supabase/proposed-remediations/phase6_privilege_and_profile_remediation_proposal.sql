-- ==============================================================================
-- KHAI SPACE HUB — PROPOSED REMEDIATION SQL (PHASE 6.1.3)
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
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Block email mutations from client roles (authenticated, anon, or any non-privileged role),
  -- while permitting trusted backend roles (postgres, supabase_admin, supabase_auth_admin, service_role)
  -- including SECURITY DEFINER sync_profile_email_from_auth().
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
  -- No-op if email did not change
  IF NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  -- Explicit policy: public.profiles.email is NOT NULL UNIQUE; ignore NULL or blank auth emails
  -- rather than corrupting or violating profile uniqueness.
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  v_normalized_email := LOWER(TRIM(NEW.email));

  -- Never silently truncate an email into a different identity
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
-- SECTION 3: MIGRATION HISTORY RECONCILIATION PROCEDURE (OWNER DECISION REQUIRED)
-- ------------------------------------------------------------------------------
-- Local file:  apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql
-- Remote DB:   supabase_migrations.schema_migrations (version = '20261113024551',
--              name = 'phase6_initial_schema_and_rls', statements IS NOT NULL)
--
-- WARNING: Do NOT blindly rename the local file or run `supabase db push` before
-- confirming exact SQL equivalence. If un-reconciled, `supabase db push` will
-- treat `20261113000001` as unapplied and attempt to re-run Phase 6 DDL.
--
-- Required Pre-Reconciliation Steps:
--   1. Compare remote `supabase_migrations.schema_migrations.statements` for
--      version '20261113024551' against `20261113000001_phase6_initial_schema_and_rls.sql`.
--   2. Run `supabase migration list` to inspect local vs remote state.
--   3. Choose ONE owner-approved path after confirming equivalence:
--      - Option A (Remote Repair, preserves Git filename):
--        `supabase migration repair --status reverted 20261113024551`
--        `supabase migration repair --status applied 20261113000001`
--      - Option B (Local Rename, zero remote mutation):
--        `git mv apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql apps/hub/supabase/migrations/20261113024551_phase6_initial_schema_and_rls.sql`
--   4. Re-run `supabase migration list` to confirm both Local and Remote match
--      before creating/deploying any new remediation migration.

-- ------------------------------------------------------------------------------
-- SECTION 4: POST-REMEDIATION VERIFICATION QUERIES (RUN AFTER OWNER APPROVAL)
-- ------------------------------------------------------------------------------
-- 1. Execute `apps/hub/supabase/tests/01_schema_catalog_validation.sql` with
--    `v_expected_mode := 'POST_REMEDIATION'` (expects 19 functions & 22 triggers -> PASS)
-- 2. Execute `apps/hub/supabase/tests/03_privilege_assertions_test.sql` (expects PASS:
--    table-level profiles UPDATE = false, 6 column-level UPDATE grants = true)
-- 3. Execute `apps/hub/supabase/tests/02_rls_and_isolation_test.sql` with
--    `v_expected_mode := 'POST_REMEDIATION'` (in psql/CLI for full DELETE coverage)
