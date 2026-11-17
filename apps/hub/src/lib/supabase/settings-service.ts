import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type {
  ContentDensity,
  DateFormatOption,
  MemberRole,
  UserProfile,
  WorkspaceSettings,
} from '@/types/dashboard';

export async function fetchUserProfile(
  userId: string,
  role: MemberRole
): Promise<UserProfile> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, bio, location, timezone, avatar_initials')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    // Option B invariant: do not silently fall back to client INSERT into public.profiles
    throw new Error(
      'Profile record not found for your account. Please sign out and sign back in or contact an administrator for trusted profile provisioning.'
    );
  }

  return {
    id: data.id,
    fullName: data.full_name,
    displayName: data.display_name,
    email: data.email,
    role,
    bio: data.bio,
    location: data.location,
    timezone: data.timezone,
    avatarInitials: data.avatar_initials,
  };
}

/**
 * Option B Profile Persistence:
 * - Strictly `UPDATE`-only (never `.upsert()`, never client `INSERT`).
 * - Updates only the 6 permitted columns (`full_name`, `display_name`, `bio`,
 *   `location`, `timezone`, `avatar_initials`); `email` is immutable from client roles.
 */
export async function updateUserProfile(
  userId: string,
  input: {
    fullName: string;
    displayName: string;
    bio: string;
    location: string;
    timezone: string;
    avatarInitials: string;
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim().slice(0, 100),
      display_name: input.displayName.trim().slice(0, 50),
      bio: input.bio.trim(),
      location: input.location.trim().slice(0, 100),
      timezone: input.timezone.trim().slice(0, 50),
      avatar_initials: input.avatarInitials.trim().slice(0, 4).toUpperCase(),
    })
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      'Unable to update profile: no existing profile row found for your account.'
    );
  }
}

export async function fetchWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  const supabase = getSupabaseBrowserClient();
  const [wsRes, setRes] = await Promise.all([
    supabase
      .from('workspaces')
      .select('name, description, timezone, default_currency, date_format, content_density')
      .eq('id', workspaceId)
      .single(),
    supabase
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single(),
  ]);

  if (wsRes.error) throw new Error(wsRes.error.message);
  if (setRes.error) throw new Error(setRes.error.message);

  const ws = wsRes.data;
  const st = setRes.data;

  const dateFormat: DateFormatOption =
    ws.date_format === 'DD/MM/YYYY' || ws.date_format === 'MM/DD/YYYY'
      ? ws.date_format
      : 'YYYY-MM-DD';
  const contentDensity: ContentDensity =
    ws.content_density === 'compact' ? 'compact' : 'comfortable';

  return {
    workspaceName: ws.name,
    workspaceDescription: ws.description,
    timezone: ws.timezone,
    defaultCurrency: ws.default_currency,
    dateFormat,
    contentDensity,
    notifications: {
      taskReminders: st.notification_task_reminders,
      milestoneUpdates: st.notification_milestone_updates,
      projectUpdates: st.notification_project_updates,
      workspaceActivity: st.notification_workspace_activity,
      subscriptionRenewals: st.notification_subscription_renewals,
    },
  };
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  input: WorkspaceSettings
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const [wsRes, setRes] = await Promise.all([
    supabase
      .from('workspaces')
      .update({
        name: input.workspaceName.trim(),
        description: input.workspaceDescription.trim(),
        timezone: input.timezone,
        default_currency: input.defaultCurrency,
        date_format: input.dateFormat,
        content_density: input.contentDensity,
      })
      .eq('id', workspaceId),
    supabase
      .from('workspace_settings')
      .update({
        notification_task_reminders: input.notifications.taskReminders,
        notification_milestone_updates: input.notifications.milestoneUpdates,
        notification_project_updates: input.notifications.projectUpdates,
        notification_workspace_activity: input.notifications.workspaceActivity,
        notification_subscription_renewals: input.notifications.subscriptionRenewals,
      })
      .eq('workspace_id', workspaceId),
  ]);

  if (wsRes.error) throw new Error(wsRes.error.message);
  if (setRes.error) throw new Error(setRes.error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: 'admin.updated_workspace_settings',
    entityType: 'workspace_settings',
    entityId: workspaceId,
    category: 'Planning',
  });
}

