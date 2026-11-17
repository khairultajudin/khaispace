import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type { DecisionStatus, NoteRecordType, WorkspaceNoteItem } from '@/types/dashboard';

export async function fetchNotesAndDecisions(workspaceId: string): Promise<WorkspaceNoteItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('workspace_notes')
    .select(
      `
      id,
      type,
      title,
      content,
      category,
      tags,
      project_id,
      decision_status,
      rationale,
      impact,
      created_at,
      updated_at,
      projects ( title )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const proj = row.projects as unknown as { title: string } | null;
    const createdIso = row.created_at.slice(0, 10);
    const updatedIso = row.updated_at.slice(0, 10);
    return {
      id: row.id,
      type: row.type as NoteRecordType,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags ?? [],
      projectId: row.project_id ?? undefined,
      projectTitle: proj?.title ?? undefined,
      status: (row.decision_status as DecisionStatus | null) ?? undefined,
      rationale: row.rationale ?? undefined,
      impact: row.impact ?? undefined,
      createdAt: createdIso,
      createdAtIso: createdIso,
      updatedAt: updatedIso,
      updatedAtIso: updatedIso,
    };
  });
}

export async function createNoteOrDecision(
  workspaceId: string,
  userId: string,
  input: Omit<WorkspaceNoteItem, 'id' | 'createdAt' | 'createdAtIso' | 'updatedAt' | 'updatedAtIso'>
): Promise<WorkspaceNoteItem> {
  const supabase = getSupabaseBrowserClient();
  const decisionStatus =
    input.type === 'Decision' ? (input.status ?? 'Proposed') : null;

  const { data, error } = await supabase
    .from('workspace_notes')
    .insert({
      workspace_id: workspaceId,
      project_id: input.projectId || null,
      type: input.type,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category.trim(),
      tags: input.tags ?? [],
      decision_status: decisionStatus,
      rationale: input.type === 'Decision' ? input.rationale?.trim() || null : null,
      impact: input.type === 'Decision' ? input.impact?.trim() || null : null,
      created_by: userId,
    })
    .select(
      `
      id, type, title, content, category, tags, project_id,
      decision_status, rationale, impact, created_at, updated_at,
      projects ( title )
    `
    )
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Created ${data.type.toLowerCase()} "${data.title}"`,
    entityType: data.type.toLowerCase(),
    entityId: data.id,
    category: 'Documentation',
  });

  const proj = data.projects as unknown as { title: string } | null;
  const createdIso = data.created_at.slice(0, 10);
  const updatedIso = data.updated_at.slice(0, 10);
  return {
    id: data.id,
    type: data.type as NoteRecordType,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags ?? [],
    projectId: data.project_id ?? undefined,
    projectTitle: proj?.title ?? undefined,
    status: (data.decision_status as DecisionStatus | null) ?? undefined,
    rationale: data.rationale ?? undefined,
    impact: data.impact ?? undefined,
    createdAt: createdIso,
    createdAtIso: createdIso,
    updatedAt: updatedIso,
    updatedAtIso: updatedIso,
  };
}

export async function updateNoteOrDecision(
  workspaceId: string,
  recordId: string,
  input: Omit<WorkspaceNoteItem, 'id' | 'createdAt' | 'createdAtIso' | 'updatedAt' | 'updatedAtIso'>
): Promise<WorkspaceNoteItem> {
  const supabase = getSupabaseBrowserClient();
  const decisionStatus =
    input.type === 'Decision' ? (input.status ?? 'Proposed') : null;

  // Note: `type` is immutable (enforced by trg_note_type_immutability), so omit `type` from UPDATE
  const { data, error } = await supabase
    .from('workspace_notes')
    .update({
      project_id: input.projectId || null,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category.trim(),
      tags: input.tags ?? [],
      decision_status: decisionStatus,
      rationale: input.type === 'Decision' ? input.rationale?.trim() || null : null,
      impact: input.type === 'Decision' ? input.impact?.trim() || null : null,
    })
    .eq('id', recordId)
    .eq('workspace_id', workspaceId)
    .select(
      `
      id, type, title, content, category, tags, project_id,
      decision_status, rationale, impact, created_at, updated_at,
      projects ( title )
    `
    )
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated ${data.type.toLowerCase()} "${data.title}"`,
    entityType: data.type.toLowerCase(),
    entityId: data.id,
    category: 'Documentation',
  });

  const proj = data.projects as unknown as { title: string } | null;
  const createdIso = data.created_at.slice(0, 10);
  const updatedIso = data.updated_at.slice(0, 10);
  return {
    id: data.id,
    type: data.type as NoteRecordType,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags ?? [],
    projectId: data.project_id ?? undefined,
    projectTitle: proj?.title ?? undefined,
    status: (data.decision_status as DecisionStatus | null) ?? undefined,
    rationale: data.rationale ?? undefined,
    impact: data.impact ?? undefined,
    createdAt: createdIso,
    createdAtIso: createdIso,
    updatedAt: updatedIso,
    updatedAtIso: updatedIso,
  };
}

export async function deleteNoteOrDecision(
  workspaceId: string,
  recordId: string,
  title: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('workspace_notes')
    .delete()
    .eq('id', recordId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Deleted note "${title}"`,
    entityType: 'note',
    entityId: recordId,
    category: 'Documentation',
  });
}
