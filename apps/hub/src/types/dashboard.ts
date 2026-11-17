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

export type SubscriptionStatus = "Active" | "Paused" | "Cancelled" | "Trial";
export type SubscriptionBillingCycle = "Monthly" | "Annual";

export interface AISubscriptionItem {
  id: string;
  provider: string;
  productName: string;
  planName: string;
  category: string;
  billingCycle: SubscriptionBillingCycle;
  amount: number;
  currency: "MYR";
  status: SubscriptionStatus;
  startDate: string;
  startDateIso: string;
  nextBillingDate: string;
  nextBillingDateIso: string;
  assignedProjectId?: string;
  assignedProjectTitle?: string;
  purpose: string;
  notes?: string;
}

export interface SubscriptionCostGroup {
  name: string;
  monthlyEquivalent: number;
  annualEquivalent: number;
  activeCount: number;
  percentage: number;
}

export type NoteRecordType = "Note" | "Decision";
export type DecisionStatus = "Proposed" | "Approved" | "Rejected" | "Superseded";

export interface WorkspaceNoteItem {
  id: string;
  type: NoteRecordType;
  title: string;
  content: string;
  category: string;
  tags: string[];
  projectId?: string;
  projectTitle?: string;
  createdAt: string;
  createdAtIso: string;
  updatedAt: string;
  updatedAtIso: string;
  // Decision-specific fields
  status?: DecisionStatus;
  rationale?: string;
  impact?: string;
}

export interface NoteMetricsSummary {
  totalNotes: number;
  totalDecisions: number;
  approvedDecisions: number;
  proposedDecisions: number;
  rejectedDecisions: number;
  supersededDecisions: number;
}

// -------------------------------------------------------------
// Phase 2G: Members & Settings Data Types
// -------------------------------------------------------------
export type MemberRole = "Owner" | "Administrator" | "Member" | "Viewer";
export type MemberStatus = "Active" | "Pending" | "Suspended";

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  joinedAtIso: string;
  bio?: string;
  invitedBy?: string;
  personalMessage?: string;
}

export interface MemberMetricsSummary {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  suspendedMembers: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  role: MemberRole;
  bio: string;
  location: string;
  timezone: string;
  avatarInitials: string;
}

export type ContentDensity = "comfortable" | "compact";
export type DateFormatOption = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";

export interface WorkspaceSettings {
  workspaceName: string;
  workspaceDescription: string;
  timezone: string;
  defaultCurrency: string;
  dateFormat: DateFormatOption;
  contentDensity: ContentDensity;
  notifications: {
    taskReminders: boolean;
    milestoneUpdates: boolean;
    projectUpdates: boolean;
    workspaceActivity: boolean;
    subscriptionRenewals: boolean;
  };
}
