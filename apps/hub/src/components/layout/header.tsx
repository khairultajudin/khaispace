"use client";

import React, { useEffect, useState } from "react";
import { Loader2, LogOut, Menu, Search, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NavSection } from "../../types/dashboard";
import { GlobalSearchModal } from "./global-search-modal";

interface HeaderProps {
  currentSection: NavSection;
  onOpenMobileMenu: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  overview: "Overview Dashboard",
  projects: "Projects Directory",
  tasks: "Tasks & Milestones",
  finance: "Finance & ROI",
  invoices: "Invoice System (MK Venture)",
  subscriptions: "AI Subscriptions",
  tokens: "Token Monitor",
  notes: "Notes & Decisions",
  settings: "Members & Settings",
};

export function Header({ currentSection, onOpenMobileMenu }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

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

      {/* Right: Search, Auth Identity, Governance Boundary & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search workspace"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCD7CC] bg-white hover:bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#347A63]" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[9px] font-mono">
            Ctrl+K
          </kbd>
        </button>

        {user?.email && (
          <div
            title="Authenticated Supabase identity with workspace Row Level Security."
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCD7CC] bg-white text-[#0C2340] text-[11px] font-mono"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#347A63]" />
            <span className="truncate max-w-[180px]">{user.email}</span>
          </div>
        )}

        <div
          title="Protected by Supabase Auth and PostgreSQL Row Level Security (RLS)."
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63] text-[11px] font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Workspace RLS</span>
          <span className="sm:hidden">RLS</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out of Khai Space Hub"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCD7CC] bg-[#E9E5DC]/70 hover:bg-[#E9E5DC] text-[#0C2340] text-[11px] font-medium transition-colors disabled:opacity-60 cursor-pointer"
        >
          {isSigningOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#536B85]" />
          ) : (
            <LogOut className="w-3.5 h-3.5 text-[#536B85]" />
          )}
          <span>Sign Out</span>
        </button>
      </div>
      {searchOpen && (
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </header>
  );
}
