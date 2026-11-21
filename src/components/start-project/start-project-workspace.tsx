"use client";

import { useSearchParams } from "next/navigation";
import { Bot, Calculator, ClipboardList } from "lucide-react";
import { useState } from "react";
import { ProjectAssistantPanel } from "@/components/assistant/project-assistant-panel";
import { ProjectBriefBuilder } from "@/components/start-project/project-brief-builder";
import {
  ProjectEstimator,
  type EstimatorHandoffPayload,
} from "@/components/start-project/project-estimator";
import { cn } from "@/lib/cn";

type WorkspaceTab = "brief" | "estimator" | "advisor";

export function StartProjectWorkspace() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: WorkspaceTab =
    tabParam === "estimator"
      ? "estimator"
      : tabParam === "advisor"
        ? "advisor"
        : "brief";

  const [selectedTab, setSelectedTab] = useState<WorkspaceTab | null>(null);
  const [estimatorPreset, setEstimatorPreset] =
    useState<EstimatorHandoffPayload | null>(null);
  const [presetVersion, setPresetVersion] = useState(0);

  const activeTab = selectedTab ?? initialTab;

  function handleCarryToBrief(payload: EstimatorHandoffPayload) {
    setEstimatorPreset(payload);
    setPresetVersion((v) => v + 1);
    setSelectedTab("brief");
  }

  return (
    <div className="space-y-6">
      {/* Interactive Tool Switcher */}
      <div
        role="tablist"
        aria-label="Project planning tools"
        className="grid gap-2 rounded-2xl border border-border bg-surface p-2 sm:grid-cols-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "brief"}
          onClick={() => setSelectedTab("brief")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
            activeTab === "brief"
              ? "bg-navy text-white shadow-xs"
              : "text-muted hover:bg-surface-muted hover:text-navy",
          )}
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
          <span>Brief Builder</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "estimator"}
          onClick={() => setSelectedTab("estimator")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
            activeTab === "estimator"
              ? "bg-electric text-white shadow-xs"
              : "text-muted hover:bg-surface-muted hover:text-navy",
          )}
        >
          <Calculator className="h-4 w-4 shrink-0" aria-hidden />
          <span>Scope Estimator</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "advisor"}
          onClick={() => setSelectedTab("advisor")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
            activeTab === "advisor"
              ? "bg-violet text-white shadow-xs"
              : "text-muted hover:bg-surface-muted hover:text-navy",
          )}
        >
          <Bot className="h-4 w-4 shrink-0" aria-hidden />
          <span>Project Advisor</span>
        </button>
      </div>

      {activeTab === "brief" && (
        <ProjectBriefBuilder
          key={presetVersion}
          initialPreset={estimatorPreset}
        />
      )}

      {activeTab === "estimator" && (
        <ProjectEstimator onCarryToBrief={handleCarryToBrief} />
      )}

      {activeTab === "advisor" && (
        <ProjectAssistantPanel pageContext="/start-a-project" />
      )}
    </div>
  );
}
