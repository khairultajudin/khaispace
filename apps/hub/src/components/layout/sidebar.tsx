"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Wallet,
  Receipt,
  Bot,
  Gauge,
  FileText,
  Settings,
  X,
  ExternalLink,
  LogOut,
  Loader2,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { fetchProjects } from "@/lib/supabase/projects-service";
import { HubProject, NavSection } from "../../types/dashboard";

interface SidebarProps {
  currentSection: NavSection;
  activeProjectId?: string | null;
  onSelectSection: (section: NavSection) => void;
  onSelectProject?: (projectId: string) => void;
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
    isReady: true,
  },
  {
    id: "personal-finance",
    label: "Kewangan Personal",
    icon: Wallet,
    isReady: true,
  },
  {
    id: "invoices",
    label: "Invoice System",
    icon: Receipt,
    badge: "MK",
    isReady: true,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: Bot,
    isReady: true,
  },
  {
    id: "tokens",
    label: "Tokens",
    icon: Gauge,
    isReady: true,
  },
  {
    id: "notes",
    label: "Notes & Decisions",
    icon: FileText,
    isReady: true,
  },
  {
    id: "settings",
    label: "Members & Settings",
    icon: Settings,
    isReady: true,
  },
];

export function Sidebar({
  currentSection,
  activeProjectId = null,
  onSelectSection,
  onSelectProject,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [sidebarProjects, setSidebarProjects] = useState<HubProject[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchProjects(activeWorkspace.id);
        if (!cancelled) {
          setSidebarProjects(rows.filter((p) => !p.metadata?.archived));
        }
      } catch {
        // ignore sidebar fetch errors
      }
    };
    void load();
    const onUpdated = () => void load();
    window.addEventListener("khai-projects-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("khai-projects-updated", onUpdated);
    };
  }, [activeWorkspace]);

  const statusDotClass = (status: string) => {
    switch (status) {
      case "Production":
      case "Active":
        return "bg-[#347A63]";
      case "In Development":
        return "bg-sky-500";
      case "Planning":
        return "bg-amber-500";
      default:
        return "bg-[#8C9BAF]";
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      if (mobileOpen) {
        onCloseMobile();
      }
    } finally {
      setIsSigningOut(false);
    }
  };

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
          const isActive =
            currentSection === item.id && !(item.id === "projects" && activeProjectId);
          const isProjectsItem = item.id === "projects";

          return (
            <div key={item.id} className="space-y-0.5">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    onSelectSection(item.id);
                    if (mobileOpen) onCloseMobile();
                  }}
                  className={`flex-1 flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 text-left cursor-pointer ${
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

                  {isProjectsItem && sidebarProjects.length > 0 ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E9E5DC] text-[#536B85] border border-[#DCD7CC]">
                      {sidebarProjects.length}
                    </span>
                  ) : (
                    item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E9E5DC] text-[#536B85] border border-[#DCD7CC]">
                        {item.badge}
                      </span>
                    )
                  )}
                </button>

                {isProjectsItem && sidebarProjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProjectsExpanded((v) => !v)}
                    className="p-1.5 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] cursor-pointer"
                    aria-label={projectsExpanded ? "Collapse projects" : "Expand projects"}
                  >
                    {projectsExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* 1 Project = 1 Tab under Projects */}
              {isProjectsItem && projectsExpanded && sidebarProjects.length > 0 && (
                <div className="ml-4 pl-2.5 border-l border-[#DCD7CC] space-y-0.5 py-0.5">
                  {sidebarProjects.map((proj) => {
                    const projActive =
                      currentSection === "projects" && activeProjectId === proj.id;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          if (onSelectProject) {
                            onSelectProject(proj.id);
                          }
                          if (mobileOpen) onCloseMobile();
                        }}
                        title={`${proj.title} (${proj.status})`}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-colors text-left cursor-pointer ${
                          projActive
                            ? "bg-[#EDF5F2] text-[#347A63] font-semibold border border-[#A8CFC2]"
                            : "text-[#536B85] hover:bg-[#E9E5DC] hover:text-[#0C2340] border border-transparent"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(
                            proj.status
                          )}`}
                        />
                        <span className="truncate">{proj.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info / Links */}
      <div className="p-4 border-t border-[#DCD7CC] bg-[#E9E5DC]/40 text-xs text-[#536B85] space-y-2.5">
        {user?.email && (
          <div className="p-2.5 rounded border border-[#DCD7CC] bg-white space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0C2340]">
              <UserCheck className="w-3.5 h-3.5 text-[#347A63] shrink-0" />
              <span className="truncate font-mono">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#536B85]">
              <span>Auth Verified</span>
              <span className="font-mono text-[#347A63]">DB Roles: Phase 6</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#0C2340] text-[11px] font-medium transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSigningOut ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#536B85]" />
              ) : (
                <LogOut className="w-3 h-3 text-[#536B85]" />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        )}

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
