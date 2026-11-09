-- ==============================================================================
-- KHAI SPACE HUB — DEVELOPMENT SEED DATA (MOCK / DEVELOPMENT ONLY)
-- ==============================================================================
-- Document Version: 1.0.0
-- Phase: Phase 3 Architecture & Persistence Planning
-- Application Target: apps/hub/
-- Working Branch: feature/khai-space-hub
--
-- CAUTION / SAFETY NOTICE:
-- THIS SCRIPT IS FOR LOCAL DEVELOPMENT TESTING ONLY.
-- CONTAINS FICTIONAL SAMPLE ENTITIES CORRESPONDING TO `sample-dashboard-data.ts`.
-- NEVER EXECUTE IN A PRODUCTION ENVIRONMENT OR AGAINST REAL CUSTOMER DATA.
-- ==============================================================================

-- 1. Fictional Workspace Root & Owner
DO $$
DECLARE
  v_ws_id uuid := '00000000-0000-0000-0000-000000000001';
  v_owner_id uuid := '00000000-0000-0000-0000-000000000002';
  v_collab_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Insert Workspace
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

  -- Insert Workspace Settings
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

  -- Insert Sample Projects
  INSERT INTO public.projects (id, workspace_id, title, category, status, location, description, tags, metadata)
  VALUES
    (
      'biztrack',
      v_ws_id,
      'BizTrack',
      'SaaS / Business Automation',
      'Active',
      'apps/biztrack/',
      'Production-grade business tracking and client management application.',
      ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase'],
      '{"scope": "Commercial SaaS", "deliveryModel": "Web App"}'::jsonb
    ),
    (
      'smart-agro-telemetry',
      v_ws_id,
      'Smart Agro Telemetry',
      'IoT / Agricultural Tech',
      'Active',
      'firmware/agro-node/',
      'LoRaWAN environmental monitoring nodes for tropical agriculture.',
      ARRAY['Embedded C++', 'ESP32', 'FreeRTOS', 'LoRaWAN'],
      '{"scope": "Hardware & Cloud", "deliveryModel": "IoT Telemetry"}'::jsonb
    ),
    (
      '3d-clicker',
      v_ws_id,
      '3D Printing Workflow Clicker',
      'Hardware / Fabrication',
      'Active',
      'hardware/clicker-cad/',
      'Tactile hardware controller for 3D printer farm management.',
      ARRAY['CAD', 'KiCad', 'RP2040', 'Firmware'],
      '{"scope": "Physical Product", "deliveryModel": "Hardware Device"}'::jsonb
    ),
    (
      'memburu-jejak',
      v_ws_id,
      'Memburu Jejak',
      'Creative / Interactive Media',
      'In Development',
      'content/narrative-engine/',
      'Interactive visual novel and narrative investigation engine.',
      ARRAY['React', 'Canvas API', 'Tailwind CSS'],
      '{"scope": "Interactive Storytelling", "deliveryModel": "Web Experience"}'::jsonb
    ),
    (
      'ourduit',
      v_ws_id,
      'OurDuit',
      'Personal Finance / Web App',
      'Planning',
      'apps/ourduit/',
      'Multi-currency household cashflow and balance sheet planner.',
      ARRAY['Next.js', 'PostgreSQL', 'Tailwind CSS'],
      '{"scope": "Personal Utility", "deliveryModel": "Web App"}'::jsonb
    ),
    (
      'open-source-tooling',
      v_ws_id,
      'Open Source Tooling',
      'Developer Tools / Libraries',
      'Production',
      'packages/core-utils/',
      'Shared TypeScript libraries and developer CLI tools.',
      ARRAY['TypeScript', 'Node.js', 'NPM'],
      '{"scope": "Developer Ecosystem", "deliveryModel": "NPM Packages"}'::jsonb
    ),
    (
      'khai-space-infrastructure',
      v_ws_id,
      'Khai Space Core Infrastructure',
      'DevOps / Core Architecture',
      'Production',
      'infra/cloud-configs/',
      'Cloudflare Pages routing, SSL termination, and monorepo build pipelines.',
      ARRAY['Cloudflare', 'GitHub Actions', 'Terraform'],
      '{"scope": "Core Infrastructure", "deliveryModel": "Cloud Architecture"}'::jsonb
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert Sample Milestones
  INSERT INTO public.milestones (id, workspace_id, project_id, title, target_date, status, description)
  VALUES
    (
      'ms-biztrack-audit',
      v_ws_id,
      'biztrack',
      'BizTrack — Performance Audit & Asset Optimization',
      '2026-11-20',
      'In Progress',
      'Optimize WebP bundles and script loading across static dashboard pages.'
    ),
    (
      'ms-agro-field',
      v_ws_id,
      'smart-agro-telemetry',
      'Smart Agro — Field Node Telemetry Calibration',
      '2026-11-25',
      'In Progress',
      'Calibrate soil moisture sensors and evaluate transmission reliability.'
    ),
    (
      'ms-clicker-mvp',
      v_ws_id,
      '3d-clicker',
      '3D Clicker — Hardware Revision 2 Testing',
      '2026-11-15',
      'In Progress',
      'Assemble PCB rev 2.1 prototypes and validate mechanical key switch actuations.'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert Representative Financial Transactions
  INSERT INTO public.financial_transactions (id, workspace_id, project_id, transaction_date, type, category, amount, description, is_investment_return)
  VALUES
    ('tx-01', v_ws_id, 'biztrack', '2026-11-04', 'Income', 'Software Retainer', 2800.00, 'BizTrack monthly client maintenance retainer', false),
    ('tx-02', v_ws_id, '3d-clicker', '2026-10-28', 'Investment', 'Fabrication Machinery', 2400.00, 'SLA Resin 3D printer hardware tooling purchase', false),
    ('tx-03', v_ws_id, '3d-clicker', '2026-11-01', 'Income', 'Equipment Licensing', 1200.00, 'First pilot licensing payout on 3D Clicker tooling batch', true),
    ('tx-04', v_ws_id, '3d-clicker', '2026-11-05', 'Income', 'Equipment Licensing', 1900.00, 'Second tranche capital recoup on 3D Clicker production', true),
    ('tx-05', v_ws_id, 'smart-agro-telemetry', '2026-10-15', 'Expense', 'Prototyping Hardware', 450.00, 'Sensirion precision temperature sensors batch', false),
    ('tx-06', v_ws_id, NULL, '2026-11-02', 'Expense', 'Cloud Infrastructure', 185.00, 'Shared domain registrations and SSL certificates', false)
  ON CONFLICT (id) DO NOTHING;

  -- Insert Representative AI Subscriptions
  INSERT INTO public.ai_subscriptions (id, workspace_id, assigned_project_id, provider, product_name, plan_name, category, billing_cycle, amount, currency, status, start_date, next_billing_date, purpose)
  VALUES
    ('sub-01', v_ws_id, 'biztrack', 'Anthropic', 'Claude Pro', 'Pro Tier', 'Code Assistant', 'Monthly', 95.00, 'MYR', 'Active', '2026-01-15', '2026-11-15', 'Architecture reviews and complex code refactoring'),
    ('sub-02', v_ws_id, 'smart-agro-telemetry', 'OpenAI', 'ChatGPT Plus', 'Plus Tier', 'General Assistant', 'Monthly', 95.00, 'MYR', 'Active', '2026-02-10', '2026-11-10', 'Documentation writing and hardware research'),
    ('sub-03', v_ws_id, 'open-source-tooling', 'GitHub', 'GitHub Copilot', 'Individual', 'Code Completion', 'Annual', 480.00, 'MYR', 'Active', '2026-04-01', '2027-04-01', 'Inline editor completions for TypeScript and C++')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Representative Architectural Decisions
  INSERT INTO public.workspace_notes (id, workspace_id, project_id, type, title, content, category, decision_status, rationale, impact)
  VALUES
    (
      'dec-01',
      v_ws_id,
      'biztrack',
      'Decision',
      'Use Turbopack in Next.js 16 build pipeline',
      'Adopt Next.js 16 native Turbopack bundler for local development and build compilation.',
      'Tooling',
      'Approved',
      'Sub-second local HMR updates and rapid production build times on multi-package repository.',
      'Significantly faster developer feedback loops with zero configuration drift.'
    ),
    (
      'dec-05',
      v_ws_id,
      'khai-space-infrastructure',
      'Decision',
      'Maintain Editorial Light Aesthetic as Sole Theme',
      'Standardize Khai Space Hub exclusively on editorial warm off-white (#FAF8F4) and deep navy typography (#0C2340).',
      'UI/UX',
      'Approved',
      'Preserves consistent contrast hierarchy and executive design identity across modules.',
      'Dark OLED mode rejected to prevent styling maintenance fragmentation.'
    )
  ON CONFLICT (id) DO NOTHING;

END $$;
