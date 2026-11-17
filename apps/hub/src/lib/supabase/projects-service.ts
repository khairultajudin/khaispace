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

