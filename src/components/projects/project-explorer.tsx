"use client";

import {
  ArrowDownAZ,
  FlaskConical,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import type { ProjectItem, ProjectStatus } from "@/content/projects";
import { services, type ServiceSlug } from "@/content/services";
import { cn } from "@/lib/cn";

type SortMode = "featured" | "alpha";

type ProjectExplorerProps = {
  items: readonly ProjectItem[];
  statuses: readonly ProjectStatus[];
};

export function ProjectExplorer({ items, statuses }: ProjectExplorerProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | ServiceSlug
  >("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ProjectStatus>(
    "all",
  );
  const [demoOnly, setDemoOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("featured");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.serviceSlug] = (counts[item.serviceSlug] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const matched = items.filter((project) => {
      if (
        selectedCategory !== "all" &&
        project.serviceSlug !== selectedCategory
      ) {
        return false;
      }

      if (selectedStatus !== "all" && project.status !== selectedStatus) {
        return false;
      }

      if (demoOnly && !project.demoHref) {
        return false;
      }

      if (!normalized) return true;

      const haystack = [
        project.title,
        project.subtitle,
        project.categoryLabel,
        project.status,
        project.summary,
        ...project.technologies,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });

    if (sortMode === "alpha") {
      return [...matched].sort((a, b) => a.title.localeCompare(b.title));
    }

    return [...matched].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [items, query, selectedCategory, selectedStatus, demoOnly, sortMode]);

  const hasFilters =
    query.trim().length > 0 ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    demoOnly;

  function resetFilters() {
    setQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setDemoOnly(false);
    setSortMode("featured");
  }

  return (
    <div>
      {/* Search + Filter Control Panel */}
      <div className="studio-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <label htmlFor="project-search" className="sr-only">
              Search projects by name, category, or technology
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="project-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by project name, problem, or technology (e.g. Next.js, IoT, AI)..."
              className="h-11 w-full rounded-xl border border-border-strong bg-background pl-10 pr-4 text-sm text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 lg:justify-end">
            <button
              type="button"
              onClick={() => setDemoOnly((v) => !v)}
              aria-pressed={demoOnly}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-colors",
                demoOnly
                  ? "border-cyan bg-cyan-soft text-[#0E7490]"
                  : "border-border-strong bg-background text-navy hover:border-electric hover:text-electric",
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              <span>Has Demo</span>
            </button>

            <div className="inline-flex rounded-xl border border-border-strong bg-background p-1">
              <button
                type="button"
                onClick={() => setSortMode("featured")}
                aria-pressed={sortMode === "featured"}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                  sortMode === "featured"
                    ? "bg-navy text-white"
                    : "text-muted hover:text-navy",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                <span>Featured</span>
              </button>
              <button
                type="button"
                onClick={() => setSortMode("alpha")}
                aria-pressed={sortMode === "alpha"}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                  sortMode === "alpha"
                    ? "bg-navy text-white"
                    : "text-muted hover:text-navy",
                )}
              >
                <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden />
                <span>A–Z</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                selectedCategory === "all"
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-background text-muted hover:border-electric hover:text-navy",
              )}
            >
              All ({items.length})
            </button>
            {services.map((service) => {
              const count = categoryCounts[service.slug] ?? 0;
              return (
                <button
                  key={service.slug}
                  type="button"
                  onClick={() => setSelectedCategory(service.slug)}
                  aria-pressed={selectedCategory === service.slug}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    selectedCategory === service.slug
                      ? "border-electric bg-electric text-white"
                      : "border-border bg-background text-muted hover:border-electric hover:text-navy",
                  )}
                >
                  {service.title} ({count})
                </button>
              );
            })}
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Status:
            </span>
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              aria-pressed={selectedStatus === "all"}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                selectedStatus === "all"
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-background text-muted hover:border-electric hover:text-navy",
              )}
            >
              All Statuses
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                aria-pressed={selectedStatus === status}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  selectedStatus === status
                    ? "border-violet bg-violet text-white"
                    : "border-border bg-background text-muted hover:border-violet hover:text-navy",
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Result Count & Active Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p
            aria-live="polite"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted"
          >
            <SlidersHorizontal className="h-4 w-4 text-electric" aria-hidden />
            <span>
              Showing <strong className="text-navy">{filteredProjects.length}</strong>{" "}
              of {items.length} projects
            </span>
          </p>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-electric hover:bg-electric hover:text-white"
                >
                  <span>
                    {services.find((s) => s.slug === selectedCategory)?.shortTitle}
                  </span>
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
              {selectedStatus !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet hover:bg-violet hover:text-white"
                >
                  <span>{selectedStatus}</span>
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
              {demoOnly && (
                <button
                  type="button"
                  onClick={() => setDemoOnly(false)}
                  className="inline-flex items-center gap-1 rounded-full bg-cyan-soft px-2.5 py-1 text-xs font-semibold text-[#0E7490] hover:bg-navy hover:text-white"
                >
                  <span>Has Demo</span>
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredProjects.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              priority={index < 2}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="font-heading text-lg font-bold text-navy">
            No projects match your current filters.
          </p>
          <p className="mt-2 text-sm text-muted">
            Try clearing your search keyword or switching back to all categories
            and statuses.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-electric px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-electric-dark"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
