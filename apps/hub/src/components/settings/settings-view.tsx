"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Users,
  User,
  Sliders,
  UserPlus,
  AlertTriangle,
  UserX,
  UserCheck,
  KeyRound,
} from "lucide-react";
import {
  WorkspaceMember,
  UserProfile,
  WorkspaceSettings,
} from "../../types/dashboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import {
  createWorkspaceInvitation,
  fetchWorkspaceRoster,
  removeWorkspaceMember,
  updateMemberRoleOrStatus,
} from "@/lib/supabase/members-service";
import {
  fetchUserProfile,
  fetchWorkspaceSettings,
  updateUserProfile,
  updateWorkspaceSettings,
} from "@/lib/supabase/settings-service";
import { MembersMetrics } from "./members-metrics";
import { MembersList } from "./members-list";
import { MemberDetail } from "./member-detail";
import { MemberForm } from "./member-form";
import { ProfileSettings } from "./profile-settings";
import { WorkspaceSettingsView } from "./workspace-settings";

type SettingsTab = "members" | "profile" | "workspace";

export function SettingsView() {
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id ?? "",
    fullName: "",
    displayName: "",
    email: user?.email ?? "",
    role: activeWorkspace?.role ?? "Member",
    bio: "",
    location: "",
    timezone: "Asia/Kuala_Lumpur (GMT+8)",
    avatarInitials: "KS",
  });
  const [settings, setSettings] = useState<WorkspaceSettings>({
    workspaceName: activeWorkspace?.name ?? "",
    workspaceDescription: activeWorkspace?.description ?? "",
    timezone: activeWorkspace?.timezone ?? "Asia/Kuala_Lumpur (GMT+8)",
    defaultCurrency: activeWorkspace?.defaultCurrency ?? "MYR (RM)",
    dateFormat: "YYYY-MM-DD",
    contentDensity: "comfortable",
    notifications: {
      taskReminders: true,
      milestoneUpdates: true,
      projectUpdates: true,
      workspaceActivity: false,
      subscriptionRenewals: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [settingsVersion, setSettingsVersion] = useState(0);

  const loadSettingsData = useCallback(async () => {
    if (!activeWorkspace || !user) return;
    try {
      const [roster, prof, wsSettings] = await Promise.all([
        fetchWorkspaceRoster(activeWorkspace.id, activeWorkspace.role),
        fetchUserProfile(user.id, activeWorkspace.role),
        fetchWorkspaceSettings(activeWorkspace.id),
      ]);
      setMembers(roster);
      setProfile(prof);
      setSettings(wsSettings);
      setError(null);
      setProfileVersion((v) => v + 1);
      setSettingsVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members and settings.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSettingsData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSettingsData]);

  // Active sub-tab state (lazy initialized from hash)
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "profile") return "profile";
      if (hash === "workspace-settings" || hash === "workspace") return "workspace";
      return "members";
    }
    return "members";
  });

  // Selected member for detail modal / deep linking
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);

  // Form modal state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "invite" | "edit";
    data?: WorkspaceMember;
  }>({
    isOpen: false,
    mode: "invite",
  });

  // Remove confirmation modal state
  const [deleteCandidate, setDeleteCandidate] = useState<WorkspaceMember | null>(null);

  // Status toggle (suspend/reactivate) candidate
  const [statusCandidate, setStatusCandidate] = useState<WorkspaceMember | null>(null);

  // Synchronize URL hash with active sub-tabs and deep links
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");

      if (hash === "settings" || hash === "members") {
        setActiveTab("members");
        setSelectedMember(null);
      } else if (hash === "profile") {
        setActiveTab("profile");
        setSelectedMember(null);
      } else if (hash === "workspace-settings" || hash === "workspace") {
        setActiveTab("workspace");
        setSelectedMember(null);
      } else if (hash.startsWith("member-")) {
        setActiveTab("members");
        const id = hash.replace("member-", "");
        const matched = members.find((m) => m.id === hash || m.id === id);
        setSelectedMember(matched || null);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, [members]);

  const setTabAndHash = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSelectedMember(null);
    if (typeof window !== "undefined") {
      const hash =
        tab === "members"
          ? "#members"
          : tab === "profile"
          ? "#profile"
          : "#workspace-settings";
      window.history.pushState(null, "", hash);
    }
  };

  const openDetail = useCallback((member: WorkspaceMember) => {
    setSelectedMember(member);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#member-${member.id}`);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedMember(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  const handleAddNewMember = () => {
    setFormModal({
      isOpen: true,
      mode: "invite",
    });
  };

  const handleEditMember = (member: WorkspaceMember) => {
    setFormModal({
      isOpen: true,
      mode: "edit",
      data: member,
    });
  };

  const handleSaveMember = async (savedMember: WorkspaceMember) => {
    if (!activeWorkspace || !user?.id) return;
    setError(null);
    try {
      if (formModal.mode === "invite") {
        if (savedMember.role === "Owner") {
          throw new Error("Cannot invite a second Owner.");
        }
        const { inviteToken } = await createWorkspaceInvitation(activeWorkspace.id, user.id, {
          email: savedMember.email,
          role: savedMember.role,
          personalMessage: savedMember.personalMessage,
        });
        setLastInviteToken(inviteToken);
      } else {
        await updateMemberRoleOrStatus(activeWorkspace.id, savedMember.id, {
          role: savedMember.role,
          status: savedMember.status,
        });
      }
      setFormModal({ isOpen: false, mode: "invite" });
      await loadSettingsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save member.");
    }
  };

  const handleDeletePrompt = (member: WorkspaceMember) => {
    if (member.role === "Owner") return;
    setDeleteCandidate(member);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate || deleteCandidate.role === "Owner" || !activeWorkspace) return;
    try {
      await removeWorkspaceMember(activeWorkspace.id, deleteCandidate.id);
      if (selectedMember?.id === deleteCandidate.id) {
        closeDetail();
      }
      setDeleteCandidate(null);
      await loadSettingsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    }
  };

  const handleToggleStatusPrompt = (member: WorkspaceMember) => {
    if (member.role === "Owner") return;
    setStatusCandidate(member);
  };

  const confirmToggleStatus = async () => {
    if (!statusCandidate || statusCandidate.role === "Owner" || !activeWorkspace) return;
    const newStatus = statusCandidate.status === "Suspended" ? "Active" : "Suspended";
    try {
      await updateMemberRoleOrStatus(activeWorkspace.id, statusCandidate.id, { status: newStatus });
      setStatusCandidate(null);
      await loadSettingsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member status.");
    }
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    if (!user?.id) return;
    setError(null);
    try {
      await updateUserProfile(user.id, {
        fullName: updatedProfile.fullName,
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
        timezone: updatedProfile.timezone,
        avatarInitials: updatedProfile.avatarInitials,
      });
      await loadSettingsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    }
  };

  const handleResetProfile = () => {
    void loadSettingsData();
  };

  const handleSaveWorkspaceSettings = async (updatedSettings: WorkspaceSettings) => {
    if (!activeWorkspace) return;
    setError(null);
    try {
      await updateWorkspaceSettings(activeWorkspace.id, updatedSettings);
      await Promise.all([loadSettingsData(), refreshWorkspaces()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace settings.");
    }
  };

  const handleResetWorkspaceSettings = () => {
    void loadSettingsData();
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <Settings className="w-4 h-4" />
              <span>Workspace Administration &bull; Roster &bull; Identity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Members &amp; Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Collaborator directory, role-based access management, personal owner profile, and global workspace configuration parameters.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-mono text-[#536B85]">
              {isLoading ? "Syncing..." : activeWorkspace?.role}
            </span>

            {activeTab === "members" && (activeWorkspace?.role === "Owner" || activeWorkspace?.role === "Administrator") && (
              <button
                type="button"
                onClick={handleAddNewMember}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Metric Grid (Shown in Members tab) */}
        {activeTab === "members" && <MembersMetrics members={members} />}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#DCD7CC] gap-2 overflow-x-auto pb-px">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Sub-tab 1: Members */}
          <button
            type="button"
            onClick={() => setTabAndHash("members")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "members"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Directory ({members.length})</span>
          </button>

          {/* Sub-tab 2: Profile */}
          <button
            type="button"
            onClick={() => setTabAndHash("profile")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Owner Profile</span>
          </button>

          {/* Sub-tab 3: Workspace Settings */}
          <button
            type="button"
            onClick={() => setTabAndHash("workspace")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "workspace"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Workspace Settings</span>
          </button>
        </div>

      </div>
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void loadSettingsData()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}
      {lastInviteToken && (
        <div className="p-4 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2] text-xs text-[#0C2340] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5 text-[#347A63]">
              <KeyRound className="w-4 h-4" />
              Invitation Created — Share Token Once
            </span>
            <button type="button" onClick={() => setLastInviteToken(null)} className="text-[#536B85] underline">
              Dismiss
            </button>
          </div>
          <p className="text-[#536B85]">
            Only the SHA-256 hash is stored in the database. Share this token securely with the invited user:
          </p>
          <code className="block p-2 rounded bg-white border border-[#DCD7CC] font-mono text-[11px] break-all">
            {lastInviteToken}
          </code>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === "members" && (
        <MembersList
          members={members}
          onSelect={openDetail}
          onEdit={handleEditMember}
          onDelete={handleDeletePrompt}
          onToggleStatus={handleToggleStatusPrompt}
          onAddNew={handleAddNewMember}
        />
      )}

      {activeTab === "profile" && (
        <ProfileSettings
          key={`profile-${profileVersion}`}
          profile={profile}
          onSaveProfile={handleSaveProfile}
          onResetProfile={handleResetProfile}
        />
      )}

      {activeTab === "workspace" && (
        <WorkspaceSettingsView
          key={`workspace-${settingsVersion}`}
          settings={settings}
          onSaveSettings={handleSaveWorkspaceSettings}
          onResetSettings={handleResetWorkspaceSettings}
        />
      )}

      {/* Detail Modal (Deep-linkable via #member-*) */}
      <MemberDetail
        member={selectedMember}
        isOpen={selectedMember !== null}
        onClose={closeDetail}
        onEdit={(mem) => {
          closeDetail();
          handleEditMember(mem);
        }}
        onDelete={(mem) => {
          closeDetail();
          handleDeletePrompt(mem);
        }}
        onToggleStatus={(mem) => {
          handleToggleStatusPrompt(mem);
        }}
      />

      {/* Invite / Edit Form Modal (Keyed for clean re-mount) */}
      {formModal.isOpen && (
        <MemberForm
          key={`${formModal.mode}-${formModal.data?.id || "new"}`}
          isOpen={formModal.isOpen}
          mode={formModal.mode}
          existingMembers={members}
          initialData={formModal.data}
          onSave={handleSaveMember}
          onClose={() => setFormModal({ isOpen: false, mode: "invite" })}
        />
      )}

      {/* Remove Confirmation Modal */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-member-dialog-title"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C3B2B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 id="delete-member-dialog-title" className="font-bold text-base text-[#0C2340]">
                Remove {deleteCandidate.name}?
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-[#0C2340]">&ldquo;{deleteCandidate.name}&rdquo;</strong>{" "}
              ({deleteCandidate.email}) from this workspace? They will lose all access to tasks, projects, and notes. This change is local to this session.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-medium text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-[#8C3B2B] hover:bg-[#8C3B2B]/90 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {statusCandidate && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-toggle-dialog-title"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C6D2B]">
              {statusCandidate.status === "Suspended" ? (
                <UserCheck className="w-6 h-6 shrink-0 text-[#347A63]" />
              ) : (
                <UserX className="w-6 h-6 shrink-0 text-[#8C6D2B]" />
              )}
              <h3 id="status-toggle-dialog-title" className="font-bold text-base text-[#0C2340]">
                {statusCandidate.status === "Suspended"
                  ? `Reactivate ${statusCandidate.name}?`
                  : `Suspend ${statusCandidate.name}?`}
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              {statusCandidate.status === "Suspended"
                ? `Reactivating "${statusCandidate.name}" will restore their active collaborator permissions within this session.`
                : `Suspending "${statusCandidate.name}" will pause their ability to create or edit tasks and records. They will remain listed in the directory as suspended.`}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusCandidate(null)}
                className="px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-medium text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                className={`px-4 py-2 rounded-md text-white text-xs font-medium transition-colors cursor-pointer ${
                  statusCandidate.status === "Suspended"
                    ? "bg-[#347A63] hover:bg-[#347A63]/90"
                    : "bg-[#8C6D2B] hover:bg-[#8C6D2B]/90"
                }`}
              >
                {statusCandidate.status === "Suspended" ? "Confirm Reactivation" : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
