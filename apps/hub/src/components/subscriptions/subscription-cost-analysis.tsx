"use client";

import React from "react";
import {
  PieChart,
  BarChart3,
  Building2,
  Layers,
  PauseCircle,
  PlayCircle,
  Repeat,
  Info,
} from "lucide-react";
import { AISubscriptionItem } from "../../types/dashboard";
import {
  calculateCostByProvider,
  calculateCostByCategory,
  calculateCostByProject,
  calculateStatusBreakdown,
  calculateTotalMonthlyCommitment,
  calculateEstimatedAnnualCommitment,
  formatMYR,
} from "../../utils/subscription-utils";

interface SubscriptionCostAnalysisProps {
  subscriptions: AISubscriptionItem[];
}

export function SubscriptionCostAnalysis({
  subscriptions,
}: SubscriptionCostAnalysisProps) {
  const providerCosts = calculateCostByProvider(subscriptions);
  const categoryCosts = calculateCostByCategory(subscriptions);
  const projectCosts = calculateCostByProject(subscriptions);
  const statusBreakdown = calculateStatusBreakdown(subscriptions);
  const totalMonthly = calculateTotalMonthlyCommitment(subscriptions);
  const totalAnnual = calculateEstimatedAnnualCommitment(subscriptions);

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <PieChart className="w-4 h-4" />
              <span>Cost Analytics &amp; Resource Allocation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
              AI Expenditure &amp; Attribution Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Consolidated spend distributions across AI vendors, capability domains, and project workspaces. Normalizes billing cadences into uniform monthly equivalents for clear comparative evaluation.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Total Active: <strong>{formatMYR(totalMonthly)}/mo</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Active vs Paused & Annual Commitment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Outflow */}
        <div className="p-5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#347A63]">
            <span className="font-semibold uppercase tracking-wider">Active Monthly Run-rate</span>
            <PlayCircle className="w-4 h-4 text-[#347A63]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#347A63]">
            {formatMYR(statusBreakdown.activeMonthly)}
          </div>
          <p className="text-[11px] text-[#347A63]/80">
            Active recurring commitment across {subscriptions.filter((s) => s.status === "Active").length} active seats.
          </p>
        </div>

        {/* Paused / Inactive Spend Potential */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#536B85]">
            <span className="font-semibold uppercase tracking-wider">Paused / Latent Spend</span>
            <PauseCircle className="w-4 h-4 text-[#8C6D2B]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#8C6D2B]">
            {formatMYR(statusBreakdown.pausedMonthly)}
          </div>
          <p className="text-[11px] text-[#536B85]">
            Monthly cost saved while {subscriptions.filter((s) => s.status === "Paused").length} subscriptions remain paused.
          </p>
        </div>

        {/* Projected Annual Commitment */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#536B85]">
            <span className="font-semibold uppercase tracking-wider">Projected Annual Commitment</span>
            <Repeat className="w-4 h-4 text-[#0C2340]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0C2340]">
            {formatMYR(totalAnnual)}
          </div>
          <p className="text-[11px] text-[#536B85]">
            Annualized total based on currently active plan rates.
          </p>
        </div>
      </div>

      {/* Two Column Cost Breakdown: Providers & Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Provider */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9E5DC] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#347A63]" />
              <h3 className="font-bold text-sm text-[#0C2340]">Spend by Vendor / Provider</h3>
            </div>
            <span className="text-xs text-[#536B85] font-mono">
              {providerCosts.length} Providers
            </span>
          </div>

          <div className="space-y-4">
            {providerCosts.map((group) => (
              <div key={group.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#0C2340] flex items-center gap-1.5">
                    <span>{group.name}</span>
                    <span className="text-[10px] text-[#536B85] font-mono font-normal">
                      ({group.activeCount} seat{group.activeCount > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#0C2340] flex items-center gap-2">
                    <span>{formatMYR(group.monthlyEquivalent)}/mo</span>
                    <span className="text-[10px] text-[#536B85] font-normal w-12 text-right">
                      {group.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Pure SVG/HTML Bar */}
                <div className="h-2 w-full bg-[#FAF8F4] rounded-full overflow-hidden border border-[#DCD7CC]">
                  <div
                    className="h-full bg-[#347A63] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(group.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost by Category */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9E5DC] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#347A63]" />
              <h3 className="font-bold text-sm text-[#0C2340]">Spend by AI Capability Domain</h3>
            </div>
            <span className="text-xs text-[#536B85] font-mono">
              {categoryCosts.length} Domains
            </span>
          </div>

          <div className="space-y-4">
            {categoryCosts.map((group) => (
              <div key={group.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#0C2340] flex items-center gap-1.5">
                    <span>{group.name}</span>
                    <span className="text-[10px] text-[#536B85] font-mono font-normal">
                      ({group.activeCount} tool{group.activeCount > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#0C2340] flex items-center gap-2">
                    <span>{formatMYR(group.monthlyEquivalent)}/mo</span>
                    <span className="text-[10px] text-[#536B85] font-normal w-12 text-right">
                      {group.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Pure SVG/HTML Bar */}
                <div className="h-2 w-full bg-[#FAF8F4] rounded-full overflow-hidden border border-[#DCD7CC]">
                  <div
                    className="h-full bg-[#0C2340] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(group.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace & Project Attribution Section */}
      <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E9E5DC] pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#347A63]" />
            <h3 className="font-bold text-sm text-[#0C2340]">
              Workspace &amp; Project Cost Attribution
            </h3>
          </div>
          <span className="text-xs text-[#536B85] font-mono">
            Directly Attributed vs Shared
          </span>
        </div>

        <p className="text-xs text-[#536B85] leading-relaxed">
          Shows how AI subscriptions are distributed across active projects. Unassigned tooling (e.g. general code assistants) appears under <strong>General Operations (Shared)</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {projectCosts.map((group) => (
            <div
              key={group.name}
              className="p-4 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-[#0C2340] line-clamp-1">
                  {group.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DCD7CC] text-[#536B85] shrink-0">
                  {group.activeCount} tool{group.activeCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="text-lg font-bold font-mono text-[#0C2340]">
                {formatMYR(group.monthlyEquivalent)}
                <span className="text-xs font-normal text-[#536B85]">/mo</span>
              </div>

              <div className="text-[11px] font-mono text-[#536B85] flex items-center justify-between pt-1 border-t border-[#E9E5DC]">
                <span>Annualized:</span>
                <span>{formatMYR(group.annualEquivalent)}/yr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Double Counting & Financial Ledger Safety Disclosure */}
      <div className="px-4 py-3 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-2.5 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Ledger Independence Notice:</strong>{" "}
          Subscription commitments tracked in this module reflect active plan agreements and are maintained independently from the historical cash ledger in the <em>Finance &amp; ROI</em> module. To prevent double counting, these costs are not automatically mirrored as bank cash outflows.
        </div>
      </div>
    </div>
  );
}
