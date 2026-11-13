-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE (PHASE 6.1.1)
-- Test 01: Complete Schema, Catalog, Policy, Trigger & Constraint Validation
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- Read-only catalog assertions. Validates every expected object individually
-- (12 tables, 11 enums, 45 RLS policies, 17 functions, 3 views, 20 triggers,
-- constraints, and indexes). Raises EXCEPTION on any mismatch.
-- Note: Table/view privilege assertions are in 03_privilege_assertions_test.sql.
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
  v_unexpected text;

  v_enum_spec record;
  v_actual_labels text[];

  v_pol_spec record;
  v_pol_row record;
  v_pol_total int;

  v_fn_spec record;
  v_fn_row record;
  v_fn_total int;

  v_view_spec record;
  v_view_def text;
  v_reloptions text[];

  v_trg_spec record;
  v_trg_def text;
  v_trg_enabled "char";
  v_trg_fn name;
  v_trg_total int;

  v_con_spec record;
  v_idx_name text;
  v_expected_indexes text[] := ARRAY[
    'idx_workspace_single_owner', 'idx_members_user', 'idx_members_lookup',
    'idx_projects_workspace', 'idx_projects_slug', 'idx_milestones_proj',
    'idx_tasks_proj', 'idx_tasks_due', 'idx_tx_ws_date', 'idx_tx_roi',
    'idx_tx_proj', 'idx_subs_ws', 'idx_subs_renew', 'idx_notes_ws',
    'idx_activity_ws', 'idx_invitations_token'
  ];
