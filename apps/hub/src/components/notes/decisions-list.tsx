"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Scale,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  AlertCircle,
  Tag,
} from "lucide-react";
import { WorkspaceNoteItem, DecisionStatus } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";

interface DecisionsListProps {
  records: WorkspaceNoteItem[];
  onSelect: (decision: WorkspaceNoteItem) => void;
  onEdit: (decision: WorkspaceNoteItem) => void;
  onDelete: (decision: WorkspaceNoteItem) => void;
  onAddNew: () => void;
}

export function DecisionsList({
  records,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: DecisionsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated-desc");

  // Only examine records with type === "Decision"
  const decisions = useMemo(
    () => records.filter((r) => r.type === "Decision"),
    [records]
  );

  const getStatusBadge = (status?: DecisionStatus) => {
    switch (status) {
      case "Approved":
        return {
          cls: "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
          icon: CheckCircle2,
        };
      case "Proposed":
        return {
          cls: "bg-[#FAF8F4] text-[#8C6D2B] border-[#D4C39B]",
          icon: Clock,
        };
      case "Rejected":
        return {
          cls: "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]",
          icon: XCircle,
        };
      case "Superseded":
        return {
          cls: "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]",
          icon: Archive,
        };
      default:
        return {
          cls: "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]",
          icon: Scale,
        };
    }
  };

  // Filter & sort
  const filteredDecisions = useMemo(() => {
    return decisions
      .filter((d) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = d.title.toLowerCase().includes(q);
          const matchContent = d.content.toLowerCase().includes(q);
          const matchRationale = d.rationale?.toLowerCase().includes(q);
          const matchImpact = d.impact?.toLowerCase().includes(q);
          const matchCategory = d.category.toLowerCase().includes(q);
          const matchProject = d.projectTitle?.toLowerCase().includes(q);
          const matchTags = d.tags.some((t) => t.toLowerCase().includes(q));

          if (
            !matchTitle &&
            !matchContent &&
            !matchRationale &&
            !matchImpact &&
            !matchCategory &&
            !matchProject &&
            !matchTags
          ) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== "all" && d.status !== selectedStatus) {
          return false;
        }

        // Project filter
        if (selectedProject !== "all") {
          if (selectedProject === "unassigned") {
            if (d.projectId) return false;
          } else if (d.projectId !== selectedProject) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "updated-desc") {
          return b.updatedAtIso.localeCompare(a.updatedAtIso);
        }
        if (sortBy === "updated-asc") {
          return a.updatedAtIso.localeCompare(b.updatedAtIso);
        }
        if (sortBy === "title-asc") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [decisions, searchTerm, selectedStatus, selectedProject, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedProject !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedProject("all");
    setSortBy("updated-desc");
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Actions Toolbar */}
      <div className="p-4 sm:p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search decisions by title, rationale, impact, or tags..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Add Decision Button */}
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
          >
            <Plus className="w-4 h-4" />
            <span>Record Decision</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Decision Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Decision Statuses ({decisions.length})</option>
              <option value="Approved">Approved</option>
              <option value="Proposed">Proposed</option>
              <option value="Rejected">Rejected</option>
              <option value="Superseded">Superseded</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Projects &amp; General</option>
              <option value="unassigned">General Workspace (No Project)</option>
              {CATALOGED_PROJECTS.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer font-medium"
            >
              <option value="updated-desc">Latest Updated / Recorded</option>
              <option value="updated-asc">Oldest Recorded</option>
              <option value="title-asc">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#E9E5DC] flex items-center justify-between text-xs text-[#536B85]">
            <span>
              Showing <strong>{filteredDecisions.length}</strong> of {decisions.length} decisions
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[#347A63] hover:underline font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredDecisions.length === 0 && (
        <div className="p-10 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#536B85] mx-auto opacity-60" />
          <h3 className="font-semibold text-sm text-[#0C2340]">No Decisions Found</h3>
          <p className="text-xs text-[#536B85] max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to browse all documented architectural and operational decisions.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Decision Cards List */}
      {filteredDecisions.length > 0 && (
        <div className="space-y-4">
          {filteredDecisions.map((dec) => {
            const badge = getStatusBadge(dec.status);
            const StatusIcon = badge.icon;

            return (
              <article
                key={dec.id}
                className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs p-5 space-y-4 hover:border-[#347A63] transition-all group"
              >
                {/* Header row: Status badge, Category & Project */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9E5DC] pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${badge.cls}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{dec.status}</span>
                    </span>
                    <span className="text-xs font-mono text-[#536B85]">
                      {dec.category}
                    </span>
                  </div>

                  {dec.projectTitle ? (
                    <span className="text-xs text-[#0C2340] font-mono flex items-center gap-1.5 bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#DCD7CC]">
                      <Building2 className="w-3.5 h-3.5 text-[#347A63]" />
                      {dec.projectTitle}
                    </span>
                  ) : (
                    <span className="text-xs text-[#536B85] italic">
                      General Command Center
                    </span>
                  )}
                </div>

                {/* Title & Core Decision Statement */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelect(dec)}
                      className="text-left text-[#0C2340] group-hover:text-[#347A63] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] rounded-xs cursor-pointer transition-colors"
                    >
                      {dec.title}
                    </button>
                  </h3>
                  <p className="text-xs text-[#0C2340] leading-relaxed">
                    {dec.content}
                  </p>
                </div>

                {/* Rationale & Impact Preview */}
                {(dec.rationale || dec.impact) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F4] p-3 rounded-md border border-[#DCD7CC]">
                    {dec.rationale && (
                      <div className="space-y-1">
                        <strong className="text-[11px] font-semibold text-[#0C2340] uppercase tracking-wider block">
                          Decision Rationale
                        </strong>
                        <p className="text-[#536B85] line-clamp-2 leading-relaxed">
                          {dec.rationale}
                        </p>
                      </div>
                    )}
                    {dec.impact && (
                      <div className="space-y-1">
                        <strong className="text-[11px] font-semibold text-[#0C2340] uppercase tracking-wider block">
                          Consequences &amp; Impact
                        </strong>
                        <p className="text-[#536B85] line-clamp-2 leading-relaxed">
                          {dec.impact}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags, Date & Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {dec.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-[#536B85] bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#DCD7CC] flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 opacity-60" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Metadata and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-[#536B85]">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#347A63]" />
                      Recorded: {dec.createdAt}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelect(dec)}
                        className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer"
                        title={`View decision: ${dec.title}`}
                        aria-label={`View decision: ${dec.title}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(dec)}
                        className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer"
                        title={`Edit decision: ${dec.title}`}
                        aria-label={`Edit decision: ${dec.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(dec)}
                        className="p-1 rounded text-[#536B85] hover:text-[#8C3B2B] hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B2B] cursor-pointer"
                        title={`Delete decision: ${dec.title}`}
                        aria-label={`Delete decision: ${dec.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
