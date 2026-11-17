"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import type { HubProject } from "@/types/dashboard";
import {
  fetchProjectDependencyCounts,
  type ProjectDependencyCounts,
} from "@/lib/supabase/projects-service";

interface DeleteProjectModalProps {
  workspaceId: string;
  project: HubProject;
  onClose: () => void;
  onConfirmDelete: (project: HubProject) => Promise<void>;
}

export function DeleteProjectModal({
  workspaceId,
  project,
  onClose,
  onConfirmDelete,
}: DeleteProjectModalProps) {
  const [counts, setCounts] = useState<ProjectDependencyCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProjectDependencyCounts(workspaceId, project.id)
      .then((res) => {
        if (!cancelled) setCounts(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setCountsError(
            err instanceof Error ? err.message : "Could not inspect project dependencies."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCounts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, project.id]);

  const handleDelete = async () => {
    if (!confirmed || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onConfirmDelete(project);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete project.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-project-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#E5B8B8] bg-white p-5 sm:p-6 shadow-xl space-y-4 my-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FDF2F2] border border-[#E5B8B8] text-[#B42318] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="delete-project-modal-title" className="text-base font-bold text-[#0C2340]">
                Delete Project
              </h2>
              <p className="text-xs text-[#536B85]">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete confirmation"
            className="p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs space-y-1">
          <div className="text-[11px] text-[#536B85]">Project to delete:</div>
          <div className="font-semibold text-[#0C2340] text-sm">{project.title}</div>
          <div className="text-[11px] font-mono text-[#536B85]">
            {project.category} &bull; {project.status}
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-[#E5B8B8] bg-[#FDF2F2] text-xs text-[#7A2727] space-y-2">
          <div className="font-semibold">Data Integrity &amp; Dependency Impact</div>
          {isLoadingCounts ? (
            <div className="flex items-center gap-2 text-[#536B85]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Checking linked tasks, milestones, and records...</span>
            </div>
          ) : countsError ? (
            <p>
              Deleting this project will permanently cascade-delete any associated{" "}
              <strong>Tasks</strong> and <strong>Milestones</strong>. Financial records,
              subscriptions, and notes will be preserved and unlinked.
            </p>
          ) : counts ? (
            <ul className="space-y-1 list-disc pl-4">
              <li>
                <strong>Permanently deleted:</strong> {counts.tasks}{" "}
                {counts.tasks === 1 ? "task" : "tasks"} and {counts.milestones}{" "}
                {counts.milestones === 1 ? "milestone" : "milestones"} linked to this project.
              </li>
              <li>
                <strong>Preserved &amp; unlinked:</strong> {counts.financialTransactions} financial{" "}
                {counts.financialTransactions === 1 ? "transaction" : "transactions"},{" "}
                {counts.subscriptions} AI{" "}
                {counts.subscriptions === 1 ? "subscription" : "subscriptions"}, and{" "}
                {counts.notes} workspace {counts.notes === 1 ? "note" : "notes"} will remain in
                the workspace with their project link cleared.
              </li>
            </ul>
          ) : null}
          <p className="text-[11px] text-[#536B85]">
            Tip: If you want to keep tasks and milestones for historical reference, use{" "}
            <strong>Archive</strong> instead.
          </p>
        </div>

        {deleteError && (
          <div
            role="alert"
            className="p-2.5 rounded border border-red-200 bg-red-50 text-red-800 text-xs"
          >
            {deleteError}
          </div>
        )}

        <label className="flex items-start gap-2.5 text-xs text-[#0C2340] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isDeleting}
            className="mt-0.5 rounded border-[#DCD7CC] text-[#B42318] focus:ring-[#B42318]"
          />
          <span>
            I understand that <strong>{project.title}</strong> and its associated tasks and
            milestones will be permanently deleted.
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-md border border-[#DCD7CC] text-xs font-medium text-[#536B85] hover:bg-[#FAF8F4] cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || isDeleting}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#B42318] hover:bg-[#912018] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isDeleting ? "Deleting..." : "Delete Project"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
