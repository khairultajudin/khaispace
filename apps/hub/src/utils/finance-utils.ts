import {
  TransactionItem,
  HubProject,
  ProjectFinanceSummary,
  MonthlyFinancialSummary,
} from "../types/dashboard";

/**
 * Format numeric value in Malaysian Ringgit (MYR) with standard local conventions.
 * Example: 1250 -> "RM 1,250.00"
 */
export function formatMYR(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-RM ${formatted}` : `RM ${formatted}`;
}

/**
 * Format numeric value with an explicit positive/negative sign.
 * Example: 1250 -> "+RM 1,250.00", -500 -> "-RM 500.00"
 */
export function formatSignedMYR(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount > 0) return `+RM ${formatted}`;
  if (amount < 0) return `-RM ${formatted}`;
  return `RM ${formatted}`;
}

/**
 * Format percentage with explicit sign.
 * Example: 30.5 -> "+30.5%", -12.4 -> "-12.4%"
 */
export function formatPercent(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Calculate total operating income across all transactions.
 */
export function calculateTotalIncome(transactions: TransactionItem[]): number {
  return transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total operating expenses (excluding capital investment).
 */
export function calculateTotalExpenses(transactions: TransactionItem[]): number {
  return transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total capital investments (capital outlay for hardware, fabrication, etc.).
 */
export function calculateTotalInvestment(transactions: TransactionItem[]): number {
  return transactions
    .filter((t) => t.type === "Investment")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Operating cashflow: Total Income minus Operating Expenses.
 * Explicitly separates operating cashflow from capital investments.
 */
export function calculateNetOperatingCashflow(income: number, expenses: number): number {
  return income - expenses;
}

/**
 * Transparent ROI Calculation:
 * ROI (%) = ((Realized Return - Investment Cost) / Investment Cost) * 100
 * Only calculated when meaningful capital outlay and tracked returns exist.
 */
export function calculateOverallROI(transactions: TransactionItem[]): {
  roiPercent: number | null;
  totalInvestment: number;
  realizedReturn: number;
  basisNote: string;
} {
  const totalInvestment = calculateTotalInvestment(transactions);
  const realizedReturn = transactions
    .filter((t) => t.type === "Income" && t.isInvestmentReturn === true)
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalInvestment <= 0) {
    return {
      roiPercent: null,
      totalInvestment: 0,
      realizedReturn,
      basisNote: "N/A — No capital investment outlay recorded",
    };
  }

  if (realizedReturn <= 0) {
    return {
      roiPercent: -100,
      totalInvestment,
      realizedReturn: 0,
      basisNote: "Capital deployed; initial return realizations pending",
    };
  }

  const roiPercent = ((realizedReturn - totalInvestment) / totalInvestment) * 100;
  return {
    roiPercent,
    totalInvestment,
    realizedReturn,
    basisNote: `Computed as ((Return ${formatMYR(realizedReturn)} - Outlay ${formatMYR(totalInvestment)}) / Outlay) × 100 on capital assets`,
  };
}

/**
 * Aggregate financial breakdown per project based on active transaction state.
 */
export function calculateProjectFinance(
  transactions: TransactionItem[],
  catalogedProjects: HubProject[]
): ProjectFinanceSummary[] {
  // Map of project id to transactions
  const projectMap = new Map<string, TransactionItem[]>();
  for (const t of transactions) {
    const pid = t.projectId || "unassigned";
    if (!projectMap.has(pid)) {
      projectMap.set(pid, []);
    }
    projectMap.get(pid)!.push(t);
  }

  const summaries: ProjectFinanceSummary[] = [];

  for (const project of catalogedProjects) {
    const txs = projectMap.get(project.id) || [];
    const income = txs
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = txs
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const investment = txs
      .filter((t) => t.type === "Investment")
      .reduce((sum, t) => sum + t.amount, 0);
    const netCashflow = income - expenses;

    // Tracked investment return for this project
    const trackedReturn = txs
      .filter((t) => t.type === "Income" && t.isInvestmentReturn === true)
      .reduce((sum, t) => sum + t.amount, 0);

    let roiPercent: number | null = null;
    let roiNote = "N/A — Insufficient Data";

    if (investment > 0) {
      if (trackedReturn > 0) {
        roiPercent = ((trackedReturn - investment) / investment) * 100;
        roiNote = `Return ${formatMYR(trackedReturn)} on ${formatMYR(investment)} outlay`;
      } else if (income > 0) {
        // Early harvest or pilot sales
        roiPercent = ((income - investment) / investment) * 100;
        roiNote = `Pilot revenue ${formatMYR(income)} on ${formatMYR(investment)} initial outlay`;
      } else {
        roiPercent = -100;
        roiNote = `Capital deployed (${formatMYR(investment)}); returns pending`;
      }
    } else if (income > 0) {
      roiNote = "N/A — Service / Retainer (No capital outlay)";
    } else if (expenses > 0) {
      roiNote = "N/A — Operational development expense only";
    } else {
      roiNote = "N/A — No financial records";
    }

    summaries.push({
      projectId: project.id,
      projectTitle: project.title,
      category: project.category,
      income,
      expenses,
      investment,
      netCashflow,
      roiPercent,
      roiNote,
    });
  }

  // Include general operations if transactions exist without specific project
  const generalTxs = projectMap.get("unassigned") || [];
  if (generalTxs.length > 0) {
    const income = generalTxs
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = generalTxs
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const investment = generalTxs
      .filter((t) => t.type === "Investment")
      .reduce((sum, t) => sum + t.amount, 0);

    summaries.push({
      projectId: "general-ops",
      projectTitle: "General Operations (Shared)",
      category: "Operations & Subscriptions",
      income,
      expenses,
      investment,
      netCashflow: income - expenses,
      roiPercent: null,
      roiNote: "Shared workspace operating subscriptions",
    });
  }

  return summaries;
}

/**
 * Aggregate monthly financial trends from transaction dates.
 */
export function calculateMonthlyTrends(
  transactions: TransactionItem[]
): MonthlyFinancialSummary[] {
  const monthMap = new Map<string, { income: number; expenses: number; investment: number }>();

  for (const t of transactions) {
    if (!t.dateIso) continue;
    const monthKey = t.dateIso.slice(0, 7); // e.g. "2026-11"
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { income: 0, expenses: 0, investment: 0 });
    }
    const bucket = monthMap.get(monthKey)!;
    if (t.type === "Income") {
      bucket.income += t.amount;
    } else if (t.type === "Expense") {
      bucket.expenses += t.amount;
    } else if (t.type === "Investment") {
      bucket.investment += t.amount;
    }
  }

  const sortedMonths = Array.from(monthMap.keys()).sort();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return sortedMonths.map((m) => {
    const [year, monthNum] = m.split("-");
    const mIndex = parseInt(monthNum, 10) - 1;
    const monthLabel = `${monthNames[mIndex]} ${year}`;
    const data = monthMap.get(m)!;

    return {
      month: m,
      monthLabel,
      income: data.income,
      expenses: data.expenses,
      investment: data.investment,
      netCashflow: data.income - data.expenses,
    };
  });
}
