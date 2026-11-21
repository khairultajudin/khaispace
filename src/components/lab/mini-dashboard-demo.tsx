"use client";

import {
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Plus,
  RotateCcw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type LedgerStatus = "Paid" | "Pending" | "Overdue";

type SampleRecord = {
  id: string;
  label: string;
  track: string;
  units: number;
  status: LedgerStatus;
};

const INITIAL_RECORDS: readonly SampleRecord[] = [
  {
    id: "SMP-101",
    label: "Sample Cohort A — Web Portal",
    track: "Operations Track",
    units: 12,
    status: "Paid",
  },
  {
    id: "SMP-102",
    label: "Sample Cohort B — Automation",
    track: "Workflow Track",
    units: 8,
    status: "Pending",
  },
  {
    id: "SMP-103",
    label: "Sample Cohort C — Telemetry",
    track: "IoT Track",
    units: 15,
    status: "Overdue",
  },
  {
    id: "SMP-104",
    label: "Sample Cohort D — Starter Site",
    track: "Studio Web",
    units: 6,
    status: "Paid",
  },
  {
    id: "SMP-105",
    label: "Sample Cohort E — Reader Hub",
    track: "Publishing Track",
    units: 10,
    status: "Pending",
  },
];

const NEXT_STATUS: Record<LedgerStatus, LedgerStatus> = {
  Paid: "Pending",
  Pending: "Overdue",
  Overdue: "Paid",
};

const STATUS_BADGE: Record<LedgerStatus, string> = {
  Paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Overdue: "bg-red-50 text-red-800 border-red-200",
};

export function MiniDashboardDemo() {
  const [records, setRecords] = useState<SampleRecord[]>([...INITIAL_RECORDS]);
  const [filter, setFilter] = useState<"All" | LedgerStatus>("All");
  const [query, setQuery] = useState("");
  const [nextSeq, setNextSeq] = useState(106);

  const stats = useMemo(() => {
    const paid = records.filter((r) => r.status === "Paid").length;
    const pending = records.filter((r) => r.status === "Pending").length;
    const overdue = records.filter((r) => r.status === "Overdue").length;
    const total = records.length || 1;
    return {
      paid,
      pending,
      overdue,
      completionPct: Math.round((paid / total) * 100),
    };
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((item) => {
      if (filter !== "All" && item.status !== filter) return false;
      if (!q) return true;
      return `${item.id} ${item.label} ${item.track}`.toLowerCase().includes(q);
    });
  }, [records, filter, query]);

  function cycleStatus(id: string) {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: NEXT_STATUS[item.status] } : item,
      ),
    );
  }

  function addSampleEntry() {
    const id = `SMP-${nextSeq}`;
    setNextSeq((n) => n + 1);
    setRecords((prev) => [
      {
        id,
        label: `Sample Record #${nextSeq - 100} — Demo Entry`,
        track: "Synthetic Batch",
        units: 5 + ((nextSeq * 3) % 14),
        status: "Pending",
      },
      ...prev,
    ]);
  }

  function resetDemo() {
    setRecords([...INITIAL_RECORDS]);
    setFilter("All");
    setQuery("");
    setNextSeq(106);
  }

  return (
    <article
      id="dashboard-demo"
      className="studio-card scroll-mt-24 overflow-hidden rounded-3xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface-muted/60 p-6 sm:p-7">
        <div className="flex items-start gap-3.5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-electric">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-electric">
                Demo 01 · Web Applications
              </span>
              <span className="rounded-full border border-cyan/30 bg-cyan-soft px-2.5 py-0.5 text-[11px] font-semibold text-[#0E7490]">
                Synthetic Data Only
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
              Mini Operations Dashboard
            </h2>
            <p className="mt-1 text-sm text-muted">
              Click any status pill to cycle states, search records, or add a
              synthetic row — demonstrating instant client-side KPI rollups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addSampleEntry}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-electric px-3.5 text-xs font-semibold text-white transition-colors hover:bg-electric-dark"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span>Add Sample Row</span>
          </button>
          <button
            type="button"
            onClick={resetDemo}
            aria-label="Reset Mini Operations Dashboard demo"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-xs font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        {/* Live Computed KPI Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted">Paid / Settled</p>
            <p className="mt-1 flex items-center gap-1.5 font-heading text-2xl font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              <span>{stats.paid}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted">Pending Review</p>
            <p className="mt-1 flex items-center gap-1.5 font-heading text-2xl font-bold text-amber-700">
              <Clock3 className="h-5 w-5" aria-hidden />
              <span>{stats.pending}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted">Action Needed</p>
            <p className="mt-1 flex items-center gap-1.5 font-heading text-2xl font-bold text-red-700">
              <TriangleAlert className="h-5 w-5" aria-hidden />
              <span>{stats.overdue}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-electric/20 bg-primary-soft/60 p-4">
            <p className="text-xs font-medium text-electric">Settled Ratio</p>
            <p className="mt-1 font-heading text-2xl font-bold text-navy">
              {stats.completionPct}%
            </p>
            <div
              aria-hidden
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white"
            >
              <div
                style={{ width: `${stats.completionPct}%` }}
                className="h-full rounded-full bg-electric transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Paid", "Pending", "Overdue"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  filter === status
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-background text-muted hover:border-electric hover:text-navy",
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <label htmlFor="lab-dashboard-search" className="sr-only">
              Filter synthetic dashboard records
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="lab-dashboard-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter sample records..."
              className="h-9 w-full rounded-xl border border-border-strong bg-background pl-8 pr-3 text-xs text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
            />
          </div>
        </div>

        {/* Interactive Table */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/70 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Synthetic Record</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-right">Status (Click to Toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-background/70"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-muted">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">
                      {item.label}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {item.track}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-navy">
                      {item.units}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => cycleStatus(item.id)}
                        title="Click to cycle status"
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-transform hover:scale-105",
                          STATUS_BADGE[item.status],
                        )}
                      >
                        {item.status}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-muted"
                  >
                    No synthetic records match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}
