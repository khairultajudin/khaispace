"use client";

import React from "react";
import { Calendar, Flag, AlertCircle } from "lucide-react";
import { TaskItem, TaskStatus } from "../../types/dashboard";

interface TaskCardProps {
  task: TaskItem;
  onSelectTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isOverdue?: boolean;
}

export function TaskCard({
  task,
  onSelectTask,
  onStatusChange,
  isOverdue = false,
}: TaskCardProps) {
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
    <div className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs hover:border-[#347A63]/60 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Primary Semantic Action Button */}
      <button
        type="button"
        onClick={() => onSelectTask(task.id)}
        aria-label={`Open task details: ${task.title}`}
        className="w-full p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] focus-visible:ring-inset space-y-3 block"
      >
        {/* Header row: Project badge & Priority */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-medium truncate max-w-[65%]">
            {task.projectTitle}
          </span>
          <span
            className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${priorityStyles} flex items-center gap-1 shrink-0`}
          >
            <Flag className="w-2.5 h-2.5" />
            {task.priority}
          </span>
        </div>

        {/* Task Title */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#0C2340] group-hover:text-[#347A63] transition-colors leading-snug">
            {task.title}
          </h3>
          <p className="text-xs text-[#536B85] line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>

        {/* Milestone reference if available */}
        {task.milestoneTitle && (
          <div className="text-[11px] text-[#536B85] flex items-center gap-1.5 pt-1">
            <span className="text-[#347A63] font-medium">Milestone:</span>
            <span className="truncate">{task.milestoneTitle}</span>
          </div>
        )}
      </button>

      {/* Sibling Bottom Action Footer (Independent from Card Button) */}
      <div className="px-5 py-3 border-t border-[#E9E5DC] bg-[#FAF8F4]/60 flex items-center justify-between gap-3 text-xs">
        {/* Due Date & Overdue status */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#536B85]">
          <Calendar className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
          <span>{task.dueDate}</span>
          {isOverdue && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-sans font-semibold text-[#8C3B2B] bg-[#FBEAE8] px-1.5 py-0.2 rounded border border-[#E8C2BA]"
              title="Task is past its due date"
            >
              <AlertCircle className="w-2.5 h-2.5" />
              Overdue
            </span>
          )}
        </div>

        {/* Interactive Status Changer */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label htmlFor={`status-${task.id}`} className="sr-only">
            Status for {task.title}
          </label>
          <div className="relative">
            <select
              id={`status-${task.id}`}
              value={task.status}
              onChange={(e) =>
                onStatusChange(task.id, e.target.value as TaskStatus)
              }
              aria-label={`Change status for ${task.title}`}
              className={`text-[11px] font-medium py-1 px-2.5 rounded border ${statusStyles} focus:outline-none focus:ring-1 focus:ring-[#347A63] cursor-pointer`}
            >
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
