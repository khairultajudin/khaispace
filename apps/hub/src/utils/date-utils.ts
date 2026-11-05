import type { TaskItem } from "../types/dashboard";

/**
 * Returns the current calendar date in local YYYY-MM-DD format.
 * Uses local getFullYear, getMonth, and getDate to avoid UTC day-shift bugs.
 */
export function getLocalTodayIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Evaluates whether a task is overdue.
 * A task is overdue only when:
 * 1. Its status is NOT "Completed"; and
 * 2. Its due date ISO string is strictly earlier than the reference/today ISO string.
 */
export function isTaskOverdue(task: TaskItem, todayIso: string): boolean {
  if (task.status === "Completed") {
    return false;
  }
  return task.dueDateIso < todayIso;
}
