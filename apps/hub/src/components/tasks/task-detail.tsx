"use client";

import React from "react";
import {
  ArrowLeft,
  Calendar,
  Flag,
  FolderKanban,
  Milestone,
  Info,
  AlertCircle,
} from "lucide-react";
import { TaskItem, TaskStatus } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";

interface TaskDetailProps {
  task: TaskItem;
  onBack: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isOverdue?: boolean;
}

export function TaskDetail({
  task,
  onBack,
  onStatusChange,
  isOverdue = false,
}: TaskDetailProps) {
  const relatedProject = CATALOGED_PROJECTS.find((p) => p.id === task.projectId);

  const priorityStyles = {
    High: "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]",
    Medium: "bg-[#FEF6E7] text-[#B07412] border-[#EAD0A0]",
    Normal: "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]",
  }[task.priority];

  const statusStyles = {
    "In Progress": "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
    Pending: "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]",
    Completed: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  }[task.status];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FFFFFF] hover:bg-[#FAF8F4] text-xs font-medium text-[#0C2340] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#536B85]" />
          <span>Back to Tasks List</span>
        </button>
      </div>

      {/* Main Task Header Card */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-medium">
                {task.projectTitle}
              </span>
              <span
                className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${priorityStyles} flex items-center gap-1`}
              >
                <Flag className="w-2.5 h-2.5" />
                {task.priority} Priority
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C3B2B] bg-[#FBEAE8] px-2 py-0.5 rounded border border-[#E8C2BA]">
                  <AlertCircle className="w-3 h-3" />
                  Past Due Date
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340] leading-tight">
              {task.title}
            </h1>
          </div>

          {/* Interactive Status Selector in Header */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
            <span className="text-[11px] text-[#536B85] font-medium">Current Status</span>
            <div className="flex items-center gap-1.5">
              {(["In Progress", "Pending", "Completed"] as TaskStatus[]).map((statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => onStatusChange(task.id, statusOption)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
                    task.status === statusOption
                      ? statusStyles + " font-semibold ring-1 ring-[#347A63]/30"
                      : "border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:bg-[#E9E5DC]"
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task Full Description */}
        <div className="pt-2 border-t border-[#E9E5DC]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#536B85] mb-2">
            Task Description &amp; Scope
          </h2>
          <p className="text-sm text-[#0C2340] leading-relaxed max-w-3xl">
            {task.description}
          </p>
        </div>
      </div>

      {/* Two Column Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Context */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
            <FolderKanban className="w-4 h-4" />
            <span>Associated Project Context</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#536B85] block mb-1">Project Name</span>
              <div className="font-semibold text-sm text-[#0C2340]">
                {task.projectTitle}
              </div>
            </div>

            {relatedProject && (
              <>
                <div>
                  <span className="text-[#536B85] block mb-1">Category &amp; Lifecycle</span>
                  <div className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] font-medium text-[#0C2340]">
                      {relatedProject.category}
                    </span>
                    <span className="px-2 py-0.5 rounded border border-[#A8CFC2] bg-[#EDF5F2] font-medium text-[#347A63]">
                      {relatedProject.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[#536B85] block mb-1">Filesystem Location</span>
                  <div className="font-mono text-[11px] p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340] break-all">
                    {relatedProject.location}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Schedule & Milestone Context */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
            <Milestone className="w-4 h-4" />
            <span>Schedule &amp; Milestone Alignment</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#536B85] block mb-1">Target Due Date</span>
              <div className="inline-flex items-center gap-2 font-mono text-xs p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340]">
                <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
                <span className="font-semibold">{task.dueDate}</span>
                <span className="text-[#536B85]">({task.dueDateIso})</span>
              </div>
            </div>

            <div>
              <span className="text-[#536B85] block mb-1">Connected Milestone</span>
              {task.milestoneTitle ? (
                <div className="p-3 rounded border border-[#DCD7CC] bg-[#FAF8F4] space-y-1">
                  <div className="font-semibold text-xs text-[#0C2340]">
                    {task.milestoneTitle}
                  </div>
                  <div className="text-[11px] text-[#536B85]">
                    Roadmap reference ID: <code className="font-mono">{task.milestoneId}</code>
                  </div>
                </div>
              ) : (
                <div className="text-[#536B85] italic">
                  Independent operational task (No linked milestone).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session State Disclosure Banner */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-3 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Local Session State Notice:</strong> Any status changes toggled in this view are updated in local React state for the current session. Tasks and milestones are illustrative internal models and are not synchronized with an external issue tracker or remote database.
        </div>
      </div>
    </div>
  );
}
