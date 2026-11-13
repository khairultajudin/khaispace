-- ==============================================================================
-- KHAI SPACE HUB — PROPOSED REMEDIATION SQL (PHASE 6.1.1)
-- STATUS: NOT DEPLOYED — OWNER REVIEW REQUIRED
-- ==============================================================================
-- Target (when approved): khai-space-hub (dpicdhjaabfjbvppmsxk)
-- Do NOT execute automatically. Do NOT register as a migration without approval.
-- Do NOT modify the original deployed migration:
--   apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SECTION 1: REVOKE EXCESSIVE `authenticated` DEFAULT PRIVILEGES & REAPPLY MINIMAL GRANTS
-- ------------------------------------------------------------------------------
-- Expected Impact:
--   Removes Supabase default ALL privileges (specifically TRUNCATE, REFERENCES,
--   TRIGGER, and unauthorized INSERT/UPDATE/DELETE) from `authenticated` across
--   all 12 public tables and 3 public financial views, plus revokes unnecessary
--   EXECUTE on the two SECURITY INVOKER trigger functions.
--   Zero impact on legitimate PostgREST application CRUD, because RLS already
--   forbids the revoked operations while TRUNCATE previously bypassed RLS.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- Revoke direct EXECUTE on SECURITY INVOKER trigger functions from authenticated
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_note_type_change() FROM authenticated;

-- Minimal table grants for `authenticated` matching the RLS & RPC security model
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
-- SECTION 2: PROTECT `public.profiles.email` FROM CLIENT-SIDE MUTATION
-- ------------------------------------------------------------------------------
-- Expected Impact:
--   Prevents authenticated users from mutating `profiles.email` independently of
--   `auth.users.email`, eliminating audit-log actor email spoofing in
--   `log_workspace_activity()` and UI profile divergence.
--
-- Trade-offs:
--   - Column-level UPDATE grant blocks `UPDATE profiles SET email = ...` at parse/
--     privilege check time (even if `email` is unchanged in a full-row PUT).
--   - A BEFORE UPDATE trigger allows harmless unchanged-email payloads while still
--     blocking any actual change to `email`.
--   - Recommended: Apply BOTH (column-level grant + trigger defense-in-depth) and
--     ensure frontend profile forms omit `email` from `.update(...)` payloads.

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, display_name, bio, location, timezone, avatar_initials)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profiles_email_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND current_user = 'authenticated' THEN
    RAISE EXCEPTION 'Security Violation: profiles.email cannot be modified by authenticated clients';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profiles_email_immutability() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_protect_profiles_email
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_email_immutability();

-- ------------------------------------------------------------------------------
-- SECTION 3: MIGRATION HISTORY RECONCILIATION PROCEDURE (MANUAL CLI / GIT ONLY)
-- ------------------------------------------------------------------------------
-- Current Discrepancy:
--   Local file:  apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql
--   Remote DB:   supabase_migrations.schema_migrations (version = '20261113024551',
--                name = 'phase6_initial_schema_and_rls')
--
-- Recommended Option A (Zero Remote Mutation — Safest):
--   Rename local file to match the already-applied remote version:
--     git mv apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql \
--            apps/hub/supabase/migrations/20261113024551_phase6_initial_schema_and_rls.sql
--   Risk: Modifies local git history path for the Phase 6 file, so any external
--   script referencing the old filename must update its path.
--
-- Alternative Option B (Supabase CLI Repair):
--   supabase migration repair --status reverted 20261113024551
--   supabase migration repair --status applied 20261113000001
--   Risk: Mutates remote `supabase_migrations.schema_migrations` directly; if
--   mistyped, `supabase db push` could attempt to reapply the entire Phase 6 DDL.

-- ------------------------------------------------------------------------------
-- SECTION 4: POST-REMEDIATION VERIFICATION QUERIES (RUN AFTER OWNER APPROVAL)
-- ------------------------------------------------------------------------------
-- 1. Execute apps/hub/supabase/tests/01_schema_catalog_validation.sql (expect PASS)
-- 2. Execute apps/hub/supabase/tests/03_privilege_assertions_test.sql (expect PASS)
-- 3. Execute apps/hub/supabase/tests/02_rls_and_isolation_test.sql (expect intentional rollback)
-- 4. Quick privilege sanity check:
-- SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privs
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')
-- GROUP BY table_name, grantee
-- ORDER BY table_name, grantee;
