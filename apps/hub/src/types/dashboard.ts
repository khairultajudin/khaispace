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

export interface TaskEntry {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: "High" | "Medium" | "Normal";
  status: "In Progress" | "Pending";
}
