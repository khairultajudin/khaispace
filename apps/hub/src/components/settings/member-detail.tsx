"use client";

import React from "react";
import {
  X,
  Mail,
  Calendar,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  User,
  Clock,
} from "lucide-react";
import { WorkspaceMember } from "../../types/dashboard";
import {
  getMemberInitials,
  getRoleBadgeStyle,
  getStatusBadgeStyle,
} from "../../utils/members-utils";

interface MemberDetailProps {
  member: WorkspaceMember | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: WorkspaceMember) => void;
  onDelete: (member: WorkspaceMember) => void;
  onToggleStatus: (member: WorkspaceMember) => void;
}

export function MemberDetail({
  member,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
}: MemberDetailProps) {
  if (!isOpen || !member) return null;

  const roleBadge = getRoleBadgeStyle(member.role);
  const statusBadge = getStatusBadgeStyle(member.status);
  const initials = getMemberInitials(member.name);
  const isOwner = member.role === "Owner";

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-detail-title"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0C2340] text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 border border-[#DCD7CC]">
              {initials}
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#347A63] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Member Profile &bull; {member.id}</span>
              </span>
              <h2 id="member-detail-title" className="text-lg font-bold text-[#0C2340]">
                {member.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            aria-label="Close member details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Email & Contact Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Email Address</span>
              <span className="font-semibold text-xs text-[#0C2340] font-mono flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#347A63]" />
                {member.email}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleBadge.cls}`}
              >
                <Shield className="w-3 h-3 mr-1" />
                {member.role}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${statusBadge.cls}`}
              >
                {member.status}
              </span>
            </div>
          </div>

          {/* Biography & Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0C2340]">
              Biography &amp; Responsibilities
            </h3>
            <div className="p-4 rounded-md border border-[#DCD7CC] bg-[#FFFFFF] leading-relaxed text-[#0C2340] whitespace-pre-line text-xs">
              {member.bio || "No profile description provided for this member."}
            </div>
          </div>

          {/* Invitation Context if Pending */}
          {member.status === "Pending" && (
            <div className="space-y-2 p-3.5 rounded-md border border-[#D4C39B] bg-[#FAF8F4]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D2B]">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Invitation Status</span>
              </div>
              <p className="text-xs text-[#536B85] leading-relaxed">
                This member has been invited to join Khai Space Hub with{" "}
                <strong className="text-[#0C2340]">{member.role}</strong> permissions.
                {member.invitedBy && (
                  <span> Invited by <strong className="text-[#0C2340]">{member.invitedBy}</strong>.</span>
                )}
              </p>
              {member.personalMessage && (
                <div className="p-2.5 rounded bg-white border border-[#DCD7CC] text-[11px] text-[#536B85] italic">
                  &ldquo;{member.personalMessage}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Owner Protection Advisory */}
          {isOwner && (
            <div className="p-3 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] flex items-start gap-2 text-xs text-[#347A63]">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-semibold">Workspace Owner Account:</strong>{" "}
                This account holds primary governance ownership over all projects, financials, and configurations. It cannot be suspended, removed, or reassigned.
              </div>
            </div>
          )}

          {/* Dates & Timeline */}
          <div className="p-3 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#536B85]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
              {member.status === "Pending" ? "Invited On: " : "Member Since: "}
              {member.joinedAt}
            </span>
            <span>Record ID: {member.id}</span>
          </div>

          {/* Deep link indicator & Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center justify-between text-[11px] text-[#536B85] font-mono">
            <span>Direct Hash: #member-{member.id}</span>
            <span className="text-[#347A63]">Session State Only</span>
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-[#E9E5DC] flex items-center justify-between gap-2">
            {/* Delete / Remove (Disabled for Owner) */}
            {!isOwner ? (
              <button
                type="button"
                onClick={() => onDelete(member)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-[#E8C2BA] text-[#8C3B2B] hover:bg-[#FBEAE8] font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Member</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {/* Suspend / Reactivate (Disabled for Owner) */}
              {!isOwner && (
                <button
                  type="button"
                  onClick={() => onToggleStatus(member)}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-md border font-medium transition-colors cursor-pointer ${
                    member.status === "Suspended"
                      ? "border-[#A8CFC2] text-[#347A63] hover:bg-[#EDF5F2]"
                      : "border-[#D4C39B] text-[#8C6D2B] hover:bg-[#FAF8F4]"
                  }`}
                >
                  {member.status === "Suspended" ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Reactivate</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </>
                  )}
                </button>
              )}

              {/* Edit */}
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#0C2340] font-medium transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
