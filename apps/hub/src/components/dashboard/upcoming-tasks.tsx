import React from "react";
import { CheckSquare, Calendar } from "lucide-react";
import { SAMPLE_UPCOMING_TASKS } from "../../data/sample-dashboard-data";

interface UpcomingTasksProps {
  onNavigateToTasks?: () => void;
}

export function UpcomingTasks({ onNavigateToTasks }: UpcomingTasksProps = {}) {
  return (
    <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#347A63]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Upcoming Tasks
            </h2>
          </div>
          {onNavigateToTasks ? (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="text-xs text-[#347A63] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Tasks &rarr;</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85]">
              Sample Queue
            </span>
          )}
        </div>
        <p className="text-xs text-[#536B85] mb-4">
          Sample operational tasks prioritized across active workspaces.
        </p>

        <div className="space-y-3.5">
          {SAMPLE_UPCOMING_TASKS.map((task, idx) => (
            <div
              key={task.id}
              className={`flex items-start justify-between gap-3 text-xs ${
                idx !== SAMPLE_UPCOMING_TASKS.length - 1
                  ? "pb-3.5 border-b border-[#E9E5DC]"
                  : ""
              }`}
            >
              <div className="space-y-1">
                <div className="text-[#0C2340] font-medium leading-snug">
                  {task.title}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#536B85] font-mono">
                  <span className="font-semibold text-[#0C2340]">{task.project}</span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#536B85]" />
                    {task.dueDate}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    task.priority === "High"
                      ? "bg-[#FAF8F4] text-[#8C3B2B] border-[#E8C2BA]"
                      : task.priority === "Medium"
                      ? "bg-[#FAF8F4] text-[#B07412] border-[#EAD0A0]"
                      : "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]"
                  }`}
                >
                  {task.priority} Priority
                </span>

                <span
                  className={`text-[10px] font-medium ${
                    task.status === "In Progress"
                      ? "text-[#347A63]"
                      : "text-[#536B85]"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E9E5DC] text-[10px] text-[#536B85] italic">
        * Preview of operational task queue. Full interactive management and milestone alignment available in Tasks &amp; Milestones.
      </div>
    </div>
  );
}
