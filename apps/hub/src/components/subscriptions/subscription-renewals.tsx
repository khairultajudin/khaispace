"use client";

import React from "react";
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  Building2,
  PauseCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { AISubscriptionItem } from "../../types/dashboard";
import {
  getUpcomingRenewals,
  formatMYR,
  getMonthlyEquivalent,
} from "../../utils/subscription-utils";
import { getLocalTodayIso } from "../../utils/date-utils";

interface SubscriptionRenewalsProps {
  subscriptions: AISubscriptionItem[];
  onSelect: (sub: AISubscriptionItem) => void;
}

export function SubscriptionRenewals({
  subscriptions,
  onSelect,
}: SubscriptionRenewalsProps) {
  const todayIso = getLocalTodayIso();
  const upcomingRenewals = getUpcomingRenewals(subscriptions, todayIso, 30);
  const urgentRenewals = upcomingRenewals.filter((r) => r.isUrgent);

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <CalendarDays className="w-4 h-4" />
              <span>Subscription Lifecycles &amp; Renewal Deadlines</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
              Upcoming Renewals
            </h2>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              30-day proactive billing radar across workspaces. Highlights renewals occurring within the next 7 calendar days to prevent unintended recurring charges or unmonitored trial rollovers.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Renewals in 30d: <strong className="font-semibold">{upcomingRenewals.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Urgent Attention Section */}
      {urgentRenewals.length > 0 && (
        <div className="p-5 rounded-lg border border-[#E8C2BA] bg-[#FBEAE8]/40 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C3B2B]">
            <AlertTriangle className="w-4 h-4 text-[#8C3B2B]" />
            <span>Urgent Attention &bull; Renewing Within 7 Days</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentRenewals.map(({ subscription: sub, daysUntil }) => (
              <div
                key={sub.id}
                onClick={() => onSelect(sub)}
                className="p-4 rounded-md border border-[#E8C2BA] bg-[#FFFFFF] shadow-2xs hover:shadow-xs transition-shadow cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-[#0C2340]">
                      {sub.productName}
                    </h3>
                    <span className="text-[11px] text-[#536B85] block">
                      {sub.provider} &bull; {sub.planName}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FBEAE8] text-[#8C3B2B] border border-[#E8C2BA]">
                    {daysUntil === 0
                      ? "DUE TODAY"
                      : daysUntil === 1
                      ? "TOMORROW"
                      : `IN ${daysUntil} DAYS`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E9E5DC]">
                  <span className="font-mono font-semibold text-[#0C2340]">
                    {formatMYR(sub.amount)}
                    <span className="text-[10px] text-[#536B85] font-normal">
                      /{sub.billingCycle === "Annual" ? "yr" : "mo"}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono text-[#536B85]">
                    {sub.nextBillingDate}
                  </span>
                </div>

                {sub.status === "Trial" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#1D4ED8] bg-[#EFF6FF] px-2 py-1 rounded border border-[#BFDBFE]">
                    <Sparkles className="w-3 h-3" />
                    <span>Trial ending. Confirm renewal or cancel.</span>
                  </div>
                )}
                {sub.status === "Paused" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C6D2B] bg-[#FAF8F4] px-2 py-1 rounded border border-[#D4C39B]">
                    <PauseCircle className="w-3 h-3" />
                    <span>Paused. Will not charge unless unpaused.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-Day Renewal Schedule Table */}
      <div className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E9E5DC] bg-[#FAF8F4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#347A63]" />
            <h3 className="font-bold text-sm text-[#0C2340]">
              Full 30-Day Billing Horizon
            </h3>
          </div>
          <span className="text-xs text-[#536B85] font-mono">
            Evaluated from current date: {todayIso}
          </span>
        </div>

        {upcomingRenewals.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#536B85]">
            <CheckCircle2 className="w-6 h-6 text-[#347A63] mx-auto mb-2 opacity-70" />
            No subscription renewals scheduled within the next 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#DCD7CC] text-[#536B85] uppercase tracking-wider text-[11px] font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subscription &amp; Provider</th>
                  <th className="py-3 px-4 font-semibold">Status Context</th>
                  <th className="py-3 px-4 font-semibold">Next Billing Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Billing Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Monthly Equiv.</th>
                  <th className="py-3 px-4 font-semibold">Time Remaining</th>
                  <th className="py-3 px-4 font-semibold">Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DC]">
                {upcomingRenewals.map(({ subscription: sub, daysUntil, isUrgent }) => (
                  <tr
                    key={sub.id}
                    onClick={() => onSelect(sub)}
                    className="hover:bg-[#FAF8F4]/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-semibold text-sm text-[#0C2340] group-hover:text-[#347A63] transition-colors">
                        {sub.productName}
                      </div>
                      <div className="text-[11px] text-[#536B85]">
                        {sub.provider} &bull; {sub.planName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {sub.status === "Active" ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                          Active Recurring
                        </span>
                      ) : sub.status === "Trial" ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                          Trial Expiring
                        </span>
                      ) : sub.status === "Paused" ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF8F4] text-[#8C6D2B] border border-[#D4C39B]">
                          Paused (No Auto-Charge)
                        </span>
                      ) : (
                        <span className="text-[#536B85]">{sub.status}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#0C2340]">
                      {sub.nextBillingDate}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#0C2340]">
                      {formatMYR(sub.amount)}
                      <span className="text-[10px] text-[#536B85] block">
                        /{sub.billingCycle === "Annual" ? "yr" : "mo"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#347A63]">
                      {formatMYR(getMonthlyEquivalent(sub))}/mo
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          isUrgent
                            ? "bg-[#FBEAE8] text-[#8C3B2B] border border-[#E8C2BA]"
                            : "bg-[#FAF8F4] text-[#0C2340] border border-[#DCD7CC]"
                        }`}
                      >
                        {daysUntil === 0
                          ? "Due today"
                          : daysUntil === 1
                          ? "Tomorrow"
                          : `${daysUntil} days`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {sub.assignedProjectTitle ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#0C2340] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#DCD7CC]">
                          <Building2 className="w-3 h-3 text-[#347A63]" />
                          {sub.assignedProjectTitle}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#536B85] italic">
                          General Operations
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
