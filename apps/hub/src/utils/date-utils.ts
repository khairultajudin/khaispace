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

/**
 * Validates that an ISO date string (YYYY-MM-DD) represents a real, valid calendar date.
 * Rejects non-existent dates such as 2026-02-31, 2026-13-01, and 2026-04-00.
 */
export function isValidCalendarDate(dateIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateIso.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}
