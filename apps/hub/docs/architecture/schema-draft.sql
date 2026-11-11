-- ==============================================================================
-- KHAI SPACE HUB — PROPOSED RELATIONAL DATABASE SCHEMA (DRAFT ONLY)
-- ==============================================================================
-- Document Version: 1.3.0 (Phase 3.3 Security & Integrity Validation Finalized)
-- Phase: Phase 3.3 Final SQL Validation & Security Closure
-- Application Target: apps/hub/
-- Working Branch: feature/khai-space-hub
--
-- CAUTION / SAFETY WARNING:
-- THIS IS AN ARCHITECTURAL DRAFT SCRIPT FOR PLANNING AND STATIC VALIDATION ONLY.
-- DO NOT EXECUTE THIS SCRIPT AGAINST A LIVE DATABASE OR REMOTE INSTANCE IN PHASE 3.3.
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
-- Note on Primary Keys:
-- Entity & event tables use `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
-- `profiles` uses `id uuid PRIMARY KEY REFERENCES auth.users(id)` (1:1 with Auth).
-- `workspace_settings` uses `workspace_id uuid PRIMARY KEY REFERENCES workspaces(id)` (1:1 with Workspace).

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

-- 3.2 Profiles (Linked 1:1 to auth.users)
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

-- STRICT RULE: At most ONE Owner per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_single_owner 
  ON public.workspace_members (workspace_id) 
  WHERE (role = 'Owner');

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
  CONSTRAINT chk_invitation_status CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  CONSTRAINT chk_invitation_role CHECK (role != 'Owner') -- Cannot invite as Owner
);

-- 3.5 Workspace Settings (1:1 with Workspace)
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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  slug varchar(50) NOT NULL,
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
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Composite unique constraints for cross-workspace relational isolation
  CONSTRAINT uq_projects_ws_slug UNIQUE (workspace_id, slug),
  CONSTRAINT uq_projects_ws_id UNIQUE (workspace_id, id)
);

-- 3.7 Project Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  slug varchar(50),
  title varchar(150) NOT NULL,
  target_date date NOT NULL,
  status public.milestone_status NOT NULL DEFAULT 'Planned',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Enforce that milestone and parent project share the exact same workspace_id
  CONSTRAINT fk_milestone_project_ws 
    FOREIGN KEY (workspace_id, project_id) 
    REFERENCES public.projects(workspace_id, id) 
    ON DELETE CASCADE,
  CONSTRAINT uq_milestones_ws_id UNIQUE (workspace_id, id)
);

-- 3.8 Actionable Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  milestone_id uuid,
  title varchar(200) NOT NULL,
  priority public.task_priority NOT NULL DEFAULT 'Normal',
  status public.task_status NOT NULL DEFAULT 'Pending',
  due_date date NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Cross-workspace protection: task must belong to same workspace as project and milestone
  CONSTRAINT fk_task_project_ws 
    FOREIGN KEY (workspace_id, project_id) 
    REFERENCES public.projects(workspace_id, id) 
    ON DELETE CASCADE,
  -- PostgreSQL 15+ column-specific SET NULL preserves NOT NULL workspace_id
  CONSTRAINT fk_task_milestone_ws 
    FOREIGN KEY (workspace_id, milestone_id) 
    REFERENCES public.milestones(workspace_id, id) 
    ON DELETE SET NULL (milestone_id)
);

-- 3.9 Financial Ledger Transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL, -- NULL indicates General Operations
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
  -- STRICT RULE: Only Income can be tagged as an investment return
  CONSTRAINT chk_investment_return_type CHECK ((type = 'Income') OR (is_investment_return = false))
);

-- 3.10 AI Subscriptions (Decoupled from General Ledger)
CREATE TABLE IF NOT EXISTS public.ai_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assigned_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
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

-- 3.12 Activity Audit Logs (Trust-Secured Ledger)
-- user_id is nullable with ON DELETE SET NULL; actor snapshot preserved in actor_email & actor_role
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email varchar(255),
  actor_role varchar(20),
  action varchar(255) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  project_id uuid,
  category varchar(50) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE & ISOLATION INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_lookup ON public.workspace_members(workspace_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(workspace_id, slug);
CREATE INDEX IF NOT EXISTS idx_milestones_proj ON public.milestones(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_proj ON public.tasks(workspace_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tx_ws_date ON public.financial_transactions(workspace_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_roi ON public.financial_transactions(workspace_id, type, is_investment_return);
CREATE INDEX IF NOT EXISTS idx_tx_proj ON public.financial_transactions(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_subs_ws ON public.ai_subscriptions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_renew ON public.ai_subscriptions(workspace_id, next_billing_date);
CREATE INDEX IF NOT EXISTS idx_notes_ws ON public.workspace_notes(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_activity_ws ON public.activity_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.workspace_invitations(token_hash) WHERE (status = 'pending');

-- ------------------------------------------------------------------------------
-- 5. CROSS-WORKSPACE REFERENTIAL INTEGRITY TRIGGERS
-- ------------------------------------------------------------------------------

-- 5.1 Project workspace validation for transactions and notes
CREATE OR REPLACE FUNCTION public.validate_project_workspace_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.project_id AND workspace_id = NEW.workspace_id
    ) THEN
      RAISE EXCEPTION 'Cross-Workspace Integrity Violation: project_id % does not exist in workspace %', 
        NEW.project_id, NEW.workspace_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tx_project_ws_integrity ON public.financial_transactions;
CREATE TRIGGER trg_tx_project_ws_integrity
  BEFORE INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_workspace_integrity();

DROP TRIGGER IF EXISTS trg_notes_project_ws_integrity ON public.workspace_notes;
CREATE TRIGGER trg_notes_project_ws_integrity
  BEFORE INSERT OR UPDATE ON public.workspace_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_workspace_integrity();

-- 5.2 Subscription assigned project validation
CREATE OR REPLACE FUNCTION public.validate_subscription_project_workspace_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.assigned_project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.assigned_project_id AND workspace_id = NEW.workspace_id
    ) THEN
      RAISE EXCEPTION 'Cross-Workspace Integrity Violation: assigned_project_id % does not exist in workspace %', 
        NEW.assigned_project_id, NEW.workspace_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subs_project_ws_integrity ON public.ai_subscriptions;
CREATE TRIGGER trg_subs_project_ws_integrity
  BEFORE INSERT OR UPDATE ON public.ai_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscription_project_workspace_integrity();

-- 5.3 Safe Project Deletion: unassign project references without deleting historical records
CREATE OR REPLACE FUNCTION public.handle_project_deletion_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Reclassify financial transactions to General Operations (Shared / NULL project_id)
  UPDATE public.financial_transactions
  SET project_id = NULL
  WHERE workspace_id = OLD.workspace_id AND project_id = OLD.id;

  -- Unassign AI subscriptions
  UPDATE public.ai_subscriptions
  SET assigned_project_id = NULL
  WHERE workspace_id = OLD.workspace_id AND assigned_project_id = OLD.id;

  -- Unassign notes and decisions
  UPDATE public.workspace_notes
  SET project_id = NULL
  WHERE workspace_id = OLD.workspace_id AND project_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_deletion_cleanup ON public.projects;
CREATE TRIGGER trg_project_deletion_cleanup
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_deletion_cleanup();

-- 5.4 Milestone Deletion Fallback: ensure tasks milestone_id is cleared without touching workspace_id
CREATE OR REPLACE FUNCTION public.handle_milestone_deletion_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.tasks
  SET milestone_id = NULL
  WHERE workspace_id = OLD.workspace_id AND milestone_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_milestone_deletion_cleanup ON public.milestones;
CREATE TRIGGER trg_milestone_deletion_cleanup
  BEFORE DELETE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_milestone_deletion_cleanup();

-- Revoke RPC execution privileges from trigger functions
REVOKE ALL ON FUNCTION public.validate_project_workspace_integrity() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_subscription_project_workspace_integrity() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_project_deletion_cleanup() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_milestone_deletion_cleanup() FROM public, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. SECURITY DEFINER HELPER FUNCTIONS (Anti-Recursion RLS Engine)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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
SET search_path = public, auth, pg_temp
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
SET search_path = public, auth, pg_temp
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

-- Restrict execution permissions to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_workspace_role(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_workspace_role(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 7. USER ONBOARDING & ATOMIC PROVISIONING FUNCTIONS
-- ------------------------------------------------------------------------------

-- 7.1 Automatic Profile Creation Trigger on auth.users (Supabase Auth Hook)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  user_full_name varchar(100);
  user_display_name varchar(50);
  initials varchar(4);
  raw_email varchar(255);
BEGIN
  -- Derive email safely with fallback for edge auth providers
  raw_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  IF raw_email = '' THEN
    raw_email := NEW.id::text || '@placeholder.khaispace.com';
  END IF;

  -- Treat raw_user_meta_data as untrusted input; clean and sanitize
  user_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(split_part(raw_email, '@', 1)), ''),
    'Member'
  );

  user_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(split_part(raw_email, '@', 1)), ''),
    'Member'
  );

  initials := UPPER(SUBSTRING(user_full_name FROM 1 FOR 2));
  IF initials IS NULL OR LENGTH(initials) = 0 THEN
    initials := 'KS';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    display_name,
    email,
    avatar_initials
  ) VALUES (
    NEW.id,
    user_full_name,
    user_display_name,
    raw_email,
    initials
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger installation on auth.users (Supabase Auth Hook)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger function should never be callable as public RPC
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- 7.2 Atomic Workspace & Owner Provisioning Function (Strictly 1 Owner Created)
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  ws_name varchar(100),
  ws_description text DEFAULT '',
  ws_timezone varchar(50) DEFAULT 'Asia/Kuala_Lumpur (GMT+8)'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  new_ws_id uuid;
  caller_id uuid := auth.uid();
  auth_user_record record;
  caller_email varchar(255);
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: caller must be authenticated.';
  END IF;

  -- Ensure caller profile exists (Self-healing defense-in-depth)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = caller_id) THEN
    SELECT email, raw_user_meta_data INTO auth_user_record
    FROM auth.users WHERE id = caller_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Authentication record not found for caller in auth.users.';
    END IF;

    caller_email := LOWER(TRIM(COALESCE(auth_user_record.email, caller_id::text || '@placeholder.khaispace.com')));

    INSERT INTO public.profiles (
      id,
      full_name,
      display_name,
      email,
      avatar_initials
    ) VALUES (
      caller_id,
      COALESCE(NULLIF(TRIM(auth_user_record.raw_user_meta_data->>'full_name'), ''), NULLIF(TRIM(split_part(caller_email, '@', 1)), ''), 'Owner'),
      COALESCE(NULLIF(TRIM(auth_user_record.raw_user_meta_data->>'display_name'), ''), NULLIF(TRIM(split_part(caller_email, '@', 1)), ''), 'Owner'),
      caller_email,
      UPPER(SUBSTRING(COALESCE(NULLIF(TRIM(auth_user_record.raw_user_meta_data->>'full_name'), ''), 'KT') FROM 1 FOR 2))
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 1. Create Workspace (direct client INSERT is blocked; this runs via SECURITY DEFINER)
  INSERT INTO public.workspaces (name, description, timezone, created_by)
  VALUES (ws_name, ws_description, ws_timezone, caller_id)
  RETURNING id INTO new_ws_id;

  -- 2. Create Initial Owner Membership (Exactly One Owner)
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (new_ws_id, caller_id, 'Owner', 'Active');

  -- 3. Initialize Workspace Settings
  INSERT INTO public.workspace_settings (workspace_id)
  VALUES (new_ws_id);

  RETURN new_ws_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_workspace_with_owner(varchar, text, varchar) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(varchar, text, varchar) TO authenticated;

-- 7.3 Secure Invitation Acceptance Function
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_id uuid := auth.uid();
  auth_user_record record;
  caller_email text;
  inv_record record;
  hashed_input text;
  new_member_id uuid;
BEGIN
  -- 1. Caller authentication enforcement
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: caller must be authenticated.';
  END IF;

  -- 2. Retrieve authoritative user record from auth.users (never rely on raw JWT or unconfirmed metadata)
  SELECT email, email_confirmed_at
  INTO auth_user_record
  FROM auth.users
  WHERE id = caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User verification failed: authoritative account not found.';
  END IF;

  -- 3 & 4. Verified email non-null and non-empty validation
  IF auth_user_record.email IS NULL OR TRIM(auth_user_record.email) = '' THEN
    RAISE EXCEPTION 'User verification failed: account does not have a valid email address.';
  END IF;

  -- 5. Verified email confirmation enforcement
  IF auth_user_record.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Email verification required: user email address has not been confirmed.';
  END IF;

  -- 6. Canonical normalization of authoritative email
  caller_email := LOWER(TRIM(auth_user_record.email));

  -- 7. Token validation & SHA-256 hashing
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RAISE EXCEPTION 'Invalid invitation token: token cannot be empty.';
  END IF;

  hashed_input := encode(digest(TRIM(p_token), 'sha256'), 'hex');

  -- 8. Locate active invitation with row locking (serializes concurrent acceptance requests)
  SELECT * INTO inv_record
  FROM public.workspace_invitations
  WHERE token_hash = hashed_input
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or already used invitation token.';
  END IF;

  -- 9. Canonical comparison between invitation email and authoritative verified user email
  IF LOWER(TRIM(inv_record.email)) IS DISTINCT FROM caller_email THEN
    RAISE EXCEPTION 'Identity mismatch: invitation was sent to a different email address.';
  END IF;

  -- 10. Check if caller is already an active member of this workspace
  IF EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = inv_record.workspace_id AND user_id = caller_id
  ) THEN
    -- Deterministic rejection without modifying invitation status or leaving partial side-effects
    RAISE EXCEPTION 'User is already an active member of workspace %.', inv_record.workspace_id;
  END IF;

  -- 11. Ensure profile exists (Self-healing defense-in-depth)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = caller_id) THEN
    INSERT INTO public.profiles (id, full_name, display_name, email, avatar_initials)
    VALUES (
      caller_id,
      COALESCE(NULLIF(TRIM(split_part(caller_email, '@', 1)), ''), 'Member'),
      COALESCE(NULLIF(TRIM(split_part(caller_email, '@', 1)), ''), 'Member'),
      caller_email,
      UPPER(SUBSTRING(COALESCE(NULLIF(TRIM(split_part(caller_email, '@', 1)), ''), 'KS') FROM 1 FOR 2))
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 12. Insert membership atomically (Direct client INSERT is disabled)
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, invited_by)
  VALUES (inv_record.workspace_id, caller_id, inv_record.role, 'Active', inv_record.invited_by)
  RETURNING id INTO new_member_id;

  -- 13. Mark invitation as accepted atomically while holding row lock
  UPDATE public.workspace_invitations
  SET status = 'accepted'
  WHERE id = inv_record.id;

  RETURN new_member_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_workspace_invitation(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(text) TO authenticated;

-- 7.4 Secure Workspace Deletion Procedure (Owner Only)
CREATE OR REPLACE FUNCTION public.delete_workspace_by_owner(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Verify caller is the active Owner of this workspace
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'Owner'
      AND status = 'Active'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the verified workspace Owner can delete a workspace.';
  END IF;

  -- Set session configuration flag so protect_workspace_owner() allows cascade deletion
  PERFORM set_config('app.deleting_workspace_id', p_workspace_id::text, true);

  -- Perform deletion (cascades to all workspace child tables)
  DELETE FROM public.workspaces WHERE id = p_workspace_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_workspace_by_owner(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_workspace_by_owner(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 8. BUSINESS AND LIFECYCLE TRIGGERS
-- ------------------------------------------------------------------------------

-- 8.1 Automatic Timestamp Maintenance
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated_at ON public.workspace_members;
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.workspace_settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.workspace_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_milestones_updated_at ON public.milestones;
CREATE TRIGGER trg_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tx_updated_at ON public.financial_transactions;
CREATE TRIGGER trg_tx_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_subs_updated_at ON public.ai_subscriptions;
CREATE TRIGGER trg_subs_updated_at BEFORE UPDATE ON public.ai_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.workspace_notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON public.workspace_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8.2 Workspace Deletion Authorization Trigger
CREATE OR REPLACE FUNCTION public.handle_workspace_deletion_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Verify that the caller is the Owner of this workspace
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = OLD.id
      AND user_id = auth.uid()
      AND role = 'Owner'
      AND status = 'Active'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the verified workspace Owner can delete a workspace.';
  END IF;

  -- Set session-scoped flag so protect_workspace_owner() allows cascade deletion
  PERFORM set_config('app.deleting_workspace_id', OLD.id::text, true);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_deletion_auth ON public.workspaces;
CREATE TRIGGER trg_workspace_deletion_auth
  BEFORE DELETE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_workspace_deletion_authorization();

REVOKE ALL ON FUNCTION public.handle_workspace_deletion_authorization() FROM public, anon, authenticated;

-- 8.3 Membership Immutability Trigger (Protects user_id, workspace_id, role boundaries)
CREATE OR REPLACE FUNCTION public.protect_workspace_members_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_role public.member_role;
BEGIN
  -- 1. user_id and workspace_id are globally immutable
  IF NEW.user_id != OLD.user_id THEN
    RAISE EXCEPTION 'Membership Identity Violation: user_id cannot be changed after creation.';
  END IF;

  IF NEW.workspace_id != OLD.workspace_id THEN
    RAISE EXCEPTION 'Membership Identity Violation: workspace_id cannot be changed after creation.';
  END IF;

  -- 2. Prevent any user from altering their own role (self-promotion / self-escalation)
  IF OLD.user_id = auth.uid() AND NEW.role != OLD.role THEN
    RAISE EXCEPTION 'Security Policy Violation: Members cannot alter their own role or self-promote.';
  END IF;

  -- 3. Prevent assigning Owner role (ownership transfer is disabled)
  IF OLD.role != 'Owner' AND NEW.role = 'Owner' THEN
    RAISE EXCEPTION 'Security Policy Violation: Promoting a member to Owner is prohibited in this version.';
  END IF;

  -- 4. Prevent demoting the Owner
  IF OLD.role = 'Owner' AND NEW.role != 'Owner' THEN
    RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be demoted.';
  END IF;

  -- 5. Prevent suspending or deactivating the Owner
  IF OLD.role = 'Owner' AND NEW.status != 'Active' THEN
    RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be suspended or deactivated.';
  END IF;

  -- 6. Enforce Administrator Boundaries: Admins cannot manage other Admins or promote to Admin
  caller_role := public.get_user_workspace_role(OLD.workspace_id);
  IF caller_role = 'Administrator' THEN
    IF OLD.role = 'Administrator' THEN
      RAISE EXCEPTION 'Security Policy Violation: Administrators cannot modify another Administrator.';
    END IF;
    IF NEW.role = 'Administrator' AND OLD.role != 'Administrator' THEN
      RAISE EXCEPTION 'Security Policy Violation: Administrators cannot promote members to Administrator.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_members_immutability ON public.workspace_members;
CREATE TRIGGER trg_protect_members_immutability
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_workspace_members_immutability();

REVOKE ALL ON FUNCTION public.protect_workspace_members_immutability() FROM public, anon, authenticated;

-- 8.4 Owner & Administrator Deletion Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_workspace_members_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_role public.member_role;
BEGIN
  -- Allow Owner deletion ONLY during authorized parent workspace deletion
  IF OLD.role = 'Owner' THEN
    IF current_setting('app.deleting_workspace_id', true) = OLD.workspace_id::text THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be removed.';
  END IF;

  -- Prohibit Administrators from deleting another Administrator or themselves
  caller_role := public.get_user_workspace_role(OLD.workspace_id);
  IF caller_role = 'Administrator' AND OLD.role = 'Administrator' THEN
    RAISE EXCEPTION 'Security Policy Violation: Administrators cannot remove another Administrator.';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_members_deletion ON public.workspace_members;
CREATE TRIGGER trg_protect_members_deletion
  BEFORE DELETE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_workspace_members_deletion();

REVOKE ALL ON FUNCTION public.protect_workspace_members_deletion() FROM public, anon, authenticated;

-- 8.5 Note Record Type Immutability
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

-- 8.6 Trusted Activity Logging Procedure
CREATE OR REPLACE FUNCTION public.log_workspace_activity(
  p_workspace_id uuid,
  p_action varchar(255),
  p_entity_type varchar(50),
  p_entity_id uuid,
  p_category varchar(50),
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  new_log_id uuid;
  caller_id uuid := auth.uid();
  caller_email text;
  caller_role public.member_role;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to log activity.';
  END IF;

  -- Verify caller is an active member of this workspace
  SELECT role INTO caller_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = caller_id AND status = 'Active';

  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not an active member of workspace %.', p_workspace_id;
  END IF;

  -- Prohibit unprivileged callers from logging restricted administrative events
  IF caller_role NOT IN ('Owner', 'Administrator') AND p_action LIKE 'admin.%' THEN
    RAISE EXCEPTION 'Unauthorized: Non-administrators cannot log administrative events.';
  END IF;

  -- Fetch caller email snapshot
  SELECT email INTO caller_email FROM public.profiles WHERE id = caller_id;

  INSERT INTO public.activity_logs (
    workspace_id,
    user_id,
    actor_email,
    actor_role,
    action,
    entity_type,
    entity_id,
    category,
    metadata,
    created_at
  ) VALUES (
    p_workspace_id,
    caller_id,
    caller_email,
    caller_role::text,
    p_action,
    p_entity_type,
    p_entity_id,
    p_category,
    p_metadata,
    now()
  )
  RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_workspace_activity(uuid, varchar, varchar, uuid, varchar, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_workspace_activity(uuid, varchar, varchar, uuid, varchar, jsonb) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
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

-- 9.1 Workspaces
CREATE POLICY "Members view workspaces" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));

CREATE POLICY "Admins update workspaces" ON public.workspaces
  FOR UPDATE USING (public.is_workspace_admin_or_owner(id));

CREATE POLICY "Owners delete workspaces" ON public.workspaces
  FOR DELETE USING (public.get_user_workspace_role(id) = 'Owner');
-- NOTE: Direct INSERT on workspaces is intentionally omitted.
-- All workspace creation MUST go through create_workspace_with_owner().

-- 9.2 Profiles
CREATE POLICY "Users read shared profiles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id AND wm1.status = 'Active'
    )
  );

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 9.3 Workspace Members (Strict Owner & Admin Separation)
CREATE POLICY "Members view roster" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id));

-- NOTE: Direct INSERT on workspace_members is intentionally omitted.
-- Memberships are created ONLY via create_workspace_with_owner() or accept_workspace_invitation().

-- UPDATE 1: Owners can update Administrator, Member, and Viewer records
CREATE POLICY "Owners update roster" ON public.workspace_members
  FOR UPDATE USING (
    public.get_user_workspace_role(workspace_id) = 'Owner' AND 
    role != 'Owner'
  ) WITH CHECK (
    public.get_user_workspace_role(workspace_id) = 'Owner' AND 
    role != 'Owner'
  );

-- UPDATE 2: Administrators can ONLY update Member and Viewer records (cannot touch Owner or Admin, cannot self-update)
CREATE POLICY "Admins update roster" ON public.workspace_members
  FOR UPDATE USING (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer') AND
    user_id != auth.uid()
  ) WITH CHECK (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer') AND
    user_id != auth.uid()
  );

-- DELETE 1: Owners can remove Administrator, Member, and Viewer records
CREATE POLICY "Owners remove roster" ON public.workspace_members
  FOR DELETE USING (
    public.get_user_workspace_role(workspace_id) = 'Owner' AND 
    role != 'Owner'
  );

-- DELETE 2: Administrators can ONLY remove Member and Viewer records (cannot remove Owner, Admin, or themselves)
CREATE POLICY "Admins remove roster" ON public.workspace_members
  FOR DELETE USING (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer') AND
    user_id != auth.uid()
  );

-- 9.4 Workspace Invitations (Owner vs Administrator Role Control)
CREATE POLICY "Admins read invitations" ON public.workspace_invitations
  FOR SELECT USING (public.is_workspace_admin_or_owner(workspace_id));

-- Owners can invite Administrators, Members, and Viewers
CREATE POLICY "Owners create invitations" ON public.workspace_invitations
  FOR INSERT WITH CHECK (
    public.get_user_workspace_role(workspace_id) = 'Owner' AND 
    role IN ('Administrator', 'Member', 'Viewer')
  );

-- Administrators can ONLY invite Members and Viewers (cannot invite another Administrator)
CREATE POLICY "Admins create invitations" ON public.workspace_invitations
  FOR INSERT WITH CHECK (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer')
  );

CREATE POLICY "Owners update invitations" ON public.workspace_invitations
  FOR UPDATE USING (public.get_user_workspace_role(workspace_id) = 'Owner');

CREATE POLICY "Admins update invitations" ON public.workspace_invitations
  FOR UPDATE USING (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer')
  ) WITH CHECK (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer')
  );

CREATE POLICY "Owners delete invitations" ON public.workspace_invitations
  FOR DELETE USING (public.get_user_workspace_role(workspace_id) = 'Owner');

CREATE POLICY "Admins delete invitations" ON public.workspace_invitations
  FOR DELETE USING (
    public.get_user_workspace_role(workspace_id) = 'Administrator' AND 
    role IN ('Member', 'Viewer')
  );

-- 9.5 Workspace Settings
CREATE POLICY "Members read settings" ON public.workspace_settings
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins update settings" ON public.workspace_settings
  FOR UPDATE USING (public.is_workspace_admin_or_owner(workspace_id));

-- 9.6 Projects
CREATE POLICY "Members read projects" ON public.projects 
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members insert projects" ON public.projects 
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members update projects" ON public.projects 
  FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Admins delete projects" ON public.projects 
  FOR DELETE USING (public.is_workspace_admin_or_owner(workspace_id));

-- 9.7 Milestones
CREATE POLICY "Members read milestones" ON public.milestones 
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members insert milestones" ON public.milestones 
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members update milestones" ON public.milestones 
  FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members delete milestones" ON public.milestones 
  FOR DELETE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

-- 9.8 Tasks
CREATE POLICY "Members read tasks" ON public.tasks 
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members insert tasks" ON public.tasks 
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members update tasks" ON public.tasks 
  FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members delete tasks" ON public.tasks 
  FOR DELETE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

-- 9.9 Financial Transactions
CREATE POLICY "Members read transactions" ON public.financial_transactions 
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members insert transactions" ON public.financial_transactions 
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members update transactions" ON public.financial_transactions 
  FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Admins delete transactions" ON public.financial_transactions 
  FOR DELETE USING (public.is_workspace_admin_or_owner(workspace_id));

-- 9.10 AI Subscriptions
CREATE POLICY "Members read subscriptions" ON public.ai_subscriptions 
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members insert subscriptions" ON public.ai_subscriptions 
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members update subscriptions" ON public.ai_subscriptions 
  FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Admins delete subscriptions" ON public.ai_subscriptions 
  FOR DELETE USING (public.is_workspace_admin_or_owner(workspace_id));

-- 9.11 Workspace Notes
CREATE POLICY "Members read notes" ON public.workspace_notes 
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members insert notes" ON public.workspace_notes 
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members update notes" ON public.workspace_notes 
  FOR UPDATE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

CREATE POLICY "Members delete notes" ON public.workspace_notes 
  FOR DELETE USING (public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer');

-- 9.12 Activity Logs (Trust Model: Read-Only via RLS, Ingestion via Triggers/Functions)
CREATE POLICY "Members read activity logs" ON public.activity_logs 
  FOR SELECT USING (public.is_workspace_member(workspace_id));
-- Direct client INSERT, UPDATE, and DELETE are strictly disallowed.
-- Activity logs are written exclusively via log_workspace_activity() or database triggers.

-- ------------------------------------------------------------------------------
-- 10. HIGH-PERFORMANCE ACCOUNTING VIEWS (SECURITY INVOKER ENABLED)
-- ------------------------------------------------------------------------------

-- 10.1 Overall Financial KPIs View
CREATE OR REPLACE VIEW public.view_overall_finance_kpis
WITH (security_invoker = true) AS
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

-- 10.2 Project Finance Summary View
CREATE OR REPLACE VIEW public.view_project_finance_summary
WITH (security_invoker = true) AS
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

-- 10.3 Monthly Financial Trends View
CREATE OR REPLACE VIEW public.view_monthly_financial_trends
WITH (security_invoker = true) AS
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

-- View Permissions Hardening (Revoke anonymous access; grant to authenticated only)
REVOKE ALL ON public.view_overall_finance_kpis FROM public, anon;
GRANT SELECT ON public.view_overall_finance_kpis TO authenticated;

REVOKE ALL ON public.view_project_finance_summary FROM public, anon;
GRANT SELECT ON public.view_project_finance_summary TO authenticated;

REVOKE ALL ON public.view_monthly_financial_trends FROM public, anon;
GRANT SELECT ON public.view_monthly_financial_trends TO authenticated;
