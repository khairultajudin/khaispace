-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE (PHASE 6.1)
-- Test 02: Strengthened Authenticated RLS, Role Matrix, View Isolation & RPC Tests
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- NOTE: Executes in a single DO block ending with an intentional exception
-- ('PHASE_6_1_ALL_TESTS_PASSED_INTENTIONAL_ROLLBACK') to guarantee atomic rollback.
-- Zero test fixtures, rows, or auth users persist in the remote database.
-- All security and isolation assertions execute under `authenticated` or `anon`.
-- ==============================================================================

DO $$
DECLARE
  -- Distinct test user identities
  user_a uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  user_b uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  user_admin uuid := '33333333-3333-3333-3333-333333333333'::uuid;
  user_member uuid := '44444444-4444-4444-4444-444444444444'::uuid;
  user_viewer uuid := '55555555-5555-5555-5555-555555555555'::uuid;
  user_suspended uuid := '66666666-6666-6666-6666-666666666666'::uuid;
  user_nonmember uuid := '77777777-7777-7777-7777-777777777777'::uuid;
  user_invited uuid := '88888888-8888-8888-8888-888888888888'::uuid;

  ws_a uuid;
  ws_b uuid;
  proj_a uuid;
  proj_b uuid;
  task_a uuid;
  tx_a uuid;
  inv_id uuid;

  v_count int;
  v_affected int;
  v_denied boolean;
  kpi_row record;
  plain_token text := 'phase61-secure-invite-token';
  v_token_hash text;
