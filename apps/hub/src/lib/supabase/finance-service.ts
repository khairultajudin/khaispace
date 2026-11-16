import { getSupabaseBrowserClient } from './client';
import { logWorkspaceActivity } from './workspace-service';
import type {
  MonthlyFinancialSummary,
  ProjectFinanceSummary,
  TransactionItem,
  TransactionType,
} from '@/types/dashboard';

export interface OverallFinanceKpis {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  totalInvestment: number;
  realizedInvestmentReturn: number;
  roiPercent: number | null;
  roiNote: string;
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

export async function fetchTransactions(workspaceId: string): Promise<TransactionItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('financial_transactions')
    .select(
      `
      id,
      description,
      transaction_date,
      type,
      category,
      amount,
      project_id,
      notes,
      is_investment_return,
      projects ( title )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const proj = row.projects as unknown as { title: string } | null;
    return {
      id: row.id,
      description: row.description,
      date: formatDisplayDate(row.transaction_date),
      dateIso: row.transaction_date,
      type: row.type as TransactionType,
      category: row.category,
      amount: Number(row.amount),
      projectId: row.project_id ?? undefined,
      projectTitle: proj?.title ?? undefined,
      notes: row.notes ?? undefined,
      isInvestmentReturn: row.is_investment_return,
    };
  });
}

export async function fetchOverallFinanceKpis(workspaceId: string): Promise<OverallFinanceKpis> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('view_overall_finance_kpis')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netCashflow: 0,
      totalInvestment: 0,
      realizedInvestmentReturn: 0,
      roiPercent: null,
      roiNote: 'N/A — No capital investment outlay recorded',
    };
  }

  return {
    totalIncome: Number(data.total_income ?? 0),
    totalExpenses: Number(data.total_expenses ?? 0),
    netCashflow: Number(data.net_cashflow ?? 0),
    totalInvestment: Number(data.total_investment ?? 0),
    realizedInvestmentReturn: Number(data.realized_investment_return ?? 0),
    roiPercent: data.roi_percent !== null && data.roi_percent !== undefined ? Number(data.roi_percent) : null,
    roiNote: data.roi_note ?? 'N/A',
  };
}

export async function fetchProjectFinanceSummary(workspaceId: string): Promise<ProjectFinanceSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('view_project_finance_summary')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.project_id)
    .map((row) => ({
      projectId: row.project_id as string,
      projectTitle: row.project_title ?? 'Project',
      category: row.category ?? 'General',
      income: Number(row.income ?? 0),
      expenses: Number(row.expenses ?? 0),
      investment: Number(row.investment ?? 0),
      netCashflow: Number(row.net_cashflow ?? 0),
      roiPercent: row.roi_percent !== null && row.roi_percent !== undefined ? Number(row.roi_percent) : null,
      roiNote: row.roi_note ?? 'N/A',
    }));
}

export async function fetchMonthlyFinancialTrends(workspaceId: string): Promise<MonthlyFinancialSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('view_monthly_financial_trends')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('month_key', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    month: row.month_key ?? '',
    monthLabel: row.month_label ?? '',
    income: Number(row.income ?? 0),
    expenses: Number(row.expenses ?? 0),
    investment: Number(row.investment ?? 0),
    netCashflow: Number(row.net_cashflow ?? 0),
  }));
}

export async function createTransaction(
  workspaceId: string,
  userId: string,
  input: Omit<TransactionItem, 'id' | 'date'>
): Promise<void> {
  if (input.amount <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }
  const isReturn = input.type === 'Income' ? Boolean(input.isInvestmentReturn) : false;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      workspace_id: workspaceId,
      project_id: input.projectId || null,
      transaction_date: input.dateIso,
      type: input.type,
      category: input.category.trim(),
      amount: input.amount,
      description: input.description.trim(),
      notes: input.notes?.trim() || null,
      is_investment_return: isReturn,
      created_by: userId,
    })
    .select('id, description')
    .single();

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Recorded ${input.type.toLowerCase()} "${data.description}"`,
    entityType: 'financial_transaction',
    entityId: data.id,
    category: 'Planning',
  });
}

export async function updateTransaction(
  workspaceId: string,
  txId: string,
  input: Omit<TransactionItem, 'id' | 'date'>
): Promise<void> {
  if (input.amount <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }
  const isReturn = input.type === 'Income' ? Boolean(input.isInvestmentReturn) : false;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('financial_transactions')
    .update({
      project_id: input.projectId || null,
      transaction_date: input.dateIso,
      type: input.type,
      category: input.category.trim(),
      amount: input.amount,
      description: input.description.trim(),
      notes: input.notes?.trim() || null,
      is_investment_return: isReturn,
    })
    .eq('id', txId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Updated transaction "${input.description.trim()}"`,
    entityType: 'financial_transaction',
    entityId: txId,
    category: 'Planning',
  });
}

export async function deleteTransaction(
  workspaceId: string,
  txId: string,
  description: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', txId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId,
    action: `Deleted transaction "${description}"`,
    entityType: 'financial_transaction',
    entityId: txId,
    category: 'Planning',
  });
}

