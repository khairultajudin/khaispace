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

export interface HubProject {
  id: string;
  title: string;
  category: string;
  status: "Active" | "Production" | "In Development" | "Planning" | "Documented";
  location: string;
  description: string;
  tags: string[];
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
