/**
 * Khai Space Hub — Reconciled Database Type Definitions (Planned Schema Blueprint)
 * Authoritative SQL Source: apps/hub/docs/architecture/schema-draft.sql (v1.3.0 / Phase 3.3.1)
 * Phase: Phase 4.1 — Database Type Integrity, RPC Contract Reconciliation & Documentation Correction
 *
 * IMPORTANT PROVENANCE & VERIFICATION NOTICE:
 * The TypeScript definitions are derived from the planned SQL blueprint and have not yet been
 * verified against a deployed live database schema. Live schema deployment and Supabase CLI
 * introspection are deferred to Phase 6 under separate project-owner authorization.
 *
 * MONETARY PRECISION CAVEAT:
 * PostgreSQL `numeric(12, 2)` columns (`financial_transactions.amount`, `ai_subscriptions.amount`,
 * and financial view aggregations) are represented as `number` for compatibility with the
 * installed `@supabase/supabase-js` v2.119.0 PostgREST type system (`PostgresSQLNumberTypes`).
 * IEEE-754 JavaScript `number` does NOT guarantee exact decimal arithmetic. Future persistence
 * and financial calculation services (Phase 8) must use integer sen (cents) conversion, exact
 * decimal utilities, or database-side SQL view aggregations (`view_overall_finance_kpis`,
 * `view_project_finance_summary`, `view_monthly_financial_trends`) to prevent floating-point drift.
 *
 * COMPOSITE & CROSS-SCHEMA RELATIONSHIP NOTES:
 * 1. Composite foreign keys (`fk_milestone_project_ws`, `fk_task_project_ws`, `fk_task_milestone_ws`)
 *    are explicitly represented in `Relationships` using multi-column arrays matching `schema-draft.sql`.
 * 2. Cross-schema foreign keys referencing `auth.users(id)` (`workspaces_created_by_fkey`,
 *    `profiles_id_fkey`) are documented in `Relationships` for complete SQL constraint fidelity;
 *    note that PostgREST does not embed `auth` schema relations directly from the `public` schema.
 * 3. `financial_transactions.project_id`, `ai_subscriptions.assigned_project_id`, and
 *    `workspace_notes.project_id` use single-column foreign keys (`REFERENCES public.projects(id)
 *    ON DELETE SET NULL`) paired with `BEFORE INSERT OR UPDATE` cross-workspace integrity triggers
 *    (`trg_tx_project_ws_integrity`, `trg_subs_project_ws_integrity`, `trg_notes_project_ws_integrity`).
 * 4. `activity_logs.project_id` intentionally has no SQL foreign key constraint so audit trail
 *    records remain intact after project deletion.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// 1. POSTGRESQL ENUM TYPES (Exact 1:1 match with `CREATE TYPE ... AS ENUM` in schema-draft.sql)
// ============================================================================

/** SQL: `CREATE TYPE public.project_status AS ENUM ('Active', 'Production', 'In Development', 'Planning', 'Documented')` */
export type ProjectStatus =
  | 'Active'
  | 'Production'
  | 'In Development'
  | 'Planning'
  | 'Documented';

/** SQL: `CREATE TYPE public.task_priority AS ENUM ('High', 'Medium', 'Normal')` */
export type TaskPriority = 'High' | 'Medium' | 'Normal';

/** SQL: `CREATE TYPE public.task_status AS ENUM ('In Progress', 'Pending', 'Completed')` */
export type TaskStatus = 'In Progress' | 'Pending' | 'Completed';

/** SQL: `CREATE TYPE public.milestone_status AS ENUM ('Planned', 'In Progress', 'Completed')` */
export type MilestoneStatus = 'Planned' | 'In Progress' | 'Completed';

/** SQL: `CREATE TYPE public.transaction_type AS ENUM ('Income', 'Expense', 'Investment')` */
export type TransactionType = 'Income' | 'Expense' | 'Investment';

/** SQL: `CREATE TYPE public.subscription_status AS ENUM ('Active', 'Paused', 'Cancelled', 'Trial')` */
export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled' | 'Trial';

/** SQL: `CREATE TYPE public.billing_cycle AS ENUM ('Monthly', 'Annual')` */
export type BillingCycle = 'Monthly' | 'Annual';

/** SQL: `CREATE TYPE public.note_record_type AS ENUM ('Note', 'Decision')` */
export type NoteRecordType = 'Note' | 'Decision';

