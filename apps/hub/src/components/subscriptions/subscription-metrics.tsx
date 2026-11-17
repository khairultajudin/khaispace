"use client";

import React from "react";
import {
  Bot,
  CreditCard,
  CalendarDays,
  Repeat,
  Info,
  Clock,
} from "lucide-react";
import { AISubscriptionItem } from "../../types/dashboard";
import {
  calculateActiveCount,
  calculateTotalMonthlyCommitment,
  calculateEstimatedAnnualCommitment,
  getUpcomingRenewals,
  formatMYR,
} from "../../utils/subscription-utils";
import { getLocalTodayIso } from "../../utils/date-utils";

interface SubscriptionMetricsProps {
  subscriptions: AISubscriptionItem[];
}

export function SubscriptionMetrics({ subscriptions }: SubscriptionMetricsProps) {
  const todayIso = getLocalTodayIso();
  const activeCount = calculateActiveCount(subscriptions);
  const monthlyCommitment = calculateTotalMonthlyCommitment(subscriptions);
  const annualCommitment = calculateEstimatedAnnualCommitment(subscriptions);
  const upcomingRenewals = getUpcomingRenewals(subscriptions, todayIso, 30);
  const urgentRenewals = upcomingRenewals.filter((r) => r.isUrgent);

  return (
    <div className="space-y-4">
      {/* 4-Card Summary Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Subscriptions */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Active AI Subscriptions</span>
              <Bot className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {activeCount}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            {subscriptions.length} total tracked across workspaces
          </span>
        </div>

        {/* 2. Monthly Equivalent Cost */}
        <div className="p-5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/40 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#347A63]">
              <span className="font-medium">Monthly Equivalent Cost</span>
              <CreditCard className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#347A63] font-mono">
              {formatMYR(monthlyCommitment)}
            </div>
          </div>
          <span className="text-[11px] text-[#347A63]/80 pt-2 border-t border-[#A8CFC2]/60 mt-2 block font-medium">
            Active recurring commitment (MYR/mo)
          </span>
        </div>

        {/* 3. Estimated Annual Commitment */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Estimated Annual Commitment</span>
              <Repeat className="w-4 h-4 text-[#0C2340]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {formatMYR(annualCommitment)}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Annual projection for active plans
          </span>
        </div>

        {/* 4. Upcoming Renewals (Next 30 Days) */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Upcoming Renewals (30d)</span>
              <CalendarDays className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
                {upcomingRenewals.length}
              </span>
              {urgentRenewals.length > 0 && (
                <span className="text-[11px] font-mono font-medium text-[#8C3B2B] bg-[#FBEAE8] px-1.5 py-0.5 rounded border border-[#E8C2BA]">
                  {urgentRenewals.length} this week
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#347A63]" />
            Next 30 calendar days
          </span>
        </div>
      </div>

      {/* Illustrative Disclaimer & Calculation Disclosure */}
      <div className="px-4 py-3 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-2.5 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Illustrative Modeling Disclaimer:</strong>{" "}
          All AI subscription items and billing amounts are simulated sample data for command center architectural modeling.
          Monthly equivalent costs normalize annual billing (<code className="font-mono bg-[#FAF8F4] px-1 py-0.5 rounded border border-[#DCD7CC] text-[#0C2340]">Annual / 12</code>) to enable direct comparison with monthly plans.
          Cancelled subscriptions are strictly excluded from recurring commitments.
        </div>
      </div>
    </div>
  );
}
