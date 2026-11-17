"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  X,
  FolderKanban,
  RotateCcw,
  Layers,
  Plus,
  AlertCircle,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { HubProject, ProjectStatus } from "../../types/dashboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import {
  createProject,
  deleteProject,
  fetchProjects,
  setProjectArchived,
  updateProject,
} from "@/lib/supabase/projects-service";
import { ProjectCard } from "./project-card";
import { ProjectDetail } from "./project-detail";
import { ProjectFormModal, type ProjectFormValues } from "./project-form-modal";
import { DeleteProjectModal } from "./delete-project-modal";

const STATUS_FILTERS: { id: "ALL" | ProjectStatus; label: string }[] = [
  { id: "ALL", label: "All Projects" },
  { id: "Production", label: "Production" },
  { id: "In Development", label: "In Development" },
  { id: "Active", label: "Active" },
  { id: "Documented", label: "Documented" },
  { id: "Planning", label: "Planning" },
];

export function ProjectsView() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [projects, setProjects] = useState<HubProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const match = window.location.hash.match(/^#project-([a-z0-9-]+)$/);
      if (match) {
        return match[1];
      }
    }
    return null;
  });

  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<HubProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<HubProject | null>(null);
  const [archivingProjectId, setArchivingProjectId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const canWrite = activeWorkspace?.role !== "Viewer";
  const canDelete =
    activeWorkspace?.role === "Owner" || activeWorkspace?.role === "Administrator";

  const loadProjects = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const rows = await fetchProjects(activeWorkspace.id);
      setProjects(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProjects();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  useEffect(() => {
    const handleHash = () => {
      const match = window.location.hash.match(/^#project-([a-z0-9-]+)$/);
      if (match) {
        setSelectedProjectId(match[1]);
      } else if (window.location.hash === "#projects") {
        setSelectedProjectId(null);
      }
    };

    window.addEventListener("hashchange", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  const handleCreateProject = async (values: ProjectFormValues) => {
    if (!activeWorkspace || !user?.id) return;
    await createProject(activeWorkspace.id, user.id, {
      title: values.title,
      category: values.category,
      status: values.status,
      location: values.location,
      description: values.description,
      fullDescription: values.fullDescription || undefined,
      tags: values.tags,
      metadata: values.metadata,
    });
    setShowCreateModal(false);
    setFeedbackBanner(`Created project "${values.title}".`);
    await loadProjects();
  };

  const handleEditProject = async (values: ProjectFormValues) => {
    if (!activeWorkspace || !editingProject) return;
    await updateProject(activeWorkspace.id, editingProject.id, {
      title: values.title,
      category: values.category,
      status: values.status,
      location: values.location,
      description: values.description,
      fullDescription: values.fullDescription,
      tags: values.tags,
      metadata: values.metadata,
    });
    setEditingProject(null);
    setFeedbackBanner(`Updated project "${values.title}".`);
    await loadProjects();
  };

  const handleToggleArchiveProject = async (project: HubProject) => {
    if (!activeWorkspace || !canWrite) return;
    const nextArchived = !Boolean(project.metadata?.archived);
    setArchivingProjectId(project.id);
    setError(null);
    try {
      await setProjectArchived(activeWorkspace.id, project, nextArchived);
      setFeedbackBanner(
        nextArchived
          ? `Archived project "${project.title}".`
          : `Restored "${project.title}" to active projects.`
      );
      if (nextArchived && selectedProjectId === project.id) {
        setSelectedProjectId(null);
      }
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : nextArchived
          ? "Failed to archive project."
          : "Failed to unarchive project."
      );
    } finally {
      setArchivingProjectId(null);
    }
  };

  const handleDeleteProject = async (project: HubProject) => {
    if (!activeWorkspace || !canDelete) return;
    await deleteProject(activeWorkspace.id, project.id, project.title);
    setDeletingProject(null);
    if (selectedProjectId === project.id) {
      setSelectedProjectId(null);
    }
    setFeedbackBanner(`Deleted project "${project.title}".`);
    await loadProjects();
  };

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.metadata?.archived),
    [projects]
  );

  const archivedProjects = useMemo(
    () => projects.filter((p) => Boolean(p.metadata?.archived)),
    [projects]
  );

  const scopedProjects = viewMode === "archived" ? archivedProjects : activeProjects;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: scopedProjects.length,
    };
    for (const project of scopedProjects) {
      counts[project.status] = (counts[project.status] || 0) + 1;
    }
    return counts;
  }, [scopedProjects]);

  const activeOrDevCount = useMemo(() => {
    return activeProjects.filter(
      (p) =>
        p.status === "Production" ||
        p.status === "In Development" ||
        p.status === "Active"
    ).length;
  }, [activeProjects]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const project of scopedProjects) {
      set.add(project.category);
    }
    return ["ALL", ...Array.from(set)];
  }, [scopedProjects]);

  const filteredProjects = useMemo(() => {
    return scopedProjects.filter((project) => {
      if (selectedStatus !== "ALL" && project.status !== selectedStatus) {
        return false;
      }
      if (selectedCategory !== "ALL" && project.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = project.title.toLowerCase().includes(q);
        const matchesCategory = project.category.toLowerCase().includes(q);
        const matchesDesc = project.description.toLowerCase().includes(q);
        const matchesLocation = project.location.toLowerCase().includes(q);
        const matchesTags = project.tags.some((tag) => tag.toLowerCase().includes(q));

        if (!matchesName && !matchesCategory && !matchesDesc && !matchesLocation && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [scopedProjects, searchQuery, selectedStatus, selectedCategory]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedStatus !== "ALL" || selectedCategory !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
  };

  const renderModals = () => (
    <>
      {showCreateModal && (
        <ProjectFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}
      {editingProject && (
        <ProjectFormModal
          mode="edit"
          initialProject={editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={handleEditProject}
        />
      )}
      {deletingProject && activeWorkspace && (
        <DeleteProjectModal
          workspaceId={activeWorkspace.id}
          project={deletingProject}
          onClose={() => setDeletingProject(null)}
          onConfirmDelete={handleDeleteProject}
        />
      )}
    </>
  );

  if (selectedProjectId) {
    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    if (selectedProject) {
      return (
        <>
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProjectId(null)}
            canWrite={canWrite}
            canDelete={canDelete}
            isArchiving={archivingProjectId === selectedProject.id}
            onEdit={(proj) => setEditingProject(proj)}
            onToggleArchive={handleToggleArchiveProject}
            onDelete={(proj) => setDeletingProject(proj)}
          />
          {renderModals()}
        </>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <FolderKanban className="w-4 h-4" />
              <span>Workspace Project Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Projects &amp; Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Live database registry of projects, applications, and engineering assets in{" "}
              <strong>{activeWorkspace?.name}</strong>.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Total: <strong className="font-semibold">{projects.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63]">
              Active / Dev: <strong className="font-semibold">{activeOrDevCount}</strong>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0C2340] text-white font-sans font-medium hover:bg-[#133258] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-[#E9E5DC] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#536B85] text-[11px] font-mono mr-1">Status Counts:</span>
            {STATUS_FILTERS.map((filter) => {
              const count = statusCounts[filter.id] || 0;
              const isSelected = selectedStatus === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedStatus(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-[#0C2340] text-white border-[#0C2340]"
                      : "bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] border-[#DCD7CC]"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-[#E9E5DC] text-[#0C2340]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center rounded-md border border-[#DCD7CC] bg-[#FAF8F4] p-0.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setSelectedStatus("ALL");
                setSelectedCategory("ALL");
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "active"
                  ? "bg-white text-[#0C2340] shadow-xs"
                  : "text-[#536B85] hover:text-[#0C2340]"
              }`}
            >
              <span>Active</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-[#E9E5DC] text-[#0C2340]">
                {activeProjects.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("archived");
                setSelectedStatus("ALL");
                setSelectedCategory("ALL");
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "archived"
                  ? "bg-white text-[#0C2340] shadow-xs"
                  : "text-[#536B85] hover:text-[#0C2340]"
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Archived</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-[#E9E5DC] text-[#0C2340]">
                {archivedProjects.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div
          role="status"
          className="p-3.5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2] text-[#0C2340] text-xs flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#347A63] shrink-0" />
            {feedbackBanner}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            aria-label="Dismiss notification"
            className="p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="underline font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, category, tags, or path..."
              className="w-full pl-9 pr-9 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder:text-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#536B85] shrink-0 font-medium">
              <Layers className="w-3.5 h-3.5 text-[#347A63]" />
              <span className="hidden lg:inline">Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#536B85] pt-1">
          <div>
            Showing <strong className="text-[#0C2340]">{filteredProjects.length}</strong> of{" "}
            <strong>{scopedProjects.length}</strong>{" "}
            {viewMode === "archived" ? "archived" : "active"} projects
            {hasActiveFilters && <span className="italic ml-1">(filtered)</span>}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[#347A63] hover:underline text-[11px] font-medium cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 rounded-lg border border-[#DCD7CC] bg-white text-center text-xs text-[#536B85]">
          Loading workspace projects...
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelectProject={setSelectedProjectId}
              canWrite={canWrite}
              canDelete={canDelete}
              onEditProject={(proj) => setEditingProject(proj)}
              onToggleArchiveProject={handleToggleArchiveProject}
              onDeleteProject={(proj) => setDeletingProject(proj)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] flex items-center justify-center mx-auto">
            {viewMode === "archived" ? (
              <Archive className="w-6 h-6" />
            ) : (
              <FolderKanban className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#0C2340]">
              {viewMode === "archived" && archivedProjects.length === 0
                ? "No archived projects"
                : scopedProjects.length === 0
                ? "No active projects in this workspace yet"
                : "No matching projects found"}
            </h3>
            <p className="text-xs text-[#536B85] max-w-sm mx-auto leading-relaxed">
              {viewMode === "archived" && archivedProjects.length === 0
                ? "Projects you archive will appear here with their tasks and milestones preserved."
                : scopedProjects.length === 0
                ? "Create your first project to start tracking milestones, tasks, and financials."
                : "We couldn't find any project matching your filter criteria."}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium text-white bg-[#0C2340] hover:bg-[#0C2340]/90 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters &amp; Reset</span>
            </button>
          ) : viewMode === "archived" ? (
            <button
              type="button"
              onClick={() => setViewMode("active")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium text-[#0C2340] bg-[#FAF8F4] hover:bg-[#E9E5DC] border border-[#DCD7CC] transition-colors cursor-pointer"
            >
              <span>View Active Projects</span>
            </button>
          ) : canWrite ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium text-white bg-[#0C2340] hover:bg-[#0C2340]/90 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Project</span>
            </button>
          ) : null}
        </div>
      )}

      {renderModals()}
    </div>
  );
}
