-- ==============================================================================
-- KHAI SPACE HUB — PROPOSED RELATIONAL DATABASE SCHEMA (DRAFT ONLY)
-- ==============================================================================
-- Document Version: 1.0.0
-- Phase: Phase 3 Architecture & Persistence Planning
-- Application Target: apps/hub/
-- Working Branch: feature/khai-space-hub
--
-- CAUTION / SAFETY WARNING:
-- THIS IS AN ARCHITECTURAL DRAFT SCRIPT FOR PLANNING AND VALIDATION ONLY.
-- DO NOT EXECUTE THIS SCRIPT AGAINST A LIVE DATABASE OR REMOTE INSTANCE IN PHASE 3.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. CUSTOM TYPES AND ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'Active',
    'Production',
    'In Development',
    'Planning',
    'Documented'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM (
    'High',
    'Medium',
    'Normal'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM (
    'In Progress',
    'Pending',
    'Completed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.milestone_status AS ENUM (
    'Planned',
    'In Progress',
    'Completed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM (
    'Income',
    'Expense',
    'Investment'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'Active',
    'Paused',
    'Cancelled',
    'Trial'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM (
    'Monthly',
    'Annual'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.note_record_type AS ENUM (
    'Note',
    'Decision'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.decision_status AS ENUM (
    'Proposed',
    'Approved',
    'Rejected',
    'Superseded'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.member_role AS ENUM (
    'Owner',
    'Administrator',
    'Member',
    'Viewer'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM (
    'Active',
    'Pending',
    'Suspended'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 3. CORE RELATIONAL TABLES
-- ------------------------------------------------------------------------------

-- 3.1 Workspaces (Tenant Root)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text NOT NULL DEFAULT '',
  timezone varchar(50) NOT NULL DEFAULT 'Asia/Kuala_Lumpur (GMT+8)',
  default_currency varchar(10) NOT NULL DEFAULT 'MYR (RM)',
  date_format varchar(20) NOT NULL DEFAULT 'YYYY-MM-DD',
  content_density varchar(20) NOT NULL DEFAULT 'comfortable',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3.2 Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name varchar(100) NOT NULL,
  display_name varchar(50) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  bio text NOT NULL DEFAULT '',
  location varchar(100) NOT NULL DEFAULT 'Kuala Lumpur, Malaysia',
  timezone varchar(50) NOT NULL DEFAULT 'Asia/Kuala_Lumpur (GMT+8)',
  avatar_initials varchar(4) NOT NULL DEFAULT 'KT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3 Workspace Members (RBAC Junction)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'Member',
  status public.member_status NOT NULL DEFAULT 'Active',
  bio text,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

-- 3.4 Workspace Invitations
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  role public.member_role NOT NULL DEFAULT 'Member',
  token_hash text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  personal_message text,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_invitation_status CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);

-- 3.5 Workspace Settings (Notification Channels)
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  notification_task_reminders boolean NOT NULL DEFAULT true,
  notification_milestone_updates boolean NOT NULL DEFAULT true,
  notification_project_updates boolean NOT NULL DEFAULT true,
  notification_workspace_activity boolean NOT NULL DEFAULT false,
  notification_subscription_renewals boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.6 Engineering Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id varchar(50) PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL,
  category varchar(100) NOT NULL,
  status public.project_status NOT NULL DEFAULT 'Planning',
  location varchar(200) NOT NULL DEFAULT '',
  description text NOT NULL,
  full_description text,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3.7 Project Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id varchar(50) PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id varchar(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL,
  target_date date NOT NULL,
  status public.milestone_status NOT NULL DEFAULT 'Planned',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3.8 Actionable Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id varchar(50) PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id varchar(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id varchar(50) REFERENCES public.milestones(id) ON DELETE SET NULL,
  title varchar(200) NOT NULL,
  priority public.task_priority NOT NULL DEFAULT 'Normal',
  status public.task_status NOT NULL DEFAULT 'Pending',
  due_date date NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3.9 Financial Ledger Transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id varchar(50) PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id varchar(50) REFERENCES public.projects(id) ON DELETE SET NULL,
  transaction_date date NOT NULL,
  type public.transaction_type NOT NULL,
  category varchar(100) NOT NULL,
  amount numeric(12, 2) NOT NULL,
  description text NOT NULL,
  notes text,
  is_investment_return boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_positive_amount CHECK (amount > 0),
  CONSTRAINT chk_investment_return_type CHECK ((type = 'Income') OR (is_investment_return = false))
);

-- 3.10 AI Subscriptions
CREATE TABLE IF NOT EXISTS public.ai_subscriptions (
  id varchar(50) PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assigned_project_id varchar(50) REFERENCES public.projects(id) ON DELETE SET NULL,
  provider varchar(100) NOT NULL,
  product_name varchar(100) NOT NULL,
  plan_name varchar(100) NOT NULL,
  category varchar(100) NOT NULL,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'Monthly',
  amount numeric(12, 2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'MYR',
  status public.subscription_status NOT NULL DEFAULT 'Active',
  start_date date NOT NULL,
  next_billing_date date NOT NULL,
  purpose text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_subscription_amount CHECK (amount >= 0),
  CONSTRAINT chk_subscription_currency CHECK (currency = 'MYR')
);

-- 3.11 Workspace Notes & Decisions
CREATE TABLE IF NOT EXISTS public.workspace_notes (
  id varchar(50) PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id varchar(50) REFERENCES public.projects(id) ON DELETE SET NULL,
  type public.note_record_type NOT NULL DEFAULT 'Note',
  title varchar(200) NOT NULL,
  content text NOT NULL,
  category varchar(100) NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  decision_status public.decision_status,
  rationale text,
  impact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_decision_fields CHECK (
    (type = 'Decision' AND decision_status IS NOT NULL) OR 
    (type = 'Note' AND decision_status IS NULL)
  )
);

-- 3.12 Immutable Activity Audit Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action varchar(255) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id varchar(50) NOT NULL,
  project_id varchar(50),
  category varchar(50) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_lookup ON public.workspace_members(workspace_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_milestones_proj ON public.milestones(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_proj ON public.tasks(workspace_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tx_ws_date ON public.financial_transactions(workspace_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_roi ON public.financial_transactions(workspace_id, type, is_investment_return);
CREATE INDEX IF NOT EXISTS idx_subs_ws ON public.ai_subscriptions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_renew ON public.ai_subscriptions(workspace_id, next_billing_date);
CREATE INDEX IF NOT EXISTS idx_notes_ws ON public.workspace_notes(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_activity_ws ON public.activity_logs(workspace_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. SECURITY DEFINER HELPER FUNCTIONS (Anti-Recursion RLS Engine)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid() 
      AND status = 'Active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_workspace_role(ws_id uuid)
RETURNS public.member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role 
  FROM public.workspace_members 
  WHERE workspace_id = ws_id 
    AND user_id = auth.uid() 
    AND status = 'Active';
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid() 
      AND role IN ('Owner', 'Administrator')
      AND status = 'Active'
  );
$$;

-- ------------------------------------------------------------------------------
-- 6. BUSINESS TRIGGERS
-- ------------------------------------------------------------------------------

-- 6.1 Automatic Timestamp Maintenance
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6.2 Owner Immutability Protection
CREATE OR REPLACE FUNCTION public.protect_workspace_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'Owner' THEN
    RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be removed.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.role = 'Owner' THEN
    IF NEW.role != 'Owner' THEN
      RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be demoted.';
    END IF;
    IF NEW.status != 'Active' THEN
      RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be suspended.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner ON public.workspace_members;
CREATE TRIGGER trg_protect_owner
  BEFORE UPDATE OR DELETE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_workspace_owner();

-- 6.3 Note Record Type Immutability
CREATE OR REPLACE FUNCTION public.prevent_note_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.type != NEW.type THEN
    RAISE EXCEPTION 'Architectural Rule Violation: Modifying record type between Note and Decision is prohibited.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_note_type_immutability ON public.workspace_notes;
CREATE TRIGGER trg_note_type_immutability
  BEFORE UPDATE ON public.workspace_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_note_type_change();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Workspaces
CREATE POLICY "Members view workspaces" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));
CREATE POLICY "Admins update workspaces" ON public.workspaces
  FOR UPDATE USING (public.is_workspace_admin_or_owner(id));

-- Profiles
CREATE POLICY "Users read shared profiles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id AND wm1.status = 'Active'
    )
  );
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Workspace Members
CREATE POLICY "Members view roster" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Admins manage roster" ON public.workspace_members
  FOR ALL USING (public.is_workspace_admin_or_owner(workspace_id))
  WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Projects, Tasks, Milestones, Subscriptions, Notes (Standard Member Scoping)
CREATE POLICY "Members read projects" ON public.projects FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members write projects" ON public.projects FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');
CREATE POLICY "Members update projects" ON public.projects FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');
CREATE POLICY "Admins delete projects" ON public.projects FOR DELETE USING (public.is_workspace_admin_or_owner(workspace_id));

CREATE POLICY "Members read tasks" ON public.tasks FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members write tasks" ON public.tasks FOR ALL USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members read milestones" ON public.milestones FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members write milestones" ON public.milestones FOR ALL USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members read transactions" ON public.financial_transactions FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members write transactions" ON public.financial_transactions FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');
CREATE POLICY "Members update transactions" ON public.financial_transactions FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');
CREATE POLICY "Admins delete transactions" ON public.financial_transactions FOR DELETE USING (public.is_workspace_admin_or_owner(workspace_id));

CREATE POLICY "Members read subscriptions" ON public.ai_subscriptions FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members write subscriptions" ON public.ai_subscriptions FOR ALL USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members read notes" ON public.workspace_notes FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members write notes" ON public.workspace_notes FOR ALL USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members read logs" ON public.activity_logs FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members insert logs" ON public.activity_logs FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

-- ------------------------------------------------------------------------------
-- 8. HIGH-PERFORMANCE ACCOUNTING VIEWS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.view_overall_finance_kpis AS
SELECT
  workspace_id,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) AS total_income,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS total_expenses,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) -
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS net_cashflow,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) AS total_investment,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) AS realized_investment_return,
  CASE
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) <= 0 THEN NULL
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) <= 0 THEN NULL
    ELSE (
      (
        COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) -
        COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00)
      ) / COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00)
    ) * 100.0
  END AS roi_percent,
  CASE
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) <= 0 
      THEN 'N/A — No capital investment outlay recorded'
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) <= 0 
      THEN 'N/A — Insufficient Return Data'
    ELSE 'Computed on verified capital return transactions'
  END AS roi_note
