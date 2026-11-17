"use client";

import React, { useState } from "react";
import { Loader2, LogOut, Menu, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

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

      {/* Right: Auth Identity, Governance Boundary & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {user?.email && (
          <div
            title="Authenticated Supabase identity. Database workspace membership and role verification are pending Phase 6 schema deployment."
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCD7CC] bg-white text-[#0C2340] text-[11px] font-mono"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#347A63]" />
            <span className="truncate max-w-[180px]">{user.email}</span>
          </div>
        )}

        <div
          title="Phase 5 verifies Supabase user authentication. Database-level workspace membership and RLS role checks are scheduled for Phase 6."
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63] text-[11px] font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Phase 5 Auth</span>
          <span className="sm:hidden">Auth</span>
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
    </header>
  );
}