/** SQL: `CREATE TYPE public.decision_status AS ENUM ('Proposed', 'Approved', 'Rejected', 'Superseded')` */
export type DecisionStatus = 'Proposed' | 'Approved' | 'Rejected' | 'Superseded';

/** SQL: `CREATE TYPE public.member_role AS ENUM ('Owner', 'Administrator', 'Member', 'Viewer')` */
export type MemberRole = 'Owner' | 'Administrator' | 'Member' | 'Viewer';

/** SQL: `CREATE TYPE public.member_status AS ENUM ('Active', 'Pending', 'Suspended')` */
export type MemberStatus = 'Active' | 'Pending' | 'Suspended';

// ============================================================================
// 2. APPLICATION-LEVEL DOMAIN TYPE ALIASES (NOT PostgreSQL `ENUM` Declarations)
// ============================================================================
// These aliases represent SQL CHECK constraint domains or frontend domain values
// stored in PostgreSQL `varchar` / `text` columns. They are intentionally excluded
// from `Database['public']['Enums']` because no corresponding `CREATE TYPE ... AS ENUM`
// exists in `schema-draft.sql`.

/**
 * Allowed values for `public.workspace_invitations.status` (`varchar(20) NOT NULL DEFAULT 'pending'`),
 * enforced in SQL by `CONSTRAINT chk_invitation_status CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))`.
 * Not a PostgreSQL ENUM type.
 */
export type InvitationStatusDomain = 'pending' | 'accepted' | 'revoked' | 'expired';

/**
 * Allowed role subset for `public.workspace_invitations.role` (`public.member_role NOT NULL DEFAULT 'Member'`),
 * enforced in SQL by `CONSTRAINT chk_invitation_role CHECK (role != 'Owner')`.
 * The underlying PostgreSQL column type is `public.member_role`.
 */
export type InvitableMemberRoleDomain = Exclude<MemberRole, 'Owner'>;

// ============================================================================
// 3. SUPABASE DATABASE SCHEMA CONTRACT (`public`)
// ============================================================================

