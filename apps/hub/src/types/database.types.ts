/**
 * Khai Space Hub — Live Reconciled Database Type Definitions
 * Verified Target: khai-space-hub (dpicdhjaabfjbvppmsxk, Singapore, PostgreSQL 17.11)
 * Introspected via: Supabase CLI / supabase_mcp.generate_typescript_types
 * Phase: Phase 6 — Database Schema & Row Level Security Deployment
 *
 * VERIFICATION NOTICE:
 * These TypeScript definitions are generated directly from the live deployed PostgreSQL 17.11
 * schema on project dpicdhjaabfjbvppmsxk following the successful execution of migration
 * 20261113000001_phase6_initial_schema_and_rls.sql (Supabase migration version 20261113024551).
 *
 * ARCHITECTURAL SUMMARY:
 * - 12 Relational Tables with Row Level Security enabled
 * - 11 PostgreSQL Enums
 * - 3 Accounting Views (security_invoker = true)
 * - 7 Public RPC Functions (15 SECURITY DEFINER + 2 SECURITY INVOKER database functions)
 * - Strict multi-tenant cross-workspace relational isolation
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_role: string | null
          category: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          project_id: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_role?: string | null
          category: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          project_id?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_role?: string | null
          category?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_subscriptions: {
        Row: {
          amount: number
          assigned_project_id: string | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          category: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          next_billing_date: string
          notes: string | null
          plan_name: string
          product_name: string
          provider: string
          purpose: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          assigned_project_id?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          next_billing_date: string
          notes?: string | null
          plan_name: string
          product_name: string
          provider: string
          purpose: string
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          assigned_project_id?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          next_billing_date?: string
          notes?: string | null
          plan_name?: string
          product_name?: string
          provider?: string
          purpose?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_subscriptions_assigned_project_id_fkey"
            columns: ["assigned_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_subscriptions_assigned_project_id_fkey"
            columns: ["assigned_project_id"]
            isOneToOne: false
            referencedRelation: "view_project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_investment_return: boolean
          notes: string | null
          project_id: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_investment_return?: boolean
          notes?: string | null
          project_id?: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_investment_return?: boolean
          notes?: string | null
          project_id?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "view_project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "financial_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          project_id: string
          slug: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          target_date: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id: string
          slug?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          target_date: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          target_date?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_milestone_project_ws"
            columns: ["workspace_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "fk_milestone_project_ws"
            columns: ["workspace_id", "project_id"]
            isOneToOne: false
            referencedRelation: "view_project_finance_summary"
            referencedColumns: ["workspace_id", "project_id"]
          },
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_initials: string
          bio: string
          created_at: string
          display_name: string
          email: string
          full_name: string
          id: string
          location: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_initials?: string
          bio?: string
          created_at?: string
          display_name: string
          email: string
          full_name: string
          id: string
          location?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_initials?: string
          bio?: string
          created_at?: string
          display_name?: string
          email?: string
          full_name?: string
          id?: string
          location?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          full_description: string | null
          id: string
          location: string
          metadata: Json
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          tags: string[]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          full_description?: string | null
          id?: string
          location?: string
          metadata?: Json
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          full_description?: string | null
          id?: string
          location?: string
          metadata?: Json
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          due_date: string
          id: string
          milestone_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          due_date: string
          id?: string
          milestone_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          milestone_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_milestone_ws"
            columns: ["workspace_id", "milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "fk_task_project_ws"
            columns: ["workspace_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "fk_task_project_ws"
            columns: ["workspace_id", "project_id"]
            isOneToOne: false
            referencedRelation: "view_project_finance_summary"
            referencedColumns: ["workspace_id", "project_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          personal_message: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: string
          token_hash: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          personal_message?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: string
          token_hash: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          personal_message?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: string
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_notes: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          decision_status: Database["public"]["Enums"]["decision_status"] | null
          id: string
          impact: string | null
          project_id: string | null
          rationale: string | null
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["note_record_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          decision_status?:
            | Database["public"]["Enums"]["decision_status"]
            | null
          id?: string
          impact?: string | null
          project_id?: string | null
          rationale?: string | null
          tags?: string[]
          title: string
          type?: Database["public"]["Enums"]["note_record_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          decision_status?:
            | Database["public"]["Enums"]["decision_status"]
            | null
          id?: string
          impact?: string | null
          project_id?: string | null
          rationale?: string | null
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["note_record_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "view_project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "workspace_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          notification_milestone_updates: boolean
          notification_project_updates: boolean
          notification_subscription_renewals: boolean
          notification_task_reminders: boolean
          notification_workspace_activity: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          notification_milestone_updates?: boolean
          notification_project_updates?: boolean
          notification_subscription_renewals?: boolean
          notification_task_reminders?: boolean
          notification_workspace_activity?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          notification_milestone_updates?: boolean
          notification_project_updates?: boolean
          notification_subscription_renewals?: boolean
          notification_task_reminders?: boolean
          notification_workspace_activity?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          content_density: string
          created_at: string
          created_by: string | null
          date_format: string
          default_currency: string
          description: string
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          content_density?: string
          created_at?: string
          created_by?: string | null
          date_format?: string
          default_currency?: string
          description?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          content_density?: string
          created_at?: string
          created_by?: string | null
          date_format?: string
          default_currency?: string
          description?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_monthly_financial_trends: {
        Row: {
          expenses: number | null
          income: number | null
          investment: number | null
          month_key: string | null
          month_label: string | null
          net_cashflow: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      view_overall_finance_kpis: {
        Row: {
          net_cashflow: number | null
          realized_investment_return: number | null
          roi_note: string | null
          roi_percent: number | null
          total_expenses: number | null
          total_income: number | null
          total_investment: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      view_project_finance_summary: {
        Row: {
          category: string | null
          expenses: number | null
          income: number | null
          investment: number | null
          net_cashflow: number | null
          project_id: string | null
          project_title: string | null
          roi_note: string | null
          roi_percent: number | null
          tracked_return: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { p_token: string }
        Returns: string
      }
      create_workspace_with_owner: {
        Args: { ws_description?: string; ws_name: string; ws_timezone?: string }
        Returns: string
      }
      delete_workspace_by_owner: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      get_user_workspace_role: {
        Args: { ws_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      is_workspace_admin_or_owner: { Args: { ws_id: string }; Returns: boolean }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      log_workspace_activity: {
        Args: {
          p_action: string
          p_category: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_workspace_id: string
        }
        Returns: string
      }
    }
    Enums: {
      billing_cycle: "Monthly" | "Annual"
      decision_status: "Proposed" | "Approved" | "Rejected" | "Superseded"
      member_role: "Owner" | "Administrator" | "Member" | "Viewer"
      member_status: "Active" | "Pending" | "Suspended"
      milestone_status: "Planned" | "In Progress" | "Completed"
      note_record_type: "Note" | "Decision"
      project_status:
        | "Active"
        | "Production"
        | "In Development"
        | "Planning"
        | "Documented"
      subscription_status: "Active" | "Paused" | "Cancelled" | "Trial"
      task_priority: "High" | "Medium" | "Normal"
      task_status: "In Progress" | "Pending" | "Completed"
      transaction_type: "Income" | "Expense" | "Investment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["Monthly", "Annual"],
      decision_status: ["Proposed", "Approved", "Rejected", "Superseded"],
      member_role: ["Owner", "Administrator", "Member", "Viewer"],
      member_status: ["Active", "Pending", "Suspended"],
      milestone_status: ["Planned", "In Progress", "Completed"],
      note_record_type: ["Note", "Decision"],
      project_status: [
        "Active",
        "Production",
        "In Development",
        "Planning",
        "Documented",
      ],
      subscription_status: ["Active", "Paused", "Cancelled", "Trial"],
      task_priority: ["High", "Medium", "Normal"],
      task_status: ["In Progress", "Pending", "Completed"],
      transaction_type: ["Income", "Expense", "Investment"],
    },
  },
} as const

// ============================================================================
// CONVENIENCE ENUM TYPE ALIASES
// ============================================================================

export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type MilestoneStatus = Database["public"]["Enums"]["milestone_status"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type BillingCycle = Database["public"]["Enums"]["billing_cycle"];
export type NoteRecordType = Database["public"]["Enums"]["note_record_type"];
export type DecisionStatus = Database["public"]["Enums"]["decision_status"];
export type MemberRole = Database["public"]["Enums"]["member_role"];
export type MemberStatus = Database["public"]["Enums"]["member_status"];

export type PublicSchema = Database["public"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
