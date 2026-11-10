-- ==============================================================================
-- KHAI SPACE HUB — DEVELOPMENT SEED DATA (MOCK / DEVELOPMENT ONLY)
-- ==============================================================================
-- Document Version: 1.3.0 (Phase 3.3 Valid UUIDs & Development Auth Alignment)
-- Phase: Phase 3.3 Final SQL Validation & Security Closure
-- Application Target: apps/hub/
-- Working Branch: feature/khai-space-hub
--
-- CAUTION / SAFETY NOTICE:
-- THIS SCRIPT IS FOR LOCAL DEVELOPMENT TESTING ONLY.
-- CONTAINS FICTIONAL SAMPLE ENTITIES CORRESPONDING TO `sample-dashboard-data.ts`.
-- NEVER EXECUTE IN A PRODUCTION ENVIRONMENT OR AGAINST REAL CUSTOMER DATA.
--
-- AUTH BOOTSTRAP NOTE:
-- In Supabase, `profiles.id` references `auth.users(id) ON DELETE CASCADE`.
-- In production, `auth.users` records are created exclusively via Supabase Auth signup.
-- For local development or isolated pgTAP testing environments, mock users MUST
-- be created in `auth.users` prior to inserting into `profiles`.
-- The script below includes a conditional mock auth block for local testing.
-- Dummy password hashes are non-functional mock values for local testing only.
-- ==============================================================================

DO $$
DECLARE
  -- Deterministic mock UUIDs conforming strictly to RFC 4122 hexadecimal syntax
  v_ws_id       uuid := 'a0000000-0000-4000-8000-000000000001';
  v_owner_id    uuid := 'a1000000-0000-4000-8000-000000000001';
  v_admin_id    uuid := 'a1000000-0000-4000-8000-000000000002';
  v_member_id   uuid := 'a1000000-0000-4000-8000-000000000003';
  
  -- Project UUIDs
  v_p_biztrack  uuid := 'b0000000-0000-4000-8000-000000000001';
  v_p_agro      uuid := 'b0000000-0000-4000-8000-000000000002';
  v_p_clicker   uuid := 'b0000000-0000-4000-8000-000000000003';
  v_p_jejak     uuid := 'b0000000-0000-4000-8000-000000000004';
  v_p_ourduit   uuid := 'b0000000-0000-4000-8000-000000000005';
  v_p_oss       uuid := 'b0000000-0000-4000-8000-000000000006';
  v_p_infra     uuid := 'b0000000-0000-4000-8000-000000000007';

  -- Milestone UUIDs
  v_m_biztrack  uuid := 'c0000000-0000-4000-8000-000000000001';
  v_m_agro      uuid := 'c0000000-0000-4000-8000-000000000002';
  v_m_clicker   uuid := 'c0000000-0000-4000-8000-000000000003';

  -- Task UUIDs
  v_t_biztrack  uuid := 'd0000000-0000-4000-8000-000000000001';
  v_t_agro      uuid := 'd0000000-0000-4000-8000-000000000002';
  v_t_clicker   uuid := 'd0000000-0000-4000-8000-000000000003';
