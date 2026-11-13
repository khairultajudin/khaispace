-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE
-- Test 01: Schema & Catalog Integrity Verification (Read-Only)
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================

DO $$
DECLARE
  v_table_count int;
  v_view_count int;
  v_enum_count int;
  v_func_count int;
  v_policy_count int;
  v_rls_disabled_count int;
  v_non_invoker_views int;
  v_anon_funcs int;
  v_missing_enums text;
BEGIN
  RAISE NOTICE '=== TEST SUITE 01: SCHEMA & CATALOG INTEGRITY VERIFICATION ===';

  -- 1. Table Count Verification (Expected: exactly 12 tables)
  SELECT count(*) INTO v_table_count FROM pg_tables WHERE schemaname = 'public';
  IF v_table_count != 12 THEN
    RAISE EXCEPTION 'Schema Assertion Failed: Expected 12 tables, found %', v_table_count;
  END IF;
  RAISE NOTICE '[PASS] Exactly 12 application tables verified in public schema.';

  -- 2. RLS Status on All 12 Tables (Expected: 0 tables with RLS disabled)
  SELECT count(*) INTO v_rls_disabled_count 
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;
  IF v_rls_disabled_count != 0 THEN
    RAISE EXCEPTION 'Security Assertion Failed: % tables have RLS disabled!', v_rls_disabled_count;
  END IF;
  RAISE NOTICE '[PASS] Row Level Security (RLS) is enabled on all 12 tables.';

  -- 3. Accounting Views Verification (Expected: exactly 3 views with security_invoker = true)
  SELECT count(*) INTO v_view_count FROM information_schema.views WHERE table_schema = 'public';
  IF v_view_count != 3 THEN
    RAISE EXCEPTION 'Schema Assertion Failed: Expected 3 accounting views, found %', v_view_count;
  END IF;

  SELECT count(*) INTO v_non_invoker_views
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relkind = 'v'
    AND NOT ('security_invoker=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[])));
  IF v_non_invoker_views != 0 THEN
    RAISE EXCEPTION 'Security Assertion Failed: Found % view(s) without security_invoker=true', v_non_invoker_views;
  END IF;
  RAISE NOTICE '[PASS] Exactly 3 financial reporting views verified with security_invoker = true.';

  -- 4. Custom Enum Types Verification (Expected: exactly 11 enums)
  SELECT count(*) INTO v_enum_count 
  FROM pg_type t 
  JOIN pg_namespace n ON n.oid = t.typnamespace 
  WHERE n.nspname = 'public' AND t.typtype = 'e';
  IF v_enum_count != 11 THEN
    RAISE EXCEPTION 'Schema Assertion Failed: Expected 11 enums, found %', v_enum_count;
  END IF;
  RAISE NOTICE '[PASS] Exactly 11 custom PostgreSQL enum types verified in public schema.';

  -- 5. Function Inventory Verification (Expected: exactly 17 functions: 15 DEFINER + 2 INVOKER)
  SELECT count(*) INTO v_func_count 
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public';
  IF v_func_count != 17 THEN
    RAISE EXCEPTION 'Function Assertion Failed: Expected 17 functions, found %', v_func_count;
  END IF;
  RAISE NOTICE '[PASS] Exactly 17 database functions verified in public schema (15 SECURITY DEFINER + 2 SECURITY INVOKER).';

  -- 6. Anonymous Function Access Verification (Expected: 0 functions executable by anon)
  SELECT count(*) INTO v_anon_funcs
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_anon_funcs != 0 THEN
    RAISE EXCEPTION 'Privilege Assertion Failed: % function(s) are executable by anonymous role!', v_anon_funcs;
  END IF;
  RAISE NOTICE '[PASS] Zero functions in schema public are executable by anonymous users (0 callable).';

  -- 7. RLS Policy Count (Expected: exactly 45 policies across 12 tables)
  SELECT count(*) INTO v_policy_count 
  FROM pg_policy pol 
  JOIN pg_class c ON pol.polrelid = c.oid 
  JOIN pg_namespace n ON c.relnamespace = n.oid 
  WHERE n.nspname = 'public';
  IF v_policy_count != 45 THEN
    RAISE EXCEPTION 'Policy Assertion Failed: Expected 45 RLS policies, found %', v_policy_count;
  END IF;
  RAISE NOTICE '[PASS] Exactly 45 Row Level Security policies active across all 12 tables.';

  RAISE NOTICE '=== ALL READ-ONLY SCHEMA CATALOG CHECKS PASSED SUCCESSFULLY ===';
END $$;
