-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE (PHASE 6.1.4.2)
-- Test 03: Strict Table, View, Column & Default Privilege Assertions (Read-Only)
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- Validates:
--   1-4: Existing effective privileges for PUBLIC, anon, and authenticated across
--        all 12 public tables, 3 public financial views, and public.profiles
--        columns using has_table_privilege(), has_column_privilege(),
--        has_any_column_privilege(), aclexplode(pg_class.relacl),
--        information_schema.role_table_grants, and information_schema.column_privileges,
--        including PostgreSQL 17 `MAINTAIN`.
--   5:   Effective role inheritance boundaries (pg_has_role(..., 'USAGE'/'MEMBER'))
--        and BOTH global (defaclnamespace = 0) and schema-specific (`public`)
--        default privileges (pg_default_acl) for `postgres` across tables/views,
--        sequences, and functions (including explicit global PUBLIC EXECUTE
--        revocation).
--        Note: Catalog inspection of pg_default_acl is NOT equivalent to creating
--        a future object and testing its actual privileges. Isolated local
--        future-object simulation remains NOT EXECUTED without local PostgreSQL.
-- ==============================================================================

DO $$
DECLARE
  v_priv text;
  v_all_privs text[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
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
  v_global_fn_acl aclitem[];
  v_public_fn_acl aclitem[];
  v_role_leak text;
  v_missing_priv_roles text;
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
    -- TRUNCATE, REFERENCES, TRIGGER, MAINTAIN must ALWAYS be false for authenticated
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'TRUNCATE') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has TRUNCATE on public.%', v_tbl_spec.tbl_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'REFERENCES') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has REFERENCES on public.%', v_tbl_spec.tbl_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'TRIGGER') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has TRIGGER on public.%', v_tbl_spec.tbl_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.' || v_tbl_spec.tbl_name, 'MAINTAIN') THEN
      RAISE EXCEPTION 'SECURITY FAILURE: authenticated has MAINTAIN on public.%', v_tbl_spec.tbl_name;
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
    AND privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN');
  IF v_info_leak IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAILURE: information_schema reports disallowed authenticated grants: %', v_info_leak;
  END IF;

  -- 5. Verify role inheritance & default privileges (`pg_default_acl`) for `postgres`
  -- 5a. Ensure anon and authenticated do not effectively inherit from privileged roles
  -- Uses pg_has_role(..., 'USAGE') to traverse transitive/indirect role inheritance chains
  -- (and 'MEMBER' to catch NOINHERIT memberships), rather than direct-only pg_auth_members.
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION 'TEST ENVIRONMENT FAILURE: Required client role(s) anon/authenticated missing from pg_roles';
  END IF;

  SELECT string_agg(target.rolname, ', ' ORDER BY target.rolname)
  INTO v_missing_priv_roles
  FROM unnest(ARRAY['postgres', 'supabase_admin', 'service_role', 'supabase_privileged_role']) AS target(rolname)
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles p WHERE p.rolname = target.rolname);

  IF v_missing_priv_roles IS NOT NULL THEN
    RAISE NOTICE '[INFO] Privileged role(s) not present in this environment (skipped in 5a): %', v_missing_priv_roles;
  END IF;

  SELECT string_agg(
    c.rolname || '->' || p.rolname ||
    CASE
      WHEN pg_has_role(c.oid, p.oid, 'USAGE') THEN ' (USAGE)'
      ELSE ' (MEMBER)'
    END,
    ', '
    ORDER BY c.rolname, p.rolname
  )
  INTO v_role_leak
  FROM pg_roles c
  CROSS JOIN unnest(ARRAY['postgres', 'supabase_admin', 'service_role', 'supabase_privileged_role']) AS target(rolname)
  JOIN pg_roles p ON p.rolname = target.rolname
  WHERE c.rolname IN ('anon', 'authenticated')
    AND (
      pg_has_role(c.oid, p.oid, 'USAGE')
      OR pg_has_role(c.oid, p.oid, 'MEMBER')
    );
  IF v_role_leak IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAILURE: Client role inherits or holds privileged membership: %', v_role_leak;
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

  -- 5c. Require an explicit GLOBAL pg_default_acl override for `postgres` functions
  -- (PostgreSQL grants EXECUTE to PUBLIC globally by default; schema-level REVOKE cannot override global defaults)
  SELECT d.defaclacl INTO v_global_fn_acl
  FROM pg_default_acl d
  WHERE d.defaclrole = 'postgres'::regrole
    AND d.defaclnamespace = 0
    AND d.defaclobjtype = 'f';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SECURITY FAILURE: Missing global pg_default_acl function override for postgres (PUBLIC inherits EXECUTE by default)';
  END IF;
  IF EXISTS (
    SELECT 1 FROM aclexplode(v_global_fn_acl) a
    WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'SECURITY FAILURE: Global pg_default_acl for postgres functions still grants EXECUTE to PUBLIC';
  END IF;

  -- 5d. Verify schema-specific `public` function default ACL also excludes PUBLIC, anon, authenticated
  SELECT d.defaclacl INTO v_public_fn_acl
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE d.defaclrole = 'postgres'::regrole
    AND n.nspname = 'public'
    AND d.defaclobjtype = 'f';
  IF FOUND AND EXISTS (
    SELECT 1 FROM aclexplode(v_public_fn_acl) a
    WHERE (a.grantee = 0 OR pg_get_userbyid(a.grantee) IN ('anon', 'authenticated'))
      AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'SECURITY FAILURE: public pg_default_acl for postgres functions grants EXECUTE to PUBLIC/anon/authenticated';
  END IF;

  RAISE NOTICE '[PASS] All strict table, view, column, and default privilege assertions passed.';
END $$;
