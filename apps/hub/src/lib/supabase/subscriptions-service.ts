import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type {
  AISubscriptionItem,
  SubscriptionBillingCycle,
  SubscriptionStatus,
} from '@/types/dashboard';

function parsePaidByFromNotes(rawNotes: string | null): {
  paidBy: 'Personal' | 'Company';
  cleanNotes?: string;
} {
  if (!rawNotes) return { paidBy: 'Personal', cleanNotes: undefined };
  const match = rawNotes.match(/^\[Paid By:\s*(Personal|Company)\]\s*/i);
  if (match) {
    const payer = match[1].toLowerCase() === 'company' ? 'Company' : 'Personal';
    const rest = rawNotes.slice(match[0].length).trim();
    return { paidBy: payer, cleanNotes: rest || undefined };
  }
  return { paidBy: 'Personal', cleanNotes: rawNotes };
}

function encodeNotesWithPaidBy(
  paidBy: 'Personal' | 'Company' | undefined,
  notes: string | undefined
): string {
  const payer = paidBy === 'Company' ? 'Company' : 'Personal';
  const clean = (notes || '').replace(/^\[Paid By:\s*(Personal|Company)\]\s*/i, '').trim();
  return clean ? `[Paid By: ${payer}] ${clean}` : `[Paid By: ${payer}]`;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function fetchSubscriptions(workspaceId: string): Promise<AISubscriptionItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('ai_subscriptions')
    .select(
      `
      id,
      provider,
      product_name,
      plan_name,
      category,
      billing_cycle,
      amount,
      currency,
      status,
      start_date,
      next_billing_date,
      assigned_project_id,
      purpose,
      notes,
      projects ( title )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('next_billing_date', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const proj = row.projects as unknown as { title: string } | null;
    const { paidBy, cleanNotes } = parsePaidByFromNotes(row.notes ?? null);
    return {
      id: row.id,
      provider: row.provider,
      productName: row.product_name,
      planName: row.plan_name,
      category: row.category,
      billingCycle: row.billing_cycle as SubscriptionBillingCycle,
      amount: Number(row.amount),
      currency: 'MYR',
      status: row.status as SubscriptionStatus,
      startDate: formatDisplayDate(row.start_date),
      startDateIso: row.start_date,
      nextBillingDate: formatDisplayDate(row.next_billing_date),
      nextBillingDateIso: row.next_billing_date,
      assignedProjectId: row.assigned_project_id ?? undefined,
      assignedProjectTitle: proj?.title ?? undefined,
      paidBy,
      purpose: row.purpose,
      notes: cleanNotes,
    };
  });
}

export async function createSubscription(
  workspaceId: string,
  userId: string,
  input: Omit<AISubscriptionItem, 'id' | 'startDate' | 'nextBillingDate'>
): Promise<void> {
  if (input.amount < 0) {
    throw new Error('Subscription amount cannot be negative.');
  }
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('ai_subscriptions')
    .insert({
      workspace_id: workspaceId,
      assigned_project_id: input.assignedProjectId || null,
      provider: input.provider.trim(),
      product_name: input.productName.trim(),
      plan_name: input.planName.trim(),
      category: input.category.trim(),
      billing_cycle: input.billingCycle,
      amount: input.amount,
      currency: 'MYR',
      status: input.status,
      start_date: input.startDateIso,
      next_billing_date: input.nextBillingDateIso,
      purpose: input.purpose.trim(),
      notes: encodeNotesWithPaidBy(input.paidBy, input.notes),
      created_by: userId,
    })
    .select('id, product_name')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Added subscription "${data.product_name}"`,
    entityType: 'ai_subscription',
    entityId: data.id,
    category: 'Planning',
  });
}

export async function updateSubscription(
  workspaceId: string,
  subId: string,
  input: Omit<AISubscriptionItem, 'id' | 'startDate' | 'nextBillingDate'>
): Promise<void> {
  if (input.amount < 0) {
    throw new Error('Subscription amount cannot be negative.');
  }
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('ai_subscriptions')
    .update({
      assigned_project_id: input.assignedProjectId || null,
      provider: input.provider.trim(),
      product_name: input.productName.trim(),
      plan_name: input.planName.trim(),
      category: input.category.trim(),
      billing_cycle: input.billingCycle,
      amount: input.amount,
      currency: 'MYR',
      status: input.status,
      start_date: input.startDateIso,
      next_billing_date: input.nextBillingDateIso,
      purpose: input.purpose.trim(),
      notes: encodeNotesWithPaidBy(input.paidBy, input.notes),
    })
    .eq('id', subId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated subscription "${input.productName.trim()}"`,
    entityType: 'ai_subscription',
    entityId: subId,
    category: 'Planning',
  });
}

export async function deleteSubscription(
  workspaceId: string,
  subId: string,
  productName: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('ai_subscriptions')
    .delete()
    .eq('id', subId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Deleted subscription "${productName}"`,
    entityType: 'ai_subscription',
    entityId: subId,
    category: 'Planning',
  });
}

