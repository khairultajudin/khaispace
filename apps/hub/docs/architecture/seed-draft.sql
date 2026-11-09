-- ==============================================================================
-- KHAI SPACE HUB — DEVELOPMENT SEED DATA (MOCK / DEVELOPMENT ONLY)
-- ==============================================================================
-- Document Version: 1.1.0 (Phase 3.1 Standardized UUIDs)
-- Phase: Phase 3.1 Security & Architecture Correction Pass
-- Application Target: apps/hub/
-- Working Branch: feature/khai-space-hub
--
-- CAUTION / SAFETY NOTICE:
-- THIS SCRIPT IS FOR LOCAL DEVELOPMENT TESTING ONLY.
-- CONTAINS FICTIONAL SAMPLE ENTITIES CORRESPONDING TO `sample-dashboard-data.ts`.
-- NEVER EXECUTE IN A PRODUCTION ENVIRONMENT OR AGAINST REAL CUSTOMER DATA.
-- ==============================================================================

DO $$
DECLARE
  -- Deterministic mock UUIDs for reproducible local development testing
  v_ws_id       uuid := '00000000-0000-0000-0000-000000000001';
  v_owner_id    uuid := '00000000-0000-0000-0000-000000000002';
  v_member_id   uuid := '00000000-0000-0000-0000-000000000003';
  
  -- Project UUIDs
  v_p_biztrack  uuid := '10000000-0000-0000-0000-000000000001';
  v_p_agro      uuid := '10000000-0000-0000-0000-000000000002';
  v_p_clicker   uuid := '10000000-0000-0000-0000-000000000003';
  v_p_jejak     uuid := '10000000-0000-0000-0000-000000000004';
  v_p_ourduit   uuid := '10000000-0000-0000-0000-000000000005';
  v_p_oss       uuid := '10000000-0000-0000-0000-000000000006';
  v_p_infra     uuid := '10000000-0000-0000-0000-000000000007';

  -- Milestone UUIDs
  v_m_biztrack  uuid := '20000000-0000-0000-0000-000000000001';
  v_m_agro      uuid := '20000000-0000-0000-0000-000000000002';
  v_m_clicker   uuid := '20000000-0000-0000-0000-000000000003';
