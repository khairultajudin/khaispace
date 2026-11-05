"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  FolderKanban,
  RotateCcw,
  Layers,
} from "lucide-react";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import { ProjectStatus } from "../../types/dashboard";
import { ProjectCard } from "./project-card";
import { ProjectDetail } from "./project-detail";

const STATUS_FILTERS: { id: "ALL" | ProjectStatus; label: string }[] = [
  { id: "ALL", label: "All Projects" },
  { id: "Production", label: "Production" },
  { id: "In Development", label: "In Development" },
  { id: "Active", label: "Active" },
  { id: "Documented", label: "Documented" },
  { id: "Planning", label: "Planning" },
];

export function ProjectsView() {
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

  React.useEffect(() => {
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

  // Compute status counts dynamically from single source of truth
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: CATALOGED_PROJECTS.length,
    };
    for (const project of CATALOGED_PROJECTS) {
      counts[project.status] = (counts[project.status] || 0) + 1;
    }
    return counts;
  }, []);

  // Dynamically calculate Active / Dev count (Production, In Development, Active)
  const activeOrDevCount = useMemo(() => {
    return CATALOGED_PROJECTS.filter(
      (p) =>
        p.status === "Production" ||
        p.status === "In Development" ||
        p.status === "Active"
    ).length;
  }, []);

  // Compute unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const project of CATALOGED_PROJECTS) {
      set.add(project.category);
    }
    return ["ALL", ...Array.from(set)];
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return CATALOGED_PROJECTS.filter((project) => {
      // Status filter
      if (selectedStatus !== "ALL" && project.status !== selectedStatus) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "ALL" && project.category !== selectedCategory) {
        return false;
      }

      // Search query (name, category, description, tags, location)
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
  }, [searchQuery, selectedStatus, selectedCategory]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedStatus !== "ALL" || selectedCategory !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
  };

  // If a project detail is open, render detail view
  if (selectedProjectId) {
    const selectedProject = CATALOGED_PROJECTS.find((p) => p.id === selectedProjectId);
    if (selectedProject) {
      return (
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
        />
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
              <span>Repository Project Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Projects &amp; Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Consolidated registry of all verified applications, research documentation, and
              hardware showcases currently residing in the <code>khairultajudin/khaispace</code> monorepo.
            </p>
          </div>

          {/* Project Count Badges */}
          <div className="shrink-0 flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Total: <strong className="font-semibold">{CATALOGED_PROJECTS.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63]">
              Active / Dev: <strong className="font-semibold">{activeOrDevCount}</strong>
            </div>
          </div>
        </div>

        {/* Status Group Summary Pills */}
        <div className="pt-2 border-t border-[#E9E5DC] flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#536B85] text-[11px] font-mono mr-1">Status Counts:</span>
          {STATUS_FILTERS.map((filter) => {
            const count = statusCounts[filter.id] || 0;
            const isSelected = selectedStatus === filter.id;

            return (
              <button
                key={filter.id}
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
      </div>

      {/* Search & Category Filter Controls */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
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

          {/* Category Dropdown Filter */}
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

            {/* Reset Filters Button */}
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

        {/* Filter Summary & Result Count */}
        <div className="flex items-center justify-between text-xs text-[#536B85] pt-1">
          <div>
            Showing <strong className="text-[#0C2340]">{filteredProjects.length}</strong> of{" "}
            <strong>{CATALOGED_PROJECTS.length}</strong> projects
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

      {/* Projects Grid or Empty State */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelectProject={setSelectedProjectId}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#0C2340]">No matching projects found</h3>
            <p className="text-xs text-[#536B85] max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any project matching your query &ldquo;{searchQuery}&rdquo; or filter
              criteria.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium text-white bg-[#0C2340] hover:bg-[#0C2340]/90 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters &amp; Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
