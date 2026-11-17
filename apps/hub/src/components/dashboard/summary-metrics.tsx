"use client";

import React, { useEffect, useState } from "react";
import { FolderKanban, Activity, CheckSquare, CreditCard } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { fetchProjects } from "@/lib/supabase/projects-service";
import { fetchTasks } from "@/lib/supabase/tasks-service";
import { fetchOverallFinanceKpis } from "@/lib/supabase/finance-service";
import { fetchSubscriptions } from "@/lib/supabase/subscriptions-service";
import type { SummaryMetric } from "../../types/dashboard";

const ICONS = [FolderKanban, Activity, CheckSquare, CreditCard];

export function SummaryMetrics() {
  const { activeWorkspace } = useWorkspace();
  const [metrics, setMetrics] = useState<SummaryMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;

    Promise.all([
      fetchProjects(activeWorkspace.id),
      fetchTasks(activeWorkspace.id),
      fetchOverallFinanceKpis(activeWorkspace.id),
      fetchSubscriptions(activeWorkspace.id),
    ])
      .then(([projects, tasks, kpis, subs]) => {
        if (cancelled) return;
        const activeProjects = projects.filter(
          (p) => p.status === "Production" || p.status === "Active" || p.status === "In Development"
        ).length;
        const openTasks = tasks.filter((t) => t.status !== "Completed").length;
        const activeSubs = subs.filter((s) => s.status === "Active");
        const monthlyAiCost = activeSubs.reduce((sum, s) => {
          return sum + (s.billingCycle === "Annual" ? s.amount / 12 : s.amount);
        }, 0);

        setMetrics([
          {
            id: "projects",
            label: "Workspace Projects",
            value: String(projects.length),
            sublabel: `${activeProjects} active or in production`,
            badgeText: "Live DB",
            note: "Synced from public.projects via workspace RLS.",
          },
          {
            id: "tasks",
            label: "Open Tasks",
            value: String(openTasks),
            sublabel: `${tasks.length} total tasks tracked`,
            badgeText: openTasks > 0 ? "In Progress" : "Clear",
            note: "Synced from public.tasks across workspace projects.",
          },
          {
            id: "cashflow",
            label: "Net Cashflow (MYR)",
            value: `RM ${kpis.netCashflow.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sublabel: `Income RM ${kpis.totalIncome.toLocaleString("en-MY", { minimumFractionDigits: 0 })} / Exp RM ${kpis.totalExpenses.toLocaleString("en-MY", { minimumFractionDigits: 0 })}`,
            badgeText: "Live View",
            note: kpis.roiNote,
          },
          {
            id: "subscriptions",
            label: "Monthly AI Spend",
            value: `RM ${monthlyAiCost.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sublabel: `${activeSubs.length} active subscription(s)`,
            badgeText: "MYR",
            note: "Normalized monthly equivalent from public.ai_subscriptions.",
          },
        ]);
      })
      .catch(() => {
        if (!cancelled) setMetrics([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#536B85]">
          Executive Summary
        </h2>
        <span className="text-[11px] text-[#536B85] font-mono">
          {isLoading ? "Syncing..." : activeWorkspace?.name ?? "Workspace"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isLoading && metrics.length === 0
          ? Array.from({ length: 4 }, (_, idx) => ({
              id: `skeleton-${idx}`,
              label: "Loading...",
              value: "—",
              sublabel: "Fetching workspace data",
              badgeText: "Live",
              note: "Connecting to Supabase...",
            }))
          : metrics
        ).map((metric, idx) => {
          const Icon = ICONS[idx % ICONS.length];

          return (
            <div
              key={metric.id}
              className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between hover:border-[#347A63] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-md bg-[#FAF8F4] border border-[#DCD7CC] flex items-center justify-center text-[#347A63]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      metric.badgeText === "In Progress" || metric.badgeText === "Live View"
                        ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                        : "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]"
                    }`}
                  >
                    {metric.badgeText}
                  </span>
                </div>

                <div className="text-2xl font-bold tracking-tight text-[#0C2340]">
                  {metric.value}
                </div>
                <div className="text-xs font-medium text-[#0C2340] mt-0.5">
                  {metric.label}
                </div>
                <div className="text-[11px] text-[#536B85] mt-1">
                  {metric.sublabel}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9E5DC] text-[10px] text-[#536B85] leading-normal">
                {metric.note}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