BEGIN
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
  -- B4. ALL 17 FUNCTIONS INDIVIDUALLY (SIGNATURE, RETURN, MODE, SEARCH_PATH, GRANTS)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_fn_total
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f';
  IF v_fn_total != 17 THEN
    RAISE EXCEPTION 'B4 Function Failure: Expected 17 functions in public, found %', v_fn_total;
  END IF;

  FOR v_fn_spec IN
    SELECT * FROM (VALUES
      ('accept_workspace_invitation', 'uuid', true, 'search_path=public, auth, extensions, pg_temp', true),
      ('create_workspace_with_owner', 'uuid', true, 'search_path=public, auth, pg_temp', true),
      ('delete_workspace_by_owner', 'void', true, 'search_path=public, auth, pg_temp', true),
      ('get_user_workspace_role', 'member_role', true, 'search_path=public, auth, pg_temp', true),
      ('is_workspace_admin_or_owner', 'boolean', true, 'search_path=public, auth, pg_temp', true),
      ('is_workspace_member', 'boolean', true, 'search_path=public, auth, pg_temp', true),
      ('log_workspace_activity', 'uuid', true, 'search_path=public, auth, pg_temp', true),
      ('handle_new_user', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('handle_workspace_deletion_authorization', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('protect_workspace_members_immutability', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('protect_workspace_members_deletion', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('handle_project_deletion_cleanup', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('handle_milestone_deletion_cleanup', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('validate_project_workspace_integrity', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('validate_subscription_project_workspace_integrity', 'trigger', true, 'search_path=public, auth, pg_temp', false),
      ('handle_updated_at', 'trigger', false, NULL::text, false),
      ('prevent_note_type_change', 'trigger', false, NULL::text, false)
    ) AS f(fn_name, ret_type, is_secdef, expected_sp, is_rpc)
  LOOP
    SELECT p.oid, p.prorettype::regtype::text AS ret_type, p.prosecdef, p.proconfig
    INTO v_fn_row
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_fn_spec.fn_name;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'B4 Function Failure: Missing function public.%', v_fn_spec.fn_name;
    END IF;
    IF v_fn_row.ret_type != v_fn_spec.ret_type THEN
      RAISE EXCEPTION 'B4 Function Failure: public.% return type is %, expected %',
        v_fn_spec.fn_name, v_fn_row.ret_type, v_fn_spec.ret_type;
    END IF;
    IF v_fn_row.prosecdef != v_fn_spec.is_secdef THEN
      RAISE EXCEPTION 'B4 Function Failure: public.% prosecdef is %, expected %',
        v_fn_spec.fn_name, v_fn_row.prosecdef, v_fn_spec.is_secdef;
    END IF;
    IF v_fn_spec.is_secdef THEN
      IF v_fn_row.proconfig IS NULL OR NOT (v_fn_spec.expected_sp = ANY(v_fn_row.proconfig)) THEN
        RAISE EXCEPTION 'B4 Function Failure: SECURITY DEFINER public.% missing expected % (got %)',
          v_fn_spec.fn_name, v_fn_spec.expected_sp, v_fn_row.proconfig;
      END IF;
    END IF;
    IF has_function_privilege('public', v_fn_row.oid, 'EXECUTE')
       OR has_function_privilege('anon', v_fn_row.oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'B4 Privilege Failure: PUBLIC or anon can EXECUTE public.%', v_fn_spec.fn_name;
    END IF;
    IF has_function_privilege('authenticated', v_fn_row.oid, 'EXECUTE') != v_fn_spec.is_rpc THEN
      RAISE EXCEPTION 'B4 Privilege Failure: authenticated EXECUTE on public.% is %, expected %',
        v_fn_spec.fn_name, NOT v_fn_spec.is_rpc, v_fn_spec.is_rpc;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- B5. ALL 3 FINANCIAL VIEWS (EXISTENCE, SECURITY_INVOKER, DEFINITION, GRANTS)
  -- ----------------------------------------------------------------------------
  FOR v_view_spec IN
    SELECT * FROM (VALUES
      ('view_overall_finance_kpis', 'financial_transactions'),
      ('view_project_finance_summary', 'financial_transactions'),
      ('view_monthly_financial_trends', 'financial_transactions')
    ) AS v(view_name, expected_source)
  LOOP
    SELECT c.reloptions, pg_get_viewdef(c.oid, true)
    INTO v_reloptions, v_view_def
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_view_spec.view_name AND c.relkind = 'v';

    IF v_view_def IS NULL THEN
      RAISE EXCEPTION 'B5 View Failure: Missing view public.%', v_view_spec.view_name;
    END IF;
    IF v_reloptions IS NULL OR NOT ('security_invoker=true' = ANY(v_reloptions)) THEN
      RAISE EXCEPTION 'B5 View Failure: public.% missing security_invoker=true', v_view_spec.view_name;
    END IF;
    IF v_view_def NOT LIKE '%' || v_view_spec.expected_source || '%' THEN
      RAISE EXCEPTION 'B5 View Failure: public.% definition does not reference %',
        v_view_spec.view_name, v_view_spec.expected_source;
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
  -- B6. ALL 20 TRIGGERS INDIVIDUALLY (TABLE, TIMING, EVENT, ENABLED, FUNCTION)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_trg_total
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND (n.nspname = 'public' OR (n.nspname = 'auth' AND c.relname = 'users'));
  IF v_trg_total != 20 THEN
    RAISE EXCEPTION 'B6 Trigger Failure: Expected 20 triggers, found %', v_trg_total;
  END IF;

  FOR v_trg_spec IN
    SELECT * FROM (VALUES
      ('auth', 'users', 'on_auth_user_created', 'AFTER INSERT', 'handle_new_user'),
      ('public', 'ai_subscriptions', 'trg_subs_project_ws_integrity', 'BEFORE INSERT OR UPDATE', 'validate_subscription_project_workspace_integrity'),
      ('public', 'ai_subscriptions', 'trg_subs_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'financial_transactions', 'trg_tx_project_ws_integrity', 'BEFORE INSERT OR UPDATE', 'validate_project_workspace_integrity'),
      ('public', 'financial_transactions', 'trg_tx_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'milestones', 'trg_milestone_deletion_cleanup', 'BEFORE DELETE', 'handle_milestone_deletion_cleanup'),
      ('public', 'milestones', 'trg_milestones_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'profiles', 'trg_profiles_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'projects', 'trg_project_deletion_cleanup', 'BEFORE DELETE', 'handle_project_deletion_cleanup'),
      ('public', 'projects', 'trg_projects_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'tasks', 'trg_tasks_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'workspace_members', 'trg_members_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'workspace_members', 'trg_protect_members_deletion', 'BEFORE DELETE', 'protect_workspace_members_deletion'),
      ('public', 'workspace_members', 'trg_protect_members_immutability', 'BEFORE UPDATE', 'protect_workspace_members_immutability'),
      ('public', 'workspace_notes', 'trg_note_type_immutability', 'BEFORE UPDATE', 'prevent_note_type_change'),
      ('public', 'workspace_notes', 'trg_notes_project_ws_integrity', 'BEFORE INSERT OR UPDATE', 'validate_project_workspace_integrity'),
      ('public', 'workspace_notes', 'trg_notes_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'workspace_settings', 'trg_settings_updated_at', 'BEFORE UPDATE', 'handle_updated_at'),
      ('public', 'workspaces', 'trg_workspace_deletion_auth', 'BEFORE DELETE', 'handle_workspace_deletion_authorization'),
      ('public', 'workspaces', 'trg_workspaces_updated_at', 'BEFORE UPDATE', 'handle_updated_at')
    ) AS tr(tbl_schema, tbl_name, trg_name, timing_event, fn_name)
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
  -- B7. CONSTRAINTS (PK, UNIQUE, COMPOSITE FK, FINANCIAL CHECK) & INDEXES
  -- ----------------------------------------------------------------------------
  FOR v_con_spec IN
    SELECT * FROM (VALUES
      ('workspaces', 'workspaces_pkey', 'p'),
      ('profiles', 'profiles_pkey', 'p'),
      ('profiles', 'profiles_email_key', 'u'),
      ('workspace_members', 'workspace_members_pkey', 'p'),
      ('workspace_members', 'uq_workspace_member', 'u'),
      ('workspace_invitations', 'workspace_invitations_pkey', 'p'),
      ('workspace_invitations', 'chk_invitation_role', 'c'),
      ('workspace_invitations', 'chk_invitation_status', 'c'),
      ('workspace_settings', 'workspace_settings_pkey', 'p'),
      ('projects', 'projects_pkey', 'p'),
      ('projects', 'uq_projects_ws_id', 'u'),
      ('projects', 'uq_projects_ws_slug', 'u'),
      ('milestones', 'milestones_pkey', 'p'),
      ('milestones', 'uq_milestones_ws_id', 'u'),
      ('milestones', 'fk_milestone_project_ws', 'f'),
      ('tasks', 'tasks_pkey', 'p'),
      ('tasks', 'fk_task_project_ws', 'f'),
      ('tasks', 'fk_task_milestone_ws', 'f'),
      ('financial_transactions', 'financial_transactions_pkey', 'p'),
      ('financial_transactions', 'chk_positive_amount', 'c'),
      ('financial_transactions', 'chk_investment_return_type', 'c'),
      ('ai_subscriptions', 'ai_subscriptions_pkey', 'p'),
      ('ai_subscriptions', 'chk_subscription_amount', 'c'),
      ('ai_subscriptions', 'chk_subscription_currency', 'c'),
      ('workspace_notes', 'workspace_notes_pkey', 'p'),
      ('workspace_notes', 'chk_decision_fields', 'c'),
      ('activity_logs', 'activity_logs_pkey', 'p')
    ) AS cn(tbl_name, con_name, con_type)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_con_spec.tbl_name
        AND con.conname = v_con_spec.con_name AND con.contype = v_con_spec.con_type
    ) THEN
      RAISE EXCEPTION 'B7 Constraint Failure: Missing constraint % (type %) on public.%',
        v_con_spec.con_name, v_con_spec.con_type, v_con_spec.tbl_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_task_milestone_ws' AND confdeltype = 'n'
  ) THEN
    RAISE EXCEPTION 'B7 Constraint Failure: fk_task_milestone_ws must have ON DELETE SET NULL (confdeltype = n)';
  END IF;

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

  RAISE NOTICE '[PASS] All Phase 6.1.1 catalog assertions passed (12 tables, 11 enums, 45 policies, 17 functions, 3 views, 20 triggers, constraints & indexes).';
END $$;