FROM public.financial_transactions
GROUP BY workspace_id;

CREATE OR REPLACE VIEW public.view_project_finance_summary AS
SELECT
  p.workspace_id,
  p.id AS project_id,
  p.title AS project_title,
  p.category,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income'), 0.00) AS income,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Expense'), 0.00) AS expenses,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00) AS investment,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income'), 0.00) -
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Expense'), 0.00) AS net_cashflow,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) AS tracked_return,
  CASE
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00) <= 0 THEN NULL
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) <= 0 THEN NULL
    ELSE (
      (
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) -
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00)
      ) / COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00)
    ) * 100.0
  END AS roi_percent,
  CASE
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00) <= 0 THEN 'N/A'
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) <= 0 
      THEN 'N/A — Insufficient Return Data'
    ELSE 'Return on capital asset outlay'
  END AS roi_note
FROM public.projects p
LEFT JOIN public.financial_transactions t 
  ON p.id = t.project_id AND p.workspace_id = t.workspace_id
GROUP BY p.workspace_id, p.id, p.title, p.category;

CREATE OR REPLACE VIEW public.view_monthly_financial_trends AS
SELECT
  workspace_id,
  to_char(transaction_date, 'YYYY-MM') AS month_key,
  to_char(transaction_date, 'FMMonth YYYY') AS month_label,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) AS income,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS expenses,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) AS investment,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) -
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS net_cashflow
FROM public.financial_transactions
GROUP BY workspace_id, to_char(transaction_date, 'YYYY-MM'), to_char(transaction_date, 'FMMonth YYYY')
ORDER BY month_key ASC;
