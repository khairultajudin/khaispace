-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE (PHASE 6.1.4)
-- Test 03: Strict Table, View, Column & Default Privilege Assertions (Read-Only)
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- Validates:
--   1-4: Existing effective privileges for PUBLIC, anon, and authenticated across
--        all 12 public tables, 3 public financial views, and public.profiles
--        columns using has_table_privilege(), has_column_privilege(),
--        has_any_column_privilege(), aclexplode(pg_class.relacl),
--        information_schema.role_table_grants, and information_schema.column_privileges.
--   5:   Role inheritance boundaries (pg_auth_members) and default privileges
--        (pg_default_acl) for the verified object-creating role (`postgres`) in
--        schema `public` and globally across tables/views, sequences, and functions.
--        Note: Inspecting pg_default_acl does not replace an isolated local
--        future-object creation simulation (NOT EXECUTED remotely).
-- ==============================================================================

DO $$
DECLARE
  v_priv text;
  v_all_privs text[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
  v_tbl_spec record;
  v_col_spec record;
  v_view_name text;
  v_views text[] := ARRAY[
    'view_overall_finance_kpis', 'view_project_finance_summary', 'view_monthly_financial_trends'
  ];
  v_expected boolean;
  v_actual boolean;
  v_acl_leak text;
  v_info_leak text;
  v_col_grants text[];
  v_defacl_leak text;
  v_fn_defacl_count int;
  v_role_leak text;
BEGIN
  -- 1. Verify PUBLIC and anon have ZERO privileges on all 12 tables and 3 views
  FOR v_tbl_spec IN
    SELECT c.relname AS obj_name, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v')
  LOOP
    FOREACH v_priv IN ARRAY v_all_privs LOOP
      IF has_table_privilege('public', 'public.' || v_tbl_spec.obj_name, v_priv) THEN
        RAISE EXCEPTION 'SECURITY FAILURE: PUBLIC has % on public.%', v_priv, v_tbl_spec.obj_name;
      END IF;
      IF has_table_privilege('anon', 'public.' || v_tbl_spec.obj_name, v_priv) THEN
        RAISE EXCEPTION 'SECURITY FAILURE: anon has % on public.%', v_priv, v_tbl_spec.obj_name;
      END IF;
    END LOOP;
  END LOOP;

  -- Cross-check aclexplode(relacl) for PUBLIC (grantee=0) or anon grants
  SELECT string_agg(c.relname || ':' || COALESCE(pg_get_userbyid(a.grantee), 'PUBLIC') || ':' || a.privilege_type, ', ')
  INTO v_acl_leak
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(c.relacl) a
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v')
    AND (a.grantee = 0 OR pg_get_userbyid(a.grantee) = 'anon');
  IF v_acl_leak IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAILURE: aclexplode detected PUBLIC/anon ACL grants: %', v_acl_leak;
  END IF;

  -- 2. Verify authenticated effective privileges against the intended table matrix
  FOR v_tbl_spec IN
    SELECT * FROM (VALUES
      ('workspaces',             true,  false, true,  true),
      ('profiles',               true,  true,  false, false),
      ('workspace_members',      true,  false, true,  true),
      ('workspace_invitations',  true,  true,  true,  true),
      ('workspace_settings',     true,  false, true,  false),
      ('projects',               true,  true,  true,  true),
      ('milestones',             true,  true,  true,  true),
      ('tasks',                  true,  true,  true,  true),
      ('financial_transactions', true,  true,  true,  true),
      ('ai_subscriptions',       true,  true,  true,  true),
      ('workspace_notes',        true,  true,  true,  true),
      ('activity_logs',          true,  false, false, false)
    ) AS m(tbl_name, exp_sel, exp_ins, exp_upd, exp_del)
  LOOP
    -- TRUNCATE, REFERENCES, TRIGGER must ALWAYS be false for authenticated
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'TRUNCATE') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has TRUNCATE on public.%', v_tbl_spec.tbl_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'REFERENCES') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has REFERENCES on public.%', v_tbl_spec.tbl_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'TRIGGER') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has TRIGGER on public.%', v_tbl_spec.tbl_name;
    END IF;

    -- SELECT / INSERT / UPDATE / DELETE
    v_actual := has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'SELECT');
    IF v_actual != v_tbl_spec.exp_sel THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated SELECT on public.% is %, expected %',
        v_tbl_spec.tbl_name, v_actual, v_tbl_spec.exp_sel;
    END IF;

    v_actual := has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'INSERT');
    IF v_actual != v_tbl_spec.exp_ins THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated INSERT on public.% is %, expected %',
        v_tbl_spec.tbl_name, v_actual, v_tbl_spec.exp_ins;
    END IF;

    v_actual := has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'UPDATE');
    IF v_actual != v_tbl_spec.exp_upd THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated UPDATE on public.% is %, expected %',
        v_tbl_spec.tbl_name, v_actual, v_tbl_spec.exp_upd;
    END IF;

    v_actual := has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'DELETE');
    IF v_actual != v_tbl_spec.exp_del THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated DELETE on public.% is %, expected %',
        v_tbl_spec.tbl_name, v_actual, v_tbl_spec.exp_del;
    END IF;
  END LOOP;

  -- 3. Verify authenticated privileges on all 3 financial views (SELECT ONLY)
  FOREACH v_view_name IN ARRAY v_views LOOP
    FOREACH v_priv IN ARRAY v_all_privs LOOP
      v_expected := (v_priv = 'SELECT');
      v_actual := has_table_privilege('authenticated', 'public.' || v_view_name, v_priv);
      IF v_actual != v_expected THEN
        RAISE EXCEPTION 'SECURITY FAILURE: authenticated % on view public.% is %, expected %',
          v_priv, v_view_name, v_actual, v_expected;
      END IF;
    END LOOP;
  END LOOP;

  -- 4. Verify column-level UPDATE matrix on public.profiles (table-level UPDATE is false)
  IF NOT has_any_column_privilege('authenticated', 'public.profiles', 'UPDATE') THEN
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated lacks column-level UPDATE on public.profiles';
  END IF;

  FOR v_col_spec IN
    SELECT * FROM (VALUES
      ('id',              false),
      ('email',           false),
      ('created_at',      false),
      ('updated_at',      false),
      ('full_name',       true),
      ('display_name',    true),
      ('bio',             true),
      ('location',        true),
      ('timezone',        true),
      ('avatar_initials', true)
    ) AS c(col_name, exp_upd)
  LOOP
    v_actual := has_column_privilege('authenticated', 'public.profiles', v_col_spec.col_name, 'UPDATE');
    IF v_actual != v_col_spec.exp_upd THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated UPDATE on public.profiles.% is %, expected %',
        v_col_spec.col_name, v_actual, v_col_spec.exp_upd;
    END IF;
  END LOOP;

  SELECT array_agg(column_name::text ORDER BY column_name) INTO v_col_grants
  FROM information_schema.column_privileges
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND grantee = 'authenticated' AND privilege_type = 'UPDATE';
  IF v_col_grants IS DISTINCT FROM ARRAY['avatar_initials', 'bio', 'display_name', 'full_name', 'location', 'timezone'] THEN
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated column UPDATE grants on public.profiles = %, expected exact 6 allowed columns',
      v_col_grants;
  END IF;

  IF has_any_column_privilege('anon', 'public.profiles', 'SELECT')
     OR has_any_column_privilege('anon', 'public.profiles', 'UPDATE')
     OR has_any_column_privilege('public', 'public.profiles', 'SELECT')
     OR has_any_column_privilege('public', 'public.profiles', 'UPDATE') THEN
    RAISE EXCEPTION 'SECURITY FAILURE: anon or PUBLIC has column privileges on public.profiles';
  END IF;

  SELECT string_agg(table_name || ':' || privilege_type, ', ') INTO v_info_leak
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND grantee = 'authenticated'
    AND privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER');
  IF v_info_leak IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAILURE: information_schema reports disallowed authenticated grants: %', v_info_leak;
  END IF;

  -- 5. Verify role inheritance & default privileges (`pg_default_acl`) for `postgres`
  -- 5a. Ensure anon and authenticated do not inherit from privileged roles
  SELECT string_agg(pg_get_userbyid(m.member) || '->' || pg_get_userbyid(m.roleid), ', ')
  INTO v_role_leak
  FROM pg_auth_members m
  WHERE pg_get_userbyid(m.member) IN ('anon', 'authenticated')
    AND pg_get_userbyid(m.roleid) IN ('postgres', 'supabase_admin', 'service_role', 'supabase_privileged_role');
  IF v_role_leak IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAILURE: Client role inherits privileged membership: %', v_role_leak;
  END IF;

  -- 5b. Check pg_default_acl for `postgres` (both `public` and `<GLOBAL>`) on tables, sequences, functions
  SELECT string_agg(
    COALESCE(n.nspname, '<GLOBAL>') || ':' || d.defaclobjtype::text || ':' ||
    COALESCE(pg_get_userbyid(a.grantee), 'PUBLIC') || ':' || a.privilege_type, ', '
  )
  INTO v_defacl_leak
  FROM pg_default_acl d
  LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
  CROSS JOIN LATERAL aclexplode(d.defaclacl) a
  WHERE d.defaclrole = 'postgres'::regrole
    AND (d.defaclnamespace = 0 OR n.nspname = 'public')
    AND d.defaclobjtype IN ('r', 'S', 'f')
    AND (a.grantee = 0 OR pg_get_userbyid(a.grantee) IN ('anon', 'authenticated'));
  IF v_defacl_leak IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAILURE: pg_default_acl for postgres grants unintended default privileges: %', v_defacl_leak;
  END IF;

  -- 5c. Require an explicit pg_default_acl entry for `postgres` functions in `public`
  -- (Without an explicit entry, PostgreSQL's built-in default grants EXECUTE to PUBLIC)
  SELECT count(*) INTO v_fn_defacl_count
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE d.defaclrole = 'postgres'::regrole
    AND n.nspname = 'public'
    AND d.defaclobjtype = 'f';
  IF v_fn_defacl_count = 0 THEN
    RAISE EXCEPTION 'SECURITY FAILURE: Missing explicit pg_default_acl function override for postgres in public (PUBLIC would inherit EXECUTE)';
  END IF;

  RAISE NOTICE '[PASS] All strict table, view, column, and default privilege assertions passed.';
END $$;
