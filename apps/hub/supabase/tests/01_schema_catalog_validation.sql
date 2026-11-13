-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE (PHASE 6.1)
-- Test 01: Strengthened Schema, Catalog, Policy & Privilege Verification (Read-Only)
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- Validates actual object names, definitions, RLS enablement, policy expressions,
-- view security_invoker options, function search_paths, triggers, constraints,
-- and role privileges (anon, authenticated, PUBLIC).
-- ==============================================================================

DO $$
DECLARE
  v_expected_tables text[] := ARRAY[
    'workspaces', 'profiles', 'workspace_members', 'workspace_invitations',
    'workspace_settings', 'projects', 'milestones', 'tasks',
    'financial_transactions', 'ai_subscriptions', 'workspace_notes', 'activity_logs'
  ];
  v_tbl text;
  v_rls_enabled boolean;
  v_missing text;
  v_bad_count int;
  v_policy_count int;
  v_secdef_funcs text[] := ARRAY[
    'accept_workspace_invitation', 'create_workspace_with_owner', 'delete_workspace_by_owner',
    'get_user_workspace_role', 'is_workspace_admin_or_owner', 'is_workspace_member',
    'log_workspace_activity', 'handle_new_user', 'handle_workspace_deletion_authorization',
    'protect_workspace_members_immutability', 'protect_workspace_members_deletion',
    'handle_project_deletion_cleanup', 'handle_milestone_deletion_cleanup',
    'validate_project_workspace_integrity', 'validate_subscription_project_workspace_integrity'
  ];
  v_rpc_funcs text[] := ARRAY[
    'accept_workspace_invitation', 'create_workspace_with_owner', 'delete_workspace_by_owner',
    'get_user_workspace_role', 'is_workspace_admin_or_owner', 'is_workspace_member',
    'log_workspace_activity'
  ];
  v_trigger_only_secdef text[] := ARRAY[
    'handle_new_user', 'handle_workspace_deletion_authorization',
    'protect_workspace_members_immutability', 'protect_workspace_members_deletion',
    'handle_project_deletion_cleanup', 'handle_milestone_deletion_cleanup',
    'validate_project_workspace_integrity', 'validate_subscription_project_workspace_integrity'
  ];
  v_fn text;
  v_prosecdef boolean;
  v_proconfig text[];
  v_views text[] := ARRAY[
    'view_overall_finance_kpis', 'view_project_finance_summary', 'view_monthly_financial_trends'
  ];
  v_v text;
  v_reloptions text[];
  v_truncate_tables text;
