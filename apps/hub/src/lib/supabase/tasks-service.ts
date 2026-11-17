import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type { MilestoneItem, MilestoneStatus, TaskItem, TaskPriority, TaskStatus } from '@/types/dashboard';

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function fetchTasks(workspaceId: string): Promise<TaskItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      project_id,
      milestone_id,
      priority,
      status,
      due_date,
      description,
      projects ( title ),
      milestones ( title )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const proj = row.projects as unknown as { title: string } | null;
    const ms = row.milestones as unknown as { title: string } | null;
    return {
      id: row.id,
      title: row.title,
      projectId: row.project_id,
      projectTitle: proj?.title ?? 'Project',
      project: proj?.title ?? 'Project',
      dueDate: formatDisplayDate(row.due_date),
      dueDateIso: row.due_date,
      priority: row.priority as TaskPriority,
      status: row.status as TaskStatus,
      description: row.description,
      milestoneId: row.milestone_id ?? undefined,
      milestoneTitle: ms?.title ?? undefined,
    };
  });
}

export async function createTask(
  workspaceId: string,
  userId: string,
  input: {
    projectId: string;
    milestoneId?: string | null;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDateIso: string;
    description?: string;
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      project_id: input.projectId,
      milestone_id: input.milestoneId || null,
      title: input.title.trim(),
      priority: input.priority,
      status: input.status,
      due_date: input.dueDateIso,
      description: input.description?.trim() ?? '',
      created_by: userId,
    })
    .select('id, title')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Created task "${data.title}"`,
    entityType: 'task',
    entityId: data.id,
    category: 'Planning',
  });
}

export async function updateTask(
  workspaceId: string,
  taskId: string,
  input: {
    projectId: string;
    milestoneId?: string | null;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDateIso: string;
    description?: string;
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('tasks')
    .update({
      project_id: input.projectId,
      milestone_id: input.milestoneId || null,
      title: input.title.trim(),
      priority: input.priority,
      status: input.status,
      due_date: input.dueDateIso,
      description: input.description?.trim() ?? '',
    })
    .eq('id', taskId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated task "${input.title.trim()}"`,
    entityType: 'task',
    entityId: taskId,
    category: 'Planning',
  });
}

export async function updateTaskStatus(
  workspaceId: string,
  taskId: string,
  status: TaskStatus,
  title: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated task "${title}" to ${status}`,
    entityType: 'task',
    entityId: taskId,
    category: 'Planning',
  });
}

export async function deleteTask(workspaceId: string, taskId: string, title: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Deleted task "${title}"`,
    entityType: 'task',
    entityId: taskId,
    category: 'Planning',
  });
}

export async function fetchMilestones(workspaceId: string, tasks: TaskItem[]): Promise<MilestoneItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('milestones')
    .select(
      `
      id,
      title,
      project_id,
      target_date,
      status,
      description,
      projects ( title )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('target_date', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const proj = row.projects as unknown as { title: string } | null;
    const relatedTaskIds = tasks.filter((t) => t.milestoneId === row.id).map((t) => t.id);
    return {
      id: row.id,
      title: row.title,
      projectId: row.project_id,
      projectTitle: proj?.title ?? 'Project',
      targetDate: formatDisplayDate(row.target_date),
      targetDateIso: row.target_date,
      status: row.status as MilestoneStatus,
      description: row.description,
      relatedTaskIds,
    };
  });
}

export async function createMilestone(
  workspaceId: string,
  userId: string,
  input: {
    projectId: string;
    title: string;
    targetDateIso: string;
    status: MilestoneStatus;
    description?: string;
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('milestones')
    .insert({
      workspace_id: workspaceId,
      project_id: input.projectId,
      title: input.title.trim(),
      target_date: input.targetDateIso,
      status: input.status,
      description: input.description?.trim() ?? '',
      created_by: userId,
    })
    .select('id, title')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Created milestone "${data.title}"`,
    entityType: 'milestone',
    entityId: data.id,
    category: 'Planning',
  });
}

export async function updateMilestone(
  workspaceId: string,
  milestoneId: string,
  input: {
    projectId: string;
    title: string;
    targetDateIso: string;
    status: MilestoneStatus;
    description?: string;
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('milestones')
    .update({
      project_id: input.projectId,
      title: input.title.trim(),
      target_date: input.targetDateIso,
      status: input.status,
      description: input.description?.trim() ?? '',
    })
    .eq('id', milestoneId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated milestone "${input.title.trim()}"`,
    entityType: 'milestone',
    entityId: milestoneId,
    category: 'Planning',
  });
}

export async function updateMilestoneStatus(
  workspaceId: string,
  milestoneId: string,
  status: MilestoneStatus
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('milestones')
    .update({ status })
    .eq('id', milestoneId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
}

export async function deleteMilestone(workspaceId: string, milestoneId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
}

