"use client";

import React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Bot,
  FileText,
  Settings,
  X,
  ExternalLink,
} from "lucide-react";
import { NavSection } from "../../types/dashboard";

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ElementType;
  badge?: string;
  isReady: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    isReady: true,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
    isReady: true,
  },
  {
    id: "tasks",
    label: "Tasks & Milestones",
    icon: CheckSquare,
    isReady: true,
  },
  {
    id: "finance",
    label: "Finance & ROI",
    icon: TrendingUp,
    badge: "Coming Soon",
    isReady: false,
  },
  {
    id: "subscriptions",
    label: "AI Subscriptions",
    icon: Bot,
    badge: "Coming Soon",
    isReady: false,
  },
  {
    id: "notes",
    label: "Notes & Decisions",
    icon: FileText,
    badge: "Coming Soon",
    isReady: false,
  },
  {
    id: "settings",
    label: "Members & Settings",
    icon: Settings,
    badge: "Coming Soon",
    isReady: false,
  },
];

export function Sidebar({
  currentSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full bg-[#FAF8F4] border-r border-[#DCD7CC] select-none">
      {/* Brand & Workspace Identity */}
      <div className="p-5 border-b border-[#DCD7CC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0C2340] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
            K
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#0C2340] leading-none">
              Khai Space Hub
            </div>
            <div className="text-[11px] text-[#536B85] mt-1 font-mono">
              Command Center
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#536B85]">
          Workspace
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectSection(item.id);
                if (mobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 text-left cursor-pointer ${
                isActive
                  ? "bg-[#EDF5F2] text-[#347A63] font-semibold border border-[#A8CFC2]"
                  : "text-[#0C2340] hover:bg-[#E9E5DC] hover:text-[#0C2340] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#347A63]" : "text-[#536B85]"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E9E5DC] text-[#536B85] border border-[#DCD7CC]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info / Links */}
      <div className="p-4 border-t border-[#DCD7CC] bg-[#E9E5DC]/40 text-xs text-[#536B85] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span>Target Host</span>
          <span className="text-[#0C2340]">Cloudflare Pages</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span>Target Domain</span>
          <span className="text-[#0C2340]">hub.khaispace.com</span>
        </div>
        <div className="pt-2 border-t border-[#DCD7CC]/60 flex items-center justify-between text-[10px] text-[#536B85]">
          <span>Khai Space &copy; 2026</span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#347A63] text-[#536B85]"
          >
            Public Site <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Stationary left column) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer (Backdrop + Slide-over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#0C2340]/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF8F4] z-50 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
