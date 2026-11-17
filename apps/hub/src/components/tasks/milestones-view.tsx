"use client";

import React, { useState } from "react";
import {
  Milestone,
  Calendar,
  Info,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { HubProject, MilestoneItem, MilestoneStatus, TaskItem } from "../../types/dashboard";

interface MilestonesViewProps {
  tasks: TaskItem[];
  milestones: MilestoneItem[];
  projects: HubProject[];
  canWrite: boolean;
  todayIso: string;
  onSelectTask: (taskId: string) => void;
  onCreateMilestone: (input: {
    projectId: string;
    title: string;
    targetDateIso: string;
    status: MilestoneStatus;
    description?: string;
  }) => Promise<void>;
  onUpdateMilestone: (
    milestoneId: string,
    input: {
      projectId: string;
      title: string;
      targetDateIso: string;
      status: MilestoneStatus;
      description?: string;
    }
  ) => Promise<void>;
  onStatusChange: (milestoneId: string, status: MilestoneStatus) => Promise<void>;
  onDeleteMilestone: (milestone: MilestoneItem) => Promise<void>;
}

export function MilestonesView({
  tasks,
  milestones,
  projects,
  canWrite,
  todayIso,
  onSelectTask,
  onCreateMilestone,
  onUpdateMilestone,
  onStatusChange,
  onDeleteMilestone,
}: MilestonesViewProps) {
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    editing?: MilestoneItem;
  }>({ open: false, mode: "create" });
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [targetDateIso, setTargetDateIso] = useState(todayIso);
  const [status, setStatus] = useState<MilestoneStatus>("Planned");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MilestoneItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const milestoneStatusStyles: Record<MilestoneStatus, string> = {
    Completed: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    "In Progress": "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
    Planned: "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]",
  };

  const openCreate = () => {
    setTitle("");
    setProjectId(projects[0]?.id ?? "");
    setTargetDateIso(todayIso);
    setStatus("Planned");
    setDescription("");
    setFormError(null);
    setFormState({ open: true, mode: "create" });
  };

  const openEdit = (ms: MilestoneItem) => {
    setTitle(ms.title);
    setProjectId(ms.projectId);
    setTargetDateIso(ms.targetDateIso);
    setStatus(ms.status);
    setDescription(ms.description);
    setFormError(null);
    setFormState({ open: true, mode: "edit", editing: ms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !targetDateIso) {
      setFormError("Milestone title, project, and target date are required.");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (formState.mode === "edit" && formState.editing) {
        await onUpdateMilestone(formState.editing.id, {
          projectId,
          title: title.trim(),
          targetDateIso,
          status,
          description: description.trim(),
        });
      } else {
        await onCreateMilestone({
          projectId,
          title: title.trim(),
          targetDateIso,
          status,
          description: description.trim(),
        });
      }
      setFormState({ open: false, mode: "create" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save milestone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDeleteMilestone(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header Banner */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <Milestone className="w-4 h-4" />
              <span>Project Roadmap &amp; Deliverables</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
              Strategic Project Milestones
            </h2>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Track project milestones, target delivery dates, and linked task completion progress.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Milestones: <strong className="font-semibold">{milestones.length}</strong>
            </span>
            {canWrite && (
              <button
                type="button"
                onClick={openCreate}
                disabled={projects.length === 0}
                title={projects.length === 0 ? "Create a project first" : "Create a new milestone"}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0C2340] hover:bg-[#133258] text-white font-sans font-medium disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Milestone</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Milestones Cards Grid */}
      {milestones.length === 0 ? (
        <div className="p-10 rounded-lg border border-dashed border-[#DCD7CC] bg-white text-center space-y-3">
          <p className="text-sm font-semibold text-[#0C2340]">No milestones created yet</p>
          <p className="text-xs text-[#536B85] max-w-sm mx-auto">
            Group project tasks under strategic milestones to track delivery targets.
          </p>
          {canWrite && projects.length > 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0C2340] text-white text-xs font-medium hover:bg-[#133258] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {milestones.map((milestone: MilestoneItem) => {
            const linkedTasks = tasks.filter(
              (t) => t.milestoneId === milestone.id || milestone.relatedTaskIds.includes(t.id)
            );
            const completedLinked = linkedTasks.filter((t) => t.status === "Completed").length;
            const progressPercent =
              linkedTasks.length > 0
                ? Math.round((completedLinked / linkedTasks.length) * 100)
                : milestone.status === "Completed"
                ? 100
                : 0;
            const isOverdue =
              milestone.status !== "Completed" && milestone.targetDateIso < todayIso;

            return (
              <div
                key={milestone.id}
                className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-medium truncate">
                      {milestone.projectTitle}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {canWrite ? (
                        <select
                          value={milestone.status}
                          onChange={(e) =>
                            void onStatusChange(milestone.id, e.target.value as MilestoneStatus)
                          }
                          aria-label={`Change status for ${milestone.title}`}
                          className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                            milestoneStatusStyles[milestone.status]
                          } cursor-pointer`}
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        <span
                          className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                            milestoneStatusStyles[milestone.status]
                          }`}
                        >
                          {milestone.status}
                        </span>
                      )}

                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(milestone)}
                            aria-label={`Edit milestone: ${milestone.title}`}
                            className="p-1 rounded border border-[#DCD7CC] text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(milestone)}
                            aria-label={`Delete milestone: ${milestone.title}`}
                            className="p-1 rounded border border-[#E5B8B8] bg-[#FDF2F2] text-[#B42318] hover:bg-[#FEE4E2] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-[#0C2340] leading-snug">
                      {milestone.title}
                    </h3>
                    {milestone.description && (
                      <p className="text-xs text-[#536B85] mt-1.5 leading-relaxed">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  {/* Target Date & Overdue */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="inline-flex items-center gap-1.5 text-[#536B85]">
                      <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
                      <span>Target: {milestone.targetDate}</span>
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-[#8C3B2B] bg-[#FBEAE8] px-1.5 py-0.5 rounded border border-[#E8C2BA]">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#536B85]">Task Completion</span>
                      <span className="font-semibold text-[#0C2340]">
                        {progressPercent}% ({completedLinked}/{linkedTasks.length})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E9E5DC] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progressPercent === 100
                            ? "bg-[#1D4ED8]"
                            : progressPercent > 0
                            ? "bg-[#347A63]"
                            : "bg-transparent"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Connected Tasks List */}
                {linkedTasks.length > 0 && (
                  <div className="pt-3 border-t border-[#E9E5DC] space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#536B85] block">
                      Connected Tasks ({linkedTasks.length})
                    </span>
                    <div className="space-y-1.5">
                      {linkedTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onSelectTask(task.id)}
                          className="w-full text-left p-2 rounded border border-[#E9E5DC] bg-[#FAF8F4] hover:bg-[#E9E5DC] transition-colors flex items-center justify-between gap-2 text-xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
                        >
                          <span className="truncate text-[#0C2340] font-medium group-hover:text-[#347A63]">
                            {task.title}
                          </span>
                          <span
                            className={`shrink-0 font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                              task.status === "Completed"
                                ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]"
                                : task.status === "In Progress"
                                ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                                : "bg-[#FFFFFF] text-[#536B85] border-[#DCD7CC]"
                            }`}
                          >
                            {task.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Planning Notice */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-3 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Live Milestone Tracking:</strong> Deleting
          a milestone preserves all linked tasks and clears their milestone reference automatically.
        </div>
      </div>

      {/* Create / Edit Milestone Modal */}
      {formState.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[#DCD7CC] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0C2340]">
                {formState.mode === "edit" ? "Edit Milestone" : "Create Milestone"}
              </h3>
              <button
                type="button"
                onClick={() => setFormState({ open: false, mode: "create" })}
                className="p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded border border-red-200 bg-red-50 text-red-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-medium text-[#0C2340] mb-1">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0C2340] mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  required
                  className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0C2340] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                    className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0C2340] mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDateIso}
                    onChange={(e) => setTargetDateIso(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0C2340] mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormState({ open: false, mode: "create" })}
                  className="px-3 py-1.5 rounded border border-[#DCD7CC] text-xs text-[#536B85] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0C2340] text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {formState.mode === "edit" ? "Save Milestone" : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Milestone Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[#E5B8B8] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#0C2340]">Delete Milestone?</h3>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-[#0C2340]">&ldquo;{deleteTarget.title}&rdquo;</strong>?
              Linked tasks will be preserved and unlinked from this milestone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded border border-[#DCD7CC] text-xs text-[#536B85] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#B42318] text-white text-xs font-medium cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
