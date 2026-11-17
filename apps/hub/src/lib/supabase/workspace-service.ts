import { getSupabaseBrowserClient } from './client';
import type { Database } from '@/types/database.types';
import type { ActivityEntry } from '@/types/dashboard';

export type MemberRole = Database['public']['Enums']['member_role'];
export type MemberStatus = Database['public']['Enums']['member_status'];

export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string;
  timezone: string;
  defaultCurrency: string;
  dateFormat: string;
  contentDensity: string;
  role: MemberRole;
  status: MemberStatus;
}

export async function fetchUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      role,
      status,
      workspaces (
        id,
        name,
        description,
        timezone,
        default_currency,
        date_format,
        content_density
      )
    `
    )
    .eq('user_id', userId)
    .eq('status', 'Active')
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const summaries: WorkspaceSummary[] = [];
  for (const row of data ?? []) {
    const ws = row.workspaces as unknown as {
      id: string;
      name: string;
      description: string;
      timezone: string;
      default_currency: string;
      date_format: string;
      content_density: string;
    } | null;
    if (!ws) continue;
    summaries.push({
      id: ws.id,
      name: ws.name,
      description: ws.description,
      timezone: ws.timezone,
      defaultCurrency: ws.default_currency,
      dateFormat: ws.date_format,
      contentDensity: ws.content_density,
      role: row.role,
      status: row.status,
    });
  }

  return summaries;
}

export async function createWorkspaceWithOwner(input: {
  name: string;
  description?: string;
  timezone?: string;
}): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('create_workspace_with_owner', {
    ws_name: input.name.trim(),
    ws_description: input.description?.trim() ?? '',
    ws_timezone: input.timezone ?? 'Asia/Kuala_Lumpur (GMT+8)',
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Workspace creation did not return a workspace ID.');
  }
  return data;
}

export async function acceptWorkspaceInvitation(token: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('accept_workspace_invitation', {
    p_token: token.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Invitation acceptance did not return a membership ID.');
  }
  return data;
}

export async function logWorkspaceActivity(input: {
  workspaceId: string;
  action: string;
  entityType: string;
  entityId: string;
  category: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc('log_workspace_activity', {
    p_workspace_id: input.workspaceId,
    p_action: input.action,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_category: input.category,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    // Non-fatal: activity logging should not block the primary user action
    console.warn('Activity log failed:', error.message);
  }
}

export async function fetchRecentActivity(workspaceId: string, limit = 10): Promise<ActivityEntry[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, action, entity_type, category, created_at, metadata')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const meta = (row.metadata as Record<string, unknown> | null) ?? {};
    const projectLabel =
      typeof meta.project_title === 'string' && meta.project_title.trim()
        ? meta.project_title
        : row.entity_type;
    const cat = row.category;
    const mappedCategory: ActivityEntry['category'] =
      cat === 'Documentation' || cat === 'Scaffold' || cat === 'Design' || cat === 'Planning'
        ? cat
        : 'Planning';
    return {
      id: row.id,
      action: row.action,
      project: projectLabel,
      date: new Date(row.created_at).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      category: mappedCategory,
    };
  });
}

