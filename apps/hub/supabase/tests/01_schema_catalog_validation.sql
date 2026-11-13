-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE (PHASE 6.1.3)
-- Test 01: Complete Schema, Catalog, Policy, Signature, View, Trigger & Constraint Validation
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- Read-only catalog assertions. Supports two explicit validation modes:
--   - 'PRE_REMEDIATION'  (default): 17 functions, 20 triggers (Phase 6 baseline)
--   - 'POST_REMEDIATION' : 19 functions, 22 triggers (after owner-approved remediation)
-- Never guesses or mixes states. Fails on partial remediation.
-- Validates every expected object individually:
--   B1: 12 tables + RLS enabled + 0 unexpected tables
--   B2: 11 enums + exact ordered labels
--   B3: 45 RLS policies (name, table, cmd, roles, USING, WITH CHECK)
--   B4: 17 (PRE) / 19 (POST) functions (exact identity args, nargs, return type, kind, secdef, search_path, overloads, grants)
--   B5: 3 financial views (security_invoker=true, columns, source tables, grouping/join/ROI logic, grants)
--   B6: 20 (PRE) / 22 (POST) triggers (table, timing/event, enabled 'O', function)
--   B7: All 52 constraints (pg_get_constraintdef, convalidated, condeferrable) & 16 indexes
-- Note: Table/view/column privilege assertions are in 03_privilege_assertions_test.sql.
-- ==============================================================================

DO $$
DECLARE
  v_expected_mode text := 'PRE_REMEDIATION'; -- Valid: 'PRE_REMEDIATION' | 'POST_REMEDIATION'
  v_expected_fn_count int;
  v_expected_trg_count int;

  v_expected_tables text[] := ARRAY[
    'workspaces', 'profiles', 'workspace_members', 'workspace_invitations',
    'workspace_settings', 'projects', 'milestones', 'tasks',
    'financial_transactions', 'ai_subscriptions', 'workspace_notes', 'activity_logs'
  ];
  v_tbl text;
  v_rls_enabled boolean;
  v_unexpected text;

  v_enum_spec record;
  v_actual_labels text[];

  v_pol_spec record;
  v_pol_row record;
  v_pol_total int;

  v_fn_spec record;
  v_fn_row record;
  v_fn_total int;
  v_fn_count int;
  v_fn_acl_leak text;

  v_view_spec record;
  v_view_oid oid;
  v_view_def text;
  v_view_cols text[];
  v_reloptions text[];
  v_view_total int;

  v_trg_spec record;
  v_trg_def text;
  v_trg_enabled "char";
  v_trg_fn name;
  v_trg_total int;

  v_con_spec record;
  v_con_row record;
  v_con_total int;
  v_idx_name text;
  v_expected_indexes text[] := ARRAY[
    'idx_workspace_single_owner', 'idx_members_user', 'idx_members_lookup',
    'idx_projects_workspace', 'idx_projects_slug', 'idx_milestones_proj',
    'idx_tasks_proj', 'idx_tasks_due', 'idx_tx_ws_date', 'idx_tx_roi',
    'idx_tx_proj', 'idx_subs_ws', 'idx_subs_renew', 'idx_notes_ws',
    'idx_activity_ws', 'idx_invitations_token'
  ];
