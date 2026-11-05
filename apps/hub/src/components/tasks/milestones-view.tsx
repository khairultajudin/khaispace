"use client";

import React from "react";
import {
  Milestone,
  Calendar,
  Info,
} from "lucide-react";
import { MilestoneItem, TaskItem } from "../../types/dashboard";
import { SAMPLE_MILESTONES } from "../../data/sample-dashboard-data";

interface MilestonesViewProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
}

export function MilestonesView({ tasks, onSelectTask }: MilestonesViewProps) {
  const milestoneStatusStyles = {
    Completed: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    "In Progress": "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
    Planned: "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]",
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
              Consolidated roadmap milestones connecting active workspaces with verifiable targets and scheduled deliverables.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Milestones: <strong className="font-semibold">{SAMPLE_MILESTONES.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Milestones Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SAMPLE_MILESTONES.map((milestone: MilestoneItem) => {
          // Calculate dynamic progress from related tasks
          const linkedTasks = tasks.filter((t) =>
            milestone.relatedTaskIds.includes(t.id)
          );
          const completedLinked = linkedTasks.filter(
            (t) => t.status === "Completed"
          ).length;
          const progressPercent =
            linkedTasks.length > 0
              ? Math.round((completedLinked / linkedTasks.length) * 100)
              : milestone.status === "Completed"
              ? 100
              : 0;

          return (
            <div
              key={milestone.id}
              className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-medium">
                    {milestone.projectTitle}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                      milestoneStatusStyles[milestone.status]
                    }`}
                  >
                    {milestone.status}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-[#0C2340] leading-snug">
                    {milestone.title}
                  </h3>
                  <p className="text-xs text-[#536B85] mt-1.5 leading-relaxed">
                    {milestone.description}
                  </p>
                </div>

                {/* Target Date */}
                <div className="flex items-center gap-1.5 text-xs text-[#536B85] font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
                  <span>Target Date: {milestone.targetDate}</span>
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

      {/* Planning Notice */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-3 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Grounded Milestone Context:</strong> Milestones reflect strategic targets across documented workspaces. Progress percentages are dynamically derived from linked task statuses in your active session.
        </div>
      </div>
    </div>
  );
}
