/**
 * Khai Space Hub — Database Type Definitions (Planned Schema)
 * Source: apps/hub/docs/architecture/schema-draft.sql (Phase 3.3.1 Approved Blueprint)
 *
 * NOTE: This file represents the documented and statically validated relational schema
 * architecture designed during Phase 3. It provides full compile-time type safety for
 * the Supabase client singleton in Phase 4.
 *
 * IMPORTANT: The live database schema will be deployed in Phase 6. These types reflect
 * the planned schema and will be verified against live generated types in Phase 6.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = 'Owner' | 'Administrator' | 'Member' | 'Viewer';
export type MemberStatus = 'Active' | 'Invited' | 'Suspended';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type InvitationRole = 'Administrator' | 'Member' | 'Viewer';
export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'Archived';
export type MilestoneStatus = 'Pending' | 'Completed' | 'Overdue';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TransactionType = 'Income' | 'Expense';
export type TransactionCategory =
  | 'Client Revenue'
  | 'Consulting'
  | 'Product Sales'
  | 'Software Licensing'
  | 'Infrastructure'
  | 'Marketing'
  | 'Operations'
  | 'Hardware'
  | 'Salaries'
  | 'Other';
export type SubscriptionCategory =
  | 'Foundation Model'
  | 'Code Assistant'
  | 'Image & Media'
  | 'Productivity & Search'
  | 'Audio & Speech'
  | 'Research & Science'
  | 'Other';
export type BillingCycle = 'Monthly' | 'Yearly' | 'Quarterly' | 'Weekly';
export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';
export type NoteType = 'Note' | 'Decision';
export type DecisionStatus = 'Proposed' | 'Accepted' | 'Superseded' | 'Rejected';
export type ActivityEntityType =
  | 'Project'
  | 'Task'
  | 'Milestone'
  | 'Finance'
  | 'Subscription'
  | 'Note'
  | 'Member'
  | 'Settings'
  | 'Workspace';

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          timezone: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          timezone?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          timezone?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
      profiles: {
        Row: {
          id: string;
          full_name: string;
          display_name: string;
          email: string;
          avatar_url: string | null;
          avatar_initials: string;
          bio: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          display_name: string;
          email: string;
          avatar_url?: string | null;
          avatar_initials?: string;
          bio?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          display_name?: string;
          email?: string;
          avatar_url?: string | null;
          avatar_initials?: string;
          bio?: string | null;
          phone?: string | null;
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
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          status: MemberStatus;
          invited_by: string | null;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          status?: MemberStatus;
          invited_by?: string | null;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          status?: MemberStatus;
          invited_by?: string | null;
          joined_at?: string;
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
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: InvitationRole;
          token_hash: string;
          status: InvitationStatus;
          invited_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: InvitationRole;
          token_hash: string;
          status?: InvitationStatus;
          invited_by: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: InvitationRole;
          token_hash?: string;
          status?: InvitationStatus;
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
      workspace_settings: {
        Row: {
          workspace_id: string;
          default_currency: string;
          fiscal_year_start_month: number;
          notify_on_task_assignment: boolean;
          notify_on_subscription_renewal: boolean;
          subscription_renewal_alert_days: number;
          allow_member_invites: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          default_currency?: string;
          fiscal_year_start_month?: number;
          notify_on_task_assignment?: boolean;
          notify_on_subscription_renewal?: boolean;
          subscription_renewal_alert_days?: number;
          allow_member_invites?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          default_currency?: string;
          fiscal_year_start_month?: number;
          notify_on_task_assignment?: boolean;
          notify_on_subscription_renewal?: boolean;
          subscription_renewal_alert_days?: number;
          allow_member_invites?: boolean;
          created_at?: string;
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
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          description: string | null;
          status: ProjectStatus;
          target_completion_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: ProjectStatus;
          target_completion_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          status?: ProjectStatus;
          target_completion_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
      milestones: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          title: string;
          due_date: string;
          status: MilestoneStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          title: string;
          due_date: string;
          status?: MilestoneStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          title?: string;
          due_date?: string;
          status?: MilestoneStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'milestones_workspace_project_fkey';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          milestone_id: string | null;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          due_date: string | null;
          assignee_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          milestone_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          assignee_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          milestone_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          assignee_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_workspace_project_fkey';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
          },
          {
            foreignKeyName: 'tasks_workspace_milestone_fkey';
            columns: ['workspace_id', 'milestone_id'];
            isOneToOne: false;
            referencedRelation: 'milestones';
            referencedColumns: ['workspace_id', 'id'];
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_transactions: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          type: TransactionType;
          category: TransactionCategory;
          amount: number;
          currency: string;
          transaction_date: string;
          description: string;
          is_investment_return: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          type: TransactionType;
          category: TransactionCategory;
          amount: number;
          currency?: string;
          transaction_date: string;
          description: string;
          is_investment_return?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          type?: TransactionType;
          category?: TransactionCategory;
          amount?: number;
          currency?: string;
          transaction_date?: string;
          description?: string;
          is_investment_return?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
            foreignKeyName: 'financial_transactions_workspace_project_fkey';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
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
      ai_subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          tool_name: string;
          category: SubscriptionCategory;
          billing_cycle: BillingCycle;
          cost_amount: number;
          currency: string;
          status: SubscriptionStatus;
          start_date: string;
          next_renewal_date: string;
          payment_method: string | null;
          auto_renew: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          tool_name: string;
          category: SubscriptionCategory;
          billing_cycle: BillingCycle;
          cost_amount: number;
          currency?: string;
          status?: SubscriptionStatus;
          start_date: string;
          next_renewal_date: string;
          payment_method?: string | null;
          auto_renew?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          tool_name?: string;
          category?: SubscriptionCategory;
          billing_cycle?: BillingCycle;
          cost_amount?: number;
          currency?: string;
          status?: SubscriptionStatus;
          start_date?: string;
          next_renewal_date?: string;
          payment_method?: string | null;
          auto_renew?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
            foreignKeyName: 'ai_subscriptions_workspace_project_fkey';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
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
      workspace_notes: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          type: NoteType;
          title: string;
          content: string;
          tags: string[];
          decision_status: DecisionStatus | null;
          is_pinned: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          type?: NoteType;
          title: string;
          content: string;
          tags?: string[];
          decision_status?: DecisionStatus | null;
          is_pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          type?: NoteType;
          title?: string;
          content?: string;
          tags?: string[];
          decision_status?: DecisionStatus | null;
          is_pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
            foreignKeyName: 'workspace_notes_workspace_project_fkey';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
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
      activity_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          actor_email: string | null;
          actor_role: string | null;
          entity_type: ActivityEntityType;
          entity_id: string | null;
          project_id: string | null;
          action: string;
          details_summary: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          actor_email?: string | null;
          actor_role?: string | null;
          entity_type: ActivityEntityType;
          entity_id?: string | null;
          project_id?: string | null;
          action: string;
          details_summary: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          actor_email?: string | null;
          actor_role?: string | null;
          entity_type?: ActivityEntityType;
          entity_id?: string | null;
          project_id?: string | null;
          action?: string;
          details_summary?: string;
          metadata?: Json | null;
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
          {
            foreignKeyName: 'activity_logs_workspace_project_fkey';
            columns: ['workspace_id', 'project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['workspace_id', 'id'];
          },
        ];
      };
    };
    Views: {
      view_overall_finance_kpis: {
        Row: {
          workspace_id: string;
          total_income: number;
          total_expense: number;
          net_cash_flow: number;
          realized_investment_return: number;
          realized_roi_percentage: number | null;
        };
      };
      view_project_finance_summary: {
        Row: {
          workspace_id: string;
          project_id: string | null;
          project_name: string;
          project_income: number;
          project_expense: number;
          project_net_margin: number;
          project_investment_return: number;
        };
      };
      view_monthly_financial_trends: {
        Row: {
          workspace_id: string;
          year_month: string;
          monthly_income: number;
          monthly_expense: number;
          monthly_net: number;
        };
      };
    };
    Functions: {
      create_workspace_with_owner: {
        Args: {
          ws_name: string;
          ws_description?: string | null;
          ws_timezone?: string | null;
        };
        Returns: string;
      };
      accept_workspace_invitation: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
      delete_workspace_by_owner: {
        Args: {
          p_workspace_id: string;
        };
        Returns: void;
      };
      log_workspace_activity: {
        Args: {
          p_workspace_id: string;
          p_entity_type: string;
          p_action: string;
          p_project_id?: string | null;
          p_details_summary: string;
          p_metadata?: Json | null;
        };
        Returns: string;
      };
      is_workspace_member: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
      get_user_workspace_role: {
        Args: {
          ws_id: string;
        };
        Returns: string | null;
      };
      is_workspace_admin_or_owner: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      member_status: MemberStatus;
      invitation_status: InvitationStatus;
      project_status: ProjectStatus;
      milestone_status: MilestoneStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      transaction_type: TransactionType;
      transaction_category: TransactionCategory;
      subscription_category: SubscriptionCategory;
      billing_cycle: BillingCycle;
      subscription_status: SubscriptionStatus;
      note_type: NoteType;
      decision_status: DecisionStatus;
      activity_entity_type: ActivityEntityType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
