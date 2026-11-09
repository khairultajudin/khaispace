"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Users,
  User,
  Sliders,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  UserX,
  UserCheck,
} from "lucide-react";
import {
  WorkspaceMember,
  UserProfile,
  WorkspaceSettings,
} from "../../types/dashboard";
import {
  SAMPLE_MEMBERS,
  SAMPLE_OWNER_PROFILE,
  SAMPLE_WORKSPACE_SETTINGS,
} from "../../data/sample-dashboard-data";
import { MembersMetrics } from "./members-metrics";
import { MembersList } from "./members-list";
import { MemberDetail } from "./member-detail";
import { MemberForm } from "./member-form";
import { ProfileSettings } from "./profile-settings";
import { WorkspaceSettingsView } from "./workspace-settings";

type SettingsTab = "members" | "profile" | "workspace";

export function SettingsView() {
  const [members, setMembers] = useState<WorkspaceMember[]>(SAMPLE_MEMBERS);
  const [profile, setProfile] = useState<UserProfile>(SAMPLE_OWNER_PROFILE);
  const [settings, setSettings] = useState<WorkspaceSettings>(
    SAMPLE_WORKSPACE_SETTINGS
  );
  const [isModified, setIsModified] = useState(false);

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

  // Selected member for detail modal / deep linking (lazy initialized from hash)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("member-")) {
        const id = hash.replace("member-", "");
        return (
          SAMPLE_MEMBERS.find((m) => m.id === hash || m.id === id) || null
        );
      }
    }
    return null;
  });

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

  // Reset baseline confirmation dialog state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const handleSaveMember = (savedMember: WorkspaceMember) => {
    if (formModal.mode === "invite") {
      setMembers((prev) => [savedMember, ...prev]);
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === savedMember.id ? savedMember : m))
      );
      if (selectedMember?.id === savedMember.id) {
        setSelectedMember(savedMember);
      }
    }
    setIsModified(true);
    setFormModal({ isOpen: false, mode: "invite" });
  };

  const handleDeletePrompt = (member: WorkspaceMember) => {
    if (member.role === "Owner") return;
    setDeleteCandidate(member);
  };

  const confirmDelete = () => {
    if (!deleteCandidate || deleteCandidate.role === "Owner") return;
    setMembers((prev) => prev.filter((m) => m.id !== deleteCandidate.id));
    setIsModified(true);
    if (selectedMember?.id === deleteCandidate.id) {
      closeDetail();
    }
    setDeleteCandidate(null);
  };

  const handleToggleStatusPrompt = (member: WorkspaceMember) => {
    if (member.role === "Owner") return;
    setStatusCandidate(member);
  };

  const confirmToggleStatus = () => {
    if (!statusCandidate || statusCandidate.role === "Owner") return;
    const newStatus = statusCandidate.status === "Suspended" ? "Active" : "Suspended";
    setMembers((prev) =>
      prev.map((m) => (m.id === statusCandidate.id ? { ...m, status: newStatus } : m))
    );
    if (selectedMember?.id === statusCandidate.id) {
      setSelectedMember({ ...statusCandidate, status: newStatus });
    }
    setIsModified(true);
    setStatusCandidate(null);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    // Also synchronize member name and email if the owner was updated
    setMembers((prev) =>
      prev.map((m) =>
        m.role === "Owner"
          ? {
              ...m,
              name: updatedProfile.fullName,
              email: updatedProfile.email,
              bio: updatedProfile.bio,
            }
          : m
      )
    );
    setIsModified(true);
  };

  const handleSaveWorkspaceSettings = (updatedSettings: WorkspaceSettings) => {
    setSettings(updatedSettings);
    setIsModified(true);
  };

  const handleResetToBaseline = () => {
    setMembers(SAMPLE_MEMBERS);
    setProfile(SAMPLE_OWNER_PROFILE);
    setSettings(SAMPLE_WORKSPACE_SETTINGS);
    setIsModified(false);
    setSelectedMember(null);
    setShowResetConfirm(false);
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
            {isModified && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer"
                title="Restore all member and settings records to default baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Module Baseline</span>
              </button>
            )}

            {activeTab === "members" && (
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

        {isModified && (
          <span className="text-[11px] font-mono text-[#8C6D2B] bg-[#FAF8F4] px-2 py-1 rounded border border-[#DCD7CC] shrink-0">
            Session modified
          </span>
        )}
      </div>

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
          profile={profile}
          onSaveProfile={handleSaveProfile}
          onResetProfile={() => {
            setProfile(SAMPLE_OWNER_PROFILE);
            setIsModified(true);
          }}
        />
      )}

      {activeTab === "workspace" && (
        <WorkspaceSettingsView
          settings={settings}
          onSaveSettings={handleSaveWorkspaceSettings}
          onResetSettings={() => {
            setSettings(SAMPLE_WORKSPACE_SETTINGS);
            setIsModified(true);
          }}
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

      {/* Reset Module Baseline Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-module-dialog-title"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C6D2B]">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 id="reset-module-dialog-title" className="font-bold text-base text-[#0C2340]">
                Reset Members &amp; Settings Baseline?
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to restore all member records, owner profile data, and workspace configurations to default baseline values? All additions, edits, and deletions made during this session will be permanently discarded.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-medium text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="px-4 py-2 rounded-md bg-[#8C6D2B] hover:bg-[#8C6D2B]/90 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
