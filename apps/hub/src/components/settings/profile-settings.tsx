"use client";

import React, { useState } from "react";
import {
  Shield,
  Check,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { UserProfile } from "../../types/dashboard";
import { SAMPLE_OWNER_PROFILE } from "../../data/sample-dashboard-data";

interface ProfileSettingsProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onResetProfile: () => void;
}

export function ProfileSettings({
  profile,
  onSaveProfile,
  onResetProfile,
}: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [timezone, setTimezone] = useState(profile.timezone);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);



  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = "Full name is required.";
    }
    if (!email.trim()) {
      errs.email = "Primary notification email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = "Please enter a valid email address.";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parts = fullName.trim().split(/\s+/);
    const initials =
      parts.length === 1
        ? parts[0].substring(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

    const updated: UserProfile = {
      ...profile,
      fullName: fullName.trim(),
      displayName: displayName.trim() || fullName.trim(),
      email: email.trim().toLowerCase(),
      bio: bio.trim(),
      location: location.trim(),
      timezone: timezone.trim(),
      avatarInitials: initials,
    };

    onSaveProfile(updated);
    setSuccessMessage("Owner profile successfully updated in session state.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCancel = () => {
    setFullName(profile.fullName);
    setDisplayName(profile.displayName);
    setEmail(profile.email);
    setBio(profile.bio);
    setLocation(profile.location);
    setTimezone(profile.timezone);
    setErrors({});
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Card */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9E5DC]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0C2340] text-white flex items-center justify-center font-bold text-xl tracking-wider shrink-0 border-2 border-[#DCD7CC] shadow-sm">
              {profile.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0C2340]">
                  {profile.fullName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0C2340] text-white">
                  <Shield className="w-3 h-3" />
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-[#536B85] font-mono mt-0.5">
                {profile.email} &bull; Display name: &ldquo;{profile.displayName}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer"
              title="Reset profile to baseline defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Profile Baseline</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-md bg-[#EDF5F2] border border-[#A8CFC2] flex items-center gap-2.5 text-xs text-[#347A63]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="owner-fullname" className="font-semibold text-[#0C2340] block">
                Full Legal Name <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="owner-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border text-xs text-[#0C2340] focus:outline-none transition-colors ${
                  errors.fullName
                    ? "border-[#8C3B2B] bg-[#FBEAE8]/40"
                    : "border-[#DCD7CC] bg-[#FAF8F4] focus:border-[#347A63] focus:bg-white"
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label htmlFor="owner-displayname" className="font-semibold text-[#0C2340] block">
                Display Name / Handle
              </label>
              <input
                id="owner-displayname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Khai"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
            </div>

            {/* Notification Email */}
            <div className="space-y-1">
              <label htmlFor="owner-email" className="font-semibold text-[#0C2340] block">
                Primary Notification Email <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="owner-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border text-xs text-[#0C2340] focus:outline-none transition-colors ${
                  errors.email
                    ? "border-[#8C3B2B] bg-[#FBEAE8]/40"
                    : "border-[#DCD7CC] bg-[#FAF8F4] focus:border-[#347A63] focus:bg-white"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label htmlFor="owner-location" className="font-semibold text-[#0C2340] block">
                Geographic Location
              </label>
              <input
                id="owner-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kuala Lumpur, Malaysia"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
            </div>

            {/* Timezone */}
            <div className="space-y-1">
              <label htmlFor="owner-timezone" className="font-semibold text-[#0C2340] block">
                Primary Working Timezone
              </label>
              <select
                id="owner-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white cursor-pointer"
              >
                <option value="Asia/Kuala_Lumpur (GMT+8)">Asia/Kuala_Lumpur (GMT+8) — Default</option>
                <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8)</option>
                <option value="Asia/Tokyo (GMT+9)">Asia/Tokyo (GMT+9)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT/BST)</option>
                <option value="America/New_York (EST)">America/New_York (EST/EDT)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-1">
              <label className="font-semibold text-[#0C2340] block">
                Workspace Governance Role
              </label>
              <div className="px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#536B85] flex items-center justify-between">
                <span className="font-semibold text-[#0C2340]">Owner &bull; Sovereign Administrator</span>
                <span className="text-[10px] font-mono uppercase bg-[#EDF5F2] text-[#347A63] px-2 py-0.5 rounded border border-[#A8CFC2]">
                  Protected
                </span>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-1">
            <label htmlFor="owner-bio" className="font-semibold text-[#0C2340] block">
              Professional Biography &amp; Research Focus
            </label>
            <textarea
              id="owner-bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell collaborators about your engineering focus, project leadership, and technical research..."
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors leading-relaxed"
            />
          </div>

          {/* Session Persistence Note */}
          <div className="p-3 rounded-md bg-[#FAF8F4] border border-[#DCD7CC] flex items-start gap-2 text-xs text-[#536B85]">
            <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-[#0C2340] font-semibold">Session Scope Notice:</strong> Profile adjustments are held in React session state. Changes persist across module tab switches in your current browser session. No cloud database or persistent cookies are modified.
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#E9E5DC] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-medium text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
            >
              Cancel Changes
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reset Profile Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-profile-title"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C6D2B]">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 id="reset-profile-title" className="font-bold text-base text-[#0C2340]">
                Reset Owner Profile Baseline?
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to restore the workspace owner profile to default baseline values? Legal name, display handle, notification email, and biography will be restored to &ldquo;Khairul Tajudin&rdquo;, and the corresponding Owner record in the member directory will be synchronized.
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
                onClick={() => {
                  setFullName(SAMPLE_OWNER_PROFILE.fullName);
                  setDisplayName(SAMPLE_OWNER_PROFILE.displayName);
                  setEmail(SAMPLE_OWNER_PROFILE.email);
                  setBio(SAMPLE_OWNER_PROFILE.bio);
                  setLocation(SAMPLE_OWNER_PROFILE.location);
                  setTimezone(SAMPLE_OWNER_PROFILE.timezone);
                  setErrors({});
                  onResetProfile();
                  setShowResetConfirm(false);
                  setSuccessMessage("Owner profile successfully restored to baseline defaults.");
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
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
