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
  Tag,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { WorkspaceNoteItem } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";

interface NotesListProps {
  records: WorkspaceNoteItem[];
  onSelect: (note: WorkspaceNoteItem) => void;
  onEdit: (note: WorkspaceNoteItem) => void;
  onDelete: (note: WorkspaceNoteItem) => void;
  onAddNew: () => void;
}

export function NotesList({
  records,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: NotesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated-desc");

  // Only examine records with type === "Note"
  const notes = useMemo(() => records.filter((r) => r.type === "Note"), [records]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => set.add(n.category));
    return Array.from(set).sort();
  }, [notes]);

  // Filter & sort
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchCategory = n.category.toLowerCase().includes(q);
          const matchProject = n.projectTitle?.toLowerCase().includes(q);
          const matchTags = n.tags.some((t) => t.toLowerCase().includes(q));

          if (!matchTitle && !matchContent && !matchCategory && !matchProject && !matchTags) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "all" && n.category !== selectedCategory) {
          return false;
        }

        // Project filter
        if (selectedProject !== "all") {
          if (selectedProject === "unassigned") {
            if (n.projectId) return false;
          } else if (n.projectId !== selectedProject) {
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
  }, [notes, searchTerm, selectedCategory, selectedProject, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedProject !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
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
              placeholder="Search notes by title, content, tags, or workspace..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Add Note Button */}
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Project Attribution Filter */}
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
              <option value="updated-desc">Latest Updated</option>
              <option value="updated-asc">Oldest Updated</option>
              <option value="title-asc">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#E9E5DC] flex items-center justify-between text-xs text-[#536B85]">
            <span>
              Showing <strong>{filteredNotes.length}</strong> of {notes.length} notes
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
      {filteredNotes.length === 0 && (
        <div className="p-10 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#536B85] mx-auto opacity-60" />
          <h3 className="font-semibold text-sm text-[#0C2340]">No Notes Match Your Filters</h3>
          <p className="text-xs text-[#536B85] max-w-sm mx-auto">
            Try adjusting your search query, or clear active category and project filters to browse all workspace notes.
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

      {/* Note Cards Grid */}
      {filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelect(note)}
              className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs p-5 space-y-3.5 hover:border-[#347A63] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#347A63] font-semibold bg-[#EDF5F2] px-2 py-0.5 rounded border border-[#A8CFC2]">
                    {note.category}
                  </span>
                  {note.projectTitle ? (
                    <span className="text-[11px] text-[#536B85] flex items-center gap-1 font-mono">
                      <Building2 className="w-3 h-3 text-[#347A63]" />
                      {note.projectTitle}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#536B85] italic">
                      General Workspace
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#0C2340] group-hover:text-[#347A63] transition-colors leading-snug">
                  {note.title}
                </h3>

                <p className="text-xs text-[#536B85] line-clamp-3 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#E9E5DC]">
                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-[#536B85] bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#DCD7CC] flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 opacity-60" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer with Date & Actions */}
                <div className="flex items-center justify-between text-[11px] text-[#536B85]">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-[#347A63]" />
                    Updated: {note.updatedAt}
                  </span>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(note)}
                      className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4]"
                      title="View details"
                      aria-label="View note"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(note)}
                      className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4]"
                      title="Edit note"
                      aria-label="Edit note"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(note)}
                      className="p-1 rounded text-[#536B85] hover:text-[#8C3B2B] hover:bg-[#FAF8F4]"
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
