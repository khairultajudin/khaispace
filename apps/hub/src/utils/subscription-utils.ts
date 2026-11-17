import {
  AISubscriptionItem,
  SubscriptionCostGroup,
} from "../types/dashboard";
import { formatMYR } from "./finance-utils";

export { formatMYR };

/**
 * Calculates monthly equivalent cost for an individual subscription.
 * - Monthly billing: returns the monthly price directly.
 * - Annual billing: calculates monthly equivalent as annual price / 12.
 */
export function getMonthlyEquivalent(sub: AISubscriptionItem): number {
  if (sub.billingCycle === "Annual") {
    return sub.amount / 12;
  }
  return sub.amount;
}

/**
 * Calculates annual equivalent cost for an individual subscription.
 * - Annual billing: returns the annual price directly.
 * - Monthly billing: calculates annual equivalent as monthly price * 12.
 */
export function getAnnualEquivalent(sub: AISubscriptionItem): number {
  if (sub.billingCycle === "Annual") {
    return sub.amount;
  }
  return sub.amount * 12;
}

/**
 * Counts active subscriptions.
 */
export function calculateActiveCount(subs: AISubscriptionItem[]): number {
  return subs.filter((s) => s.status === "Active").length;
}

/**
 * Calculates total monthly equivalent commitment across all active subscriptions.
 * Cancelled and paused subscriptions do not count as active recurring commitments.
 */
export function calculateTotalMonthlyCommitment(subs: AISubscriptionItem[]): number {
  return subs
    .filter((s) => s.status === "Active")
    .reduce((sum, s) => sum + getMonthlyEquivalent(s), 0);
}

/**
 * Calculates estimated annual commitment across all active subscriptions.
 * Excludes cancelled and paused subscriptions.
 */
export function calculateEstimatedAnnualCommitment(subs: AISubscriptionItem[]): number {
  return subs
    .filter((s) => s.status === "Active")
    .reduce((sum, s) => sum + getAnnualEquivalent(s), 0);
}

/**
 * Computes calendar days between todayIso and targetDateIso.
 * Positive value means target date is in the future.
 */