export type Database = {
  public: {
    Tables: {
      /**
       * 3.1 `public.workspaces` (Tenant Root)
       * SQL: lines 122–133 of `schema-draft.sql`
       */
      workspaces: {
        Row: {
          id: string;
          name: string;
          description: string;
          timezone: string;
          default_currency: string;
          date_format: string;
          content_density: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          timezone?: string;
          default_currency?: string;
          date_format?: string;
          content_density?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          timezone?: string;
          default_currency?: string;
          date_format?: string;
          content_density?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workspaces_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.2 `public.profiles` (Linked 1:1 to `auth.users`)
       * SQL: lines 136–147 of `schema-draft.sql`
       */
      profiles: {
        Row: {
          id: string;
          full_name: string;
          display_name: string;
          email: string;
          bio: string;
          location: string;
          timezone: string;
          avatar_initials: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          display_name: string;
          email: string;
          bio?: string;
          location?: string;
          timezone?: string;
          avatar_initials?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          display_name?: string;
          email?: string;
          bio?: string;
          location?: string;
          timezone?: string;
          avatar_initials?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.3 `public.workspace_members` (RBAC Junction)
       * SQL: lines 150–162 of `schema-draft.sql`
       */
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: MemberRole;
          status: MemberStatus;
          bio: string | null;
          invited_by: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: MemberRole;
          status?: MemberStatus;
          bio?: string | null;
          invited_by?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: MemberRole;
          status?: MemberStatus;
          bio?: string | null;
          invited_by?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.4 `public.workspace_invitations`
       * SQL: lines 170–183 of `schema-draft.sql`
       */
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: MemberRole;
          token_hash: string;
          status: string;
          personal_message: string | null;
          invited_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: MemberRole;
          token_hash: string;
          status?: string;
          personal_message?: string | null;
          invited_by: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: MemberRole;
          token_hash?: string;
          status?: string;
          personal_message?: string | null;
          invited_by?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_invitations_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_invitations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.5 `public.workspace_settings` (1:1 with Workspace)
       * SQL: lines 186–194 of `schema-draft.sql`
       */
      workspace_settings: {
        Row: {
          workspace_id: string;
          notification_task_reminders: boolean;
          notification_milestone_updates: boolean;
          notification_project_updates: boolean;
          notification_workspace_activity: boolean;
          notification_subscription_renewals: boolean;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          notification_task_reminders?: boolean;
          notification_milestone_updates?: boolean;
          notification_project_updates?: boolean;
          notification_workspace_activity?: boolean;
          notification_subscription_renewals?: boolean;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          notification_task_reminders?: boolean;
          notification_milestone_updates?: boolean;
          notification_project_updates?: boolean;
          notification_workspace_activity?: boolean;
          notification_subscription_renewals?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_settings_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: true;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.6 `public.projects` (Engineering Projects)
       * SQL: lines 197–215 of `schema-draft.sql`
       */
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          slug: string;
          title: string;
          category: string;
          status: ProjectStatus;
          location: string;
          description: string;
          full_description: string | null;
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          slug: string;
          title: string;
          category: string;
          status?: ProjectStatus;
          location?: string;
          description: string;
          full_description?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          slug?: string;
          title?: string;
          category?: string;
          status?: ProjectStatus;
          location?: string;
          description?: string;
          full_description?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.7 `public.milestones` (Project Milestones)
       * SQL: lines 218–236 of `schema-draft.sql`
       */
      milestones: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          slug: string | null;
          title: string;
          target_date: string;
          status: MilestoneStatus;
          description: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          slug?: string | null;
          title: string;
          target_date: string;
          status?: MilestoneStatus;
          description?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          slug?: string | null;
          title?: string;
          target_date?: string;
          status?: MilestoneStatus;
          description?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'milestones_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'milestones_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_milestone_project_ws';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
          },
        ];
      };

      /**
       * 3.8 `public.tasks` (Actionable Tasks)
       * SQL: lines 239–262 of `schema-draft.sql`
       */
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          milestone_id: string | null;
          title: string;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string;
          description: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          milestone_id?: string | null;
          title: string;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          milestone_id?: string | null;
          title?: string;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_task_project_ws';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
          },
          {
            foreignKeyName: 'fk_task_milestone_ws';
            columns: ['workspace_id', 'milestone_id'];
            isOneToOne: false;
            referencedRelation: 'milestones';
            referencedColumns: ['workspace_id', 'id'];
          },
        ];
      };

      /**
       * 3.9 `public.financial_transactions` (Financial Ledger Transactions)
       * SQL: lines 265–282 of `schema-draft.sql`
       */
      financial_transactions: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          transaction_date: string;
          type: TransactionType;
          category: string;
          amount: number;
          description: string;
          notes: string | null;
          is_investment_return: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          transaction_date: string;
          type: TransactionType;
          category: string;
          amount: number;
          description: string;
          notes?: string | null;
          is_investment_return?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          transaction_date?: string;
          type?: TransactionType;
          category?: string;
          amount?: number;
          description?: string;
          notes?: string | null;
          is_investment_return?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_transactions_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_transactions_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_transactions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.10 `public.ai_subscriptions` (Decoupled from General Ledger)
       * SQL: lines 285–306 of `schema-draft.sql`
       */
      ai_subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          assigned_project_id: string | null;
          provider: string;
          product_name: string;
          plan_name: string;
          category: string;
          billing_cycle: BillingCycle;
          amount: number;
          currency: string;
          status: SubscriptionStatus;
          start_date: string;
          next_billing_date: string;
          purpose: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          assigned_project_id?: string | null;
          provider: string;
          product_name: string;
          plan_name: string;
          category: string;
          billing_cycle?: BillingCycle;
          amount: number;
          currency?: string;
          status?: SubscriptionStatus;
          start_date: string;
          next_billing_date: string;
          purpose: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          assigned_project_id?: string | null;
          provider?: string;
          product_name?: string;
          plan_name?: string;
          category?: string;
          billing_cycle?: BillingCycle;
          amount?: number;
          currency?: string;
          status?: SubscriptionStatus;
          start_date?: string;
          next_billing_date?: string;
          purpose?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_subscriptions_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_subscriptions_assigned_project_id_fkey';
            columns: ['assigned_project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_subscriptions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.11 `public.workspace_notes` (Workspace Notes & Decisions)
       * SQL: lines 309–328 of `schema-draft.sql`
       */
      workspace_notes: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          type: NoteRecordType;
          title: string;
          content: string;
          category: string;
          tags: string[];
          decision_status: DecisionStatus | null;
          rationale: string | null;
          impact: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          type?: NoteRecordType;
          title: string;
          content: string;
          category: string;
          tags?: string[];
          decision_status?: DecisionStatus | null;
          rationale?: string | null;
          impact?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          type?: NoteRecordType;
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          decision_status?: DecisionStatus | null;
          rationale?: string | null;
          impact?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_notes_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_notes_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_notes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      /**
       * 3.12 `public.activity_logs` (Activity Audit Logs — Trust-Secured Ledger)
       * SQL: lines 332–345 of `schema-draft.sql`
       */
      activity_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          actor_email: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          project_id: string | null;
          category: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          actor_email?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          project_id?: string | null;
          category: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          actor_email?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          project_id?: string | null;
          category?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: {
      /**
       * 10.1 `public.view_overall_finance_kpis` (`WITH (security_invoker = true)`)
       * SQL: lines 1315–1343 of `schema-draft.sql`
       */
      view_overall_finance_kpis: {
        Row: {
          workspace_id: string;
          total_income: number;
          total_expenses: number;
          net_cashflow: number;
          total_investment: number;
          realized_investment_return: number;
          roi_percent: number | null;
          roi_note: string;
        };
        Relationships: [];
      };

      /**
       * 10.2 `public.view_project_finance_summary` (`WITH (security_invoker = true)`)
       * SQL: lines 1346–1378 of `schema-draft.sql`
       */
      view_project_finance_summary: {
        Row: {
          workspace_id: string;
          project_id: string;
          project_title: string;
          category: string;
          income: number;
          expenses: number;
          investment: number;
          net_cashflow: number;
          tracked_return: number;
          roi_percent: number | null;
          roi_note: string;
        };
        Relationships: [];
      };

      /**
       * 10.3 `public.view_monthly_financial_trends` (`WITH (security_invoker = true)`)
       * SQL: lines 1381–1394 of `schema-draft.sql`
       */
      view_monthly_financial_trends: {
        Row: {
          workspace_id: string;
          month_key: string;
          month_label: string;
          income: number;
          expenses: number;
          investment: number;
          net_cashflow: number;
        };
        Relationships: [];
      };
    };

    Functions: {
      /**
       * 7.2 `public.create_workspace_with_owner` (`SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 621–683 of `schema-draft.sql`
       */
      create_workspace_with_owner: {
        Args: {
          ws_name: string;
          ws_description?: string;
          ws_timezone?: string;
        };
        Returns: string;
      };

      /**
       * 7.3 `public.accept_workspace_invitation` (`SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 689–788 of `schema-draft.sql`
       */
      accept_workspace_invitation: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };

      /**
       * 7.4 `public.delete_workspace_by_owner` (`SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 794–818 of `schema-draft.sql`
       */
      delete_workspace_by_owner: {
        Args: {
          p_workspace_id: string;
        };
        Returns: void;
      };

      /**
       * 8.6 `public.log_workspace_activity` (`SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 1019–1086 of `schema-draft.sql`
       */
      log_workspace_activity: {
        Args: {
          p_workspace_id: string;
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_category: string;
          p_metadata?: Json;
        };
        Returns: string;
      };

      /**
       * 6.1 `public.is_workspace_member` (`STABLE`, `SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 493–507 of `schema-draft.sql`
       */
      is_workspace_member: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };

      /**
       * 6.2 `public.get_user_workspace_role` (`STABLE`, `SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 509–521 of `schema-draft.sql`
       * Returns `public.member_role` (or `null` when caller has no active membership in `ws_id`).
       */
      get_user_workspace_role: {
        Args: {
          ws_id: string;
        };
        Returns: Database['public']['Enums']['member_role'] | null;
      };

      /**
       * 6.3 `public.is_workspace_admin_or_owner` (`STABLE`, `SECURITY DEFINER`, `SET search_path = public, auth, pg_temp`)
       * SQL: lines 523–538 of `schema-draft.sql`
       */
      is_workspace_admin_or_owner: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
    };

    Enums: {
      project_status: ProjectStatus;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      milestone_status: MilestoneStatus;
      transaction_type: TransactionType;
      subscription_status: SubscriptionStatus;
      billing_cycle: BillingCycle;
      note_record_type: NoteRecordType;
      decision_status: DecisionStatus;
      member_role: MemberRole;
      member_status: MemberStatus;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ============================================================================
// 4. SUPABASE SCHEMA HELPER UTILITIES
// ============================================================================

export type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

export type Views<T extends keyof PublicSchema['Views']> =
  PublicSchema['Views'][T]['Row'];

export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T];
