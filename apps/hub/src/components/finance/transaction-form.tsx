"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, Info } from "lucide-react";
import { TransactionItem, TransactionType } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";

interface TransactionFormProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: TransactionItem;
  onSave: (transaction: TransactionItem) => void;
  onClose: () => void;
}

export function TransactionForm({
  isOpen,
  mode,
  initialData,
  onSave,
  onClose,
}: TransactionFormProps) {
  const [description, setDescription] = useState<string>(() => initialData?.description || "");
  const [type, setType] = useState<TransactionType>(() => initialData?.type || "Expense");
  const [amount, setAmount] = useState<string>(() => (initialData ? initialData.amount.toString() : ""));
  const [dateIso, setDateIso] = useState<string>(() => initialData?.dateIso || "2026-11-09");
  const [category, setCategory] = useState<string>(() => initialData?.category || "");
  const [projectId, setProjectId] = useState<string>(() => initialData?.projectId || "none");
  const [notes, setNotes] = useState<string>(() => initialData?.notes || "");
  const [isInvestmentReturn, setIsInvestmentReturn] = useState<boolean>(() => initialData?.isInvestmentReturn || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!description.trim()) {
      errs.description = "Transaction description is required.";
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = "Amount must be a positive number greater than 0.";
    }

    if (!dateIso.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
      errs.dateIso = "A valid date in YYYY-MM-DD format is required.";
    }

    if (!category.trim()) {
      errs.category = "Category is required.";
    }

    if (projectId !== "none") {
      const validProject = CATALOGED_PROJECTS.find((p) => p.id === projectId);
      if (!validProject) {
        errs.projectId = "Selected project must exist in the catalog.";
      }
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

    // Convert dateIso to formatted readable date string
    const dateObj = new Date(dateIso + "T00:00:00");
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const savedTx: TransactionItem = {
      id: initialData?.id || `tx-${Date.now()}`,
      description: description.trim(),
      type,
      amount: parseFloat(amount),
      date: formattedDate,
      dateIso,
      category: category.trim(),
      projectId: matchedProject?.id,
      projectTitle: matchedProject?.title,
      notes: notes.trim() || undefined,
      isInvestmentReturn: type === "Income" ? isInvestmentReturn : false,
    };

    onSave(savedTx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-form-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E9E5DC] flex items-center justify-between bg-[#FAF8F4]">
          <h2 id="tx-form-title" className="text-base font-bold text-[#0C2340]">
            {mode === "add" ? "Record New Transaction" : "Edit Transaction"}
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
          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="tx-desc" className="font-semibold text-[#0C2340] block">
              Description <span className="text-[#8C3B2B]">*</span>
            </label>
            <input
              id="tx-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 3D Printer filament & nozzles"
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
            {errors.description && (
              <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Type & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="tx-type" className="font-semibold text-[#0C2340] block">
                Transaction Type <span className="text-[#8C3B2B]">*</span>
              </label>
              <select
                id="tx-type"
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
              >
                <option value="Expense">Operating Expense</option>
                <option value="Income">Operating Income</option>
                <option value="Investment">Capital Investment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="tx-amount" className="font-semibold text-[#0C2340] block">
                Amount (MYR) <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
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
          </div>

          {/* Date & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="tx-date" className="font-semibold text-[#0C2340] block">
                Date (YYYY-MM-DD) <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-mono focus:outline-none focus:border-[#347A63] cursor-pointer"
              />
              {errors.dateIso && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.dateIso}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="tx-cat" className="font-semibold text-[#0C2340] block">
                Category <span className="text-[#8C3B2B]">*</span>
              </label>
              <input
                id="tx-cat"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Hardware Capital, Client Retainer"
                className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
              />
              {errors.category && (
                <p className="text-[11px] text-[#8C3B2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Project Attribution */}
          <div className="space-y-1">
            <label htmlFor="tx-project" className="font-semibold text-[#0C2340] block">
              Related Project Attribution
            </label>
            <select
              id="tx-project"
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

          {/* Realized Capital Return Checkbox (for Income) */}
          {type === "Income" && (
            <div className="p-3 rounded-md border border-[#A8CFC2] bg-[#EDF5F2]/40 flex items-start gap-2.5">
              <input
                id="tx-roi-return"
                type="checkbox"
                checked={isInvestmentReturn}
                onChange={(e) => setIsInvestmentReturn(e.target.checked)}
                className="mt-0.5 rounded border-[#DCD7CC] text-[#347A63] focus:ring-[#347A63] cursor-pointer"
              />
              <label htmlFor="tx-roi-return" className="text-[11px] text-[#0C2340] leading-relaxed cursor-pointer">
                <strong>Tag as Realized Capital Return:</strong> Mark this income as direct realized return on invested equipment/assets (counts toward project ROI calculation).
              </label>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="tx-notes" className="font-semibold text-[#0C2340] block">
              Notes (Optional)
            </label>
            <textarea
              id="tx-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operational justification or invoice memo..."
              className="w-full px-3 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Session Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] flex items-center gap-2 text-[11px] text-[#536B85]">
            <Info className="w-3.5 h-3.5 text-[#347A63] shrink-0" />
            <span>Changes will update active metrics in client memory for this session only.</span>
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
              <span>{mode === "add" ? "Add Transaction" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
