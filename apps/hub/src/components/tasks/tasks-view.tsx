"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  CheckSquare,
  Search,
  X,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
  ListTodo,
  Milestone,
  Info,
  Plus,
  Loader2,
} from "lucide-react";
import { HubProject, MilestoneItem, TaskItem, TaskPriority, TaskStatus } from "../../types/dashboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { fetchProjects } from "@/lib/supabase/projects-service";
import { createTask, fetchMilestones, fetchTasks, updateTaskStatus } from "@/lib/supabase/tasks-service";
import { getLocalTodayIso, isTaskOverdue } from "../../utils/date-utils";
import { TaskCard } from "./task-card";
import { TaskDetail } from "./task-detail";
import { MilestonesView } from "./milestones-view";

interface TasksViewProps {
  simulatedTodayIso?: string;
}

export function TasksView({ simulatedTodayIso }: TasksViewProps = {}) {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [projects, setProjects] = useState<HubProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "milestones">("tasks");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"due-asc" | "due-desc">("due-asc");

  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Normal");
  const [newTaskDueIso, setNewTaskDueIso] = useState(() => getLocalTodayIso());
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canWrite = activeWorkspace?.role !== "Viewer";

  const loadData = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const [projRows, taskRows] = await Promise.all([
        fetchProjects(activeWorkspace.id),
        fetchTasks(activeWorkspace.id),
      ]);
      const msRows = await fetchMilestones(activeWorkspace.id, taskRows);
      setProjects(projRows);
      setTasks(taskRows);
      setMilestones(msRows);
      setError(null);
      if (projRows.length > 0 && !newTaskProjectId) {
        setNewTaskProjectId(projRows[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, newTaskProjectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Dynamic local calendar date (updates automatically if page remains open across midnight)
  const [currentDateIso, setCurrentDateIso] = useState<string>(() => getLocalTodayIso());
  const todayIso = simulatedTodayIso || currentDateIso;

  useEffect(() => {
    if (simulatedTodayIso) return;
    const timer = setInterval(() => {
      const current = getLocalTodayIso();
      setCurrentDateIso((prev) => (prev !== current ? current : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, [simulatedTodayIso]);

  // Synchronous hash reader for direct task links (#task-<id>)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const match = window.location.hash.match(/^#task-([a-z0-9-]+)$/);
      if (match) return match[1];
    }
    return null;
  });

  // Listen to hash changes
  useEffect(() => {
    const handleHash = () => {
      const match = window.location.hash.match(/^#task-([a-z0-9-]+)$/);
      if (match) {
        setSelectedTaskId(match[1]);
      } else if (window.location.hash === "#milestones") {
        setActiveTab("milestones");
        setSelectedTaskId(null);
      } else if (window.location.hash === "#tasks") {
        setActiveTab("tasks");
        setSelectedTaskId(null);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Update URL hash when task is selected or deselected
  const handleSelectTask = (taskId: string | null) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      window.location.hash = `task-${taskId}`;
    } else {
      window.location.hash = activeTab === "milestones" ? "milestones" : "tasks";
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!activeWorkspace) return;
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await updateTaskStatus(activeWorkspace.id, taskId, newStatus, target?.title ?? "Task");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task status.");
      await loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !user?.id || !newTaskProjectId || !newTaskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask(activeWorkspace.id, user.id, {
        projectId: newTaskProjectId,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        status: "Pending",
        dueDateIso: newTaskDueIso,
        description: newTaskDesc.trim(),
      });
      setShowNewTask(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic summary metrics calculation from active state
  const metrics = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const pending = tasks.filter((t) => t.status === "Pending").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const overdue = tasks.filter((t) => isTaskOverdue(t, todayIso)).length;

    return { total, inProgress, pending, completed, overdue };
  }, [tasks, todayIso]);

  const projectOptions = useMemo(() => {
    return [
      { id: "ALL", title: "All Projects" },
      ...projects.map((p) => ({ id: p.id, title: p.title })),
    ];
  }, [projects]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Project filter
        if (selectedProject !== "ALL" && task.projectId !== selectedProject) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "ALL" && task.status !== selectedStatus) {
          return false;
        }

        // Priority filter
        if (selectedPriority !== "ALL" && task.priority !== selectedPriority) {
          return false;
        }

        // Search query
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description.toLowerCase().includes(q);
          const matchesProject = task.projectTitle.toLowerCase().includes(q);
          const matchesMilestone = task.milestoneTitle?.toLowerCase().includes(q) ?? false;

          if (!matchesTitle && !matchesDesc && !matchesProject && !matchesMilestone) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "due-asc") {
          return a.dueDateIso.localeCompare(b.dueDateIso);
        } else {
          return b.dueDateIso.localeCompare(a.dueDateIso);
        }
      });
  }, [tasks, selectedProject, selectedStatus, selectedPriority, searchQuery, sortOrder]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedProject !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedPriority !== "ALL" ||
    sortOrder !== "due-asc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedProject("ALL");
    setSelectedStatus("ALL");
    setSelectedPriority("ALL");
    setSortOrder("due-asc");
  };

  // If a task detail is active, render TaskDetail view
  if (selectedTaskId) {
    const activeTask = tasks.find((t) => t.id === selectedTaskId);
    if (activeTask) {
      const isOverdue = isTaskOverdue(activeTask, todayIso);
      return (
        <TaskDetail
          task={activeTask}
          onBack={() => handleSelectTask(null)}
          onStatusChange={handleStatusChange}
          isOverdue={isOverdue}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <CheckSquare className="w-4 h-4" />
              <span>Workspace Action Items</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Tasks &amp; Milestones
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Consolidated operational task queue and milestone tracking aligned across all eight repository workspaces. Statuses can be interactively updated in the current session.
            </p>
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={() => setShowNewTask(true)}
              disabled={projects.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0C2340] text-white text-xs font-medium hover:bg-[#133258] disabled:opacity-50 cursor-pointer shrink-0"
              title={projects.length === 0 ? "Create a project first" : "Create a new task"}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          )}
        </div>

        {/* Tab Switcher: Tasks Queue vs Project Milestones */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E9E5DC]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("tasks");
              window.location.hash = "tasks";
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
              activeTab === "tasks"
                ? "bg-[#0C2340] text-white shadow-2xs"
                : "border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC]"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tasks Queue ({tasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("milestones");
              window.location.hash = "milestones";
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
              activeTab === "milestones"
                ? "bg-[#0C2340] text-white shadow-2xs"
                : "border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC]"
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>Project Milestones</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-1">
          <span className="text-xs text-[#536B85] font-medium block">Total Tasks</span>
          <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
            {metrics.total}
          </div>
          <span className="text-[11px] text-[#536B85] block">Across 8 projects</span>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#347A63] font-medium block">In Progress</span>
            <Clock className="w-3.5 h-3.5 text-[#347A63]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#347A63] font-mono">
            {metrics.inProgress}
          </div>
          <span className="text-[11px] text-[#347A63]/80 block">Active focus</span>
        </div>

        {/* Pending */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-1">
          <span className="text-xs text-[#536B85] font-medium block">Pending</span>
          <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
            {metrics.pending}
          </div>
          <span className="text-[11px] text-[#536B85] block">Queued items</span>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF]/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#1D4ED8] font-medium block">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#1D4ED8] font-mono">
            {metrics.completed}
          </div>
          <span className="text-[11px] text-[#1D4ED8]/80 block">Verified deliverables</span>
        </div>

        {/* Overdue */}
        <div
          className={`col-span-2 lg:col-span-1 p-5 rounded-lg border shadow-xs space-y-1 ${
            metrics.overdue > 0
              ? "border-[#E8C2BA] bg-[#FBEAE8]/40"
              : "border-[#DCD7CC] bg-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium block ${
                metrics.overdue > 0 ? "text-[#8C3B2B]" : "text-[#536B85]"
              }`}
            >
              Overdue
            </span>
            <AlertCircle
              className={`w-3.5 h-3.5 ${
                metrics.overdue > 0 ? "text-[#8C3B2B]" : "text-[#536B85]"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold tracking-tight font-mono ${
              metrics.overdue > 0 ? "text-[#8C3B2B]" : "text-[#0C2340]"
            }`}
          >
            {metrics.overdue}
          </div>
          <span
            className={`text-[11px] block ${
              metrics.overdue > 0 ? "text-[#8C3B2B]/80 font-medium" : "text-[#536B85]"
            }`}
          >
            {metrics.overdue > 0 ? "Past due date" : "All on schedule"}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void loadData()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] flex items-start gap-3 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Live Workspace Persistence:</strong> Task statuses and new tasks are persisted to Supabase PostgreSQL under workspace RLS.
          {isLoading ? " Syncing..." : ""}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "milestones" ? (
        <MilestonesView tasks={tasks} milestones={milestones} onSelectTask={handleSelectTask} />
      ) : (
        /* Tasks Queue Tab */
        <div className="space-y-6">
          {/* Search, Filter & Sort Controls */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, description, or project..."
                  className="w-full pl-9 pr-9 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder:text-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters & Sorters Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Project Filter */}
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  aria-label="Filter by project"
                  className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer max-w-[150px] truncate"
                >
                  {projectOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.title}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Filter by status"
                  className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  aria-label="Filter by priority"
                  className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Normal">Normal</option>
                </select>

                {/* Sort Order */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "due-asc" | "due-desc")}
                  aria-label="Sort by due date"
                  className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer font-mono text-[11px]"
                >
                  <option value="due-asc">Due: Earliest First</option>
                  <option value="due-desc">Due: Latest First</option>
                </select>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer shrink-0"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Result count summary */}
            <div className="flex items-center justify-between text-xs text-[#536B85] pt-1">
              <div>
                Showing <strong className="text-[#0C2340]">{filteredTasks.length}</strong> of{" "}
                <strong>{tasks.length}</strong> tasks
                {hasActiveFilters && <span className="italic ml-1">(filtered)</span>}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[#347A63] hover:underline text-[11px] font-medium cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Tasks Grid or Empty State */}
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTasks.map((task) => {
                const isOverdue = isTaskOverdue(task, todayIso);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={handleSelectTask}
                    onStatusChange={handleStatusChange}
                    isOverdue={isOverdue}
                  />
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#0C2340]">No matching tasks found</h3>
                <p className="text-xs text-[#536B85] max-w-sm mx-auto leading-relaxed">
                  We couldn&apos;t find any task matching your filter or search criteria.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium text-white bg-[#0C2340] hover:bg-[#0C2340]/90 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters &amp; Reset</span>
              </button>
            </div>
          )}
        </div>
      )}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCD7CC] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0C2340]">Create New Task</h2>
              <button type="button" onClick={() => setShowNewTask(false)} className="p-1 text-[#536B85]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#0C2340] mb-1">Project</label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0C2340] mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0C2340] mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0C2340] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueIso}
                    onChange={(e) => setNewTaskDueIso(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0C2340] mb-1">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded border border-[#DCD7CC] bg-[#FAF8F4]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="px-3 py-1.5 rounded border border-[#DCD7CC] text-xs text-[#536B85]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0C2340] text-white text-xs font-medium disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
