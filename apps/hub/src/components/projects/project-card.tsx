import React from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { HubProject } from "../../types/dashboard";

interface ProjectCardProps {
  project: HubProject;
  onSelectProject: (id: string) => void;
}

export function ProjectCard({ project, onSelectProject }: ProjectCardProps) {
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
    <div
      onClick={() => onSelectProject(project.id)}
      className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between hover:border-[#347A63] transition-all duration-150 cursor-pointer group"
    >
      <div>
        {/* Top bar: Category + Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#536B85]">
            {project.category}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </div>

        {/* Project Title */}
        <h3 className="text-base font-semibold text-[#0C2340] tracking-tight group-hover:text-[#347A63] transition-colors flex items-center justify-between">
          <span>{project.title}</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#347A63]" />
        </h3>

        {/* Description */}
        <p className="text-xs text-[#536B85] mt-2 leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Footer: Location & Tags */}
      <div className="mt-4 pt-3 border-t border-[#E9E5DC] space-y-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-[#536B85] font-mono text-[10px]">
          <MapPin className="w-3 h-3 text-[#347A63] shrink-0" />
          <span className="text-[#0C2340] truncate" title={project.location}>
            {project.location}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