BEGIN
  IF v_expected_mode NOT IN ('PRE_REMEDIATION', 'POST_REMEDIATION') THEN
    RAISE EXCEPTION 'Invalid test mode: %', v_expected_mode;
  END IF;
  v_expected_fn_count := CASE WHEN v_expected_mode = 'POST_REMEDIATION' THEN 19 ELSE 17 END;
  v_expected_trg_count := CASE WHEN v_expected_mode = 'POST_REMEDIATION' THEN 22 ELSE 20 END;

  -- ----------------------------------------------------------------------------
  -- B1. TABLES & RLS ENABLEMENT (12 Expected, 0 Unexpected)
  -- ----------------------------------------------------------------------------
  FOREACH v_tbl IN ARRAY v_expected_tables LOOP
    SELECT c.relrowsecurity INTO v_rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = v_tbl AND c.relkind = 'r';

    IF v_rls_enabled IS NULL THEN
      RAISE EXCEPTION 'B1 Catalog Failure: Missing required table public.%', v_tbl;
    END IF;
    IF NOT v_rls_enabled THEN
      RAISE EXCEPTION 'B1 Security Failure: RLS is NOT enabled on public.%', v_tbl;
    END IF;
  END LOOP;

  SELECT string_agg(tablename, ', ') INTO v_unexpected
  FROM pg_tables
  WHERE schemaname = 'public' AND NOT (tablename = ANY(v_expected_tables));
  IF v_unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'B1 Catalog Failure: Unexpected table(s) in public: %', v_unexpected;
  END IF;

  -- ----------------------------------------------------------------------------
  -- B2. ALL 11 CUSTOM ENUMS & EXACT ORDERED LABELS
  -- ----------------------------------------------------------------------------
  IF (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e') != 11 THEN
    RAISE EXCEPTION 'B2 Catalog Failure: Expected exactly 11 enums in public';
  END IF;

  FOR v_enum_spec IN
    SELECT * FROM (VALUES
      ('project_status', ARRAY['Active', 'Production', 'In Development', 'Planning', 'Documented']),
      ('task_priority', ARRAY['High', 'Medium', 'Normal']),
      ('task_status', ARRAY['In Progress', 'Pending', 'Completed']),
      ('milestone_status', ARRAY['Planned', 'In Progress', 'Completed']),
      ('transaction_type', ARRAY['Income', 'Expense', 'Investment']),
      ('subscription_status', ARRAY['Active', 'Paused', 'Cancelled', 'Trial']),
      ('billing_cycle', ARRAY['Monthly', 'Annual']),
      ('note_record_type', ARRAY['Note', 'Decision']),
      ('decision_status', ARRAY['Proposed', 'Approved', 'Rejected', 'Superseded']),
      ('member_role', ARRAY['Owner', 'Administrator', 'Member', 'Viewer']),
      ('member_status', ARRAY['Active', 'Pending', 'Suspended'])
    ) AS e(enum_name, expected_labels)
  LOOP
    SELECT array_agg(en.enumlabel::text ORDER BY en.enumsortorder) INTO v_actual_labels
    FROM pg_enum en
    JOIN pg_type t ON en.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = v_enum_spec.enum_name;

    IF v_actual_labels IS NULL THEN
      RAISE EXCEPTION 'B2 Enum Failure: Missing enum public.%', v_enum_spec.enum_name;
    END IF;
    IF v_actual_labels IS DISTINCT FROM v_enum_spec.expected_labels THEN
      RAISE EXCEPTION 'B2 Enum Failure: Labels mismatch on public.%. Expected %, got %',
        v_enum_spec.enum_name, v_enum_spec.expected_labels, v_actual_labels;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- B3. ALL 45 RLS POLICIES INDIVIDUALLY (NAME, TABLE, CMD, ROLES, QUAL, CHECK)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_pol_total FROM pg_policies WHERE schemaname = 'public';
  IF v_pol_total != 45 THEN
    RAISE EXCEPTION 'B3 Policy Failure: Expected 45 policies in public, found %', v_pol_total;
  END IF;

  FOR v_pol_spec IN
    SELECT * FROM (VALUES
      ('activity_logs', 'Members read activity logs', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL::text),
      ('ai_subscriptions', 'Admins delete subscriptions', 'DELETE', ARRAY['public'], 'is_workspace_admin_or_owner(workspace_id)', NULL),
      ('ai_subscriptions', 'Members insert subscriptions', 'INSERT', ARRAY['public'], NULL, '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))'),
      ('ai_subscriptions', 'Members read subscriptions', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('ai_subscriptions', 'Members update subscriptions', 'UPDATE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('financial_transactions', 'Admins delete transactions', 'DELETE', ARRAY['public'], 'is_workspace_admin_or_owner(workspace_id)', NULL),
      ('financial_transactions', 'Members insert transactions', 'INSERT', ARRAY['public'], NULL, '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))'),
      ('financial_transactions', 'Members read transactions', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('financial_transactions', 'Members update transactions', 'UPDATE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('milestones', 'Members delete milestones', 'DELETE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('milestones', 'Members insert milestones', 'INSERT', ARRAY['public'], NULL, '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))'),
      ('milestones', 'Members read milestones', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('milestones', 'Members update milestones', 'UPDATE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('profiles', 'Users insert own profile', 'INSERT', ARRAY['public'], NULL, '(id = auth.uid())'),
      ('profiles', 'Users read shared profiles', 'SELECT', ARRAY['public'], '((id = auth.uid()) OR (EXISTS ( SELECT 1 FROM (workspace_members wm1 JOIN workspace_members wm2 ON ((wm1.workspace_id = wm2.workspace_id))) WHERE ((wm1.user_id = auth.uid()) AND (wm2.user_id = profiles.id) AND (wm1.status = ''Active''::member_status)))))', NULL),
      ('profiles', 'Users update own profile', 'UPDATE', ARRAY['public'], '(id = auth.uid())', '(id = auth.uid())'),
      ('projects', 'Admins delete projects', 'DELETE', ARRAY['public'], 'is_workspace_admin_or_owner(workspace_id)', NULL),
      ('projects', 'Members insert projects', 'INSERT', ARRAY['public'], NULL, '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))'),
      ('projects', 'Members read projects', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('projects', 'Members update projects', 'UPDATE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('tasks', 'Members delete tasks', 'DELETE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('tasks', 'Members insert tasks', 'INSERT', ARRAY['public'], NULL, '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))'),
      ('tasks', 'Members read tasks', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('tasks', 'Members update tasks', 'UPDATE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('workspace_invitations', 'Admins delete invitations', 'DELETE', ARRAY['public'], '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])))', NULL),
      ('workspace_invitations', 'Owners delete invitations', 'DELETE', ARRAY['public'], '(get_user_workspace_role(workspace_id) = ''Owner''::member_role)', NULL),
      ('workspace_invitations', 'Admins create invitations', 'INSERT', ARRAY['public'], NULL, '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])))'),
      ('workspace_invitations', 'Owners create invitations', 'INSERT', ARRAY['public'], NULL, '((get_user_workspace_role(workspace_id) = ''Owner''::member_role) AND (role = ANY (ARRAY[''Administrator''::member_role, ''Member''::member_role, ''Viewer''::member_role])))'),
      ('workspace_invitations', 'Admins read invitations', 'SELECT', ARRAY['public'], 'is_workspace_admin_or_owner(workspace_id)', NULL),
      ('workspace_invitations', 'Admins update invitations', 'UPDATE', ARRAY['public'], '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])))', '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])))'),
      ('workspace_invitations', 'Owners update invitations', 'UPDATE', ARRAY['public'], '(get_user_workspace_role(workspace_id) = ''Owner''::member_role)', NULL),
      ('workspace_members', 'Admins remove roster', 'DELETE', ARRAY['public'], '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])) AND (user_id <> auth.uid()))', NULL),
      ('workspace_members', 'Owners remove roster', 'DELETE', ARRAY['public'], '((get_user_workspace_role(workspace_id) = ''Owner''::member_role) AND (role <> ''Owner''::member_role))', NULL),
      ('workspace_members', 'Members view roster', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('workspace_members', 'Admins update roster', 'UPDATE', ARRAY['public'], '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])) AND (user_id <> auth.uid()))', '((get_user_workspace_role(workspace_id) = ''Administrator''::member_role) AND (role = ANY (ARRAY[''Member''::member_role, ''Viewer''::member_role])) AND (user_id <> auth.uid()))'),
      ('workspace_members', 'Owners update roster', 'UPDATE', ARRAY['public'], '((get_user_workspace_role(workspace_id) = ''Owner''::member_role) AND (role <> ''Owner''::member_role))', '((get_user_workspace_role(workspace_id) = ''Owner''::member_role) AND (role <> ''Owner''::member_role))'),
      ('workspace_notes', 'Members delete notes', 'DELETE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('workspace_notes', 'Members insert notes', 'INSERT', ARRAY['public'], NULL, '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))'),
      ('workspace_notes', 'Members read notes', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('workspace_notes', 'Members update notes', 'UPDATE', ARRAY['public'], '(is_workspace_member(workspace_id) AND (get_user_workspace_role(workspace_id) <> ''Viewer''::member_role))', NULL),
      ('workspace_settings', 'Members read settings', 'SELECT', ARRAY['public'], 'is_workspace_member(workspace_id)', NULL),
      ('workspace_settings', 'Admins update settings', 'UPDATE', ARRAY['public'], 'is_workspace_admin_or_owner(workspace_id)', NULL),
      ('workspaces', 'Owners delete workspaces', 'DELETE', ARRAY['public'], '(get_user_workspace_role(id) = ''Owner''::member_role)', NULL),
      ('workspaces', 'Members view workspaces', 'SELECT', ARRAY['public'], 'is_workspace_member(id)', NULL),
      ('workspaces', 'Admins update workspaces', 'UPDATE', ARRAY['public'], 'is_workspace_admin_or_owner(id)', NULL)
    ) AS p(tbl, pol, cmd, expected_roles, expected_qual, expected_check)
  LOOP
    SELECT cmd, roles::text[] AS roles,
           regexp_replace(COALESCE(qual, ''), '\s+', ' ', 'g') AS norm_qual,
           regexp_replace(COALESCE(with_check, ''), '\s+', ' ', 'g') AS norm_check
    INTO v_pol_row
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = v_pol_spec.tbl AND policyname = v_pol_spec.pol;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'B3 Policy Failure: Missing policy "%" on public.%', v_pol_spec.pol, v_pol_spec.tbl;
    END IF;
    IF v_pol_row.cmd != v_pol_spec.cmd THEN
      RAISE EXCEPTION 'B3 Policy Failure: Policy "%" on public.% has cmd %, expected %',
        v_pol_spec.pol, v_pol_spec.tbl, v_pol_row.cmd, v_pol_spec.cmd;
    END IF;
    IF v_pol_row.roles IS DISTINCT FROM v_pol_spec.expected_roles THEN
      RAISE EXCEPTION 'B3 Policy Failure: Policy "%" on public.% has roles %, expected %',
        v_pol_spec.pol, v_pol_spec.tbl, v_pol_row.roles, v_pol_spec.expected_roles;
    END IF;
    IF v_pol_row.norm_qual != COALESCE(v_pol_spec.expected_qual, '') THEN
      RAISE EXCEPTION 'B3 Policy Failure: USING mismatch on "%" (public.%). Got: %, Expected: %',
        v_pol_spec.pol, v_pol_spec.tbl, v_pol_row.norm_qual, v_pol_spec.expected_qual;
    END IF;
    IF v_pol_row.norm_check != COALESCE(v_pol_spec.expected_check, '') THEN
      RAISE EXCEPTION 'B3 Policy Failure: WITH CHECK mismatch on "%" (public.%). Got: %, Expected: %',
        v_pol_spec.pol, v_pol_spec.tbl, v_pol_row.norm_check, v_pol_spec.expected_check;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- B4. FUNCTIONS INDIVIDUALLY (17 PRE_REMEDIATION / 19 POST_REMEDIATION)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_fn_total
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f';
  IF v_fn_total != v_expected_fn_count THEN
    RAISE EXCEPTION '[MODE: %] B4 Function Failure: Expected % functions in public, found %',
      v_expected_mode, v_expected_fn_count, v_fn_total;
  END IF;

  FOR v_fn_spec IN
    SELECT * FROM (VALUES
      ('PRE_REMEDIATION',  'accept_workspace_invitation', 1, 'p_token text', 'uuid', true, 'search_path=public, auth, extensions, pg_temp', true),
      ('PRE_REMEDIATION',  'create_workspace_with_owner', 3, 'ws_name character varying, ws_description text, ws_timezone character varying', 'uuid', true, 'search_path=public, auth, pg_temp', true),
      ('PRE_REMEDIATION',  'delete_workspace_by_owner', 1, 'p_workspace_id uuid', 'void', true, 'search_path=public, auth, pg_temp', true),
      ('PRE_REMEDIATION',  'get_user_workspace_role', 1, 'ws_id uuid', 'member_role', true, 'search_path=public, auth, pg_temp', true),
      ('PRE_REMEDIATION',  'is_workspace_admin_or_owner', 1, 'ws_id uuid', 'boolean', true, 'search_path=public, auth, pg_temp', true),
      ('PRE_REMEDIATION',  'is_workspace_member', 1, 'ws_id uuid', 'boolean', true, 'search_path=public, auth, pg_temp', true),
      ('PRE_REMEDIATION',  'log_workspace_activity', 6, 'p_workspace_id uuid, p_action character varying, p_entity_type character varying, p_entity_id uuid, p_category character varying, p_metadata jsonb', 'uuid', true, 'search_path=public, auth, pg_temp', true),
      ('PRE_REMEDIATION',  'handle_new_user', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'handle_workspace_deletion_authorization', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'protect_workspace_members_immutability', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'protect_workspace_members_deletion', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'handle_project_deletion_cleanup', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'handle_milestone_deletion_cleanup', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'validate_project_workspace_integrity', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'validate_subscription_project_workspace_integrity', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('PRE_REMEDIATION',  'handle_updated_at', 0, '', 'trigger', false, NULL::text, false),
      ('PRE_REMEDIATION',  'prevent_note_type_change', 0, '', 'trigger', false, NULL::text, false),
      ('POST_REMEDIATION', 'protect_profiles_email_immutability', 0, '', 'trigger', false, 'search_path=public, pg_temp', false),
      ('POST_REMEDIATION', 'sync_profile_email_from_auth', 0, '', 'trigger', true, 'search_path=public, auth, pg_temp', false)
    ) AS f(min_mode, fn_name, expected_nargs, expected_id_args, ret_type, is_secdef, expected_sp, is_rpc)
    WHERE f.min_mode = 'PRE_REMEDIATION' OR v_expected_mode = 'POST_REMEDIATION'
  LOOP
    SELECT count(*) INTO v_fn_count
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_fn_spec.fn_name;

    IF v_fn_count = 0 THEN
      RAISE EXCEPTION 'B4 Function Failure: Missing function public.%', v_fn_spec.fn_name;
    END IF;
    IF v_fn_count > 1 THEN
      RAISE EXCEPTION 'B4 Overload Failure: Unexpected overload count % for public.%', v_fn_count, v_fn_spec.fn_name;
    END IF;

    SELECT p.oid, p.prokind, p.pronargs,
           pg_get_function_identity_arguments(p.oid) AS id_args,
           pg_get_function_result(p.oid) AS res_type,
           p.prosecdef, p.proconfig, p.proacl
    INTO v_fn_row
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_fn_spec.fn_name;

    IF v_fn_row.prokind != 'f' THEN
      RAISE EXCEPTION 'B4 Function Failure: public.% prokind is %, expected f', v_fn_spec.fn_name, v_fn_row.prokind;
    END IF;
    IF v_fn_row.pronargs != v_fn_spec.expected_nargs THEN
      RAISE EXCEPTION 'B4 Signature Failure: public.% pronargs is %, expected %',
        v_fn_spec.fn_name, v_fn_row.pronargs, v_fn_spec.expected_nargs;
    END IF;
    IF v_fn_row.id_args != v_fn_spec.expected_id_args THEN
      RAISE EXCEPTION 'B4 Signature Failure: public.% identity args "%" != expected "%"',
        v_fn_spec.fn_name, v_fn_row.id_args, v_fn_spec.expected_id_args;
    END IF;
    IF v_fn_row.res_type != v_fn_spec.ret_type THEN
      RAISE EXCEPTION 'B4 Function Failure: public.% return type is %, expected %',
        v_fn_spec.fn_name, v_fn_row.res_type, v_fn_spec.ret_type;
    END IF;
    IF v_fn_row.prosecdef != v_fn_spec.is_secdef THEN
      RAISE EXCEPTION 'B4 Function Failure: public.% prosecdef is %, expected %',
        v_fn_spec.fn_name, v_fn_row.prosecdef, v_fn_spec.is_secdef;
    END IF;
    IF v_fn_spec.expected_sp IS NOT NULL THEN
      IF v_fn_row.proconfig IS NULL OR NOT (v_fn_spec.expected_sp = ANY(v_fn_row.proconfig)) THEN
        RAISE EXCEPTION 'B4 Function Failure: public.% missing expected % (got %)',
          v_fn_spec.fn_name, v_fn_spec.expected_sp, v_fn_row.proconfig;
      END IF;
    ELSE
      IF v_fn_row.proconfig IS NOT NULL THEN
        RAISE EXCEPTION 'B4 Function Failure: public.% has unexpected proconfig %',
          v_fn_spec.fn_name, v_fn_row.proconfig;
      END IF;
    END IF;
    IF has_function_privilege('public', v_fn_row.oid, 'EXECUTE')
       OR has_function_privilege('anon', v_fn_row.oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'B4 Privilege Failure: PUBLIC or anon can EXECUTE public.%', v_fn_spec.fn_name;
    END IF;
    SELECT string_agg(COALESCE(pg_get_userbyid(a.grantee), 'PUBLIC'), ', ')
    INTO v_fn_acl_leak
    FROM aclexplode(v_fn_row.proacl) a
    WHERE a.grantee = 0 OR pg_get_userbyid(a.grantee) = 'anon';
    IF v_fn_acl_leak IS NOT NULL THEN
      RAISE EXCEPTION 'B4 ACL Failure: public.% proacl contains PUBLIC/anon: %', v_fn_spec.fn_name, v_fn_acl_leak;
    END IF;
    IF has_function_privilege('authenticated', v_fn_row.oid, 'EXECUTE') != v_fn_spec.is_rpc THEN
      RAISE EXCEPTION 'B4 Privilege Failure: authenticated EXECUTE on public.% is %, expected %',
        v_fn_spec.fn_name, NOT v_fn_spec.is_rpc, v_fn_spec.is_rpc;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- B5. ALL 3 FINANCIAL VIEWS (EXISTENCE, COLUMNS, SOURCES, LOGIC, SECURITY_INVOKER, GRANTS)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_view_total
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'v';
  IF v_view_total != 3 THEN
    RAISE EXCEPTION 'B5 View Failure: Expected exactly 3 views in public, found %', v_view_total;
  END IF;

  FOR v_view_spec IN
    SELECT * FROM (VALUES
      (
        'view_overall_finance_kpis',
        ARRAY['workspace_id','total_income','total_expenses','net_cashflow','total_investment','realized_investment_return','roi_percent','roi_note'],
        ARRAY['financial_transactions'],
        'GROUP BY workspace_id',
        'is_investment_return = true'
      ),
      (
        'view_project_finance_summary',
        ARRAY['workspace_id','project_id','project_title','category','income','expenses','investment','net_cashflow','tracked_return','roi_percent','roi_note'],
        ARRAY['projects','financial_transactions'],
        'GROUP BY p.workspace_id, p.id, p.title, p.category',
        'LEFT JOIN financial_transactions t ON p.id = t.project_id AND p.workspace_id = t.workspace_id'
      ),
      (
        'view_monthly_financial_trends',
        ARRAY['workspace_id','month_key','month_label','income','expenses','investment','net_cashflow'],
        ARRAY['financial_transactions'],
        'GROUP BY workspace_id',
        'YYYY-MM'
      )
    ) AS v(view_name, expected_cols, expected_sources, expected_group, expected_semantic)
  LOOP
    SELECT c.oid, c.reloptions, pg_get_viewdef(c.oid, true)
    INTO v_view_oid, v_reloptions, v_view_def
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_view_spec.view_name AND c.relkind = 'v';

    IF v_view_oid IS NULL THEN
      RAISE EXCEPTION 'B5 View Failure: Missing view public.%', v_view_spec.view_name;
    END IF;
    IF v_reloptions IS NULL OR NOT ('security_invoker=true' = ANY(v_reloptions)) THEN
      RAISE EXCEPTION 'B5 View Failure: public.% missing security_invoker=true', v_view_spec.view_name;
    END IF;

    SELECT array_agg(a.attname::text ORDER BY a.attnum) INTO v_view_cols
    FROM pg_attribute a
    WHERE a.attrelid = v_view_oid AND a.attnum > 0 AND NOT a.attisdropped;
    IF v_view_cols IS DISTINCT FROM v_view_spec.expected_cols THEN
      RAISE EXCEPTION 'B5 View Column Failure: public.% columns % != expected %',
        v_view_spec.view_name, v_view_cols, v_view_spec.expected_cols;
    END IF;

    IF v_view_def NOT LIKE '%' || v_view_spec.expected_group || '%' THEN
      RAISE EXCEPTION 'B5 View Logic Failure: public.% missing expected grouping "%"',
        v_view_spec.view_name, v_view_spec.expected_group;
    END IF;
    IF v_view_def NOT LIKE '%' || v_view_spec.expected_semantic || '%' THEN
      RAISE EXCEPTION 'B5 View Logic Failure: public.% missing expected semantic clause "%"',
        v_view_spec.view_name, v_view_spec.expected_semantic;
    END IF;

    -- Verify underlying table dependencies via pg_depend + pg_rewrite
    IF EXISTS (
      SELECT 1 FROM unnest(v_view_spec.expected_sources) AS src_tbl
      WHERE NOT EXISTS (
        SELECT 1
        FROM pg_rewrite rw
        JOIN pg_depend d ON d.objid = rw.oid AND d.classid = 'pg_rewrite'::regclass
        JOIN pg_class ref ON ref.oid = d.refobjid
        JOIN pg_namespace rn ON rn.oid = ref.relnamespace
        WHERE rw.ev_class = v_view_oid AND rn.nspname = 'public' AND ref.relname = src_tbl
      )
    ) THEN
      RAISE EXCEPTION 'B5 View Dependency Failure: public.% missing expected source dependency in %',
        v_view_spec.view_name, v_view_spec.expected_sources;
    END IF;

    IF has_table_privilege('anon', 'public.' || v_view_spec.view_name, 'SELECT')
       OR has_table_privilege('public', 'public.' || v_view_spec.view_name, 'SELECT') THEN
      RAISE EXCEPTION 'B5 View Privilege Failure: anon or PUBLIC has SELECT on public.%', v_view_spec.view_name;
    END IF;
    IF NOT has_table_privilege('authenticated', 'public.' || v_view_spec.view_name, 'SELECT') THEN
      RAISE EXCEPTION 'B5 View Privilege Failure: authenticated missing SELECT on public.%', v_view_spec.view_name;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- B6. TRIGGERS INDIVIDUALLY (20 PRE_REMEDIATION / 22 POST_REMEDIATION)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_trg_total
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND (n.nspname = 'public' OR (n.nspname = 'auth' AND c.relname = 'users'));
  IF v_trg_total != v_expected_trg_count THEN
    RAISE EXCEPTION '[MODE: %] B6 Trigger Failure: Expected % triggers, found %',
      v_expected_mode, v_expected_trg_count, v_trg_total;
  END IF;

  FOR v_trg_spec IN
    SELECT * FROM (VALUES
      ('PRE_REMEDIATION',  'auth', 'users', 'on_auth_user_created', 'AFTER INSERT', 'handle_new_user'),
      ('PRE_REMEDIATION',  'public', 'ai_subscriptions', 'trg_subs_project_ws_integrity', 'BEFORE INSERT OR UPDATE', 'validate_subscription_project_workspace_integrity'),
      ('PRE_REMEDIATION',  'public', 'ai_subscriptions', 'trg_subs_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'financial_transactions', 'trg_tx_project_ws_integrity', 'BEFORE INSERT OR UPDATE', 'validate_project_workspace_integrity'),
      ('PRE_REMEDIATION',  'public', 'financial_transactions', 'trg_tx_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'milestones', 'trg_milestone_deletion_cleanup', 'BEFORE DELETE', 'handle_milestone_deletion_cleanup'),
      ('PRE_REMEDIATION',  'public', 'milestones', 'trg_milestones_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'profiles', 'trg_profiles_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'projects', 'trg_project_deletion_cleanup', 'BEFORE DELETE', 'handle_project_deletion_cleanup'),
      ('PRE_REMEDIATION',  'public', 'projects', 'trg_projects_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'tasks', 'trg_tasks_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'workspace_members', 'trg_members_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'workspace_members', 'trg_protect_members_deletion', 'BEFORE DELETE', 'protect_workspace_members_deletion'),
      ('PRE_REMEDIATION',  'public', 'workspace_members', 'trg_protect_members_immutability', 'BEFORE UPDATE', 'protect_workspace_members_immutability'),
      ('PRE_REMEDIATION',  'public', 'workspace_notes', 'trg_note_type_immutability', 'BEFORE UPDATE', 'prevent_note_type_change'),
      ('PRE_REMEDIATION',  'public', 'workspace_notes', 'trg_notes_project_ws_integrity', 'BEFORE INSERT OR UPDATE', 'validate_project_workspace_integrity'),
      ('PRE_REMEDIATION',  'public', 'workspace_notes', 'trg_notes_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'workspace_settings', 'trg_settings_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('PRE_REMEDIATION',  'public', 'workspaces', 'trg_workspace_deletion_auth', 'BEFORE DELETE', 'handle_workspace_deletion_authorization'),
      ('PRE_REMEDIATION',  'public', 'workspaces', 'trg_workspaces_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('POST_REMEDIATION', 'public', 'profiles', 'trg_protect_profiles_email', 'BEFORE UPDATE', 'protect_profiles_email_immutability'),
      ('POST_REMEDIATION', 'auth', 'users', 'on_auth_user_email_updated', 'AFTER UPDATE OF email', 'sync_profile_email_from_auth')
    ) AS tr(min_mode, tbl_schema, tbl_name, trg_name, timing_event, fn_name)
    WHERE tr.min_mode = 'PRE_REMEDIATION' OR v_expected_mode = 'POST_REMEDIATION'
  LOOP
    SELECT t.tgenabled, p.proname, pg_get_triggerdef(t.oid)
    INTO v_trg_enabled, v_trg_fn, v_trg_def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE NOT t.tgisinternal
      AND n.nspname = v_trg_spec.tbl_schema
      AND c.relname = v_trg_spec.tbl_name
      AND t.tgname = v_trg_spec.trg_name;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'B6 Trigger Failure: Missing trigger % on %.%',
        v_trg_spec.trg_name, v_trg_spec.tbl_schema, v_trg_spec.tbl_name;
    END IF;
    IF v_trg_enabled != 'O' THEN
      RAISE EXCEPTION 'B6 Trigger Failure: Trigger % is not enabled (tgenabled=%)',
        v_trg_spec.trg_name, v_trg_enabled;
    END IF;
    IF v_trg_fn != v_trg_spec.fn_name THEN
      RAISE EXCEPTION 'B6 Trigger Failure: Trigger % calls %, expected %',
        v_trg_spec.trg_name, v_trg_fn, v_trg_spec.fn_name;
    END IF;
    IF v_trg_def NOT LIKE '%' || v_trg_spec.timing_event || '%' THEN
      RAISE EXCEPTION 'B6 Trigger Failure: Trigger % timing/event mismatch (def: %)',
        v_trg_spec.trg_name, v_trg_def;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- B7. ALL 52 CONSTRAINTS (DEFINITION, VALIDATION, DEFERRABILITY) & 16 INDEXES
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_con_total
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public';
  IF v_con_total != 52 THEN
    RAISE EXCEPTION 'B7 Constraint Failure: Expected 52 constraints in public, found %', v_con_total;
  END IF;

  FOR v_con_spec IN
    SELECT * FROM (VALUES
      ('activity_logs', 'activity_logs_pkey', 'p', 'PRIMARY KEY (id)'),
      ('activity_logs', 'activity_logs_user_id_fkey', 'f', 'FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('activity_logs', 'activity_logs_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('ai_subscriptions', 'ai_subscriptions_pkey', 'p', 'PRIMARY KEY (id)'),
      ('ai_subscriptions', 'chk_subscription_amount', 'c', 'CHECK ((amount >= (0)::numeric))'),
      ('ai_subscriptions', 'chk_subscription_currency', 'c', 'CHECK (((currency)::text = ''MYR''::text))'),
      ('ai_subscriptions', 'ai_subscriptions_assigned_project_id_fkey', 'f', 'FOREIGN KEY (assigned_project_id) REFERENCES projects(id) ON DELETE SET NULL'),
      ('ai_subscriptions', 'ai_subscriptions_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('ai_subscriptions', 'ai_subscriptions_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('financial_transactions', 'financial_transactions_pkey', 'p', 'PRIMARY KEY (id)'),
      ('financial_transactions', 'chk_investment_return_type', 'c', 'CHECK (((type = ''Income''::transaction_type) OR (is_investment_return = false)))'),
      ('financial_transactions', 'chk_positive_amount', 'c', 'CHECK ((amount > (0)::numeric))'),
      ('financial_transactions', 'financial_transactions_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('financial_transactions', 'financial_transactions_project_id_fkey', 'f', 'FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL'),
      ('financial_transactions', 'financial_transactions_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('milestones', 'milestones_pkey', 'p', 'PRIMARY KEY (id)'),
      ('milestones', 'uq_milestones_ws_id', 'u', 'UNIQUE (workspace_id, id)'),
      ('milestones', 'fk_milestone_project_ws', 'f', 'FOREIGN KEY (workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE'),
      ('milestones', 'milestones_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('milestones', 'milestones_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('profiles', 'profiles_pkey', 'p', 'PRIMARY KEY (id)'),
      ('profiles', 'profiles_email_key', 'u', 'UNIQUE (email)'),
      ('profiles', 'profiles_id_fkey', 'f', 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE'),
      ('projects', 'projects_pkey', 'p', 'PRIMARY KEY (id)'),
      ('projects', 'uq_projects_ws_id', 'u', 'UNIQUE (workspace_id, id)'),
      ('projects', 'uq_projects_ws_slug', 'u', 'UNIQUE (workspace_id, slug)'),
      ('projects', 'projects_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('projects', 'projects_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('tasks', 'tasks_pkey', 'p', 'PRIMARY KEY (id)'),
      ('tasks', 'fk_task_milestone_ws', 'f', 'FOREIGN KEY (workspace_id, milestone_id) REFERENCES milestones(workspace_id, id) ON DELETE SET NULL (milestone_id)'),
      ('tasks', 'fk_task_project_ws', 'f', 'FOREIGN KEY (workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE'),
      ('tasks', 'tasks_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('tasks', 'tasks_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('workspace_invitations', 'workspace_invitations_pkey', 'p', 'PRIMARY KEY (id)'),
      ('workspace_invitations', 'chk_invitation_role', 'c', 'CHECK ((role <> ''Owner''::member_role))'),
      ('workspace_invitations', 'chk_invitation_status', 'c', 'CHECK (((status)::text = ANY ((ARRAY[''pending''::character varying, ''accepted''::character varying, ''revoked''::character varying, ''expired''::character varying])::text[])))'),
      ('workspace_invitations', 'workspace_invitations_invited_by_fkey', 'f', 'FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE'),
      ('workspace_invitations', 'workspace_invitations_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('workspace_members', 'workspace_members_pkey', 'p', 'PRIMARY KEY (id)'),
      ('workspace_members', 'uq_workspace_member', 'u', 'UNIQUE (workspace_id, user_id)'),
      ('workspace_members', 'workspace_members_invited_by_fkey', 'f', 'FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('workspace_members', 'workspace_members_user_id_fkey', 'f', 'FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE'),
      ('workspace_members', 'workspace_members_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('workspace_notes', 'workspace_notes_pkey', 'p', 'PRIMARY KEY (id)'),
      ('workspace_notes', 'chk_decision_fields', 'c', 'CHECK ((((type = ''Decision''::note_record_type) AND (decision_status IS NOT NULL)) OR ((type = ''Note''::note_record_type) AND (decision_status IS NULL))))'),
      ('workspace_notes', 'workspace_notes_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL'),
      ('workspace_notes', 'workspace_notes_project_id_fkey', 'f', 'FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL'),
      ('workspace_notes', 'workspace_notes_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('workspace_settings', 'workspace_settings_pkey', 'p', 'PRIMARY KEY (workspace_id)'),
      ('workspace_settings', 'workspace_settings_workspace_id_fkey', 'f', 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE'),
      ('workspaces', 'workspaces_pkey', 'p', 'PRIMARY KEY (id)'),
      ('workspaces', 'workspaces_created_by_fkey', 'f', 'FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL')
    ) AS cn(tbl_name, con_name, con_type, expected_def)
  LOOP
    SELECT con.contype, con.convalidated, con.condeferrable, pg_get_constraintdef(con.oid) AS def
    INTO v_con_row
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_con_spec.tbl_name AND con.conname = v_con_spec.con_name;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'B7 Constraint Failure: Missing constraint % on public.%', v_con_spec.con_name, v_con_spec.tbl_name;
    END IF;
    IF v_con_row.contype != v_con_spec.con_type THEN
      RAISE EXCEPTION 'B7 Constraint Failure: % on public.% has contype %, expected %',
        v_con_spec.con_name, v_con_spec.tbl_name, v_con_row.contype, v_con_spec.con_type;
    END IF;
    IF NOT v_con_row.convalidated THEN
      RAISE EXCEPTION 'B7 Constraint Failure: % on public.% is NOT validated', v_con_spec.con_name, v_con_spec.tbl_name;
    END IF;
    IF v_con_row.condeferrable THEN
      RAISE EXCEPTION 'B7 Constraint Failure: % on public.% is unexpectedly deferrable', v_con_spec.con_name, v_con_spec.tbl_name;
    END IF;
    IF v_con_row.def != v_con_spec.expected_def THEN
      RAISE EXCEPTION 'B7 Constraint Definition Failure: % on public.% got "%", expected "%"',
        v_con_spec.con_name, v_con_spec.tbl_name, v_con_row.def, v_con_spec.expected_def;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'workspace_members'
      AND indexname = 'idx_workspace_single_owner'
      AND indexdef LIKE '%CREATE UNIQUE INDEX%'
      AND indexdef LIKE '%WHERE (role = ''Owner''::member_role)%'
  ) THEN
    RAISE EXCEPTION 'B7 Index Failure: idx_workspace_single_owner missing or altered';
  END IF;

  FOREACH v_idx_name IN ARRAY v_expected_indexes LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = v_idx_name
    ) THEN
      RAISE EXCEPTION 'B7 Index Failure: Missing expected index public.%', v_idx_name;
    END IF;
  END LOOP;

  RAISE NOTICE '[PASS] [MODE: %] Catalog assertions passed (12 tables, 11 enums, 45 policies, % functions, 3 views, % triggers, 52 constraints & 16 indexes).',
    v_expected_mode, v_expected_fn_count, v_expected_trg_count;
END $$;
