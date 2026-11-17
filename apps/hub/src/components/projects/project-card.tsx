"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Calendar,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { HubProject } from "../../types/dashboard";

interface ProjectCardProps {
  project: HubProject;
  onSelectProject: (id: string) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  onEditProject?: (project: HubProject) => void;
  onToggleArchiveProject?: (project: HubProject) => void;
  onDeleteProject?: (project: HubProject) => void;
}

export function ProjectCard({
  project,
  onSelectProject,
  canWrite = false,
  canDelete = false,
  onEditProject,
  onToggleArchiveProject,
  onDeleteProject,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isArchived = Boolean(project.metadata?.archived);
  const hasActions =
    (canWrite && (onEditProject || onToggleArchiveProject)) ||
    (canDelete && onDeleteProject);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const getStatusBadge = (status: HubProject["status"]) => {
    switch (status) {
      case "Production":
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
    <div className="relative rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between hover:border-[#347A63] transition-all duration-150 group">
      {/* Top Action Menu (outside the card select button to keep valid non-nested button semantics) */}
      {hasActions && (
        <div ref={menuRef} className="absolute top-3.5 right-3.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            aria-label={`Actions for ${project.title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] border border-transparent hover:border-[#DCD7CC] transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label={`${project.title} actions`}
              className="absolute right-0 mt-1 w-44 rounded-lg border border-[#DCD7CC] bg-white shadow-lg py-1 z-20 text-xs"
            >
              {canWrite && onEditProject && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditProject(project);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#0C2340] hover:bg-[#FAF8F4] cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#347A63]" />
                  <span>Edit Project</span>
                </button>
              )}

              {canWrite && onToggleArchiveProject && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleArchiveProject(project);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#0C2340] hover:bg-[#FAF8F4] cursor-pointer"
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5 text-[#347A63]" />
                      <span>Unarchive Project</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5 text-[#536B85]" />
                      <span>Archive Project</span>
                    </>
                  )}
                </button>
              )}

              {canDelete && onDeleteProject && (
                <>
                  <div className="my-1 border-t border-[#E9E5DC]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteProject(project);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#B42318] hover:bg-[#FDF2F2] cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelectProject(project.id)}
        className="w-full h-full text-left p-5 rounded-lg flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] focus-visible:ring-offset-2 cursor-pointer"
        aria-label={`View details for ${project.title}`}
      >
        <div className="w-full">
          {/* Top bar: Category + Status */}
          <div className={`flex items-start justify-between gap-2 mb-2 ${hasActions ? "pr-8" : ""}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#536B85]">
              {project.category}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {isArchived && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]">
                  Archived
                </span>
              )}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(
                  project.status
                )}`}
              >
                {project.status}
              </span>
            </div>
          </div>

          {/* Project Title */}
          <div className="text-base font-semibold text-[#0C2340] tracking-tight group-hover:text-[#347A63] transition-colors flex items-center justify-between">
            <span>{project.title}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#347A63] shrink-0" />
          </div>

          {/* Description */}
          <p className="text-xs text-[#536B85] mt-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Footer: Location, Dates & Tags */}
        <div className="w-full mt-4 pt-3 border-t border-[#E9E5DC] space-y-2 text-[11px]">
          {project.location && (
            <div className="flex items-center gap-1.5 text-[#536B85] font-mono text-[10px]">
              <MapPin className="w-3 h-3 text-[#347A63] shrink-0" />
              <span className="text-[#0C2340] truncate" title={project.location}>
                {project.location}
              </span>
            </div>
          )}

          {(project.metadata?.startDate || project.metadata?.dueDate) && (
            <div className="flex items-center gap-1.5 text-[#536B85] font-mono text-[10px]">
              <Calendar className="w-3 h-3 text-[#347A63] shrink-0" />
              <span>
                {project.metadata.startDate || "—"} &rarr; {project.metadata.dueDate || "—"}
              </span>
            </div>
          )}

          {project.tags.length > 0 && (
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
          )}
        </div>
      </button>
    </div>
  );
}
