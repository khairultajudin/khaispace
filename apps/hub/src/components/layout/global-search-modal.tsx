"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckSquare,
  FileText,
  FolderKanban,
  Loader2,
  Milestone,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { fetchProjects } from "@/lib/supabase/projects-service";
import { fetchTasks, fetchMilestones } from "@/lib/supabase/tasks-service";
import { fetchTransactions } from "@/lib/supabase/finance-service";
import { fetchSubscriptions } from "@/lib/supabase/subscriptions-service";
import { fetchNotesAndDecisions } from "@/lib/supabase/notes-service";
import { formatMYR } from "@/utils/finance-utils";

interface SearchResultItem {
  id: string;
  kind: "Project" | "Task" | "Milestone" | "Transaction" | "Subscription" | "Note" | "Decision";
  title: string;
  subtitle: string;
  hash: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !activeWorkspace) return;
    let cancelled = false;

    Promise.all([
      fetchProjects(activeWorkspace.id),
      fetchTasks(activeWorkspace.id),
      fetchTransactions(activeWorkspace.id),
      fetchSubscriptions(activeWorkspace.id),
      fetchNotesAndDecisions(activeWorkspace.id),
    ])
      .then(async ([projects, tasks, txs, subs, notes]) => {
        if (cancelled) return;
        const milestones = await fetchMilestones(activeWorkspace.id, tasks);
        if (cancelled) return;

        const next: SearchResultItem[] = [
          ...projects.map((p) => ({
            id: `proj-${p.id}`,
            kind: "Project" as const,
            title: p.title,
            subtitle: `${p.category} • ${p.status}${p.metadata?.archived ? " (Archived)" : ""}`,
            hash: `project-${p.id}`,
          })),
          ...tasks.map((t) => ({
            id: `task-${t.id}`,
            kind: "Task" as const,
            title: t.title,
            subtitle: `${t.projectTitle} • ${t.status} • Due ${t.dueDate}`,
            hash: `task-${t.id}`,
          })),
          ...milestones.map((m) => ({
            id: `ms-${m.id}`,
            kind: "Milestone" as const,
            title: m.title,
            subtitle: `${m.projectTitle} • ${m.status} • Target ${m.targetDate}`,
            hash: "milestones",
          })),
          ...txs.map((tx) => ({
            id: `tx-${tx.id}`,
            kind: "Transaction" as const,
            title: tx.description,
            subtitle: `${tx.type} • ${formatMYR(tx.amount)} • ${tx.date}`,
            hash: `tx-${tx.id}`,
          })),
          ...subs.map((s) => ({
            id: `sub-${s.id}`,
            kind: "Subscription" as const,
            title: `${s.productName} (${s.planName})`,
            subtitle: `${s.provider} • ${s.status} • ${formatMYR(s.amount)}/${s.billingCycle}`,
            hash: `subscription-${s.id}`,
          })),
          ...notes.map((n) => ({
            id: `note-${n.id}`,
            kind: (n.type === "Decision" ? "Decision" : "Note") as "Decision" | "Note",
            title: n.title,
            subtitle: `${n.category} • ${n.updatedAt}`,
            hash: n.type === "Decision" ? `decision-${n.id}` : `note-${n.id}`,
          })),
        ];
        setItems(next);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeWorkspace]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [items, query]);

  if (!isOpen) return null;

  const getIcon = (kind: SearchResultItem["kind"]) => {
    switch (kind) {
      case "Project":
        return <FolderKanban className="w-3.5 h-3.5 text-[#347A63]" />;
      case "Task":
        return <CheckSquare className="w-3.5 h-3.5 text-[#347A63]" />;
      case "Milestone":
        return <Milestone className="w-3.5 h-3.5 text-[#347A63]" />;
      case "Transaction":
        return <TrendingUp className="w-3.5 h-3.5 text-[#347A63]" />;
      case "Subscription":
        return <Bot className="w-3.5 h-3.5 text-[#347A63]" />;
      case "Note":
      case "Decision":
        return <FileText className="w-3.5 h-3.5 text-[#347A63]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Global Workspace Search"
    >
      <div className="w-full max-w-xl rounded-xl border border-[#DCD7CC] bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E9E5DC]">
          <Search className="w-4 h-4 text-[#536B85] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, milestones, transactions, subscriptions, notes..."
            className="flex-1 text-sm text-[#0C2340] placeholder:text-[#536B85] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close global search"
            className="p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#E9E5DC]">
          {isLoading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-xs text-[#536B85]">
              <Loader2 className="w-4 h-4 animate-spin text-[#347A63]" />
              <span>Searching workspace records...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#536B85]">
              No matching records found in {activeWorkspace?.name ?? "workspace"}.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  window.location.hash = item.hash;
                  onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-[#FAF8F4] transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center justify-center shrink-0">
                    {getIcon(item.kind)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#0C2340] truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#536B85] truncate">{item.subtitle}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] shrink-0">
                  {item.kind}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
