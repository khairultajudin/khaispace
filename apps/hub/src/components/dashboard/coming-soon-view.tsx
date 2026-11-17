import React from "react";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { NavSection } from "../../types/dashboard";

interface ComingSoonViewProps {
  section: NavSection;
  onBackToOverview: () => void;
}

const SECTION_METADATA: Record<
  NavSection,
  { title: string; subtitle: string; description: string; phase: string }
> = {
  overview: {
    title: "Overview",
    subtitle: "Command Center Dashboard",
    description: "Primary overview workspace.",
    phase: "Phase 2A",
  },
  projects: {
    title: "Projects Directory & Detail Views",
    subtitle: "Deep-dive project workspace and asset management",
    description:
      "A centralized directory to view repository project details, code architecture, README previews, and standalone launch links for BizTrack, OurDuit, Memburu Jejak, and other internal assets.",
    phase: "Phase 2B",
  },
  tasks: {
    title: "Tasks & Milestones Engine",
    subtitle: "Cross-project initiative tracking and backlog",
    description:
      "Operational backlog and milestone tracking system to coordinate upcoming deliverables across creative and software projects.",
    phase: "Phase 2C",
  },
  finance: {
    title: "Finance & ROI Telemetry",
    subtitle: "Expenditure analysis and project return models",
    description:
      "Comprehensive cost modeling for hosting, domains, infrastructure, and revenue tracking across commercial projects.",
    phase: "Phase 2D",
  },
  subscriptions: {
    title: "AI Subscriptions & Tooling Tracker",
    subtitle: "Recurring tool subscriptions and credit budgets",
    description:
      "Centralized ledger to monitor AI model API budgets (Gemini, Claude, Midjourney, OpenAI) and recurring software tooling renewals.",
    phase: "Phase 2E",
  },
  notes: {
    title: "Notes & Architectural Decisions",
    subtitle: "Design records, meeting notes, and technical ADRs",
    description:
      "Curated log of architecture decision records (ADRs), prompt libraries, design guidelines, and project retrospectives.",
    phase: "Phase 2F",
  },
  settings: {
    title: "Members & Hub Settings",
    subtitle: "Profile, access permissions, and environment variables",
    description:
      "Configuration settings for Supabase client credentials, Cloudflare Pages integration preferences, and profile controls.",
    phase: "Phase 3",
  },
};

export function ComingSoonView({ section, onBackToOverview }: ComingSoonViewProps) {
  const meta = SECTION_METADATA[section];

  return (
    <div className="space-y-6">
      {/* Return Action */}
      <button
        onClick={onBackToOverview}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#0C2340] bg-[#FFFFFF] hover:bg-[#E9E5DC] border border-[#DCD7CC] transition-colors cursor-pointer shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#347A63]" />
        <span>Back to Overview Dashboard</span>
      </button>

      {/* Main Notice Card */}
      <div className="p-8 sm:p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs text-center max-w-3xl mx-auto space-y-6">
        <div className="w-14 h-14 rounded-full bg-[#EDF5F2] border border-[#A8CFC2] text-[#347A63] flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-mono text-[#536B85]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#347A63]"></span>
            <span>Target Milestone: {meta.phase}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
            {meta.title}
          </h1>

          <p className="text-sm font-medium text-[#347A63]">
            {meta.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-[#536B85] max-w-xl mx-auto leading-relaxed pt-2">
            {meta.description}
          </p>
        </div>

        <div className="pt-6 border-t border-[#E9E5DC] flex flex-wrap items-center justify-center gap-3 text-xs text-[#536B85]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#347A63]" />
            <span>Scope Restricted to Phase 2A</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[11px]">
            Navigation Safe • No Broken Links
          </div>
        </div>
      </div>
    </div>
  );
}