BEGIN

  -- ----------------------------------------------------------------------------
  -- OPTIONAL DEV-ONLY AUTH BOOTSTRAP (Local Supabase Docker / pgTAP only)
  -- ----------------------------------------------------------------------------
  BEGIN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES
      (v_owner_id, 'khairul@khaispace.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"full_name": "Khairul Tajudin", "display_name": "Khairul"}'::jsonb),
      (v_admin_id, 'sarah.chen@khaispace.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"full_name": "Sarah Chen", "display_name": "Sarah"}'::jsonb),
      (v_member_id, 'alex.rivera@khaispace.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"full_name": "Alex Rivera", "display_name": "Alex"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    -- If auth schema or users table does not exist in standalone SQL runner, continue
    NULL;
  END;

  -- ----------------------------------------------------------------------------
  -- 1. Insert Profiles (Guaranteed Valid UUIDs)
  -- ----------------------------------------------------------------------------
  INSERT INTO public.profiles (id, full_name, display_name, email, bio, location, timezone, avatar_initials)
  VALUES
    (
      v_owner_id,
      'Khairul Tajudin',
      'Khairul',
      'khairul@khaispace.com',
      'Founder, Lead Systems Architect, and Full-Stack Hardware/Software Engineer.',
      'Kuala Lumpur, Malaysia',
      'Asia/Kuala_Lumpur (GMT+8)',
      'KT'
    ),
    (
      v_admin_id,
      'Sarah Chen',
      'Sarah',
      'sarah.chen@khaispace.com',
      'Operations Lead and Systems Engineer specializing in cloud operations.',
      'Penang, Malaysia',
      'Asia/Kuala_Lumpur (GMT+8)',
      'SC'
    ),
    (
      v_member_id,
      'Alex Rivera',
      'Alex',
      'alex.rivera@khaispace.com',
      'Embedded Firmware and CAD Prototyping Specialist.',
      'Johor Bahru, Malaysia',
      'Asia/Kuala_Lumpur (GMT+8)',
      'AR'
    )
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 2. Insert Workspace
  -- ----------------------------------------------------------------------------
  INSERT INTO public.workspaces (id, name, description, timezone, default_currency, date_format, content_density, created_by)
  VALUES (
    v_ws_id,
    'Khai Space Command Center',
    'Private unified hub for managing engineering projects, task milestones, financial ROI, AI tooling subscriptions, and architectural decision records.',
    'Asia/Kuala_Lumpur (GMT+8)',
    'MYR (RM)',
    'YYYY-MM-DD',
    'comfortable',
    v_owner_id
  ) ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 3. Insert Workspace Members (Owner, Admin, Member)
  -- ----------------------------------------------------------------------------
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, bio)
  VALUES
    (v_ws_id, v_owner_id, 'Owner', 'Active', 'Workspace Founder and Lead Engineer'),
    (v_ws_id, v_admin_id, 'Administrator', 'Active', 'Operations Administrator'),
    (v_ws_id, v_member_id, 'Member', 'Active', 'Hardware Prototyping Contributor')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 4. Insert Workspace Settings
  -- ----------------------------------------------------------------------------
  INSERT INTO public.workspace_settings (
    workspace_id,
    notification_task_reminders,
    notification_milestone_updates,
    notification_project_updates,
    notification_workspace_activity,
    notification_subscription_renewals
  ) VALUES (
    v_ws_id,
    true,
    true,
    true,
    false,
    true
  ) ON CONFLICT (workspace_id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 5. Insert Sample Projects
  -- ----------------------------------------------------------------------------
  INSERT INTO public.projects (id, workspace_id, slug, title, category, status, location, description, tags, metadata, created_by)
  VALUES
    (
      v_p_biztrack,
      v_ws_id,
      'biztrack',
      'BizTrack',
      'SaaS / Business Automation',
      'Active',
      'apps/biztrack/',
      'Production-grade business tracking and client management application.',
      ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase'],
      '{"scope": "Commercial SaaS", "deliveryModel": "Web App"}'::jsonb,
      v_owner_id
    ),
    (
      v_p_agro,
      v_ws_id,
      'smart-agro-telemetry',
      'Smart Agro Telemetry',
      'IoT / Agricultural Tech',
      'Active',
      'firmware/agro-node/',
      'LoRaWAN environmental monitoring nodes for tropical agriculture.',
      ARRAY['Embedded C++', 'ESP32', 'FreeRTOS', 'LoRaWAN'],
      '{"scope": "Hardware & Cloud", "deliveryModel": "IoT Telemetry"}'::jsonb,
      v_owner_id
    ),
    (
      v_p_clicker,
      v_ws_id,
      '3d-clicker',
      '3D Printing Workflow Clicker',
      'Hardware / Fabrication',
      'Active',
      'hardware/clicker-cad/',
      'Tactile hardware controller for 3D printer farm management.',
      ARRAY['CAD', 'KiCad', 'RP2040', 'Firmware'],
      '{"scope": "Physical Product", "deliveryModel": "Hardware Device"}'::jsonb,
      v_owner_id
    ),
    (
      v_p_jejak,
      v_ws_id,
      'memburu-jejak',
      'Memburu Jejak',
      'Creative / Interactive Media',
      'In Development',
      'content/narrative-engine/',
      'Interactive visual novel and narrative investigation engine.',
      ARRAY['React', 'Canvas API', 'Tailwind CSS'],
      '{"scope": "Interactive Storytelling", "deliveryModel": "Web Experience"}'::jsonb,
      v_owner_id
    ),
    (
      v_p_ourduit,
      v_ws_id,
      'ourduit',
      'OurDuit',
      'Personal Finance / Web App',
      'Planning',
      'apps/ourduit/',
      'Multi-currency household cashflow and balance sheet planner.',
      ARRAY['Next.js', 'PostgreSQL', 'Tailwind CSS'],
      '{"scope": "Personal Utility", "deliveryModel": "Web App"}'::jsonb,
      v_owner_id
    ),
    (
      v_p_oss,
      v_ws_id,
      'open-source-tooling',
      'Open Source Tooling',
      'Developer Tools / Libraries',
      'Production',
      'packages/core-utils/',
      'Shared TypeScript libraries and developer CLI tools.',
      ARRAY['TypeScript', 'Node.js', 'NPM'],
      '{"scope": "Developer Ecosystem", "deliveryModel": "NPM Packages"}'::jsonb,
      v_owner_id
    ),
    (
      v_p_infra,
      v_ws_id,
      'khai-space-infrastructure',
      'Khai Space Core Infrastructure',
      'DevOps / Core Architecture',
      'Production',
      'infra/cloud-configs/',
      'Cloudflare Pages routing, SSL termination, and monorepo build pipelines.',
      ARRAY['Cloudflare', 'GitHub Actions', 'Terraform'],
      '{"scope": "Core Infrastructure", "deliveryModel": "Cloud Architecture"}'::jsonb,
      v_owner_id
    )
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 6. Insert Sample Milestones (Composite Workspace Integrity)
  -- ----------------------------------------------------------------------------
  INSERT INTO public.milestones (id, workspace_id, project_id, slug, title, target_date, status, description, created_by)
  VALUES
    (
      v_m_biztrack,
      v_ws_id,
      v_p_biztrack,
      'ms-biztrack-audit',
      'BizTrack — Performance Audit & Asset Optimization',
      '2026-11-20',
      'In Progress',
      'Optimize WebP bundles and script loading across static dashboard pages.',
      v_owner_id
    ),
    (
      v_m_agro,
      v_ws_id,
      v_p_agro,
      'ms-agro-field',
      'Smart Agro — Field Node Telemetry Calibration',
      '2026-11-25',
      'In Progress',
      'Calibrate soil moisture sensors and evaluate transmission reliability.',
      v_owner_id
    ),
    (
      v_m_clicker,
      v_ws_id,
      v_p_clicker,
      'ms-clicker-mvp',
      '3D Clicker — Hardware Revision 2 Testing',
      '2026-11-15',
      'In Progress',
      'Assemble PCB rev 2.1 prototypes and validate mechanical key switch actuations.',
      v_owner_id
    )
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 7. Insert Actionable Tasks
  -- ----------------------------------------------------------------------------
  INSERT INTO public.tasks (id, workspace_id, project_id, milestone_id, title, priority, status, due_date, description, created_by)
  VALUES
    (
      v_t_biztrack,
      v_ws_id,
      v_p_biztrack,
      v_m_biztrack,
      'Audit client bundle size and optimize icons',
      'High',
      'In Progress',
      '2026-11-18',
      'Reduce vendor bundle size by replacing heavy lucide imports with tree-shaken direct modules.',
      v_owner_id
    ),
    (
      v_t_agro,
      v_ws_id,
      v_p_agro,
      v_m_agro,
      'Flash LoRaWAN node test firmware',
      'Medium',
      'Pending',
      '2026-11-22',
      'Deploy v0.4.2 telemetry payload encoder onto prototype field nodes.',
      v_owner_id
    ),
    (
      v_t_clicker,
      v_ws_id,
      v_p_clicker,
      v_m_clicker,
      'Validate SLA enclosure dimensional tolerances',
      'High',
      'In Progress',
      '2026-11-14',
      'Measure snap-fit case prototype with digital caliper against CAD drawings.',
      v_owner_id
    )
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 8. Insert Representative Financial Ledger Transactions
  -- ----------------------------------------------------------------------------
  INSERT INTO public.financial_transactions (id, workspace_id, project_id, transaction_date, type, category, amount, description, is_investment_return, created_by)
  VALUES
    (gen_random_uuid(), v_ws_id, v_p_biztrack, '2026-11-04', 'Income', 'Software Retainer', 2800.00, 'BizTrack monthly client maintenance retainer', false, v_owner_id),
    (gen_random_uuid(), v_ws_id, v_p_clicker, '2026-10-28', 'Investment', 'Fabrication Machinery', 2400.00, 'SLA Resin 3D printer hardware tooling purchase', false, v_owner_id),
    (gen_random_uuid(), v_ws_id, v_p_clicker, '2026-11-01', 'Income', 'Equipment Licensing', 1200.00, 'First pilot licensing payout on 3D Clicker tooling batch', true, v_owner_id),
    (gen_random_uuid(), v_ws_id, v_p_clicker, '2026-11-05', 'Income', 'Equipment Licensing', 1900.00, 'Second tranche capital recoup on 3D Clicker production', true, v_owner_id),
    (gen_random_uuid(), v_ws_id, v_p_agro, '2026-10-15', 'Expense', 'Prototyping Hardware', 450.00, 'Sensirion precision temperature sensors batch', false, v_owner_id),
    (gen_random_uuid(), v_ws_id, NULL, '2026-11-02', 'Expense', 'Cloud Infrastructure', 185.00, 'Shared domain registrations and SSL certificates', false, v_owner_id)
  ON CONFLICT DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 9. Insert Representative AI Subscriptions
  -- ----------------------------------------------------------------------------
  INSERT INTO public.ai_subscriptions (id, workspace_id, assigned_project_id, provider, product_name, plan_name, category, billing_cycle, amount, currency, status, start_date, next_billing_date, purpose, created_by)
  VALUES
    (gen_random_uuid(), v_ws_id, v_p_biztrack, 'Anthropic', 'Claude Pro', 'Pro Tier', 'Code Assistant', 'Monthly', 95.00, 'MYR', 'Active', '2026-01-15', '2026-11-15', 'Architecture reviews and complex code refactoring', v_owner_id),
    (gen_random_uuid(), v_ws_id, v_p_agro, 'OpenAI', 'ChatGPT Plus', 'Plus Tier', 'General Assistant', 'Monthly', 95.00, 'MYR', 'Active', '2026-02-10', '2026-11-10', 'Documentation writing and hardware research', v_owner_id),
    (gen_random_uuid(), v_ws_id, v_p_oss, 'GitHub', 'GitHub Copilot', 'Individual', 'Code Completion', 'Annual', 480.00, 'MYR', 'Active', '2026-04-01', '2027-04-01', 'Inline editor completions for TypeScript and C++', v_owner_id)
  ON CONFLICT DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 10. Insert Representative Architectural Decisions & Notes
  -- ----------------------------------------------------------------------------
  INSERT INTO public.workspace_notes (id, workspace_id, project_id, type, title, content, category, decision_status, rationale, impact, created_by)
  VALUES
    (
      gen_random_uuid(),
      v_ws_id,
      v_p_biztrack,
      'Decision',
      'Use Turbopack in Next.js 16 build pipeline',
      'Adopt Next.js 16 native Turbopack bundler for local development and build compilation.',
      'Tooling',
      'Approved',
      'Sub-second local HMR updates and rapid production build times on multi-package repository.',
      'Significantly faster developer feedback loops with zero configuration drift.',
      v_owner_id
    ),
    (
      gen_random_uuid(),
      v_ws_id,
      v_p_infra,
      'Decision',
      'Maintain Editorial Light Aesthetic as Sole Theme',
      'Standardize Khai Space Hub exclusively on editorial warm off-white (#FAF8F4) and deep navy typography (#0C2340).',
      'UI/UX',
      'Approved',
      'Preserves consistent contrast hierarchy and executive design identity across modules.',
      'Dark OLED mode rejected to prevent styling maintenance fragmentation.',
      v_owner_id
    )
  ON CONFLICT DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 11. Insert Sample Activity Audit Logs
  -- ----------------------------------------------------------------------------
  INSERT INTO public.activity_logs (id, workspace_id, user_id, actor_email, actor_role, action, entity_type, entity_id, project_id, category, metadata, created_at)
  VALUES
    (
      gen_random_uuid(),
      v_ws_id,
      v_owner_id,
      'khairul@khaispace.com',
      'Owner',
      'workspace.provisioned',
      'workspace',
      v_ws_id,
      NULL,
      'admin',
      '{"workspace_name": "Khai Space Command Center"}'::jsonb,
      now() - interval '2 days'
    ),
    (
      gen_random_uuid(),
      v_ws_id,
      v_owner_id,
      'khairul@khaispace.com',
      'Owner',
      'project.created',
      'project',
      v_p_biztrack,
      v_p_biztrack,
      'project',
      '{"title": "BizTrack", "slug": "biztrack"}'::jsonb,
      now() - interval '1 day'
    )
  ON CONFLICT DO NOTHING;

END $$;
