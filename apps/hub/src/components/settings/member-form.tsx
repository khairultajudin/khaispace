"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, Info, UserPlus, Pencil, Shield } from "lucide-react";
import { WorkspaceMember, MemberRole } from "../../types/dashboard";
import { getLocalTodayIso } from "../../utils/date-utils";

interface MemberFormProps {
  isOpen: boolean;
  mode: "invite" | "edit";
  existingMembers: WorkspaceMember[];
  initialData?: WorkspaceMember;
  onSave: (member: WorkspaceMember) => void;
  onClose: () => void;
}

function generateUniqueMemberId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) =>
          b.toString(16).padStart(2, "0")
        ).join("")
      : Math.random().toString(36).substring(2, 10);
  return `mem-${timestamp}-${randomPart}`;
}

export function MemberForm({
  isOpen,
  mode,
  existingMembers,
  initialData,
  onSave,
  onClose,
}: MemberFormProps) {
  const isEditingOwner = initialData?.role === "Owner";

  const [name, setName] = useState<string>(() => initialData?.name || "");
  const [email, setEmail] = useState<string>(() => initialData?.email || "");
  const [role, setRole] = useState<MemberRole>(() => initialData?.role || "Member");
  const [bio, setBio] = useState<string>(() => initialData?.bio || "");
  const [personalMessage, setPersonalMessage] = useState<string>(
    () => initialData?.personalMessage || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Validate email for invitations
    if (mode === "invite") {
      if (!email.trim()) {
        errs.email = "Email address is required for sending an invitation.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errs.email = "Please enter a valid email address (e.g., user@example.com).";
        } else {
          // Check for duplicate email against existing members
          const duplicate = existingMembers.some(
            (m) => m.email.toLowerCase() === email.trim().toLowerCase()
          );
          if (duplicate) {
            errs.email = "A workspace member or pending invite with this email already exists.";
          }
        }
      }

      // If name is left blank during invite, fallback to the email username part
      if (!role) {
        errs.role = "A role must be assigned.";
      }
    }

    // Validate name when editing
    if (mode === "edit") {
      if (!name.trim()) {
        errs.name = "Member full name is required.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const todayIso = getLocalTodayIso();
    const todayObj = new Date(todayIso + "T00:00:00");
    const formattedToday = todayObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (mode === "invite") {
      // Derive default name from email if not provided
      const resolvedName = name.trim() || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const newMember: WorkspaceMember = {
        id: generateUniqueMemberId(),
        name: resolvedName,
        email: email.trim().toLowerCase(),
        role: role === "Owner" ? "Member" : role, // Owner cannot be created via ordinary invitation
        status: "Pending",
        joinedAt: formattedToday,
        joinedAtIso: todayIso,
        bio: bio.trim() || undefined,
        invitedBy: "Khairul Tajudin (Owner)",
        personalMessage: personalMessage.trim() || undefined,
      };
      onSave(newMember);
    } else if (initialData) {
      const updatedMember: WorkspaceMember = {
        ...initialData,
        name: name.trim(),
        role: isEditingOwner ? "Owner" : (role === "Owner" ? initialData.role : role),
        bio: bio.trim() || undefined,
      };
      onSave(updatedMember);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-form-title"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center gap-2">
            {mode === "invite" ? (
              <UserPlus className="w-4 h-4 text-[#347A63]" />
            ) : (
              <Pencil className="w-4 h-4 text-[#347A63]" />
            )}
            <h2 id="member-form-title" className="text-base font-bold text-[#0C2340]">
              {mode === "invite" ? "Invite Workspace Collaborator" : `Edit Member: ${initialData?.name}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Simulated Mode Advisory Banner */}
          {mode === "invite" && (
            <div className="p-3 rounded-md bg-[#EDF5F2] border border-[#A8CFC2] flex items-start gap-2.5 text-[#347A63]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-semibold">Simulated Invitation:</strong> Submitting will create a pending invitation in React session state. In production, an onboarding email with an activation link would be dispatched.
              </div>
            </div>
          )}

          {/* Email Address (Editable only when inviting) */}
          <div className="space-y-1">
            <label htmlFor="member-email" className="font-semibold text-[#0C2340] block">
              Email Address {mode === "invite" && <span className="text-[#8C3B2B]">*</span>}
            </label>
            {mode === "invite" ? (
              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@khaispace.my"
                className={`w-full px-3 py-2 rounded-md border text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none transition-colors ${
                  errors.email
                    ? "border-[#8C3B2B] bg-[#FBEAE8]/40 focus:border-[#8C3B2B]"
                    : "border-[#DCD7CC] bg-[#FAF8F4] focus:border-[#347A63] focus:bg-white"
                }`}
              />
            ) : (
              <input
                id="member-email"
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] cursor-not-allowed font-mono text-xs"
              />
            )}
            {errors.email && (
              <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="member-name" className="font-semibold text-[#0C2340] block">
              Full Name {mode === "edit" && <span className="text-[#8C3B2B]">*</span>}
              {mode === "invite" && <span className="text-[#536B85] font-normal"> (Optional)</span>}
            </label>
            <input
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aisyah Rahman"
              className={`w-full px-3 py-2 rounded-md border text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none transition-colors ${
                errors.name
                  ? "border-[#8C3B2B] bg-[#FBEAE8]/40 focus:border-[#8C3B2B]"
                  : "border-[#DCD7CC] bg-[#FAF8F4] focus:border-[#347A63] focus:bg-white"
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-1">
            <label htmlFor="member-role" className="font-semibold text-[#0C2340] block">
              Role &amp; Permissions <span className="text-[#8C3B2B]">*</span>
            </label>
            {isEditingOwner ? (
              <div className="px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-semibold flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#347A63]" />
                <span>Workspace Owner (Immutable Governance Role)</span>
              </div>
            ) : (
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white cursor-pointer"
              >
                <option value="Administrator">Administrator — Full operational access &amp; management</option>
                <option value="Member">Member — Can create, edit tasks, notes &amp; project items</option>
                <option value="Viewer">Viewer — Read-only observation access</option>
              </select>
            )}
            <p className="text-[11px] text-[#536B85]">
              {role === "Administrator"
                ? "Can manage workspace settings, invite members, and edit all catalog items."
                : role === "Member"
                ? "Can create, update, and manage tasks, decisions, and subscriptions."
                : role === "Viewer"
                ? "Restricted to viewing projects, metrics, and documentation without write permissions."
                : "Full sovereign governance over all workspace resources."}
            </p>
          </div>

          {/* Biography / Description */}
          <div className="space-y-1">
            <label htmlFor="member-bio" className="font-semibold text-[#0C2340] block">
              Biography &amp; Responsibilities <span className="text-[#536B85] font-normal">(Optional)</span>
            </label>
            <textarea
              id="member-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of the member's responsibilities, project ownership, or technical specialty..."
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Personal Message (Only for Invitation) */}
          {mode === "invite" && (
            <div className="space-y-1">
              <label htmlFor="member-msg" className="font-semibold text-[#0C2340] block">
                Personal Invitation Note <span className="text-[#536B85] font-normal">(Optional)</span>
              </label>
              <textarea
                id="member-msg"
                rows={2}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Welcome to the team! Looking forward to collaborating on Khai Space projects..."
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E9E5DC] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-medium text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{mode === "invite" ? "Send Simulated Invite" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
