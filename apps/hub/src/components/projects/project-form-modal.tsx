"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { HubProject, ProjectMetadata, ProjectStatus } from "@/types/dashboard";

export interface ProjectFormValues {
  title: string;
  category: string;
  status: ProjectStatus;
  location: string;
  description: string;
  fullDescription: string;
  tags: string[];
  metadata: ProjectMetadata;
}

interface ProjectFormModalProps {
  mode: "create" | "edit";
  initialProject?: HubProject | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

const PROJECT_STATUSES: ProjectStatus[] = [
  "Planning",
  "In Development",
  "Active",
  "Production",
  "Documented",
];

export function ProjectFormModal({
  mode,
  initialProject,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const [title, setTitle] = useState(initialProject?.title ?? "");
  const [category, setCategory] = useState(initialProject?.category ?? "Engineering");
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status ?? "Planning");
  const [location, setLocation] = useState(initialProject?.location ?? "");
  const [description, setDescription] = useState(initialProject?.description ?? "");
  const [fullDescription, setFullDescription] = useState(initialProject?.fullDescription ?? "");
  const [tagsText, setTagsText] = useState((initialProject?.tags ?? []).join(", "));
  const [startDate, setStartDate] = useState(initialProject?.metadata?.startDate ?? "");
  const [dueDate, setDueDate] = useState(initialProject?.metadata?.dueDate ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Project title is required.");
      return;
    }
    if (!category.trim()) {
      setFormError("Project category is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Project description is required.");
      return;
    }
    if (startDate && dueDate && dueDate < startDate) {
      setFormError("Due date cannot be earlier than start date.");
      return;
    }

    const parsedTags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const nextMetadata: ProjectMetadata = {
      ...(initialProject?.metadata ?? {}),
    };
    if (startDate) {
      nextMetadata.startDate = startDate;
    } else {
      delete nextMetadata.startDate;
    }
    if (dueDate) {
      nextMetadata.dueDate = dueDate;
    } else {
      delete nextMetadata.dueDate;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category: category.trim(),
        status,
        location: location.trim(),
        description: description.trim(),
        fullDescription: fullDescription.trim(),
        tags: parsedTags,
        metadata: nextMetadata,
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : mode === "edit"
          ? "Failed to update project."
          : "Failed to create project."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-form-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#DCD7CC] bg-white p-5 sm:p-6 shadow-xl space-y-4 my-auto">
        <div className="flex items-center justify-between">
          <h2 id="project-form-modal-title" className="text-lg font-semibold text-[#0C2340]">
            {mode === "edit" ? "Edit Project" : "Create New Project"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div
            role="alert"
            className="p-2.5 rounded border border-red-200 bg-red-50 text-red-800 text-xs"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3" noValidate>
          <div>
            <label htmlFor="project-title-input" className="block text-xs font-medium text-[#0C2340] mb-1">
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              id="project-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-category-input" className="block text-xs font-medium text-[#0C2340] mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <input
                id="project-category-input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={100}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="project-status-select" className="block text-xs font-medium text-[#0C2340] mb-1">
                Status
              </label>
              <select
                id="project-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-start-date-input" className="block text-xs font-medium text-[#0C2340] mb-1">
                Start Date
              </label>
              <input
                id="project-start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="project-due-date-input" className="block text-xs font-medium text-[#0C2340] mb-1">
                Due Date
              </label>
              <input
                id="project-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-location-input" className="block text-xs font-medium text-[#0C2340] mb-1">
              Location / Path
            </label>
            <input
              id="project-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. apps/hub or https://..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="project-description-input" className="block text-xs font-medium text-[#0C2340] mb-1">
              Summary Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="project-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
            />
          </div>

          {mode === "edit" && (
            <div>
              <label htmlFor="project-full-description-input" className="block text-xs font-medium text-[#0C2340] mb-1">
                Detailed Overview (optional)
              </label>
              <textarea
                id="project-full-description-input"
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                rows={2}
                disabled={isSubmitting}
                placeholder="Extended architecture or project notes..."
                className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
              />
            </div>
          )}

          <div>
            <label htmlFor="project-tags-input" className="block text-xs font-medium text-[#0C2340] mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="project-tags-input"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="Next.js, Supabase, Commerce"
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 rounded border border-[#DCD7CC] text-xs text-[#536B85] hover:bg-[#FAF8F4] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0C2340] hover:bg-[#133258] text-white text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "edit" ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

