"use client";

import React, { useState } from "react";
import {
  Settings,
  Globe,
  Sun,
  LayoutTemplate,
  Bell,
  Check,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { WorkspaceSettings, ContentDensity, DateFormatOption } from "../../types/dashboard";
import { SAMPLE_WORKSPACE_SETTINGS } from "../../data/sample-dashboard-data";

interface WorkspaceSettingsProps {
  settings: WorkspaceSettings;
  onSaveSettings: (updated: WorkspaceSettings) => void;
  onResetSettings: () => void;
}

export function WorkspaceSettingsView({
  settings,
  onSaveSettings,
  onResetSettings,
}: WorkspaceSettingsProps) {
  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [workspaceDescription, setWorkspaceDescription] = useState(
    settings.workspaceDescription
  );
  const [timezone, setTimezone] = useState(settings.timezone);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);
  const [dateFormat, setDateFormat] = useState<DateFormatOption>(settings.dateFormat);
  const [contentDensity, setContentDensity] = useState<ContentDensity>(
    settings.contentDensity
  );

  // Notification toggles
  const [notifications, setNotifications] = useState({ ...settings.notifications });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);



  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!workspaceName.trim()) {
      errs.workspaceName = "Workspace name cannot be empty.";
    }
    if (!workspaceDescription.trim()) {
      errs.workspaceDescription = "Workspace description is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated: WorkspaceSettings = {
      workspaceName: workspaceName.trim(),
      workspaceDescription: workspaceDescription.trim(),
      timezone,
      defaultCurrency,
      dateFormat,
      contentDensity,
      notifications,
    };

    onSaveSettings(updated);
    setSuccessMessage("Workspace configurations successfully saved in session state.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCancel = () => {
    setWorkspaceName(settings.workspaceName);
    setWorkspaceDescription(settings.workspaceDescription);
    setTimezone(settings.timezone);
    setDefaultCurrency(settings.defaultCurrency);
    setDateFormat(settings.dateFormat);
    setContentDensity(settings.contentDensity);
    setNotifications({ ...settings.notifications });
    setErrors({});
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-8">
        {/* Header with Title & Reset Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9E5DC]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <Settings className="w-4 h-4" />
              <span>Workspace Administration &bull; Environment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
              Workspace Configuration
            </h2>
            <p className="text-xs text-[#536B85] max-w-xl leading-relaxed">
              Global environment parameters, locale defaults, density preference preview, and simulated event notifications.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer"
              title="Restore workspace settings to baseline defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Settings Baseline</span>
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

        <form onSubmit={handleSave} className="space-y-8 text-xs">
          {/* Section 1: General Workspace Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E9E5DC]">
              <Globe className="w-4 h-4 text-[#347A63]" />
              <h3 className="text-sm font-bold text-[#0C2340] uppercase tracking-wider">
                1. General Workspace Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Workspace Name */}
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="ws-name" className="font-semibold text-[#0C2340] block">
                  Workspace Name <span className="text-[#8C3B2B]">*</span>
                </label>
                <input
                  id="ws-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border text-xs text-[#0C2340] focus:outline-none transition-colors ${
                    errors.workspaceName
                      ? "border-[#8C3B2B] bg-[#FBEAE8]/40"
                      : "border-[#DCD7CC] bg-[#FAF8F4] focus:border-[#347A63] focus:bg-white"
                  }`}
                />
                {errors.workspaceName && (
                  <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.workspaceName}</span>
                  </p>
                )}
              </div>

              {/* Workspace Description */}
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="ws-desc" className="font-semibold text-[#0C2340] block">
                  Workspace Purpose &amp; Charter <span className="text-[#8C3B2B]">*</span>
                </label>
                <textarea
                  id="ws-desc"
                  rows={2}
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border text-xs text-[#0C2340] focus:outline-none transition-colors ${
                    errors.workspaceDescription
                      ? "border-[#8C3B2B] bg-[#FBEAE8]/40"
                      : "border-[#DCD7CC] bg-[#FAF8F4] focus:border-[#347A63] focus:bg-white"
                  }`}
                />
                {errors.workspaceDescription && (
                  <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.workspaceDescription}</span>
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div className="space-y-1">
                <label htmlFor="ws-tz" className="font-semibold text-[#0C2340] block">
                  Workspace Operating Timezone
                </label>
                <select
                  id="ws-tz"
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

              {/* Default Currency (Fixed Workspace Standard) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0C2340] block">
                    Accounting Currency Standard
                  </span>
                  <span className="text-[10px] font-mono text-[#347A63] bg-[#EDF5F2] px-1.5 py-0.5 rounded border border-[#A8CFC2] font-semibold">
                    Fixed Standard
                  </span>
                </div>
                <div className="px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] font-mono flex items-center justify-between font-semibold">
                  <span>Malaysian Ringgit (MYR)</span>
                  <span className="text-[#347A63] font-bold">RM</span>
                </div>
                <p className="text-[11px] text-[#536B85] leading-relaxed">
                  Fixed workspace monetary standard. All ledger entries, cashflow metrics, and AI subscription cost analyses are strictly recorded in Malaysian Ringgit (MYR).
                </p>
              </div>

              {/* Date Format */}
              <div className="space-y-1">
                <label htmlFor="ws-dateformat" className="font-semibold text-[#0C2340] block">
                  Calendar Date Presentation Format
                </label>
                <select
                  id="ws-dateformat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value as DateFormatOption)}
                  className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white cursor-pointer"
                >
                  <option value="YYYY-MM-DD">ISO 8601 (YYYY-MM-DD) — e.g. 2026-11-09</option>
                  <option value="DD/MM/YYYY">British / Commonwealth (DD/MM/YYYY) — e.g. 09/11/2026</option>
                  <option value="MM/DD/YYYY">US Standard (MM/DD/YYYY) — e.g. 11/09/2026</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Appearance & Content Density */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E9E5DC]">
              <LayoutTemplate className="w-4 h-4 text-[#347A63]" />
              <h3 className="text-sm font-bold text-[#0C2340] uppercase tracking-wider">
                2. Appearance &amp; Layout Density
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Theme Palette */}
              <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0C2340] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-[#8C6D2B]" />
                    Editorial Light Aesthetic (Active)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#EDF5F2] text-[#347A63] px-2 py-0.5 rounded border border-[#A8CFC2] font-semibold">
                    Default
                  </span>
                </div>
                <p className="text-xs text-[#536B85] leading-relaxed">
                  Warm off-white (<code className="font-mono text-[#0C2340]">#FAF8F4</code>), deep navy typography (<code className="font-mono text-[#0C2340]">#0C2340</code>), and muted green accents (<code className="font-mono text-[#347A63]">#347A63</code>). Dark OLED mode was rejected in Decision <code className="font-mono font-semibold">#dec-5</code>.
                </p>
              </div>

              {/* Content Density */}
              <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0C2340] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#347A63]" />
                    Content Density
                  </span>
                  <span className="text-[10px] font-mono text-[#8C6D2B] bg-white px-2 py-0.5 rounded border border-[#DCD7CC]">
                    Preference Preview
                  </span>
                </div>
                <p className="text-xs text-[#536B85] leading-relaxed">
                  Interactive layout preference preview. Selecting an option updates only the preview below to demonstrate spacing density and does not affect global spacing across other Hub modules.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentDensity("comfortable")}
                    className={`py-2 px-3 rounded text-xs font-semibold border transition-all cursor-pointer text-center ${
                      contentDensity === "comfortable"
                        ? "bg-white text-[#347A63] border-[#347A63] shadow-xs"
                        : "bg-transparent text-[#536B85] border-[#DCD7CC] hover:bg-white"
                    }`}
                  >
                    Comfortable (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentDensity("compact")}
                    className={`py-2 px-3 rounded text-xs font-semibold border transition-all cursor-pointer text-center ${
                      contentDensity === "compact"
                        ? "bg-white text-[#0C2340] border-[#0C2340] shadow-xs"
                        : "bg-transparent text-[#536B85] border-[#DCD7CC] hover:bg-white"
                    }`}
                  >
                    Compact (Data-Dense)
                  </button>
                </div>
                {/* Live Preview Box */}
                <div
                  className={`rounded border border-[#DCD7CC] bg-white transition-all text-xs ${
                    contentDensity === "compact" ? "p-2.5 space-y-1" : "p-4 space-y-2"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-[#0C2340]">
                    <span>Sample Table Row / Card Preview</span>
                    <span className="text-[10px] font-mono text-[#347A63] uppercase">
                      {contentDensity === "compact" ? "Compact Spacing (Dense)" : "Comfortable Spacing (Editorial)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#536B85]">
                    {contentDensity === "compact"
                      ? "Compact mode illustrates reduced cell padding and tighter vertical rhythm for dense tabular views."
                      : "Comfortable mode illustrates standard editorial whitespace and relaxed touch targets."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Preferences (Simulation) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E9E5DC]">
              <Bell className="w-4 h-4 text-[#347A63]" />
              <h3 className="text-sm font-bold text-[#0C2340] uppercase tracking-wider">
                3. Notification Preferences (Simulated)
              </h3>
            </div>

            <div className="space-y-3">
              {/* Toggle 1: Task Reminders */}
              <div className="p-3.5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0C2340] block">
                    Task &amp; Milestone Reminders
                  </span>
                  <span className="text-xs text-[#536B85]">
                    Simulate notifications for upcoming task due dates and overdue items.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("taskReminders")}
                  role="switch"
                  aria-checked={notifications.taskReminders}
                  className={`w-11 h-6 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shrink-0 ${
                    notifications.taskReminders ? "bg-[#347A63]" : "bg-[#DCD7CC]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      notifications.taskReminders ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Milestone Updates */}
              <div className="p-3.5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0C2340] block">
                    Key Milestone Achievements
                  </span>
                  <span className="text-xs text-[#536B85]">
                    Receive simulated notices when project milestones reach 100% completion.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("milestoneUpdates")}
                  role="switch"
                  aria-checked={notifications.milestoneUpdates}
                  className={`w-11 h-6 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shrink-0 ${
                    notifications.milestoneUpdates ? "bg-[#347A63]" : "bg-[#DCD7CC]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      notifications.milestoneUpdates ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Project Status Updates */}
              <div className="p-3.5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0C2340] block">
                    Project Status Changes
                  </span>
                  <span className="text-xs text-[#536B85]">
                    Alerts when repository statuses shift between Production, Active, or Planned.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("projectUpdates")}
                  role="switch"
                  aria-checked={notifications.projectUpdates}
                  className={`w-11 h-6 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shrink-0 ${
                    notifications.projectUpdates ? "bg-[#347A63]" : "bg-[#DCD7CC]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      notifications.projectUpdates ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Workspace Activity */}
              <div className="p-3.5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0C2340] block">
                    Workspace Roster &amp; Member Actions
                  </span>
                  <span className="text-xs text-[#536B85]">
                    Simulate alerts for member invitations, role reassignments, and account suspensions.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("workspaceActivity")}
                  role="switch"
                  aria-checked={notifications.workspaceActivity}
                  className={`w-11 h-6 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shrink-0 ${
                    notifications.workspaceActivity ? "bg-[#347A63]" : "bg-[#DCD7CC]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      notifications.workspaceActivity ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 5: Subscription Renewals */}
              <div className="p-3.5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0C2340] block">
                    AI Subscription Renewal Reminders
                  </span>
                  <span className="text-xs text-[#536B85]">
                    Notify when an active subscription has an upcoming renewal scheduled in the next 30 days.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("subscriptionRenewals")}
                  role="switch"
                  aria-checked={notifications.subscriptionRenewals}
                  className={`w-11 h-6 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shrink-0 ${
                    notifications.subscriptionRenewals ? "bg-[#347A63]" : "bg-[#DCD7CC]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      notifications.subscriptionRenewals ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-settings-title"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C6D2B]">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 id="reset-settings-title" className="font-bold text-base text-[#0C2340]">
                Reset Workspace Configuration?
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to restore workspace configuration to default baseline values? Any custom name, description, timezone, or notification toggles modified in this session will be reverted.
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
                  setWorkspaceName(SAMPLE_WORKSPACE_SETTINGS.workspaceName);
                  setWorkspaceDescription(SAMPLE_WORKSPACE_SETTINGS.workspaceDescription);
                  setTimezone(SAMPLE_WORKSPACE_SETTINGS.timezone);
                  setDefaultCurrency(SAMPLE_WORKSPACE_SETTINGS.defaultCurrency);
                  setDateFormat(SAMPLE_WORKSPACE_SETTINGS.dateFormat);
                  setContentDensity(SAMPLE_WORKSPACE_SETTINGS.contentDensity);
                  setNotifications({ ...SAMPLE_WORKSPACE_SETTINGS.notifications });
                  setErrors({});
                  onResetSettings();
                  setShowResetConfirm(false);
                  setSuccessMessage("Workspace configuration successfully restored to default baseline.");
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
