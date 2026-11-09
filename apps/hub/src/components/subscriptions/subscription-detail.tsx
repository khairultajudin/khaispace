"use client";

import React from "react";
import {
  X,
  Building2,
  Calendar,
  Layers,
  Pencil,
  Trash2,
} from "lucide-react";
import { AISubscriptionItem, SubscriptionStatus } from "../../types/dashboard";
import {
  formatMYR,
  getMonthlyEquivalent,
  getAnnualEquivalent,
  getDaysUntil,
} from "../../utils/subscription-utils";
import { getLocalTodayIso } from "../../utils/date-utils";

interface SubscriptionDetailProps {
  subscription: AISubscriptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (sub: AISubscriptionItem) => void;
  onDelete: (sub: AISubscriptionItem) => void;
}

export function SubscriptionDetail({
  subscription,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: SubscriptionDetailProps) {
  if (!isOpen || !subscription) return null;

  const todayIso = getLocalTodayIso();
  const monthlyEquiv = getMonthlyEquivalent(subscription);
  const annualEquiv = getAnnualEquivalent(subscription);
  const daysUntil = getDaysUntil(subscription.nextBillingDateIso, todayIso);
  const isUrgent = subscription.status !== "Cancelled" && daysUntil >= 0 && daysUntil <= 7;

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case "Active":
        return "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]";
      case "Paused":
        return "bg-[#FAF8F4] text-[#8C6D2B] border-[#D4C39B]";
      case "Trial":
        return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
      case "Cancelled":
        return "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]";
      default:
        return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-detail-title"
    >
      <div className="w-full max-w-xl bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#347A63]">
              AI Subscription Record &bull; {subscription.id}
            </span>
            <h2 id="sub-detail-title" className="text-lg font-bold text-[#0C2340]">
              {subscription.productName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            aria-label="Close subscription details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status & Provider Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Vendor / Provider</span>
              <span className="font-semibold text-sm text-[#0C2340]">{subscription.provider}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Plan Tier</span>
              <span className="font-semibold text-sm text-[#0C2340]">{subscription.planName}</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block">Lifecycle Status</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(
                  subscription.status
                )}`}
              >
                {subscription.status}
              </span>
            </div>
          </div>

          {/* Pricing & Billing Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-md bg-[#FAF8F4] border border-[#DCD7CC]">
              <span className="text-[10px] text-[#536B85] block uppercase font-sans">Nominal Charge</span>
              <span className="text-base font-bold text-[#0C2340]">
                {formatMYR(subscription.amount)}
              </span>
              <span className="text-[10px] text-[#536B85] block font-sans">
                billed {subscription.billingCycle.toLowerCase()}
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#EDF5F2]/50 border border-[#A8CFC2]">
              <span className="text-[10px] text-[#347A63] block uppercase font-sans font-semibold">Monthly Equiv</span>
              <span className="text-base font-bold text-[#347A63]">
                {formatMYR(monthlyEquiv)}
              </span>
              <span className="text-[10px] text-[#347A63]/80 block font-sans">
                {subscription.billingCycle === "Annual" ? "annual / 12" : "direct monthly"}
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#FAF8F4] border border-[#DCD7CC] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#536B85] block uppercase font-sans">Annualized</span>
              <span className="text-base font-bold text-[#0C2340]">
                {formatMYR(annualEquiv)}
              </span>
              <span className="text-[10px] text-[#536B85] block font-sans">
                12-month commitment
              </span>
            </div>
          </div>

          {/* Dates & Renewal Schedule */}
          <div className="p-4 rounded-md border border-[#DCD7CC] bg-[#FFFFFF] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0C2340]">
              <Calendar className="w-4 h-4 text-[#347A63]" />
              <span>Subscription Schedule &amp; Renewal Deadlines</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-[#536B85] block">Subscription Start Date</span>
                <span className="font-mono text-xs text-[#0C2340] font-medium">
                  {subscription.startDate} ({subscription.startDateIso})
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#536B85] block">Next Billing / Renewal Date</span>
                <span className="font-mono text-xs text-[#0C2340] font-medium flex items-center gap-1.5">
                  {subscription.nextBillingDate}
                  {subscription.status !== "Cancelled" && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                        isUrgent
                          ? "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]"
                          : "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]"
                      }`}
                    >
                      {daysUntil === 0
                        ? "Today"
                        : daysUntil === 1
                        ? "Tomorrow"
                        : daysUntil > 0
                        ? `${daysUntil}d left`
                        : "Passed"}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Capability Domain & Project Attribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] space-y-1">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#347A63]" />
                Capability Domain
              </span>
              <span className="font-semibold text-xs text-[#0C2340] block">
                {subscription.category}
              </span>
            </div>

            <div className="p-3 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] space-y-1">
              <span className="text-[10px] text-[#536B85] uppercase tracking-wider block flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#347A63]" />
                Project Attribution
              </span>
              <span className="font-semibold text-xs text-[#0C2340] block">
                {subscription.assignedProjectTitle || "General Operations (Shared)"}
              </span>
            </div>
          </div>

          {/* Operational Purpose & Notes */}
          <div className="space-y-2">
            <div>
              <span className="text-[11px] font-semibold text-[#0C2340] block mb-1">
                Operational Purpose &amp; Workload
              </span>
              <p className="text-xs text-[#536B85] bg-[#FAF8F4] p-3 rounded border border-[#DCD7CC] leading-relaxed">
                {subscription.purpose}
              </p>
            </div>

            {subscription.notes && (
              <div>
                <span className="text-[11px] font-semibold text-[#0C2340] block mb-1">
                  Administrative Notes
                </span>
                <p className="text-xs text-[#536B85] bg-[#FAF8F4] p-3 rounded border border-[#DCD7CC] leading-relaxed">
                  {subscription.notes}
                </p>
              </div>
            )}
          </div>

          {/* Deep link indicator & Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center justify-between text-[11px] text-[#536B85] font-mono">
            <span>Direct Hash: #{`subscription-${subscription.id}`}</span>
            <span className="text-[#347A63]">Illustrative Sample Data</span>
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-3 border-t border-[#E9E5DC] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onDelete(subscription)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-[#E8C2BA] text-[#8C3B2B] hover:bg-[#FBEAE8] font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(subscription)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#0C2340] font-medium transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
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
