export type NavSection =
  | "overview"
  | "projects"
  | "tasks"
  | "finance"
  | "subscriptions"
  | "notes"
  | "settings";

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  badgeText: string;
  note: string;
}

export type ProjectStatus =
  | "Active"
  | "Production"
  | "In Development"
  | "Planning"
  | "Documented";

export interface ProjectMetadata {
  scope?: string;
  techStack?: string;
  deliveryModel?: string;
  repositoryPath?: string;
  verificationStatus?: "Verified In-Tree" | "Planned / Not Yet Implemented";
  pathStatus?: "Verified Filesystem Path" | "Planned Location (Not on filesystem)";
  stackStatus?: "Active Implementation" | "Proposed / Not Implemented";
}

export interface HubProject {
  id: string;
  title: string;
  category: string;
  status: ProjectStatus;
  location: string;
  description: string;
  tags: string[];
  fullDescription?: string;
  metadata?: ProjectMetadata;
}

export interface ActivityEntry {
  id: string;
  action: string;
  project: string;
  date: string;
  category: "Documentation" | "Scaffold" | "Design" | "Planning";
}

export type TaskPriority = "High" | "Medium" | "Normal";
export type TaskStatus = "In Progress" | "Pending" | "Completed";
export type MilestoneStatus = "Planned" | "In Progress" | "Completed";

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
  project?: string;
  dueDate: string;
  dueDateIso: string;
  priority: TaskPriority;
  status: TaskStatus;
  description: string;
  milestoneId?: string;
  milestoneTitle?: string;
}

export interface MilestoneItem {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
  targetDate: string;
  targetDateIso: string;
  status: MilestoneStatus;
  description: string;
  relatedTaskIds: string[];
}

export type TaskEntry = TaskItem;

export type TransactionType = "Income" | "Expense" | "Investment";

export interface TransactionItem {
  id: string;
  description: string;
  date: string;
  dateIso: string;
  type: TransactionType;
  category: string;
  amount: number;
  projectId?: string;
  projectTitle?: string;
  notes?: string;
  isInvestmentReturn?: boolean;
}

export interface ProjectFinanceSummary {
  projectId: string;
  projectTitle: string;
  category: string;
  income: number;
  expenses: number;
  investment: number;
  netCashflow: number;
  roiPercent: number | null;
  roiNote: string;
}

export interface MonthlyFinancialSummary {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  investment: number;
  netCashflow: number;
}
