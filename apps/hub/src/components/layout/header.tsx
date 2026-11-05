"use client";

import React from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { NavSection } from "../../types/dashboard";

interface HeaderProps {
  currentSection: NavSection;
  onOpenMobileMenu: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  overview: "Overview Dashboard",
  projects: "Projects Directory",
  tasks: "Tasks & Milestones",
  finance: "Finance & ROI",
  subscriptions: "AI Subscriptions",
  notes: "Notes & Decisions",
  settings: "Members & Settings",
};

export function Header({ currentSection, onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#DCD7CC] bg-[#FAF8F4]/95 backdrop-blur-xs sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#536B85] hidden sm:inline">Hub</span>
          <span className="text-[#DCD7CC] hidden sm:inline">/</span>
          <span className="font-semibold text-sm sm:text-base text-[#0C2340]">
            {SECTION_TITLES[currentSection]}
          </span>
        </div>
      </div>

      {/* Right: Telemetry & Branch Badges */}
      <div className="flex items-center gap-2.5">
        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCD7CC] bg-[#E9E5DC] text-[#0C2340] font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#347A63]"></span>
          Branch: feature/khai-space-hub
        </span>

        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCD7CC] bg-[#FFFFFF] text-[#536B85] text-[11px] font-mono">
          Deployment: Planned (Cloudflare Pages)
        </span>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63] text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Phase 2A</span>
        </div>
      </div>
    </header>
  );
}
