"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Calendar, AlertTriangle } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { fetchTasks } from "@/lib/supabase/tasks-service";
import { getLocalTodayIso, isTaskOverdue } from "@/utils/date-utils";
import type { TaskItem } from "../../types/dashboard";

interface UpcomingTasksProps {
  onNavigateToTasks?: () => void;
}

export function UpcomingTasks({ onNavigateToTasks }: UpcomingTasksProps = {}) {
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;
    fetchTasks(activeWorkspace.id)
      .then((rows) => {
        if (!cancelled) {
          setTasks(rows.filter((t) => t.status !== "Completed").slice(0, 5));
        }
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

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
          {onNavigateToTasks && (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="text-xs text-[#347A63] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Tasks &rarr;</span>
            </button>
          )}
        </div>
        <p className="text-xs text-[#536B85] mb-4">
          Open operational tasks prioritized by due date across your workspace.
        </p>

        {isLoading ? (
          <p className="text-xs text-[#536B85]">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-[#536B85] py-4">
            No open tasks queued. Create tasks under Tasks &amp; Milestones.
          </p>
        ) : (
          <div className="space-y-3.5">
            {tasks.map((task, idx) => {
              const overdue = isTaskOverdue(task, getLocalTodayIso());
              return (
              <div
                key={task.id}
                className={`flex items-start justify-between gap-3 text-xs ${
                  idx !== tasks.length - 1 ? "pb-3.5 border-b border-[#E9E5DC]" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="text-[#0C2340] font-medium leading-snug">
                    {task.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#536B85] font-mono">
                    <span className="font-semibold text-[#0C2340]">{task.projectTitle}</span>
                    <span>&bull;</span>
                    <span className={`inline-flex items-center gap-1 ${overdue ? "text-[#8C3B2B] font-semibold" : ""}`}>
                      {overdue ? (
                        <AlertTriangle className="w-3 h-3 text-[#8C3B2B]" />
                      ) : (
                        <Calendar className="w-3 h-3 text-[#536B85]" />
                      )}
                      {task.dueDate}
                      {overdue && " (Overdue)"}
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
                      task.status === "In Progress" ? "text-[#347A63]" : "text-[#536B85]"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E9E5DC] text-[10px] text-[#536B85] italic">
        * Live operational task queue. Manage full lifecycle in Tasks &amp; Milestones.
      </div>
    </div>
  );
}