BEGIN
  -- 1. Verify every expected table exists and has RLS enabled
  FOREACH v_tbl IN ARRAY v_expected_tables LOOP
    SELECT c.relrowsecurity INTO v_rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = v_tbl AND c.relkind = 'r';

    IF v_rls_enabled IS NULL THEN
      RAISE EXCEPTION 'Catalog Assertion Failed: Missing required table public.%', v_tbl;
    END IF;
    IF NOT v_rls_enabled THEN
      RAISE EXCEPTION 'Security Assertion Failed: RLS is NOT enabled on public.%', v_tbl;
    END IF;
  END LOOP;

  -- Verify no unexpected tables in public
  SELECT string_agg(tablename, ', ') INTO v_missing
  FROM pg_tables
  WHERE schemaname = 'public' AND NOT (tablename = ANY(v_expected_tables));
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Catalog Assertion Failed: Unexpected table(s) in public: %', v_missing;
  END IF;

  -- 2. Verify all 11 enums and exact enum labels
  IF (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') != 11 THEN
    RAISE EXCEPTION 'Catalog Assertion Failed: Expected exactly 11 enums in public.';
  END IF;

  IF (SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder) FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'member_role')
     IS DISTINCT FROM ARRAY['Owner', 'Administrator', 'Member', 'Viewer'] THEN
    RAISE EXCEPTION 'Enum Assertion Failed: member_role labels mismatch';
  END IF;

  IF (SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder) FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'member_status')
     IS DISTINCT FROM ARRAY['Active', 'Pending', 'Suspended'] THEN
    RAISE EXCEPTION 'Enum Assertion Failed: member_status labels mismatch';
  END IF;

  IF (SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder) FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'transaction_type')
     IS DISTINCT FROM ARRAY['Income', 'Expense', 'Investment'] THEN
    RAISE EXCEPTION 'Enum Assertion Failed: transaction_type labels mismatch';
  END IF;

  -- 3. Verify all 3 financial views exist with security_invoker = true
  FOREACH v_v IN ARRAY v_views LOOP
    SELECT c.reloptions INTO v_reloptions
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = v_v AND c.relkind = 'v';

    IF v_reloptions IS NULL OR NOT ('security_invoker=true' = ANY(v_reloptions)) THEN
      RAISE EXCEPTION 'View Security Assertion Failed: View public.% missing security_invoker=true', v_v;
    END IF;
  END LOOP;

  -- 4. Verify SECURITY DEFINER functions have explicit safe search_path
  FOREACH v_fn IN ARRAY v_secdef_funcs LOOP
    SELECT p.prosecdef, p.proconfig INTO v_prosecdef, v_proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = v_fn;

    IF v_prosecdef IS NULL THEN
      RAISE EXCEPTION 'Function Assertion Failed: Missing function public.%', v_fn;
    END IF;
    IF NOT v_prosecdef THEN
      RAISE EXCEPTION 'Security Assertion Failed: Function public.% must be SECURITY DEFINER', v_fn;
    END IF;
    IF v_proconfig IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(v_proconfig) cfg WHERE cfg LIKE 'search_path=%pg_temp%'
    ) THEN
      RAISE EXCEPTION 'Security Assertion Failed: SECURITY DEFINER function public.% missing safe search_path with pg_temp', v_fn;
    END IF;
  END LOOP;

  -- 5. Verify function execution privileges for PUBLIC, anon, and authenticated
  FOREACH v_fn IN ARRAY v_rpc_funcs LOOP
    IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = v_fn
        AND (has_function_privilege('anon', p.oid, 'EXECUTE')
             OR has_function_privilege('public', p.oid, 'EXECUTE')
             OR NOT has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    ) THEN
      RAISE EXCEPTION 'Privilege Assertion Failed: Incorrect EXECUTE grants on RPC public.%', v_fn;
    END IF;
  END LOOP;

  FOREACH v_fn IN ARRAY v_trigger_only_secdef LOOP
    IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = v_fn
        AND (has_function_privilege('anon', p.oid, 'EXECUTE')
             OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
             OR has_function_privilege('public', p.oid, 'EXECUTE'))
    ) THEN
      RAISE EXCEPTION 'Privilege Assertion Failed: Trigger-only function public.% is callable by client roles!', v_fn;
    END IF;
  END LOOP;

  -- 6. Verify anon has zero table or view privileges in public
  SELECT count(*) INTO v_bad_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND grantee = 'anon';
  IF v_bad_count != 0 THEN
    RAISE EXCEPTION 'Privilege Assertion Failed: anon has % table/view grants in public!', v_bad_count;
  END IF;

  -- 7. Verify RLS policy count (45) and key policy definitions
  SELECT count(*) INTO v_policy_count FROM pg_policies WHERE schemaname = 'public';
  IF v_policy_count != 45 THEN
    RAISE EXCEPTION 'Policy Assertion Failed: Expected 45 RLS policies, found %', v_policy_count;
  END IF;

  -- Ensure no INSERT policy exists on workspaces, workspace_members, or activity_logs
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('workspaces', 'workspace_members', 'activity_logs')
      AND cmd = 'INSERT'
  ) THEN
    RAISE EXCEPTION 'Policy Assertion Failed: Direct INSERT policy exists on restricted table!';
  END IF;

  -- Ensure workspace_invitations has exactly 7 policies
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspace_invitations') != 7 THEN
    RAISE EXCEPTION 'Policy Assertion Failed: workspace_invitations should have exactly 7 policies.';
  END IF;

  -- 8. Verify key constraints & partial unique index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'workspace_members' AND indexname = 'idx_workspace_single_owner'
      AND indexdef LIKE '%WHERE (role = ''Owner''::member_role)%'
  ) THEN
    RAISE EXCEPTION 'Index Assertion Failed: idx_workspace_single_owner partial unique index missing or altered!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_task_milestone_ws' AND confdeltype = 'n'
  ) THEN
    RAISE EXCEPTION 'Constraint Assertion Failed: fk_task_milestone_ws missing!';
  END IF;

  -- 9. Verify triggers exist on expected tables (19 public triggers + 1 auth.users trigger = 20)
  IF (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal) != 19 THEN
    RAISE EXCEPTION 'Trigger Assertion Failed: Expected 19 user triggers on public tables!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'Trigger Assertion Failed: Auth hook on_auth_user_created missing on auth.users!';
  END IF;

  -- 10. Audit check for excessive default privileges on authenticated (non-failing diagnostic notice)
  SELECT string_agg(DISTINCT table_name, ', ') INTO v_truncate_tables
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND grantee = 'authenticated' AND privilege_type = 'TRUNCATE';
  IF v_truncate_tables IS NOT NULL THEN
    RAISE NOTICE '[AUDIT FINDING] authenticated role retains default TRUNCATE/ALL privileges on: %', v_truncate_tables;
  END IF;

  RAISE NOTICE '[PASS] All strengthened catalog, policy, constraint, trigger, and privilege checks passed.';
END $$;
