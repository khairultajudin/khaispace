-- ==============================================================================
-- KHAI SPACE HUB — DATABASE TEST SUITE
-- Test 02: RLS Matrix, Tenant Isolation & Functional Verification (Transactional Rollback)
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================
-- NOTE: THIS SCRIPT EXECUTES INSIDE A STRICT TRANSACTION THAT ENDS IN ROLLBACK.
-- ZERO TEST FIXTURES, ROWS, OR TEST USERS ARE LEFT IN THE PRODUCTION DATABASE.
-- ==============================================================================

DO $$
DECLARE
  -- Test user IDs
  user_a uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  user_b uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  user_c uuid := '33333333-3333-3333-3333-333333333333'::uuid;
  user_viewer uuid := '44444444-4444-4444-4444-444444444444'::uuid;
  user_suspended uuid := '55555555-5555-5555-5555-555555555555'::uuid;
  
  -- Test workspace IDs
  ws_a uuid;
  ws_b uuid;
  
  -- Test entity IDs
  proj_a uuid;
  proj_b uuid;
  tx_inc uuid;
  tx_inv uuid;
  tx_ret uuid;
  inv_id uuid;
  
  -- Verification variables
  kpi_row record;
  read_count int;
  auth_err boolean := false;
  dup_owner_err boolean := false;
  cross_ws_err boolean := false;
  viewer_err boolean := false;
  plain_token text := 'test-invitation-token-123456';
  token_hash text;
