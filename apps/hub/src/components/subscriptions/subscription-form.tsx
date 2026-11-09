"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, Info } from "lucide-react";
import {
  AISubscriptionItem,
  SubscriptionStatus,
  SubscriptionBillingCycle,
} from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import { getLocalTodayIso, isValidCalendarDate } from "../../utils/date-utils";

interface SubscriptionFormProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: AISubscriptionItem;
  onSave: (subscription: AISubscriptionItem) => void;
  onClose: () => void;
}

export function SubscriptionForm({
  isOpen,
  mode,
  initialData,
  onSave,
  onClose,
}: SubscriptionFormProps) {
  const todayIso = getLocalTodayIso();

  const [provider, setProvider] = useState<string>(() => initialData?.provider || "");
  const [productName, setProductName] = useState<string>(() => initialData?.productName || "");
  const [planName, setPlanName] = useState<string>(() => initialData?.planName || "");
  const [category, setCategory] = useState<string>(() => initialData?.category || "LLM & Code Assistant");
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>(() => initialData?.billingCycle || "Monthly");
  const [amount, setAmount] = useState<string>(() => (initialData ? initialData.amount.toString() : ""));
  const [status, setStatus] = useState<SubscriptionStatus>(() => initialData?.status || "Active");
  const [startDateIso, setStartDateIso] = useState<string>(() => initialData?.startDateIso || todayIso);
  const [nextBillingDateIso, setNextBillingDateIso] = useState<string>(() => initialData?.nextBillingDateIso || todayIso);
  const [projectId, setProjectId] = useState<string>(() => initialData?.assignedProjectId || "none");
  const [purpose, setPurpose] = useState<string>(() => initialData?.purpose || "");
  const [notes, setNotes] = useState<string>(() => initialData?.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!provider.trim()) {
      errs.provider = "Vendor / Provider name is required (e.g. OpenAI, Anthropic).";
    }

    if (!productName.trim()) {
      errs.productName = "Product name is required (e.g. ChatGPT Plus, Claude Pro).";
    }

    if (!planName.trim()) {
      errs.planName = "Plan name is required (e.g. Pro, Individual, Standard).";
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      errs.amount = "Amount must be a non-negative number (0.00 or greater).";
    }

    if (!category.trim()) {
      errs.category = "Capability category is required.";
    }

    if (!startDateIso.trim() || !isValidCalendarDate(startDateIso)) {
      errs.startDateIso = "A valid calendar start date (YYYY-MM-DD) is required.";
    }

    if (!nextBillingDateIso.trim() || !isValidCalendarDate(nextBillingDateIso)) {
      errs.nextBillingDateIso = "A valid calendar next billing date (YYYY-MM-DD) is required.";
    }

    if (projectId !== "none") {
      const validProject = CATALOGED_PROJECTS.find((p) => p.id === projectId);
      if (!validProject) {
        errs.projectId = "Selected project must exist in the catalog.";
      }
    }

    if (!purpose.trim()) {
      errs.purpose = "Operational purpose is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedProject =
      projectId !== "none"
        ? CATALOGED_PROJECTS.find((p) => p.id === projectId)
        : undefined;

    // Convert ISO dates to readable date strings
    const startObj = new Date(startDateIso + "T00:00:00");
    const formattedStartDate = startObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const nextObj = new Date(nextBillingDateIso + "T00:00:00");
    const formattedNextDate = nextObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const savedSub: AISubscriptionItem = {
      id: initialData?.id || `sub-${Date.now()}`,
      provider: provider.trim(),
      productName: productName.trim(),
      planName: planName.trim(),
      category: category.trim(),
      billingCycle,
      amount: parseFloat(amount),
      currency: "MYR",
      status,
      startDate: formattedStartDate,
      startDateIso,
      nextBillingDate: formattedNextDate,
      nextBillingDateIso,
      assignedProjectId: matchedProject?.id,
      assignedProjectTitle: matchedProject?.title,
      purpose: purpose.trim(),
      notes: notes.trim() || undefined,
    };

    onSave(savedSub);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-form-title"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <h2 id="sub-form-title" className="text-base font-bold text-[#0C2340]">
            {mode === "add" ? "Register AI Subscription" : "Edit Subscription"}
          </h2>
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
          {/* Provider & Product Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="sub-provider" className="font-semibold text-[#0C2340] block">
                Provider / Vendor <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="sub-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. OpenAI, Anthropic, Google"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
              {errors.provider && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.provider}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="sub-product" className="font-semibold text-[#0C2340] block">
                Product Name <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="sub-product"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. ChatGPT Plus, Claude Pro"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
              {errors.productName && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.productName}
                </p>
              )}
            </div>
          </div>

          {/* Plan Name & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="sub-plan" className="font-semibold text-[#0C2340] block">
                Plan Name / Tier <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="sub-plan"
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Individual Pro, Team, Standard"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
              {errors.planName && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.planName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="sub-category" className="font-semibold text-[#0C2340] block">
                Capability Domain <span className="text-[#8C3B2B]">*</span>
              </label>
              <select
                id="sub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="LLM & Code Assistant">LLM &amp; Code Assistant</option>
                <option value="LLM & Conversational AI">LLM &amp; Conversational AI</option>
                <option value="Multimodal & Code">Multimodal &amp; Code</option>
                <option value="Visual & Generative Art">Visual &amp; Generative Art</option>
                <option value="Voice & Audio">Voice &amp; Audio</option>
                <option value="Research & Discovery">Research &amp; Discovery</option>
                <option value="Infrastructure & APIs">Infrastructure &amp; APIs</option>
              </select>
              {errors.category && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Billing Cycle, Amount & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="sub-cycle" className="font-semibold text-[#0C2340] block">
                Billing Cycle <span className="text-[#8C3B2B]">*</span>
              </label>
              <select
                id="sub-cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as SubscriptionBillingCycle)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="sub-amount" className="font-semibold text-[#0C2340] block">
                Amount (MYR) <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-mono focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
              {errors.amount && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.amount}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="sub-status" className="font-semibold text-[#0C2340] block">
                Lifecycle Status <span className="text-[#8C3B2B]">*</span>
              </label>
              <select
                id="sub-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Trial">Trial</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Start Date & Next Renewal Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="sub-start" className="font-semibold text-[#0C2340] block">
                Start Date (YYYY-MM-DD) <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="sub-start"
                type="date"
                value={startDateIso}
                onChange={(e) => setStartDateIso(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-mono focus:outline-none focus:border-[#347A63] cursor-pointer"
              />
              {errors.startDateIso && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.startDateIso}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="sub-next" className="font-semibold text-[#0C2340] block">
                Next Billing Date (YYYY-MM-DD) <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="sub-next"
                type="date"
                value={nextBillingDateIso}
                onChange={(e) => setNextBillingDateIso(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-mono focus:outline-none focus:border-[#347A63] cursor-pointer"
              />
              {errors.nextBillingDateIso && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.nextBillingDateIso}
                </p>
              )}
            </div>
          </div>

          {/* Project Attribution */}
          <div className="space-y-1">
            <label htmlFor="sub-project" className="font-semibold text-[#0C2340] block">
              Workspace / Project Attribution
            </label>
            <select
              id="sub-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="none">General Operations (Shared / No Project)</option>
              {CATALOGED_PROJECTS.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title} ({proj.category})
                </option>
              ))}
            </select>
          </div>

          {/* Operational Purpose */}
          <div className="space-y-1">
            <label htmlFor="sub-purpose" className="font-semibold text-[#0C2340] block">
              Operational Purpose &amp; Workload <span className="text-[#8C3B2B]">*</span>
            </label>
            <input
              id="sub-purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Primary IDE assistant and unit test generation"
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
            {errors.purpose && (
              <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.purpose}
              </p>
            )}
          </div>

          {/* Administrative Notes */}
          <div className="space-y-1">
            <label htmlFor="sub-notes" className="font-semibold text-[#0C2340] block">
              Administrative Notes (Optional)
            </label>
            <textarea
              id="sub-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="License constraints, renewal review dates, or seat allocation memos..."
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Session Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center gap-2 text-[11px] text-[#536B85]">
            <Info className="w-3.5 h-3.5 text-[#347A63] shrink-0" />
            <span>Updates are preserved in client React session memory only for this session.</span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#E9E5DC] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#536B85] hover:text-[#0C2340] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{mode === "add" ? "Register Subscription" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
