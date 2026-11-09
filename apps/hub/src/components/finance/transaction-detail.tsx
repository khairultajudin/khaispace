"use client";

import React from "react";
import {
  ArrowLeft,
  Calendar,
  FolderKanban,
  Info,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
} from "lucide-react";
import { TransactionItem } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import { formatMYR } from "../../utils/finance-utils";

interface TransactionDetailProps {
  transaction: TransactionItem;
  onBack: () => void;
  onEdit: (transaction: TransactionItem) => void;
  onDelete: (transactionId: string) => void;
}

export function TransactionDetail({
  transaction,
  onBack,
  onEdit,
  onDelete,
}: TransactionDetailProps) {
  const relatedProject = transaction.projectId
    ? CATALOGED_PROJECTS.find((p) => p.id === transaction.projectId)
    : undefined;

  const typeConfig = {
    Income: {
      label: "Operating Income",
      badge: "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
      icon: ArrowUpRight,
    },
    Expense: {
      label: "Operating Expense",
      badge: "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]",
      icon: ArrowDownRight,
    },
    Investment: {
      label: "Capital Investment",
      badge: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
      icon: Building2,
    },
  }[transaction.type];

  const IconComponent = typeConfig.icon;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FFFFFF] hover:bg-[#FAF8F4] text-xs font-medium text-[#0C2340] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#536B85]" />
          <span>Back to Transactions Ledger</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FFFFFF] hover:bg-[#FAF8F4] text-xs font-medium text-[#0C2340] transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#536B85]" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8C2BA] bg-[#FFFFFF] hover:bg-[#FBEAE8] text-xs font-medium text-[#8C3B2B] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#8C3B2B]" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Detail Header Card */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`font-mono text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded border ${typeConfig.badge} flex items-center gap-1`}
              >
                <IconComponent className="w-3 h-3" />
                {typeConfig.label}
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85]">
                {transaction.category}
              </span>
              {transaction.isInvestmentReturn && (
                <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63]">
                  Realized Capital Return
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340] leading-tight">
              {transaction.description}
            </h1>
          </div>

          <div className="shrink-0 text-left md:text-right font-mono">
            <span className="text-xs text-[#536B85] block mb-0.5">Transaction Amount</span>
            <span
              className={`text-2xl sm:text-3xl font-bold ${
                transaction.type === "Income"
                  ? "text-[#347A63]"
                  : transaction.type === "Expense"
                  ? "text-[#8C3B2B]"
                  : "text-[#0C2340]"
              }`}
            >
              {formatMYR(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Transaction Notes */}
        {transaction.notes && (
          <div className="pt-3 border-t border-[#E9E5DC]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#536B85] mb-1.5">
              Operational Notes &amp; Memo
            </h2>
            <p className="text-sm text-[#0C2340] leading-relaxed max-w-3xl">
              {transaction.notes}
            </p>
          </div>
        )}
      </div>

      {/* Two Column Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Attribution Context */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
            <FolderKanban className="w-4 h-4" />
            <span>Workspace Attribution</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#536B85] block mb-1">Assigned Project</span>
              <div className="font-semibold text-sm text-[#0C2340]">
                {transaction.projectTitle || "General Operations (Shared)"}
              </div>
            </div>

            {relatedProject ? (
              <>
                <div>
                  <span className="text-[#536B85] block mb-1">Category &amp; Lifecycle</span>
                  <div className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] font-medium text-[#0C2340]">
                      {relatedProject.category}
                    </span>
                    <span className="px-2 py-0.5 rounded border border-[#A8CFC2] bg-[#EDF5F2] font-medium text-[#347A63]">
                      {relatedProject.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[#536B85] block mb-1">Filesystem Path</span>
                  <div className="font-mono text-[11px] p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340] break-all">
                    {relatedProject.location}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[#536B85] text-xs leading-relaxed">
                Shared workspace operational overhead, general subscriptions, and administrative costs.
              </p>
            )}
          </div>
        </div>

        {/* Date & Metadata */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
            <Calendar className="w-4 h-4" />
            <span>Timing &amp; Ledger Metadata</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#536B85] block mb-1">Transaction Date</span>
              <div className="inline-flex items-center gap-2 font-mono text-xs p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340]">
                <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
                <span className="font-semibold">{transaction.date}</span>
                <span className="text-[#536B85]">({transaction.dateIso})</span>
              </div>
            </div>

            <div>
              <span className="text-[#536B85] block mb-1">Stable Transaction Identifier</span>
              <div className="font-mono text-xs p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340]">
                {transaction.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session State Disclosure Banner */}
      <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-3 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Local Session State Notice:</strong> Transactions, edits, and deletions are maintained in client memory for this browser session. Figures represent illustrative sample financial data and are not connected to any external banking institution or database.
        </div>
      </div>
    </div>
  );
}
