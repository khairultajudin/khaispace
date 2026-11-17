"use client";

import React from "react";
import { Calendar, FolderKanban, CheckSquare, TrendingUp, FileText } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import type { NavSection } from "@/types/dashboard";

interface WelcomeBannerProps {
  onNavigate?: (section: NavSection) => void;
}

export function WelcomeBanner({ onNavigate }: WelcomeBannerProps = {}) {
  const { activeWorkspace } = useWorkspace();
  const currentDate = new Date().toLocaleDateString("en-MY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#536B85] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
            <span>{currentDate}</span>
            <span className="text-[#DCD7CC]">&bull;</span>
            <span>{activeWorkspace?.name ?? "Khai Space Central"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
            Welcome to Khai Space Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
            Personal business and project command center for managing projects, tasks, milestones,
            finances, AI subscriptions, and operational decisions.
          </p>
        </div>

        <div className="shrink-0 flex md:flex-col items-start md:items-end gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
            Role: <strong className="font-semibold">{activeWorkspace?.role ?? "Member"}</strong>
          </span>
          <span className="px-3 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63]">
            Currency: <strong className="font-semibold">{activeWorkspace?.defaultCurrency ?? "MYR"}</strong>
          </span>
        </div>
      </div>

      {onNavigate && (
        <div className="pt-4 border-t border-[#E9E5DC] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#536B85] mr-1">
            Quick Jump:
          </span>
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#0C2340] transition-colors cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#347A63]" />
            <span>Manage Projects</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("tasks")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#0C2340] transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#347A63]" />
            <span>Tasks &amp; Milestones</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("finance")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#0C2340] transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#347A63]" />
            <span>Finance &amp; ROI</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("notes")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#0C2340] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#347A63]" />
            <span>Notes &amp; Decisions</span>
          </button>
        </div>
      )}
    </div>
  );
}