BEGIN
  -- ----------------------------------------------------------------------------
  -- PRIVILEGED SETUP: Create auth.users identities (triggers handle_new_user)
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
    (user_a, 'owner-a@example.com', now(), '{"full_name": "Owner A"}'::jsonb),
    (user_b, 'owner-b@example.com', now(), '{"full_name": "Owner B"}'::jsonb),
    (user_admin, 'admin-a@example.com', now(), '{"full_name": "Admin A"}'::jsonb),
    (user_member, 'member-a@example.com', now(), '{"full_name": "Member A"}'::jsonb),
    (user_viewer, 'viewer-a@example.com', now(), '{"full_name": "Viewer A"}'::jsonb),
    (user_suspended, 'suspended-a@example.com', now(), '{"full_name": "Suspended A"}'::jsonb),
    (user_nonmember, 'nonmember@example.com', now(), '{"full_name": "Non Member"}'::jsonb),
    (user_invited, 'invited@example.com', now(), '{"full_name": "Invited User"}'::jsonb);

  -- ----------------------------------------------------------------------------
  -- 1. RPC EXECUTION TESTS UNDER `anon` AND `authenticated`
  -- ----------------------------------------------------------------------------
  -- 1a. `anon` cannot call create_workspace_with_owner (42501 insufficient_privilege)
  v_denied := false;
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.create_workspace_with_owner('Anon Workspace');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  RESET ROLE;
  IF NOT v_denied THEN
    RAISE EXCEPTION 'Security Failure: anon was able to execute create_workspace_with_owner!';
  END IF;

  -- 1b. `authenticated` with NULL auth.uid() rejected (P0001)
  v_denied := false;
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.create_workspace_with_owner('Null UID Workspace');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%Authentication required%' THEN
      v_denied := true;
    END IF;
  END;
  RESET ROLE;
  IF NOT v_denied THEN
    RAISE EXCEPTION 'Security Failure: NULL auth.uid() was not rejected by create_workspace_with_owner!';
  END IF;

  -- 1c. Authenticated User A creates Workspace A via RPC
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  ws_a := public.create_workspace_with_owner('Workspace A', 'Tenant A');
  RESET ROLE;
  IF ws_a IS NULL THEN
    RAISE EXCEPTION 'RPC Failure: User A failed to create Workspace A!';
  END IF;

  -- 1d. Authenticated User B creates Workspace B via RPC
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  ws_b := public.create_workspace_with_owner('Workspace B', 'Tenant B');
  RESET ROLE;
  IF ws_b IS NULL THEN
    RAISE EXCEPTION 'RPC Failure: User B failed to create Workspace B!';
  END IF;

  -- ----------------------------------------------------------------------------
  -- PRIVILEGED SETUP: Seed roles in Workspace A and fixtures in Workspace A & B
  -- ----------------------------------------------------------------------------
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status) VALUES
    (ws_a, user_admin, 'Administrator', 'Active'),
    (ws_a, user_member, 'Member', 'Active'),
    (ws_a, user_viewer, 'Viewer', 'Active'),
    (ws_a, user_suspended, 'Member', 'Suspended');

  INSERT INTO public.projects (workspace_id, slug, title, category, description)
  VALUES (ws_a, 'alpha', 'Alpha Project', 'Engineering', 'Workspace A Project')
  RETURNING id INTO proj_a;

  INSERT INTO public.projects (workspace_id, slug, title, category, description)
  VALUES (ws_b, 'beta', 'Beta Project', 'Operations', 'Workspace B Project')
  RETURNING id INTO proj_b;

  INSERT INTO public.tasks (workspace_id, project_id, title, due_date)
  VALUES (ws_a, proj_a, 'Alpha Task', current_date + 7)
  RETURNING id INTO task_a;

  INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description, is_investment_return) VALUES
    (ws_a, proj_a, current_date, 'Income', 'Consulting', 15000.00, 'A Income', false),
    (ws_a, proj_a, current_date, 'Expense', 'Cloud', 3000.00, 'A Expense', false),
    (ws_a, proj_a, current_date, 'Investment', 'Hardware', 10000.00, 'A Investment', false),
    (ws_a, proj_a, current_date, 'Income', 'Dividends', 12500.00, 'A Return', true),
    (ws_b, proj_b, current_date, 'Income', 'Sales', 5000.00, 'B Income', false),
    (ws_b, proj_b, current_date, 'Expense', 'Ops', 1000.00, 'B Expense', false);

  -- ----------------------------------------------------------------------------
  -- 2. AUTHENTICATED CROSS-WORKSPACE RLS ISOLATION (USER A vs USER B)
  -- ----------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;

  -- 2a. User A reads Workspace A (Allowed) and Workspace B (Denied: 0 rows)
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  SELECT count(*) INTO v_count FROM public.projects WHERE workspace_id = ws_a;
  IF v_count != 1 THEN RAISE EXCEPTION 'RLS Failure: User A could not read Workspace A projects'; END IF;

  SELECT count(*) INTO v_count FROM public.projects WHERE workspace_id = ws_b;
  IF v_count != 0 THEN RAISE EXCEPTION 'RLS Leak: User A read % projects from Workspace B!', v_count; END IF;

  SELECT count(*) INTO v_count FROM public.financial_transactions WHERE workspace_id = ws_b;
  IF v_count != 0 THEN RAISE EXCEPTION 'RLS Leak: User A read % transactions from Workspace B!', v_count; END IF;

  -- 2b. User A cannot INSERT into Workspace B (42501)
  v_denied := false;
  BEGIN
    INSERT INTO public.projects (workspace_id, slug, title, category, description)
    VALUES (ws_b, 'hijack', 'Hijack', 'Security', 'Should fail');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'RLS Leak: User A inserted project into Workspace B!'; END IF;

  -- 2c. User A cannot UPDATE Workspace B (0 rows affected)
  UPDATE public.projects SET title = 'Tampered' WHERE id = proj_b;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 0 THEN RAISE EXCEPTION 'RLS Leak: User A updated % rows in Workspace B!', v_affected; END IF;

  -- 2d. User A cannot DELETE Workspace B (0 rows affected)
  DELETE FROM public.projects WHERE id = proj_b;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 0 THEN RAISE EXCEPTION 'RLS Leak: User A deleted % rows in Workspace B!', v_affected; END IF;

  -- 2e. User B cannot read/insert/update/delete Workspace A
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  SELECT count(*) INTO v_count FROM public.projects WHERE workspace_id = ws_a;
  IF v_count != 0 THEN RAISE EXCEPTION 'RLS Leak: User B read % projects from Workspace A!', v_count; END IF;

  v_denied := false;
  BEGIN
    INSERT INTO public.projects (workspace_id, slug, title, category, description)
    VALUES (ws_a, 'hijack-b', 'Hijack B', 'Security', 'Should fail');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'RLS Leak: User B inserted project into Workspace A!'; END IF;

  UPDATE public.projects SET title = 'Tampered B' WHERE id = proj_a;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 0 THEN RAISE EXCEPTION 'RLS Leak: User B updated Workspace A!'; END IF;

  DELETE FROM public.projects WHERE id = proj_a;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 0 THEN RAISE EXCEPTION 'RLS Leak: User B deleted Workspace A!'; END IF;

  -- 2f. Cross-workspace relational integrity trigger check (User A inserts in ws_a referencing proj_b)
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  v_denied := false;
  BEGIN
    INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description)
    VALUES (ws_a, proj_b, current_date, 'Expense', 'Software', 100.00, 'Trigger test');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%Cross-Workspace Integrity Violation%' THEN
      v_denied := true;
    END IF;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Trigger Failure: Cross-workspace project_id was not blocked!'; END IF;

  RESET ROLE;

  -- ----------------------------------------------------------------------------
  -- 3. NON-MEMBER & ANONYMOUS ACCESS DENIAL
  -- ----------------------------------------------------------------------------
  -- 3a. Non-member authenticated user
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', user_nonmember::text, true);
  SELECT count(*) INTO v_count FROM public.projects;
  IF v_count != 0 THEN RAISE EXCEPTION 'RLS Leak: Non-member read % projects!', v_count; END IF;
  SELECT count(*) INTO v_count FROM public.workspaces;
  IF v_count != 0 THEN RAISE EXCEPTION 'RLS Leak: Non-member read % workspaces!', v_count; END IF;
  RESET ROLE;

  -- 3b. Anonymous user
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  v_denied := false;
  BEGIN
    PERFORM count(*) FROM public.projects;
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  RESET ROLE;
  IF NOT v_denied THEN RAISE EXCEPTION 'Privilege Leak: anon was able to SELECT from public.projects!'; END IF;

  -- ----------------------------------------------------------------------------
  -- 4. ROLE BOUNDARIES UNDER `authenticated` (ADMIN, MEMBER, VIEWER, SUSPENDED)
  -- ----------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;

  -- 4a. Direct unauthorized writes blocked for all authenticated users
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  v_denied := false;
  BEGIN
    INSERT INTO public.workspaces (name) VALUES ('Direct Bypass WS');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'RLS Failure: Direct INSERT on workspaces succeeded!'; END IF;

  v_denied := false;
  BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (ws_a, user_nonmember, 'Member');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'RLS Failure: Direct INSERT on workspace_members succeeded!'; END IF;

  v_denied := false;
  BEGIN
    INSERT INTO public.activity_logs (workspace_id, action, entity_type, entity_id, category)
    VALUES (ws_a, 'spoof', 'project', proj_a, 'security');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'RLS Failure: Direct INSERT on activity_logs succeeded!'; END IF;

  -- 4b. Administrator boundaries: can update settings, CANNOT delete workspace, CANNOT promote to Owner
  PERFORM set_config('request.jwt.claim.sub', user_admin::text, true);
  UPDATE public.workspace_settings SET notification_workspace_activity = true WHERE workspace_id = ws_a;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 1 THEN RAISE EXCEPTION 'Role Failure: Admin could not update workspace_settings'; END IF;

  -- Admin cannot promote Member to Administrator
  v_denied := false;
  BEGIN
    UPDATE public.workspace_members SET role = 'Administrator' WHERE workspace_id = ws_a AND user_id = user_member;
  EXCEPTION WHEN insufficient_privilege OR raise_exception THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Privilege Escalation: Admin promoted Member to Administrator!'; END IF;

  -- Admin cannot delete workspace via RPC
  v_denied := false;
  BEGIN
    PERFORM public.delete_workspace_by_owner(ws_a);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%Only the verified workspace Owner%' THEN v_denied := true; END IF;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Security Failure: Admin deleted workspace!'; END IF;

  -- 4c. Member boundaries: can update task, CANNOT delete project, CANNOT update workspace_settings
  PERFORM set_config('request.jwt.claim.sub', user_member::text, true);
  UPDATE public.tasks SET status = 'In Progress' WHERE id = task_a;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 1 THEN RAISE EXCEPTION 'Role Failure: Member could not update task!'; END IF;

  DELETE FROM public.projects WHERE id = proj_a;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 0 THEN RAISE EXCEPTION 'Role Leak: Member deleted a project!'; END IF;

  UPDATE public.workspace_settings SET notification_workspace_activity = false WHERE workspace_id = ws_a;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != 0 THEN RAISE EXCEPTION 'Role Leak: Member updated workspace_settings!'; END IF;

  -- 4d. Viewer boundaries: can read, CANNOT insert/update/delete
  PERFORM set_config('request.jwt.claim.sub', user_viewer::text, true);
  SELECT count(*) INTO v_count FROM public.projects WHERE workspace_id = ws_a;
  IF v_count != 1 THEN RAISE EXCEPTION 'Role Failure: Viewer could not read projects'; END IF;

  v_denied := false;
  BEGIN
    INSERT INTO public.tasks (workspace_id, project_id, title, due_date) VALUES (ws_a, proj_a, 'Viewer Task', current_date);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Role Leak: Viewer inserted a task!'; END IF;

  -- 4e. Suspended user boundaries: reads 0 rows, cannot write
  PERFORM set_config('request.jwt.claim.sub', user_suspended::text, true);
  SELECT count(*) INTO v_count FROM public.projects WHERE workspace_id = ws_a;
  IF v_count != 0 THEN RAISE EXCEPTION 'Role Leak: Suspended user read % projects!', v_count; END IF;

  v_denied := false;
  BEGIN
    INSERT INTO public.tasks (workspace_id, project_id, title, due_date) VALUES (ws_a, proj_a, 'Suspended Task', current_date);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Role Leak: Suspended user inserted a task!'; END IF;

  RESET ROLE;

  -- ----------------------------------------------------------------------------
  -- 5. INVITATION ACCEPTANCE UNDER `authenticated`
  -- ----------------------------------------------------------------------------
  v_token_hash := encode(extensions.digest(plain_token::text, 'sha256'), 'hex');
  INSERT INTO public.workspace_invitations (workspace_id, email, role, token_hash, invited_by)
  VALUES (ws_a, 'invited@example.com', 'Member', v_token_hash, user_a)
  RETURNING id INTO inv_id;

  SET LOCAL ROLE authenticated;

  -- Wrong-email user rejected
  PERFORM set_config('request.jwt.claim.sub', user_nonmember::text, true);
  v_denied := false;
  BEGIN
    PERFORM public.accept_workspace_invitation(plain_token);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%Identity mismatch%' THEN v_denied := true; END IF;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Security Failure: Wrong user accepted invitation!'; END IF;

  -- Correct verified user accepted
  PERFORM set_config('request.jwt.claim.sub', user_invited::text, true);
  PERFORM public.accept_workspace_invitation(plain_token);
  RESET ROLE;

  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_a AND user_id = user_invited AND status = 'Active') THEN
    RAISE EXCEPTION 'RPC Failure: Invited user membership not created!';
  END IF;

  -- ----------------------------------------------------------------------------
  -- 6. FINANCIAL VIEWS ISOLATION UNDER `authenticated`
  -- ----------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;

  -- User A sees ONLY Workspace A KPIs, project summary, and trends
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  SELECT * INTO kpi_row FROM public.view_overall_finance_kpis WHERE workspace_id = ws_a;
  IF kpi_row.total_income != 27500.00 OR kpi_row.roi_percent != 25.0 THEN
    RAISE EXCEPTION 'View Failure: Workspace A KPI mismatch';
  END IF;

  SELECT count(*) INTO v_count FROM public.view_overall_finance_kpis WHERE workspace_id = ws_b;
  IF v_count != 0 THEN RAISE EXCEPTION 'View Leak: User A saw Workspace B overall KPIs!'; END IF;

  SELECT count(*) INTO v_count FROM public.view_project_finance_summary WHERE workspace_id = ws_b;
  IF v_count != 0 THEN RAISE EXCEPTION 'View Leak: User A saw Workspace B project finance!'; END IF;

  SELECT count(*) INTO v_count FROM public.view_monthly_financial_trends WHERE workspace_id = ws_b;
  IF v_count != 0 THEN RAISE EXCEPTION 'View Leak: User A saw Workspace B monthly trends!'; END IF;

  -- User B sees ONLY Workspace B KPIs
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  SELECT * INTO kpi_row FROM public.view_overall_finance_kpis WHERE workspace_id = ws_b;
  IF kpi_row.total_income != 5000.00 THEN RAISE EXCEPTION 'View Failure: Workspace B KPI mismatch'; END IF;

  SELECT count(*) INTO v_count FROM public.view_overall_finance_kpis WHERE workspace_id = ws_a;
  IF v_count != 0 THEN RAISE EXCEPTION 'View Leak: User B saw Workspace A KPIs!'; END IF;

  -- Non-member sees 0 rows across all 3 views
  PERFORM set_config('request.jwt.claim.sub', user_nonmember::text, true);
  IF (SELECT count(*) FROM public.view_overall_finance_kpis) != 0
     OR (SELECT count(*) FROM public.view_project_finance_summary) != 0
     OR (SELECT count(*) FROM public.view_monthly_financial_trends) != 0 THEN
    RAISE EXCEPTION 'View Leak: Non-member read financial views!';
  END IF;

  RESET ROLE;

  -- ----------------------------------------------------------------------------
  -- 7. SAFE NON-SWALLOWING WORKSPACE DELETION ASSERTION UNDER `authenticated`
  -- ----------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;

  -- Non-owner (User B) attempt must be denied and workspace MUST still exist
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  v_denied := false;
  BEGIN
    PERFORM public.delete_workspace_by_owner(ws_a);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%Only the verified workspace Owner%' THEN
      v_denied := true;
    ELSE
      RAISE; -- Re-raise unexpected error
    END IF;
  END;
  RESET ROLE;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'Security Failure: Non-owner User B deleted Workspace A without raising authorization error!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = ws_a) THEN
    RAISE EXCEPTION 'Security Failure: Workspace A was deleted despite authorization check!';
  END IF;

  -- Owner (User A) deletion succeeds and cascades
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  PERFORM public.delete_workspace_by_owner(ws_a);
  RESET ROLE;

  IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = ws_a) THEN
    RAISE EXCEPTION 'Cascade Failure: Workspace A still exists after Owner deletion!';
  END IF;
  IF EXISTS (SELECT 1 FROM public.projects WHERE workspace_id = ws_a) THEN
    RAISE EXCEPTION 'Cascade Failure: Workspace A projects still exist!';
  END IF;

  -- Intentional rollback to leave zero fixtures in remote database
  RAISE EXCEPTION 'PHASE_6_1_ALL_TESTS_PASSED_INTENTIONAL_ROLLBACK';
END $$;
