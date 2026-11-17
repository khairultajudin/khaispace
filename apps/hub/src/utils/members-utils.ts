import { WorkspaceMember, MemberMetricsSummary, MemberRole, MemberStatus } from "../types/dashboard";

export function calculateMemberMetrics(members: WorkspaceMember[]): MemberMetricsSummary {
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const pendingInvitations = members.filter((m) => m.status === "Pending").length;
  const suspendedMembers = members.filter((m) => m.status === "Suspended").length;

  return {
    totalMembers,
    activeMembers,
    pendingInvitations,
    suspendedMembers,
  };
}

export function getMemberInitials(name: string): string {
  if (!name.trim()) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleBadgeStyle(role: MemberRole): { cls: string; label: string } {
  switch (role) {
    case "Owner":
      return {
        cls: "bg-[#0C2340] text-white border-[#0C2340]",
        label: "Workspace Owner",
      };
    case "Administrator":
      return {
        cls: "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
        label: "Administrator",
      };
    case "Member":
      return {
        cls: "bg-[#FAF8F4] text-[#0C2340] border-[#DCD7CC]",
        label: "Team Member",
      };
    case "Viewer":
      return {
        cls: "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]",
        label: "Observer / Viewer",
      };
  }
}

export function getStatusBadgeStyle(status: MemberStatus): { cls: string; label: string } {
  switch (status) {
    case "Active":
      return {
        cls: "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
        label: "Active",
      };
    case "Pending":
      return {
        cls: "bg-[#FAF8F4] text-[#8C6D2B] border-[#D4C39B]",
        label: "Pending Invite",
      };
    case "Suspended":
      return {
        cls: "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]",
        label: "Suspended",
      };
  }
}
