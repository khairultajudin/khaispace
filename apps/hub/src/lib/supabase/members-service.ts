import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type { MemberRole, MemberStatus, WorkspaceMember } from '@/types/dashboard';

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function sha256Hex(plain: string): Promise<string> {
  const bytes = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function fetchWorkspaceRoster(
  workspaceId: string,
  viewerRole: MemberRole
): Promise<WorkspaceMember[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: memberRows, error: memberErr } = await supabase
    .from('workspace_members')
    .select(
      `
      id,
      user_id,
      role,
      status,
      bio,
      joined_at,
      profiles!workspace_members_user_id_fkey (
        full_name,
        email,
        bio
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  if (memberErr) throw new Error(memberErr.message);

  const roster: WorkspaceMember[] = (memberRows ?? []).map((row) => {
    const prof = row.profiles as unknown as {
      full_name: string;
      email: string;
      bio: string;
    } | null;
    const joinedIso = row.joined_at.slice(0, 10);
    return {
      id: row.id,
      name: prof?.full_name ?? 'Workspace Member',
      email: prof?.email ?? '',
      role: row.role as MemberRole,
      status: row.status as MemberStatus,
      joinedAt: formatDisplayDate(row.joined_at),
      joinedAtIso: joinedIso,
      bio: row.bio ?? prof?.bio ?? undefined,
    };
  });

  if (viewerRole === 'Owner' || viewerRole === 'Administrator') {
    const { data: invRows, error: invErr } = await supabase
      .from('workspace_invitations')
      .select('id, email, role, status, personal_message, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!invErr && invRows) {
      for (const inv of invRows) {
        roster.push({
          id: `inv:${inv.id}`,
          name: inv.email.split('@')[0] || 'Invited User',
          email: inv.email,
          role: inv.role as MemberRole,
          status: 'Pending',
          joinedAt: `Invited ${formatDisplayDate(inv.created_at)}`,
          joinedAtIso: inv.created_at.slice(0, 10),
          personalMessage: inv.personal_message ?? undefined,
        });
      }
    }
  }

  return roster;
}

export async function createWorkspaceInvitation(
  workspaceId: string,
  invitedByUserId: string,
  input: {
    email: string;
    role: Exclude<MemberRole, 'Owner'>;
    personalMessage?: string;
  }
): Promise<{ inviteToken: string }> {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const inviteToken = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const tokenHash = await sha256Hex(inviteToken);

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      token_hash: tokenHash,
      personal_message: input.personalMessage?.trim() || null,
      invited_by: invitedByUserId,
    })
    .select('id, email')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `admin.invited_member (${data.email})`,
    entityType: 'workspace_invitation',
    entityId: data.id,
    category: 'Planning',
  });

  return { inviteToken };
}

export async function updateMemberRoleOrStatus(
  workspaceId: string,
  memberId: string,
  updates: { role?: MemberRole; status?: MemberStatus }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('workspace_members')
    .update(updates)
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `admin.updated_member`,
    entityType: 'workspace_member',
    entityId: memberId,
    category: 'Planning',
  });
}

export async function removeWorkspaceMember(workspaceId: string, memberId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (memberId.startsWith('inv:')) {
    const invId = memberId.slice(4);
    const { error } = await supabase
      .from('workspace_invitations')
      .update({ status: 'revoked' })
      .eq('id', invId)
      .eq('workspace_id', workspaceId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `admin.removed_member`,
    entityType: 'workspace_member',
    entityId: memberId,
    category: 'Planning',
  });
}

