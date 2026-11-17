import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type { HubProject, ProjectMetadata, ProjectStatus } from '@/types/dashboard';
import type { Database } from '@/types/database.types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

function toSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'project'}-${suffix}`;
}

function mapProjectRow(row: ProjectRow): HubProject {
  const meta = (row.metadata ?? {}) as ProjectMetadata;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status as ProjectStatus,
    location: row.location,
    description: row.description,
    tags: row.tags ?? [],
    fullDescription: row.full_description ?? undefined,
    metadata: Object.keys(meta).length > 0 ? meta : undefined,
  };
}

export async function fetchProjects(workspaceId: string): Promise<HubProject[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProjectRow);
}

export async function createProject(
  workspaceId: string,
  userId: string,
  input: {
    title: string;
    category: string;
    status: ProjectStatus;
    location?: string;
    description: string;
    fullDescription?: string;
    tags?: string[];
    metadata?: ProjectMetadata;
  }
): Promise<HubProject> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      slug: toSlug(input.title),
      title: input.title.trim(),
      category: input.category.trim(),
      status: input.status,
      location: input.location?.trim() ?? '',
      description: input.description.trim(),
      full_description: input.fullDescription?.trim() || null,
      tags: input.tags ?? [],
      metadata: (input.metadata ?? {}) as Database['public']['Tables']['projects']['Insert']['metadata'],
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Created project "${data.title}"`,
    entityType: 'project',
    entityId: data.id,
    category: 'Planning',
    metadata: { project_title: data.title },
  });

  return mapProjectRow(data);
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  input: Partial<{
    title: string;
    category: string;
    status: ProjectStatus;
    location: string;
    description: string;
    fullDescription: string;
    tags: string[];
    metadata: ProjectMetadata;
  }>
): Promise<HubProject> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.location !== undefined ? { location: input.location.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.fullDescription !== undefined ? { full_description: input.fullDescription.trim() || null } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Database['public']['Tables']['projects']['Update']['metadata'] }
        : {}),
    })
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated project "${data.title}"`,
    entityType: 'project',
    entityId: data.id,
    category: 'Planning',
    metadata: { project_title: data.title },
  });

  return mapProjectRow(data);
}

export interface ProjectDependencyCounts {
  tasks: number;
  milestones: number;
  financialTransactions: number;
  subscriptions: number;
  notes: number;
}

export async function fetchProjectDependencyCounts(
  workspaceId: string,
  projectId: string
): Promise<ProjectDependencyCounts> {
  const supabase = getSupabaseBrowserClient();
  const [tasksRes, milestonesRes, txRes, subsRes, notesRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId),
    supabase
      .from('milestones')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId),
    supabase
      .from('financial_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId),
    supabase
      .from('ai_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('assigned_project_id', projectId),
    supabase
      .from('workspace_notes')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId),
  ]);

  const firstErr =
    tasksRes.error ||
    milestonesRes.error ||
    txRes.error ||
    subsRes.error ||
    notesRes.error;
  if (firstErr) {
    throw new Error(firstErr.message);
  }

  return {
    tasks: tasksRes.count ?? 0,
    milestones: milestonesRes.count ?? 0,
    financialTransactions: txRes.count ?? 0,
    subscriptions: subsRes.count ?? 0,
    notes: notesRes.count ?? 0,
  };
}

export async function setProjectArchived(
  workspaceId: string,
  project: HubProject,
  archived: boolean
): Promise<HubProject> {
  const supabase = getSupabaseBrowserClient();
  const nextMetadata: ProjectMetadata = {
    ...(project.metadata ?? {}),
    archived,
    archivedAt: archived ? new Date().toISOString() : undefined,
  };
  if (!archived) {
    delete nextMetadata.archivedAt;
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      metadata: nextMetadata as Database['public']['Tables']['projects']['Update']['metadata'],
    })
    .eq('id', project.id)
    .eq('workspace_id', workspaceId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `${archived ? 'Archived' : 'Unarchived'} project "${data.title}"`,
    entityType: 'project',
    entityId: data.id,
    category: 'Planning',
    metadata: { project_title: data.title, archived },
  });

  return mapProjectRow(data);
}

export interface ProjectContextSummary {
  tasks: Array<{ id: string; title: string; status: string; dueDate: string }>;
  milestones: Array<{ id: string; title: string; status: string; targetDate: string }>;
  finance: { count: number; totalIncome: number; totalExpense: number; net: number };
  subscriptions: Array<{ id: string; productName: string; planName: string; status: string }>;
  notes: Array<{ id: string; title: string; type: string }>;
  recentActivity: Array<{ id: string; action: string; createdAt: string }>;
}

export async function fetchProjectContext(
  workspaceId: string,
  projectId: string
): Promise<ProjectContextSummary> {
  const supabase = getSupabaseBrowserClient();
  const [tasksRes, milestonesRes, txRes, subsRes, notesRes, activityRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date')
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId)
      .order('due_date', { ascending: true })
      .limit(6),
    supabase
      .from('milestones')
      .select('id, title, status, target_date')
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId)
      .order('target_date', { ascending: true })
      .limit(6),
    supabase
      .from('financial_transactions')
      .select('type, amount')
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId),
    supabase
      .from('ai_subscriptions')
      .select('id, product_name, plan_name, status')
      .eq('workspace_id', workspaceId)
      .eq('assigned_project_id', projectId)
      .limit(6),
    supabase
      .from('workspace_notes')
      .select('id, title, type')
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('activity_logs')
      .select('id, action, created_at')
      .eq('workspace_id', workspaceId)
      .eq('entity_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of txRes.data ?? []) {
    const amt = Number(row.amount ?? 0);
    if (row.type === 'Income') totalIncome += amt;
    else totalExpense += amt;
  }

  return {
    tasks: (tasksRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.due_date,
    })),
    milestones: (milestonesRes.data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      targetDate: m.target_date,
    })),
    finance: {
      count: txRes.data?.length ?? 0,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    },
    subscriptions: (subsRes.data ?? []).map((s) => ({
      id: s.id,
      productName: s.product_name,
      planName: s.plan_name,
      status: s.status,
    })),
    notes: (notesRes.data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
    })),
    recentActivity: (activityRes.data ?? []).map((a) => ({
      id: a.id,
      action: a.action,
      createdAt: a.created_at,
    })),
  };
}

export async function deleteProject(workspaceId: string, projectId: string, title: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Deleted project "${title}"`,
    entityType: 'project',
    entityId: projectId,
    category: 'Planning',
    metadata: { project_title: title },
  });
}

