"use client";

import React from "react";
import {
  X,
  Calendar,
  Pencil,
  Trash2,
  Tag,
  Scale,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  FileText,
} from "lucide-react";
import { WorkspaceNoteItem, DecisionStatus } from "../../types/dashboard";

interface NoteDetailProps {
  record: WorkspaceNoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: WorkspaceNoteItem) => void;
  onDelete: (record: WorkspaceNoteItem) => void;
}

export function NoteDetail({
  record,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: NoteDetailProps) {
  if (!isOpen || !record) return null;

  const isDecision = record.type === "Decision";

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

  const badge = getStatusBadge(record.status);
  const StatusIcon = badge.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-detail-title"
    >
      <div className="w-full max-w-xl bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#347A63] flex items-center gap-1.5">
              {isDecision ? (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Decision Record &bull; {record.id}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Workspace Note &bull; {record.id}</span>
                </>
              )}
            </span>
            <h2 id="record-detail-title" className="text-lg font-bold text-[#0C2340]">
              {record.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            aria-label="Close record details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Metadata Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Category Domain</span>
              <span className="font-semibold text-sm text-[#0C2340]">{record.category}</span>
            </div>

            {isDecision && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Decision Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${badge.cls}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{record.status}</span>
                </span>
              </div>
            )}

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Project Attribution</span>
              <span className="font-semibold text-xs text-[#0C2340]">
                {record.projectTitle || "General Workspace"}
              </span>
            </div>
          </div>

          {/* Core Content */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0C2340]">
              {isDecision ? "Decision Statement & Context" : "Note Content"}
            </h3>
            <div className="p-4 rounded-md border border-[#DCD7CC] bg-[#FFFFFF] leading-relaxed text-[#0C2340] whitespace-pre-line text-xs">
              {record.content}
            </div>
          </div>

          {/* Decision Rationale & Impact (if Decision) */}
          {isDecision && (
            <div className="space-y-3">
              {record.rationale && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#347A63]">
                    Underlying Rationale &amp; Considerations
                  </h4>
                  <div className="p-3.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] leading-relaxed text-[#536B85] text-xs">
                    {record.rationale}
                  </div>
                </div>
              )}

              {record.impact && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0C2340]">
                    Consequences &amp; Expected Impact
                  </h4>
                  <div className="p-3.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] leading-relaxed text-[#536B85] text-xs">
                    {record.impact}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {record.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">
                Associated Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {record.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono text-[#536B85] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#DCD7CC] flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-[#347A63]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates & Timeline */}
          <div className="p-3 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#536B85]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
              Created: {record.createdAt}
            </span>
            <span className="flex items-center gap-1">
              Updated: {record.updatedAt}
            </span>
          </div>

          {/* Deep link indicator & Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center justify-between text-[11px] text-[#536B85] font-mono">
            <span>Direct Hash: #{isDecision ? `decision-${record.id}` : `note-${record.id}`}</span>
            <span className="text-[#347A63]">Illustrative Sample Data</span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E9E5DC] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onDelete(record)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-[#E8C2BA] text-[#8C3B2B] hover:bg-[#FBEAE8] font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(record)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#0C2340] font-medium transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
