import React from "react";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import { NavSection } from "../../types/dashboard";

interface ProjectCatalogProps {
  onNavigateToProjects: (section: NavSection) => void;
}

export function ProjectCatalog({ onNavigateToProjects }: ProjectCatalogProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
            Cataloged Projects
          </h2>
          <p className="text-xs text-[#536B85]">
            Overview of applications, standalone assets, and research projects across the repository.
          </p>
        </div>

        <button
          onClick={() => onNavigateToProjects("projects")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#347A63] bg-[#EDF5F2] hover:bg-[#A8CFC2]/40 border border-[#A8CFC2] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Go to Projects Section</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATALOGED_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between hover:border-[#347A63] transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#536B85]">
                  {project.category}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    project.status === "Production"
                      ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                      : project.status === "Active"
                      ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                      : project.status === "In Development"
                      ? "bg-[#FAF8F4] text-[#0C2340] border-[#DCD7CC]"
                      : "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]"
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <h3 className="text-base font-semibold text-[#0C2340] tracking-tight">
                {project.title}
              </h3>

              <p className="text-xs text-[#536B85] mt-1.5 leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E9E5DC] space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-[#536B85] font-mono text-[10px]">
                <span>Tree Location:</span>
                <span className="text-[#0C2340] truncate max-w-[170px]" title={project.location}>
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
        ))}
      </div>
    </div>
  );
}