export function getDaysUntil(targetDateIso: string, todayIso: string): number {
  const target = new Date(targetDateIso + "T00:00:00");
  const today = new Date(todayIso + "T00:00:00");
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface UpcomingRenewalItem {
  subscription: AISubscriptionItem;
  daysUntil: number;
  isUrgent: boolean; // within 7 days
}

/**
 * Identifies renewals scheduled within the next N calendar days.
 * Excludes cancelled subscriptions. Paused and trial items are preserved with status context.
 */
export function getUpcomingRenewals(
  subs: AISubscriptionItem[],
  todayIso: string,
  daysAhead: number = 30
): UpcomingRenewalItem[] {
  const items: UpcomingRenewalItem[] = [];

  for (const s of subs) {
    if (s.status === "Cancelled" || !s.nextBillingDateIso) continue;
    const daysUntil = getDaysUntil(s.nextBillingDateIso, todayIso);
    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      items.push({
        subscription: s,
        daysUntil,
        isUrgent: daysUntil <= 7,
      });
    }
  }

  // Sort earliest renewal first
  return items.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Aggregates active subscription monthly equivalent by provider.
 */
export function calculateCostByProvider(subs: AISubscriptionItem[]): SubscriptionCostGroup[] {
  const activeSubs = subs.filter((s) => s.status === "Active");
  const total = calculateTotalMonthlyCommitment(subs);
  const map = new Map<string, { monthly: number; annual: number; count: number }>();

  for (const s of activeSubs) {
    const prov = s.provider.trim();
    if (!map.has(prov)) {
      map.set(prov, { monthly: 0, annual: 0, count: 0 });
    }
    const bucket = map.get(prov)!;
    bucket.monthly += getMonthlyEquivalent(s);
    bucket.annual += getAnnualEquivalent(s);
    bucket.count += 1;
  }

  const groups: SubscriptionCostGroup[] = [];
  for (const [provider, data] of map.entries()) {
    groups.push({
      name: provider,
      monthlyEquivalent: data.monthly,
      annualEquivalent: data.annual,
      activeCount: data.count,
      percentage: total > 0 ? (data.monthly / total) * 100 : 0,
    });
  }

  return groups.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}

/**
 * Aggregates active subscription monthly equivalent by category.
 */
export function calculateCostByCategory(subs: AISubscriptionItem[]): SubscriptionCostGroup[] {
  const activeSubs = subs.filter((s) => s.status === "Active");
  const total = calculateTotalMonthlyCommitment(subs);
  const map = new Map<string, { monthly: number; annual: number; count: number }>();

  for (const s of activeSubs) {
    const cat = s.category.trim();
    if (!map.has(cat)) {
      map.set(cat, { monthly: 0, annual: 0, count: 0 });
    }
    const bucket = map.get(cat)!;
    bucket.monthly += getMonthlyEquivalent(s);
    bucket.annual += getAnnualEquivalent(s);
    bucket.count += 1;
  }

  const groups: SubscriptionCostGroup[] = [];
  for (const [category, data] of map.entries()) {
    groups.push({
      name: category,
      monthlyEquivalent: data.monthly,
      annualEquivalent: data.annual,
      activeCount: data.count,
      percentage: total > 0 ? (data.monthly / total) * 100 : 0,
    });
  }

  return groups.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}

/**
 * Aggregates active subscription monthly equivalent by project attribution.
 * Unassigned subscriptions appear under "General Operations (Shared)".
 */
export function calculateCostByProject(subs: AISubscriptionItem[]): SubscriptionCostGroup[] {
  const activeSubs = subs.filter((s) => s.status === "Active");
  const total = calculateTotalMonthlyCommitment(subs);
  const map = new Map<string, { monthly: number; annual: number; count: number }>();

  for (const s of activeSubs) {
    const projectTitle = s.assignedProjectTitle?.trim() || "General Operations (Shared)";
    if (!map.has(projectTitle)) {
      map.set(projectTitle, { monthly: 0, annual: 0, count: 0 });
    }
    const bucket = map.get(projectTitle)!;
    bucket.monthly += getMonthlyEquivalent(s);
    bucket.annual += getAnnualEquivalent(s);
    bucket.count += 1;
  }

  const groups: SubscriptionCostGroup[] = [];
  for (const [projectTitle, data] of map.entries()) {
    groups.push({
      name: projectTitle,
      monthlyEquivalent: data.monthly,
      annualEquivalent: data.annual,
      activeCount: data.count,
      percentage: total > 0 ? (data.monthly / total) * 100 : 0,
    });
  }

  return groups.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}

/**
 * Analyzes active versus paused and non-active subscription costs.
 */
export function calculateStatusBreakdown(subs: AISubscriptionItem[]): {
  activeMonthly: number;
  activeAnnual: number;
  pausedMonthly: number;
  pausedAnnual: number;
  trialCount: number;
  cancelledCount: number;
} {
  let activeMonthly = 0;
  let activeAnnual = 0;
  let pausedMonthly = 0;
  let pausedAnnual = 0;
  let trialCount = 0;
  let cancelledCount = 0;

  for (const s of subs) {
    if (s.status === "Active") {
      activeMonthly += getMonthlyEquivalent(s);
      activeAnnual += getAnnualEquivalent(s);
    } else if (s.status === "Paused") {
      pausedMonthly += getMonthlyEquivalent(s);
      pausedAnnual += getAnnualEquivalent(s);
    } else if (s.status === "Trial") {
      trialCount += 1;
    } else if (s.status === "Cancelled") {
      cancelledCount += 1;
    }
  }

  return {
    activeMonthly,
    activeAnnual,
    pausedMonthly,
    pausedAnnual,
    trialCount,
    cancelledCount,
  };
}
