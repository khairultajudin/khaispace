"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Receipt,
  FolderKanban,
  BarChart3,
} from "lucide-react";
import { HubProject, TransactionItem } from "../../types/dashboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { fetchProjects } from "@/lib/supabase/projects-service";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from "@/lib/supabase/finance-service";
import { FinancialMetrics } from "./financial-metrics";
import { ProjectFinance } from "./project-finance";
import { FinancialTrends } from "./financial-trends";
import { TransactionList } from "./transaction-list";
import { TransactionDetail } from "./transaction-detail";
import { TransactionForm } from "./transaction-form";

export function FinanceView() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [projects, setProjects] = useState<HubProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "projects" | "trends">("overview");

  const loadTransactions = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const [rows, projRows] = await Promise.all([
        fetchTransactions(activeWorkspace.id),
        fetchProjects(activeWorkspace.id),
      ]);
      setTransactions(rows);
      setProjects(projRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load financial transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTransactions();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTransactions]);

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

  const handleSaveTransaction = async (savedTx: TransactionItem) => {
    if (!activeWorkspace || !user?.id) return;
    try {
      if (modalState.mode === "add") {
        await createTransaction(activeWorkspace.id, user.id, savedTx);
      } else {
        await updateTransaction(activeWorkspace.id, savedTx.id, savedTx);
      }
      setModalState({ isOpen: false, mode: "add" });
      await loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction.");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!activeWorkspace) return;
    const target = transactions.find((t) => t.id === txId);
    try {
      await deleteTransaction(activeWorkspace.id, txId, target?.description ?? "Transaction");
      if (selectedTxId === txId) {
        handleSelectTransaction(null);
      }
      await loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction.");
    }
  };

  // If viewing a transaction detail, render TransactionDetail view
  if (selectedTxId) {
    const activeTx = transactions.find((t) => t.id === selectedTxId);
    if (activeTx) {
      return (
        <div className="space-y-6">
          <TransactionDetail
            transaction={activeTx}
            projects={projects}
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
              projects={projects}
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
              Consolidated operational cashflow, multi-month trajectories, and capital asset return analysis synced with Supabase PostgreSQL.
            </p>
          </div>

          <div className="shrink-0 font-mono text-xs text-[#536B85]">
            {isLoading ? "Syncing ledger..." : `${transactions.length} ledger entries`}
          </div>
        </div>
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => void loadTransactions()} className="underline font-medium">
              Retry
            </button>
          </div>
        )}

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
          <ProjectFinance transactions={transactions} projects={projects} />
        </div>
      )}

      {activeTab === "transactions" && (
        <TransactionList
          transactions={transactions}
          projects={projects}
          onSelectTransaction={handleSelectTransaction}
          onAddTransaction={() => setModalState({ isOpen: true, mode: "add" })}
          onEditTransaction={(tx) => setModalState({ isOpen: true, mode: "edit", data: tx })}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {activeTab === "projects" && (
        <ProjectFinance transactions={transactions} projects={projects} />
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
          projects={projects}
          onSave={handleSaveTransaction}
          onClose={() => setModalState({ isOpen: false, mode: "add" })}
        />
      )}
    </div>
  );
}