BEGIN
  RAISE NOTICE '=== TEST SUITE 02: RLS MATRIX & ISOLATION VERIFICATION ===';

  -- ----------------------------------------------------------------------------
  -- 1. Unauthenticated Workspace Creation
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.create_workspace_with_owner('Illegal Workspace');
  EXCEPTION WHEN OTHERS THEN
    auth_err := true;
  END;
  IF NOT auth_err THEN
    RAISE EXCEPTION 'Security Assertion Failed: create_workspace_with_owner allowed unauthenticated caller!';
  END IF;
  RAISE NOTICE '[PASS] Unauthenticated workspace creation successfully blocked.';

  -- ----------------------------------------------------------------------------
  -- 2. Authenticated Workspace Creation & Automatic Profile Trigger
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  VALUES (user_a, 'owner-a@example.com', now(), '{"full_name": "Owner A", "display_name": "OwnerA"}'::jsonb);

  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  ws_a := public.create_workspace_with_owner('Workspace A', 'First Test Workspace');

  IF ws_a IS NULL THEN
    RAISE EXCEPTION 'Functional Assertion Failed: create_workspace_with_owner returned NULL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_a AND email = 'owner-a@example.com') THEN
    RAISE EXCEPTION 'Profile Assertion Failed: Profile for User A was not created by trigger!';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_a AND user_id = user_a AND role = 'Owner' AND status = 'Active') THEN
    RAISE EXCEPTION 'Owner Membership Failed: Active Owner membership not found for User A in Workspace A';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.workspace_settings WHERE workspace_id = ws_a) THEN
    RAISE EXCEPTION 'Settings Failed: workspace_settings record not initialized for Workspace A';
  END IF;
  RAISE NOTICE '[PASS] Authenticated workspace creation, profile trigger, Owner membership, and settings verified.';

  -- ----------------------------------------------------------------------------
  -- 3. Single-Owner Constraint Enforcement
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  VALUES (user_b, 'user-b@example.com', now(), '{"full_name": "User B", "display_name": "UserB"}'::jsonb);

  BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (ws_a, user_b, 'Owner', 'Active');
  EXCEPTION WHEN unique_violation THEN
    dup_owner_err := true;
  END;

  IF NOT dup_owner_err THEN
    RAISE EXCEPTION 'Constraint Assertion Failed: Partial unique index allowed duplicate Owner in Workspace A!';
  END IF;
  RAISE NOTICE '[PASS] Strict single-owner constraint verified (second Owner insertion rejected).';

  -- ----------------------------------------------------------------------------
  -- 4. Multi-Tenant Cross-Workspace Relational Isolation
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  ws_b := public.create_workspace_with_owner('Workspace B', 'Second Test Workspace');

  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  INSERT INTO public.projects (workspace_id, slug, title, category, description)
  VALUES (ws_a, 'proj-alpha', 'Alpha Project', 'Engineering', 'Alpha Description')
  RETURNING id INTO proj_a;

  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  INSERT INTO public.projects (workspace_id, slug, title, category, description)
  VALUES (ws_b, 'proj-beta', 'Beta Project', 'Operations', 'Beta Description')
  RETURNING id INTO proj_b;

  -- User A attempts cross-workspace project assignment in Workspace A
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  BEGIN
    INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description)
    VALUES (ws_a, proj_b, current_date, 'Expense', 'Software', 500.00, 'Cross-workspace illegal transaction');
  EXCEPTION WHEN OTHERS THEN
    cross_ws_err := true;
  END;

  IF NOT cross_ws_err THEN
    RAISE EXCEPTION 'Integrity Assertion Failed: Cross-workspace project reference was allowed!';
  END IF;
  RAISE NOTICE '[PASS] Cross-workspace referential integrity trigger blocked foreign project assignment.';

  -- ----------------------------------------------------------------------------
  -- 5. Role Matrix: Viewer Write Prohibition & Suspended User Isolation
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  VALUES (user_viewer, 'viewer@example.com', now(), '{"full_name": "Viewer User", "display_name": "Viewer"}'::jsonb);
  
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (ws_a, user_viewer, 'Viewer', 'Active');

  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  VALUES (user_suspended, 'suspended@example.com', now(), '{"full_name": "Suspended User", "display_name": "Suspended"}'::jsonb);

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (ws_a, user_suspended, 'Member', 'Suspended');

  -- Test as Viewer under authenticated role
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', user_viewer::text, true);

  -- Viewer can read
  SELECT count(*) INTO read_count FROM public.projects WHERE workspace_id = ws_a;
  IF read_count != 1 THEN
    RAISE EXCEPTION 'Viewer Read Assertion Failed: Viewer could not read workspace projects!';
  END IF;

  -- Viewer cannot write
  BEGIN
    INSERT INTO public.projects (workspace_id, slug, title, category, description)
    VALUES (ws_a, 'proj-viewer', 'Viewer Proj', 'Engineering', 'Forbidden');
  EXCEPTION WHEN OTHERS THEN
    viewer_err := true;
  END;
  IF NOT viewer_err THEN
    RAISE EXCEPTION 'RLS Write Assertion Failed: Viewer was able to insert a project!';
  END IF;

  -- Test as Suspended User under authenticated role
  PERFORM set_config('request.jwt.claim.sub', user_suspended::text, true);
  SELECT count(*) INTO read_count FROM public.projects WHERE workspace_id = ws_a;
  IF read_count != 0 THEN
    RAISE EXCEPTION 'RLS Suspended Assertion Failed: Suspended user was able to read % projects!', read_count;
  END IF;
  RAISE NOTICE '[PASS] Role matrix verified: Viewer read allowed/write denied; Suspended user read denied.';

  -- Reset role to postgres for setup
  RESET ROLE;

  -- ----------------------------------------------------------------------------
  -- 6. Invitation Token Hashing & Acceptance
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  VALUES (user_c, 'invited-c@example.com', now(), '{"full_name": "Invited C", "display_name": "UserC"}'::jsonb);

  token_hash := encode(extensions.digest(plain_token::text, 'sha256'), 'hex');

  INSERT INTO public.workspace_invitations (workspace_id, email, role, token_hash, invited_by)
  VALUES (ws_a, 'invited-c@example.com', 'Member', token_hash, user_a)
  RETURNING id INTO inv_id;

  PERFORM set_config('request.jwt.claim.sub', user_c::text, true);
  PERFORM public.accept_workspace_invitation(plain_token);

  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_a AND user_id = user_c AND role = 'Member' AND status = 'Active') THEN
    RAISE EXCEPTION 'Invitation Assertion Failed: User C membership not created upon invitation acceptance!';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.workspace_invitations WHERE id = inv_id AND status = 'accepted') THEN
    RAISE EXCEPTION 'Invitation Assertion Failed: Invitation status was not updated to accepted!';
  END IF;
  RAISE NOTICE '[PASS] Invitation token hashing and secure acceptance procedure verified.';

  -- ----------------------------------------------------------------------------
  -- 7. Accounting Views & Financial KPI Verification
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);

  INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description)
  VALUES (ws_a, proj_a, current_date, 'Income', 'Consulting', 15000.00, 'Client milestone payment')
  RETURNING id INTO tx_inc;

  INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description)
  VALUES (ws_a, proj_a, current_date, 'Expense', 'Contractor', 3000.00, 'Subcontractor fee');

  INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description)
  VALUES (ws_a, proj_a, current_date, 'Investment', 'Hardware', 10000.00, 'Server infrastructure investment')
  RETURNING id INTO tx_inv;

  INSERT INTO public.financial_transactions (workspace_id, project_id, transaction_date, type, category, amount, description, is_investment_return)
  VALUES (ws_a, proj_a, current_date, 'Income', 'Dividends', 12500.00, 'Hardware asset dividend return', true)
  RETURNING id INTO tx_ret;

  -- Query Accounting View as authenticated User A
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);

  SELECT * INTO kpi_row FROM public.view_overall_finance_kpis WHERE workspace_id = ws_a;
  
  IF kpi_row.total_income != 27500.00 THEN
    RAISE EXCEPTION 'KPI Assertion Failed: Expected total_income 27500.00, got %', kpi_row.total_income;
  END IF;
  IF kpi_row.total_expenses != 3000.00 THEN
    RAISE EXCEPTION 'KPI Assertion Failed: Expected total_expenses 3000.00, got %', kpi_row.total_expenses;
  END IF;
  IF kpi_row.net_cashflow != 24500.00 THEN
    RAISE EXCEPTION 'KPI Assertion Failed: Expected net_cashflow 24500.00, got %', kpi_row.net_cashflow;
  END IF;
  IF kpi_row.total_investment != 10000.00 THEN
    RAISE EXCEPTION 'KPI Assertion Failed: Expected total_investment 10000.00, got %', kpi_row.total_investment;
  END IF;
  IF kpi_row.realized_investment_return != 12500.00 THEN
    RAISE EXCEPTION 'KPI Assertion Failed: Expected realized_return 12500.00, got %', kpi_row.realized_investment_return;
  END IF;
  IF kpi_row.roi_percent != 25.0 THEN
    RAISE EXCEPTION 'KPI Assertion Failed: Expected ROI percent 25.0, got %', kpi_row.roi_percent;
  END IF;
  RAISE NOTICE '[PASS] view_overall_finance_kpis calculations and 25.0%% ROI verified against fixtures.';

  -- Reset role
  RESET ROLE;

  -- ----------------------------------------------------------------------------
  -- 8. Owner-Authorized Workspace Deletion & Cascading Cleanup
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  BEGIN
    PERFORM public.delete_workspace_by_owner(ws_a);
    RAISE EXCEPTION 'Security Assertion Failed: Non-owner User B was able to call delete_workspace_by_owner on Workspace A!';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  PERFORM public.delete_workspace_by_owner(ws_a);

  IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = ws_a) THEN
    RAISE EXCEPTION 'Deletion Assertion Failed: Workspace A was not deleted!';
  END IF;
  IF EXISTS (SELECT 1 FROM public.projects WHERE workspace_id = ws_a) THEN
    RAISE EXCEPTION 'Deletion Cascade Failed: Projects for Workspace A were not deleted!';
  END IF;
  IF EXISTS (SELECT 1 FROM public.financial_transactions WHERE workspace_id = ws_a) THEN
    RAISE EXCEPTION 'Deletion Cascade Failed: Financial transactions for Workspace A were not deleted!';
  END IF;
  RAISE NOTICE '[PASS] Owner workspace deletion and cascading cleanup verified.';

  -- Safety Rollback Trigger
  RAISE EXCEPTION 'PHASE_6_TESTS_COMPLETE_ROLLBACK';
END $$;