BEGIN
  -- 1. Insert Workspace
  INSERT INTO public.workspaces (id, name, description, timezone, default_currency, date_format, content_density)
  VALUES (
    v_ws_id,
    'Khai Space Command Center',
    'Private unified hub for managing engineering projects, task milestones, financial ROI, AI tooling subscriptions, and architectural decision records.',
    'Asia/Kuala_Lumpur (GMT+8)',
    'MYR (RM)',
    'YYYY-MM-DD',
    'comfortable'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Workspace Settings
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

  -- 3. Insert Sample Projects
  INSERT INTO public.projects (id, workspace_id, slug, title, category, status, location, description, tags, metadata)
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
      '{"scope": "Commercial SaaS", "deliveryModel": "Web App"}'::jsonb
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
      '{"scope": "Hardware & Cloud", "deliveryModel": "IoT Telemetry"}'::jsonb
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
      '{"scope": "Physical Product", "deliveryModel": "Hardware Device"}'::jsonb
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
      '{"scope": "Interactive Storytelling", "deliveryModel": "Web Experience"}'::jsonb
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
      '{"scope": "Personal Utility", "deliveryModel": "Web App"}'::jsonb
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
      '{"scope": "Developer Ecosystem", "deliveryModel": "NPM Packages"}'::jsonb
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
      '{"scope": "Core Infrastructure", "deliveryModel": "Cloud Architecture"}'::jsonb
    )
  ON CONFLICT (id) DO NOTHING;

  -- 4. Insert Sample Milestones (Composite Workspace Integrity)
  INSERT INTO public.milestones (id, workspace_id, project_id, slug, title, target_date, status, description)
  VALUES
    (
      v_m_biztrack,
      v_ws_id,
      v_p_biztrack,
      'ms-biztrack-audit',
      'BizTrack — Performance Audit & Asset Optimization',
      '2026-11-20',
      'In Progress',
      'Optimize WebP bundles and script loading across static dashboard pages.'
    ),
    (
      v_m_agro,
      v_ws_id,
      v_p_agro,
      'ms-agro-field',
      'Smart Agro — Field Node Telemetry Calibration',
      '2026-11-25',
      'In Progress',
      'Calibrate soil moisture sensors and evaluate transmission reliability.'
    ),
    (
      v_m_clicker,
      v_ws_id,
      v_p_clicker,
      'ms-clicker-mvp',
      '3D Clicker — Hardware Revision 2 Testing',
      '2026-11-15',
      'In Progress',
      'Assemble PCB rev 2.1 prototypes and validate mechanical key switch actuations.'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Insert Representative Financial Transactions
  INSERT INTO public.financial_transactions (id, workspace_id, project_id, transaction_date, type, category, amount, description, is_investment_return)
  VALUES
    (gen_random_uuid(), v_ws_id, v_p_biztrack, '2026-11-04', 'Income', 'Software Retainer', 2800.00, 'BizTrack monthly client maintenance retainer', false),
    (gen_random_uuid(), v_ws_id, v_p_clicker, '2026-10-28', 'Investment', 'Fabrication Machinery', 2400.00, 'SLA Resin 3D printer hardware tooling purchase', false),
    (gen_random_uuid(), v_ws_id, v_p_clicker, '2026-11-01', 'Income', 'Equipment Licensing', 1200.00, 'First pilot licensing payout on 3D Clicker tooling batch', true),
    (gen_random_uuid(), v_ws_id, v_p_clicker, '2026-11-05', 'Income', 'Equipment Licensing', 1900.00, 'Second tranche capital recoup on 3D Clicker production', true),
    (gen_random_uuid(), v_ws_id, v_p_agro, '2026-10-15', 'Expense', 'Prototyping Hardware', 450.00, 'Sensirion precision temperature sensors batch', false),
    (gen_random_uuid(), v_ws_id, NULL, '2026-11-02', 'Expense', 'Cloud Infrastructure', 185.00, 'Shared domain registrations and SSL certificates', false)
  ON CONFLICT DO NOTHING;

  -- 6. Insert Representative AI Subscriptions
  INSERT INTO public.ai_subscriptions (id, workspace_id, assigned_project_id, provider, product_name, plan_name, category, billing_cycle, amount, currency, status, start_date, next_billing_date, purpose)
  VALUES
    (gen_random_uuid(), v_ws_id, v_p_biztrack, 'Anthropic', 'Claude Pro', 'Pro Tier', 'Code Assistant', 'Monthly', 95.00, 'MYR', 'Active', '2026-01-15', '2026-11-15', 'Architecture reviews and complex code refactoring'),
    (gen_random_uuid(), v_ws_id, v_p_agro, 'OpenAI', 'ChatGPT Plus', 'Plus Tier', 'General Assistant', 'Monthly', 95.00, 'MYR', 'Active', '2026-02-10', '2026-11-10', 'Documentation writing and hardware research'),
    (gen_random_uuid(), v_ws_id, v_p_oss, 'GitHub', 'GitHub Copilot', 'Individual', 'Code Completion', 'Annual', 480.00, 'MYR', 'Active', '2026-04-01', '2027-04-01', 'Inline editor completions for TypeScript and C++')
  ON CONFLICT DO NOTHING;

  -- 7. Insert Representative Architectural Decisions
  INSERT INTO public.workspace_notes (id, workspace_id, project_id, type, title, content, category, decision_status, rationale, impact)
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
      'Significantly faster developer feedback loops with zero configuration drift.'
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
      'Dark OLED mode rejected to prevent styling maintenance fragmentation.'
    )
  ON CONFLICT DO NOTHING;

END $$;
