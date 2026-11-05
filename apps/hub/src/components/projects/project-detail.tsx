import React from "react";
import {
  ArrowLeft,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { HubProject } from "../../types/dashboard";

interface ProjectDetailProps {
  project: HubProject;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
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
        return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
      default:
        return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#0C2340] bg-[#FFFFFF] hover:bg-[#E9E5DC] border border-[#DCD7CC] transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#347A63]" />
          <span>Back to Projects List</span>
        </button>
      </div>

      {/* Main Project Header Card */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
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
        {/* Left Column: Repository & Tree Location */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9E5DC]">
            <MapPin className="w-4 h-4 text-[#347A63]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Repository & Tree Location
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[#536B85] font-medium mb-1">Filesystem Path:</div>
              <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[#0C2340] break-all">
                {project.location}
              </div>
            </div>

            {project.metadata?.repositoryPath && (
              <div>
                <div className="text-[#536B85] font-medium mb-1">Monorepo Integration:</div>
                <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[#536B85]">
                  {project.metadata.repositoryPath}
                </div>
              </div>
            )}

            <div className="pt-2 text-[11px] text-[#536B85] leading-relaxed">
              * In-tree projects are maintained within the centralized <code>khairultajudin/khaispace</code> repository.
            </div>
          </div>
        </div>

        {/* Right Column: Technical Architecture & Scope */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9E5DC]">
            <Layers className="w-4 h-4 text-[#347A63]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Architecture & Scope
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
              <div className="text-[#536B85] font-medium mb-1">Technology Stack:</div>
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
          </div>
        </div>
      </div>

      {/* Data Integrity Notice */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 text-xs text-[#536B85] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#347A63] shrink-0" />
          <span>
            Metadata reflects verified in-tree files. No external databases or unverified endpoints are referenced.
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#536B85] shrink-0">
          Source of Truth: CATALOGED_PROJECTS
        </span>
      </div>
    </div>
  );
}
