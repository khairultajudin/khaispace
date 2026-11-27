"use client";

import React, { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Bot,
  Calendar,
  CheckSquare,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  MapPin,
  CheckCircle2,
  Info,
  Milestone,
  Pencil,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { HubProject } from "../../types/dashboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { fetchProjectContext, type ProjectContextSummary } from "@/lib/supabase/projects-service";
import { formatMYR } from "@/utils/finance-utils";
import { MemburuJejakWorkspace } from "./memburu-jejak-workspace";
import { HidroponikWorkspace } from "./hidroponik-workspace";
import { AirFryerWorkspace } from "./air-fryer-workspace";
import { BizTrackWorkspace } from "./biztrack-workspace";
import { KaiWorkspace } from "./kai-workspace";

interface ProjectDetailProps {
  project: HubProject;
  onBack: () => void;
  canWrite?: boolean;
  canDelete?: boolean;
  isArchiving?: boolean;
  onEdit?: (project: HubProject) => void;
  onToggleArchive?: (project: HubProject) => void;
  onDelete?: (project: HubProject) => void;
}

export function ProjectDetail({
  project,
  onBack,
  canWrite = false,
  canDelete = false,
  isArchiving = false,
  onEdit,
  onToggleArchive,
  onDelete,
}: ProjectDetailProps) {
  const { activeWorkspace } = useWorkspace();
  const [contextSummary, setContextSummary] = useState<ProjectContextSummary | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const isArchived = Boolean(project.metadata?.archived);
  const isMemburuJejak =
    project.title.toLowerCase().includes("memburu jejak") ||
    Boolean(project.metadata?.archiveUrl?.includes("memburu-jejak"));
  const isHidroponik =
    project.title.toLowerCase().includes("hidroponik") ||
    Boolean(project.metadata?.archiveUrl?.includes("hidroponik"));
  const isAirFryer =
    project.title.toLowerCase().includes("air fryer") ||
    Boolean(project.metadata?.archiveUrl?.includes("air-fryer"));
  const isBizTrack =
    project.title.toLowerCase().includes("biztrack") ||
    Boolean(project.metadata?.archiveUrl?.includes("biztrack"));
  const isKai =
    project.title.toLowerCase().includes("ai assistant") ||
    project.title.toLowerCase().startsWith("kai") ||
    project.title.toLowerCase().includes("kai ");
  const hasNativeWorkspace =
    isMemburuJejak || isHidroponik || isAirFryer || isBizTrack || isKai;
  const isPlanned =
    project.status === "Planning" ||
    project.metadata?.verificationStatus === "Planned / Not Yet Implemented";

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;
    fetchProjectContext(activeWorkspace.id, project.id)
      .then((res) => {
        if (!cancelled) setContextSummary(res);
      })
      .catch(() => {
        if (!cancelled) setContextSummary(null);
      })
      .finally(() => {
        if (!cancelled) setIsContextLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace, project.id]);

  const getStatusBadge = (status: HubProject["status"]) => {
    switch (status) {
      case "Production":
        return "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]";
      case "Active":
        return "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]";
      case "In Development":
        return "bg-[#FAF8F4] text-[#0C2340] border-[#DCD7CC]";
      case "Documented":
        return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
      case "Planning":
        return "bg-[#FAF8F4] text-[#8C5E1A] border-[#EAD0A0]";
      default:
        return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#0C2340] bg-[#FFFFFF] hover:bg-[#E9E5DC] border border-[#DCD7CC] transition-colors cursor-pointer shadow-xs self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#347A63]" />
          <span>Back to Projects List</span>
        </button>

        {(canWrite || canDelete) && (
          <div className="flex flex-wrap items-center gap-2">
            {canWrite && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#0C2340] bg-[#FFFFFF] hover:bg-[#FAF8F4] border border-[#DCD7CC] transition-colors cursor-pointer shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5 text-[#347A63]" />
                <span>Edit Project</span>
              </button>
            )}

            {canWrite && onToggleArchive && (
              <button
                type="button"
                onClick={() => onToggleArchive(project)}
                disabled={isArchiving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#0C2340] bg-[#FFFFFF] hover:bg-[#FAF8F4] border border-[#DCD7CC] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isArchiving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#347A63]" />
                ) : isArchived ? (
                  <ArchiveRestore className="w-3.5 h-3.5 text-[#347A63]" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-[#536B85]" />
                )}
                <span>{isArchived ? "Unarchive Project" : "Archive Project"}</span>
              </button>
            )}

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#B42318] bg-[#FDF2F2] hover:bg-[#FEE4E2] border border-[#E5B8B8] transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Merged Native Project Workspaces (replaces separate Preserved Archive) */}
      {isMemburuJejak && <MemburuJejakWorkspace />}
      {isHidroponik && <HidroponikWorkspace />}
      {isAirFryer && <AirFryerWorkspace />}
      {isBizTrack && <BizTrackWorkspace />}
      {isKai && <KaiWorkspace />}

      {/* Main Project Header Card */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#536B85]">
                {project.category}
              </span>
              <span className="text-[#DCD7CC]">&bull;</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(
                  project.status
                )}`}
              >
                {project.status}
              </span>
              {isArchived && (
                <>
                  <span className="text-[#DCD7CC]">&bull;</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]">
                    Archived
                  </span>
                </>
              )}
              <span className="text-[#DCD7CC]">&bull;</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isPlanned
                    ? "bg-[#FAF8F4] text-[#8C5E1A] border-[#EAD0A0]"
                    : "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                }`}
              >
                {isPlanned ? "Planned Specification" : "Verified In-Tree Asset"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              {project.title}
            </h1>

            <p className="text-sm text-[#536B85] max-w-3xl leading-relaxed">
              {project.fullDescription || project.description}
            </p>
          </div>

          <div className="shrink-0 p-3 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-mono space-y-1 sm:text-right">
            <div className="text-[10px] text-[#536B85]">Project ID</div>
            <div className="font-semibold text-[#0C2340]">{project.id}</div>
          </div>
        </div>

        {/* Tags */}
        <div className="pt-2 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2.5 py-1 rounded bg-[#FAF8F4] text-[#0C2340] border border-[#DCD7CC]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Metadata & Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Repository & Location */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9E5DC]">
            <MapPin className="w-4 h-4 text-[#347A63]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Repository &amp; Location Status
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[#536B85] font-medium mb-1">
                {isPlanned
                  ? "Planned Location (Not on filesystem):"
                  : "Verified Filesystem Path:"}
              </div>
              <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[#0C2340] break-all">
                {project.location}
              </div>
            </div>

            {project.metadata?.repositoryPath && (
              <div>
                <div className="text-[#536B85] font-medium mb-1">
                  {isPlanned
                    ? "Planned Integration Target:"
                    : "Monorepo Integration:"}
                </div>
                <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[#536B85]">
                  {project.metadata.repositoryPath}
                </div>
              </div>
            )}

            {project.metadata?.archiveUrl && !hasNativeWorkspace && (
              <div>
                <div className="text-[#536B85] font-medium mb-1.5">
                  Preserved Private Portfolio Archive:
                </div>
                <a
                  href={project.metadata.archiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] hover:bg-[#A8CFC2]/40 text-xs font-medium text-[#347A63] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Preserved Archive</span>
                </a>
              </div>
            )}

            <div className="pt-2 text-[11px] text-[#536B85] leading-relaxed">
              {isPlanned ? (
                <span className="text-[#8C5E1A]">
                  * This project is currently in the conceptual planning phase. No source code,
                  directories, or assets exist on the filesystem yet.
                </span>
              ) : (
                <span>
                  * In-tree project maintained within the centralized{" "}
                  <code>khairultajudin/khaispace</code> repository.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Architecture & Scope */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9E5DC]">
            <Layers className="w-4 h-4 text-[#347A63]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Architecture &amp; Scope
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[#536B85] font-medium mb-1">Project Scope:</div>
              <div className="text-[#0C2340] font-medium">
                {project.metadata?.scope || "Ecosystem Module"}
              </div>
            </div>

            <div>
              <div className="text-[#536B85] font-medium mb-1">
                {isPlanned
                  ? "Proposed Technology Stack (Planned):"
                  : "Active Technology Stack (Implemented):"}
              </div>
              <div className="text-[#0C2340] font-mono text-[11px]">
                {project.metadata?.techStack || project.tags.join(", ")}
              </div>
            </div>

            <div>
              <div className="text-[#536B85] font-medium mb-1">Delivery / Packaging:</div>
              <div className="text-[#0C2340]">
                {project.metadata?.deliveryModel || "Monorepo Asset"}
              </div>
            </div>

            {(project.metadata?.startDate || project.metadata?.dueDate) && (
              <div>
                <div className="text-[#536B85] font-medium mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
                  <span>Timeline:</span>
                </div>
                <div className="text-[#0C2340] font-mono text-[11px]">
                  {project.metadata.startDate || "Not set"} &rarr;{" "}
                  {project.metadata.dueDate || "Not set"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Knowledge Base (Source-Backed Details) */}
      {(project.metadata?.objectives ||
        project.metadata?.architectureSummary ||
        (project.metadata?.completedWork && project.metadata.completedWork.length > 0) ||
        (project.metadata?.inProgressWork && project.metadata.inProgressWork.length > 0) ||
        (project.metadata?.documentationRefs && project.metadata.documentationRefs.length > 0) ||
        project.metadata?.ownerInputNeeded) && (
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-white shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9E5DC]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Project Knowledge Base
            </h2>
            {project.metadata?.repositoryUrl && (
              <a
                href={project.metadata.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#347A63] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Repository</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {project.metadata?.objectives && (
              <div className="space-y-1">
                <div className="font-semibold text-[#0C2340]">Objectives</div>
                <p className="text-[#536B85] leading-relaxed">{project.metadata.objectives}</p>
              </div>
            )}

            {project.metadata?.architectureSummary && (
              <div className="space-y-1">
                <div className="font-semibold text-[#0C2340]">Architecture &amp; Technical Notes</div>
                <p className="text-[#536B85] leading-relaxed">
                  {project.metadata.architectureSummary}
                </p>
              </div>
            )}

            {project.metadata?.completedWork && project.metadata.completedWork.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-semibold text-[#347A63]">Completed Work</div>
                <ul className="list-disc pl-4 space-y-1 text-[#536B85]">
                  {project.metadata.completedWork.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {project.metadata?.inProgressWork && project.metadata.inProgressWork.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0C2340]">In Progress / Next Steps</div>
                <ul className="list-disc pl-4 space-y-1 text-[#536B85]">
                  {project.metadata.inProgressWork.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {project.metadata?.hardwareComponents && project.metadata.hardwareComponents.length > 0 && (
            <div className="pt-2 border-t border-[#E9E5DC] text-xs space-y-1.5">
              <div className="font-semibold text-[#0C2340]">Hardware &amp; Components</div>
              <div className="flex flex-wrap gap-1.5">
                {project.metadata.hardwareComponents.map((comp) => (
                  <span
                    key={comp}
                    className="px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[11px] text-[#0C2340]"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.metadata?.documentationRefs && project.metadata.documentationRefs.length > 0 && (
            <div className="pt-2 border-t border-[#E9E5DC] text-xs space-y-1.5">
              <div className="font-semibold text-[#0C2340]">Documentation &amp; Source References</div>
              <div className="flex flex-wrap gap-2">
                {project.metadata.documentationRefs.map((ref) => (
                  <span
                    key={ref}
                    className="px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[11px] text-[#536B85]"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.metadata?.ownerInputNeeded && (
            <div className="p-3 rounded-md border border-[#EAD0A0] bg-[#FAF8F4] text-xs text-[#8C5E1A]">
              <strong>Owner Input Needed:</strong> {project.metadata.ownerInputNeeded}
            </div>
          )}
        </div>
      )}

      {/* Cross-Module Connected Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E9E5DC] pb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0C2340]">
              <CheckSquare className="w-3.5 h-3.5 text-[#347A63]" />
              Tasks ({contextSummary?.tasks.length ?? 0})
            </span>
            <a href="#tasks" className="text-[11px] font-medium text-[#347A63] hover:underline">
              Open Tasks &rarr;
            </a>
          </div>
          {isContextLoading ? (
            <p className="text-xs text-[#536B85]">Loading linked tasks...</p>
          ) : !contextSummary || contextSummary.tasks.length === 0 ? (
            <p className="text-xs text-[#536B85]">No tasks linked to this project.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {contextSummary.tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <a href={`#task-${t.id}`} className="text-[#0C2340] hover:text-[#347A63] truncate font-medium">
                    {t.title}
                  </a>
                  <span className="text-[10px] font-mono text-[#536B85] shrink-0">{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E9E5DC] pb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0C2340]">
              <Milestone className="w-3.5 h-3.5 text-[#347A63]" />
              Milestones ({contextSummary?.milestones.length ?? 0})
            </span>
            <a href="#milestones" className="text-[11px] font-medium text-[#347A63] hover:underline">
              Roadmap &rarr;
            </a>
          </div>
          {isContextLoading ? (
            <p className="text-xs text-[#536B85]">Loading milestones...</p>
          ) : !contextSummary || contextSummary.milestones.length === 0 ? (
            <p className="text-xs text-[#536B85]">No milestones linked to this project.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {contextSummary.milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="text-[#0C2340] truncate font-medium">{m.title}</span>
                  <span className="text-[10px] font-mono text-[#536B85] shrink-0">{m.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E9E5DC] pb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0C2340]">
              <TrendingUp className="w-3.5 h-3.5 text-[#347A63]" />
              Finance &amp; Subscriptions
            </span>
            <a href="#finance" className="text-[11px] font-medium text-[#347A63] hover:underline">
              Ledger &rarr;
            </a>
          </div>
          {isContextLoading ? (
            <p className="text-xs text-[#536B85]">Loading financial summary...</p>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#536B85]">Transactions ({contextSummary?.finance.count ?? 0}):</span>
                <span className="font-mono font-semibold text-[#0C2340]">
                  {formatMYR(contextSummary?.finance.net ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536B85] inline-flex items-center gap-1">
                  <Bot className="w-3 h-3 text-[#347A63]" /> AI Subscriptions:
                </span>
                <span className="font-mono text-[#0C2340]">{contextSummary?.subscriptions.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536B85] inline-flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#347A63]" /> Notes &amp; Decisions:
                </span>
                <a href="#notes" className="font-mono text-[#347A63] hover:underline">
                  {contextSummary?.notes.length ?? 0}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Differentiated Data Integrity Notice */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 text-xs text-[#536B85] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          {isPlanned ? (
            <Info className="w-4 h-4 text-[#8C5E1A] shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5 sm:mt-0" />
          )}
          <span>
            {isPlanned
              ? "Conceptual Planning Entry: This project represents a proposed specification. Its suggested technology stack and repository placement are planning targets and not active filesystem entities."
              : "Verified Repository Asset: Metadata, technology stack, and filesystem paths correspond to verified source files in the khairultajudin/khaispace repository."}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#536B85] shrink-0">
          {isPlanned ? "Status: Planning Target" : "Source of Truth: Verified In-Tree"}
        </span>
      </div>
    </div>
  );
}
