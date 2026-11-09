"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bot,
  ListFilter,
  CalendarDays,
  PieChart,
  RotateCcw,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { AISubscriptionItem } from "../../types/dashboard";
import { SAMPLE_SUBSCRIPTIONS } from "../../data/sample-dashboard-data";
import { SubscriptionMetrics } from "./subscription-metrics";
import { SubscriptionList } from "./subscription-list";
import { SubscriptionRenewals } from "./subscription-renewals";
import { SubscriptionCostAnalysis } from "./subscription-cost-analysis";
import { SubscriptionDetail } from "./subscription-detail";
import { SubscriptionForm } from "./subscription-form";

type SubscriptionTab = "directory" | "renewals" | "cost-analysis";

export function SubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<AISubscriptionItem[]>(SAMPLE_SUBSCRIPTIONS);
  const [activeTab, setActiveTab] = useState<SubscriptionTab>("directory");
  const [isModified, setIsModified] = useState(false);

  // Form modal state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    data?: AISubscriptionItem;
  }>({
    isOpen: false,
    mode: "add",
  });

  // Selected subscription for detail view / deep linking
  const [selectedSub, setSelectedSub] = useState<AISubscriptionItem | null>(null);

  // Delete confirmation modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AISubscriptionItem | null>(null);

  // Handle URL hash routing
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");

      if (hash === "renewals") {
        setActiveTab("renewals");
        setSelectedSub(null);
      } else if (hash === "cost-analysis") {
        setActiveTab("cost-analysis");
        setSelectedSub(null);
      } else if (hash === "subscriptions" || hash === "directory") {
        setActiveTab("directory");
        setSelectedSub(null);
      } else if (hash.startsWith("subscription-") || hash.startsWith("sub-")) {
        const id = hash.replace("subscription-", "");
        const matched = subscriptions.find((s) => s.id === id);
        if (matched) {
          setSelectedSub(matched);
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [subscriptions]);

  const setTabAndHash = (tab: SubscriptionTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      if (tab === "directory") {
        window.history.pushState(null, "", "#subscriptions");
      } else {
        window.history.pushState(null, "", `#${tab}`);
      }
    }
  };

  const openDetail = useCallback((sub: AISubscriptionItem) => {
    setSelectedSub(sub);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#subscription-${sub.id}`);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedSub(null);
    if (typeof window !== "undefined") {
      window.history.pushState(
        null,
        "",
        activeTab === "directory" ? "#subscriptions" : `#${activeTab}`
      );
    }
  }, [activeTab]);

  const handleAddNew = () => {
    setFormModal({
      isOpen: true,
      mode: "add",
    });
  };

  const handleEdit = (sub: AISubscriptionItem) => {
    setFormModal({
      isOpen: true,
      mode: "edit",
      data: sub,
    });
  };

  const handleSave = (savedSub: AISubscriptionItem) => {
    if (formModal.mode === "add") {
      setSubscriptions((prev) => [savedSub, ...prev]);
    } else {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === savedSub.id ? savedSub : s))
      );
      if (selectedSub?.id === savedSub.id) {
        setSelectedSub(savedSub);
      }
    }
    setIsModified(true);
    setFormModal({ isOpen: false, mode: "add" });
  };

  const handleDeletePrompt = (sub: AISubscriptionItem) => {
    setDeleteCandidate(sub);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    setSubscriptions((prev) => prev.filter((s) => s.id !== deleteCandidate.id));
    setIsModified(true);
    if (selectedSub?.id === deleteCandidate.id) {
      closeDetail();
    }
    setDeleteCandidate(null);
  };

  const handleResetToBaseline = () => {
    setSubscriptions(SAMPLE_SUBSCRIPTIONS);
    setIsModified(false);
    setSelectedSub(null);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <Bot className="w-4 h-4" />
              <span>AI Command Center &bull; Developer Tooling</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              AI Subscriptions &amp; Services
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Consolidated lifecycle tracking, renewal calendar, and cost attribution across LLM assistants, generative media models, and AI developer tooling.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isModified && (
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-xs font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer"
                title="Restore default sample subscriptions"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Baseline</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <SubscriptionMetrics subscriptions={subscriptions} />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#DCD7CC] gap-2 overflow-x-auto pb-px">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setTabAndHash("directory")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "directory"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Tools Directory ({subscriptions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAndHash("renewals")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "renewals"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Renewals &amp; Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAndHash("cost-analysis")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "cost-analysis"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Cost Analysis &amp; Attribution</span>
          </button>
        </div>

        {isModified && (
          <span className="text-[11px] font-mono text-[#8C6D2B] bg-[#FAF8F4] px-2 py-1 rounded border border-[#DCD7CC] shrink-0">
            Session modified
          </span>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === "directory" && (
        <SubscriptionList
          subscriptions={subscriptions}
          onSelect={openDetail}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onAddNew={handleAddNew}
        />
      )}

      {activeTab === "renewals" && (
        <SubscriptionRenewals
          subscriptions={subscriptions}
          onSelect={openDetail}
        />
      )}

      {activeTab === "cost-analysis" && (
        <SubscriptionCostAnalysis subscriptions={subscriptions} />
      )}

      {/* Subscription Detail Modal (Deep-linkable) */}
      <SubscriptionDetail
        subscription={selectedSub}
        isOpen={selectedSub !== null}
        onClose={closeDetail}
        onEdit={(sub) => {
          closeDetail();
          handleEdit(sub);
        }}
        onDelete={(sub) => {
          closeDetail();
          handleDeletePrompt(sub);
        }}
      />

      {/* Add / Edit Form Modal (Keyed for reliable reset without cascading renders) */}
      {formModal.isOpen && (
        <SubscriptionForm
          key={`${formModal.mode}-${formModal.data?.id || "new"}`}
          isOpen={formModal.isOpen}
          mode={formModal.mode}
          initialData={formModal.data}
          onSave={handleSave}
          onClose={() => setFormModal({ isOpen: false, mode: "add" })}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C3B2B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#0C2340]">
                Delete Subscription Record?
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-[#0C2340]">
                {deleteCandidate.productName} ({deleteCandidate.planName})
              </strong>{" "}
              from this session? All calculated metrics and renewal timelines will update immediately.
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
                Delete Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
