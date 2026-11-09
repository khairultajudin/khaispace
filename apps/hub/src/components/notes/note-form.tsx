"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, Info, FileText, Scale } from "lucide-react";
import {
  WorkspaceNoteItem,
  NoteRecordType,
  DecisionStatus,
} from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import { getLocalTodayIso } from "../../utils/date-utils";

interface NoteFormProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialType?: NoteRecordType;
  initialData?: WorkspaceNoteItem;
  onSave: (record: WorkspaceNoteItem) => void;
  onClose: () => void;
}

function generateUniqueRecordId(prefix: "note" | "dec"): string {
  const timestamp = Date.now().toString(36);
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) =>
          b.toString(16).padStart(2, "0")
        ).join("")
      : Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${randomPart}`;
}

export function NoteForm({
  isOpen,
  mode,
  initialType = "Note",
  initialData,
  onSave,
  onClose,
}: NoteFormProps) {
  const [type, setType] = useState<NoteRecordType>(() => initialData?.type || initialType);
  const [title, setTitle] = useState<string>(() => initialData?.title || "");
  const [content, setContent] = useState<string>(() => initialData?.content || "");
  const [category, setCategory] = useState<string>(() => initialData?.category || "Architecture");
  const [tagsStr, setTagsStr] = useState<string>(() => initialData?.tags.join(", ") || "");
  const [projectId, setProjectId] = useState<string>(() => initialData?.projectId || "none");
  const [status, setStatus] = useState<DecisionStatus>(() => initialData?.status || "Proposed");
  const [rationale, setRationale] = useState<string>(() => initialData?.rationale || "");
  const [impact, setImpact] = useState<string>(() => initialData?.impact || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = "Record title is required.";
    }

    if (!content.trim()) {
      errs.content = "Content or statement is required.";
    }

    if (!category.trim()) {
      errs.category = "Category is required.";
    }

    if (projectId !== "none") {
      const validProject = CATALOGED_PROJECTS.find((p) => p.id === projectId);
      if (!validProject) {
        errs.projectId = "Selected project must exist in the catalog.";
      }
    }

    if (type === "Decision") {
      if (!rationale.trim()) {
        errs.rationale = "Decision rationale is required for decision records.";
      }
      if (!impact.trim()) {
        errs.impact = "Expected consequences or impact is required.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedProject =
      projectId !== "none"
        ? CATALOGED_PROJECTS.find((p) => p.id === projectId)
        : undefined;

    const todayIso = getLocalTodayIso();
    const todayObj = new Date(todayIso + "T00:00:00");
    const formattedToday = todayObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const parsedTags = tagsStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const prefix = type === "Decision" ? "dec" : "note";
    const id = initialData?.id || generateUniqueRecordId(prefix);

    const savedRecord: WorkspaceNoteItem = {
      id,
      type,
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags: parsedTags,
      projectId: matchedProject?.id,
      projectTitle: matchedProject?.title,
      createdAt: initialData?.createdAt || formattedToday,
      createdAtIso: initialData?.createdAtIso || todayIso,
      updatedAt: formattedToday,
      updatedAtIso: todayIso,
      ...(type === "Decision"
        ? {
            status,
            rationale: rationale.trim(),
            impact: impact.trim(),
          }
        : {}),
    };

    onSave(savedRecord);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-form-title"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <h2 id="note-form-title" className="text-base font-bold text-[#0C2340]">
            {mode === "add"
              ? type === "Decision"
                ? "Record Architectural Decision"
                : "Create Workspace Note"
              : type === "Decision"
              ? "Edit Decision Record"
              : "Edit Workspace Note"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Record Type Selector (Add) or Immutable Display (Edit) */}
          {mode === "edit" ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF8F4] rounded-md border border-[#DCD7CC] text-[#536B85]">
              {type === "Decision" ? (
                <>
                  <Scale className="w-3.5 h-3.5 text-[#0C2340]" />
                  <span>
                    Record Type: <strong className="text-[#0C2340]">Architectural Decision</strong> (Immutable)
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#347A63]" />
                  <span>
                    Record Type: <strong className="text-[#347A63]">Workspace Note</strong> (Immutable)
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF8F4] rounded-md border border-[#DCD7CC]">
              <button
                type="button"
                onClick={() => setType("Note")}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  type === "Note"
                    ? "bg-[#FFFFFF] text-[#347A63] shadow-2xs border border-[#DCD7CC]"
                    : "text-[#536B85] hover:text-[#0C2340]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Workspace Note</span>
              </button>
              <button
                type="button"
                onClick={() => setType("Decision")}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  type === "Decision"
                    ? "bg-[#FFFFFF] text-[#0C2340] shadow-2xs border border-[#DCD7CC]"
                    : "text-[#536B85] hover:text-[#0C2340]"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Decision Record</span>
              </button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="record-title" className="font-semibold text-[#0C2340] block">
              Title <span className="text-[#8C3B2B]">*</span>
            </label>
            <input
              id="record-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "Decision"
                  ? "e.g. Adopt Next.js Static Export for Hub"
                  : "e.g. Monorepo Build Isolation Guidelines"
              }
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
            {errors.title && (
              <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Category & Project Attribution Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="record-category" className="font-semibold text-[#0C2340] block">
                Category Domain <span className="text-[#8C3B2B]">*</span>
              </label>
              <select
                id="record-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="Architecture">Architecture</option>
                <option value="Design & UX">Design &amp; UX</option>
                <option value="Design System">Design System</option>
                <option value="Data Architecture">Data Architecture</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Agronomy">Agronomy</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Deployment">Deployment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="record-project" className="font-semibold text-[#0C2340] block">
                Workspace / Project Attribution
              </label>
              <select
                id="record-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="none">General Workspace (No Project)</option>
                {CATALOGED_PROJECTS.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Decision Status (if Decision) */}
          {type === "Decision" && (
            <div className="space-y-1">
              <label htmlFor="decision-status" className="font-semibold text-[#0C2340] block">
                Decision Lifecycle Status <span className="text-[#8C3B2B]">*</span>
              </label>
              <select
                id="decision-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as DecisionStatus)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="Proposed">Proposed (Under Review)</option>
                <option value="Approved">Approved (Active Standard)</option>
                <option value="Rejected">Rejected</option>
                <option value="Superseded">Superseded</option>
              </select>
            </div>
          )}

          {/* Content / Statement */}
          <div className="space-y-1">
            <label htmlFor="record-content" className="font-semibold text-[#0C2340] block">
              {type === "Decision" ? "Decision Statement" : "Note Body / Description"}{" "}
              <span className="text-[#8C3B2B]">*</span>
            </label>
            <textarea
              id="record-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === "Decision"
                  ? "Explicit decision statement describing the agreed direction..."
                  : "Technical details, procedural notes, or reference parameters..."
              }
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
            {errors.content && (
              <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.content}
              </p>
            )}
          </div>

          {/* Decision Rationale & Impact (if Decision) */}
          {type === "Decision" && (
            <>
              <div className="space-y-1">
                <label htmlFor="decision-rationale" className="font-semibold text-[#0C2340] block">
                  Decision Rationale <span className="text-[#8C3B2B]">*</span>
                </label>
                <textarea
                  id="decision-rationale"
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Why was this decision taken? Trade-offs and context considered..."
                  className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
                />
                {errors.rationale && (
                  <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.rationale}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="decision-impact" className="font-semibold text-[#0C2340] block">
                  Expected Consequences &amp; Impact <span className="text-[#8C3B2B]">*</span>
                </label>
                <textarea
                  id="decision-impact"
                  rows={2}
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  placeholder="Architectural, operational, or downstream workflow consequences..."
                  className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
                />
                {errors.impact && (
                  <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.impact}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Tags */}
          <div className="space-y-1">
            <label htmlFor="record-tags" className="font-semibold text-[#0C2340] block">
              Tags (Comma separated)
            </label>
            <input
              id="record-tags"
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. nextjs, build-pipeline, cloudflare"
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Session Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center gap-2 text-[11px] text-[#536B85]">
            <Info className="w-3.5 h-3.5 text-[#347A63] shrink-0" />
            <span>Updates are preserved in client React session memory only for this session.</span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E9E5DC] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#536B85] hover:text-[#0C2340] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{mode === "add" ? "Save Record" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
