"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Receipt,
  FolderKanban,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { TransactionItem } from "../../types/dashboard";
import { SAMPLE_TRANSACTIONS } from "../../data/sample-dashboard-data";
import { FinancialMetrics } from "./financial-metrics";
import { ProjectFinance } from "./project-finance";
import { FinancialTrends } from "./financial-trends";
import { TransactionList } from "./transaction-list";
import { TransactionDetail } from "./transaction-detail";
import { TransactionForm } from "./transaction-form";

export function FinanceView() {
  // Local session state for transactions
  const [transactions, setTransactions] = useState<TransactionItem[]>(SAMPLE_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "projects" | "trends">("overview");
  const [hasSessionModifications, setHasSessionModifications] = useState<boolean>(false);

  // Synchronous hash reader for direct transaction links (#tx-<id>)
  const [selectedTxId, setSelectedTxId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const match = window.location.hash.match(/^#tx-([a-z0-9-]+)$/);
      if (match) return match[1];
    }
    return null;
  });

  // Modal state for Add / Edit
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    data?: TransactionItem;
  }>({
    isOpen: false,
    mode: "add",
  });

  // Hash listener
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#tx-([a-z0-9-]+)$/);
      if (match) {
        setSelectedTxId(match[1]);
      } else if (hash === "#transactions") {
        setActiveTab("transactions");
        setSelectedTxId(null);
      } else if (hash === "#projects-finance") {
        setActiveTab("projects");
        setSelectedTxId(null);
      } else if (hash === "#trends") {
        setActiveTab("trends");
        setSelectedTxId(null);
      } else if (hash === "#finance") {
        setSelectedTxId(null);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Update URL hash when transaction is selected
  const handleSelectTransaction = (txId: string | null) => {
    setSelectedTxId(txId);
    if (txId) {
      window.location.hash = `tx-${txId}`;
    } else {
      window.location.hash =
        activeTab === "overview"
          ? "finance"
          : activeTab === "transactions"
          ? "transactions"
          : activeTab === "projects"
          ? "projects-finance"
          : "trends";
    }
  };

  // Add transaction
  const handleSaveTransaction = (savedTx: TransactionItem) => {
    if (modalState.mode === "add") {
      setTransactions((prev) => [savedTx, ...prev]);
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === savedTx.id ? savedTx : t))
      );
    }
    setHasSessionModifications(true);
    setModalState({ isOpen: false, mode: "add" });
  };

  // Delete transaction
  const handleDeleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    setHasSessionModifications(true);
    if (selectedTxId === txId) {
      handleSelectTransaction(null);
    }
  };

  // Reset session modifications to initial sample state
  const handleResetSessionData = () => {
    setTransactions(SAMPLE_TRANSACTIONS);
    setHasSessionModifications(false);
  };

  // If viewing a transaction detail, render TransactionDetail view
  if (selectedTxId) {
    const activeTx = transactions.find((t) => t.id === selectedTxId);
    if (activeTx) {
      return (
        <div className="space-y-6">
          <TransactionDetail
            transaction={activeTx}
            onBack={() => handleSelectTransaction(null)}
            onEdit={(tx) => setModalState({ isOpen: true, mode: "edit", data: tx })}
            onDelete={handleDeleteTransaction}
          />

          {modalState.isOpen && (
            <TransactionForm
              key={`detail-${modalState.mode}-${modalState.data?.id || "new"}`}
              isOpen={modalState.isOpen}
              mode={modalState.mode}
              initialData={modalState.data}
              onSave={handleSaveTransaction}
              onClose={() => setModalState({ isOpen: false, mode: "add" })}
            />
          )}
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <TrendingUp className="w-4 h-4" />
              <span>Financial Command &amp; Capital Attribution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Finance &amp; ROI
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Consolidated operational cashflow, multi-month trajectories, and capital asset return analysis. Changes made here operate strictly in local React session state.
            </p>
          </div>

          {/* Session modifications indicator */}
          {hasSessionModifications && (
            <div className="shrink-0 flex items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#347A63] animate-pulse"></span>
                Session Modified
              </span>
              <button
                type="button"
                onClick={handleResetSessionData}
                className="px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer"
                title="Reset transactions to initial sample state"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Reset State
              </button>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E9E5DC]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("overview");
              window.location.hash = "finance";
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
              activeTab === "overview"
                ? "bg-[#0C2340] text-white shadow-2xs"
                : "border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Financial Overview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("transactions");
              window.location.hash = "transactions";
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
              activeTab === "transactions"
                ? "bg-[#0C2340] text-white shadow-2xs"
                : "border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC]"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Transactions Ledger ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("projects");
              window.location.hash = "projects-finance";
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
              activeTab === "projects"
                ? "bg-[#0C2340] text-white shadow-2xs"
                : "border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC]"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Project Economics &amp; ROI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("trends");
              window.location.hash = "trends";
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] ${
              activeTab === "trends"
                ? "bg-[#0C2340] text-white shadow-2xs"
                : "border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Monthly Trends</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Metrics */}
      <FinancialMetrics transactions={transactions} />

      {/* Tab Specific Views */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <FinancialTrends transactions={transactions} />
          <ProjectFinance transactions={transactions} />
        </div>
      )}

      {activeTab === "transactions" && (
        <TransactionList
          transactions={transactions}
          onSelectTransaction={handleSelectTransaction}
          onAddTransaction={() => setModalState({ isOpen: true, mode: "add" })}
          onEditTransaction={(tx) => setModalState({ isOpen: true, mode: "edit", data: tx })}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {activeTab === "projects" && (
        <ProjectFinance transactions={transactions} />
      )}

      {activeTab === "trends" && (
        <FinancialTrends transactions={transactions} />
      )}

      {/* Add / Edit Transaction Modal */}
      {modalState.isOpen && (
        <TransactionForm
          key={`main-${modalState.mode}-${modalState.data?.id || "new"}`}
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          initialData={modalState.data}
          onSave={handleSaveTransaction}
          onClose={() => setModalState({ isOpen: false, mode: "add" })}
        />
      )}
    </div>
  );
}
