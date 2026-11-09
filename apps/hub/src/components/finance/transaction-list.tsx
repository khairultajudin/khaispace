"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  RotateCcw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { TransactionItem, TransactionType } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import { formatMYR } from "../../utils/finance-utils";

interface TransactionListProps {
  transactions: TransactionItem[];
  onSelectTransaction: (txId: string) => void;
  onAddTransaction: () => void;
  onEditTransaction: (tx: TransactionItem) => void;
  onDeleteTransaction: (txId: string) => void;
}

export function TransactionList({
  transactions,
  onSelectTransaction,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"ALL" | TransactionType>("ALL");
  const [selectedProject, setSelectedProject] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Derive unique categories dynamically from current transaction state
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      if (t.category) set.add(t.category);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [transactions]);

  // Derive unique project filter options
  const projectFilterOptions = useMemo(() => {
    return [
      { id: "ALL", label: "All Workspaces" },
      { id: "unassigned", label: "General Operations (Shared)" },
      ...CATALOGED_PROJECTS.map((p) => ({ id: p.id, label: p.title })),
    ];
  }, []);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Type filter
        if (selectedType !== "ALL" && tx.type !== selectedType) {
          return false;
        }

        // Project filter
        if (selectedProject !== "ALL") {
          if (selectedProject === "unassigned") {
            if (tx.projectId) return false;
          } else if (tx.projectId !== selectedProject) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "ALL" && tx.category !== selectedCategory) {
          return false;
        }

        // Search query (description, notes, category, projectTitle)
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchProj = tx.projectTitle ? tx.projectTitle.toLowerCase().includes(q) : false;

          if (!matchDesc && !matchNotes && !matchCat && !matchProj) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return b.dateIso.localeCompare(a.dateIso);
        } else {
          return a.dateIso.localeCompare(b.dateIso);
        }
      });
  }, [transactions, selectedType, selectedProject, selectedCategory, searchQuery, sortOrder]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedType !== "ALL" ||
    selectedProject !== "ALL" ||
    selectedCategory !== "ALL" ||
    sortOrder !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setSelectedProject("ALL");
    setSelectedCategory("ALL");
    setSortOrder("newest");
  };

  const typePillStyles = {
    Income: "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
    Expense: "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]",
    Investment: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Action Bar */}
      <div className="p-4 sm:p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, notes, or category..."
              className="w-full pl-9 pr-9 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder:text-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as "ALL" | TransactionType)}
              aria-label="Filter by transaction type"
              className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Operating Expense</option>
              <option value="Investment">Capital Investment</option>
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project attribution"
              className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer max-w-[150px] truncate"
            >
              {projectFilterOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer max-w-[140px] truncate"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              aria-label="Sort by date"
              className="py-2 px-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer font-mono text-[11px]"
            >
              <option value="newest">Date: Newest First</option>
              <option value="oldest">Date: Oldest First</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#E9E5DC] font-medium text-[#536B85] hover:text-[#0C2340] transition-colors cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Add Transaction Button */}
            <button
              type="button"
              onClick={onAddTransaction}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>

        {/* Results summary row */}
        <div className="flex items-center justify-between text-xs text-[#536B85] pt-1 border-t border-[#E9E5DC]">
          <div>
            Showing <strong className="text-[#0C2340]">{filteredTransactions.length}</strong> of{" "}
            <strong>{transactions.length}</strong> transactions
            {hasActiveFilters && <span className="italic ml-1">(filtered)</span>}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#347A63] hover:underline text-[11px] font-medium cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Transaction Records List / Table */}
      {filteredTransactions.length > 0 ? (
        <div className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#DCD7CC] text-[#536B85] uppercase tracking-wider text-[11px] font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Description &amp; Project</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DC]">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#FAF8F4]/80 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#536B85] whitespace-nowrap">
                      {tx.dateIso}
                    </td>

                    {/* Description & Project */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onSelectTransaction(tx.id)}
                        className="font-semibold text-sm text-[#0C2340] group-hover:text-[#347A63] transition-colors text-left block cursor-pointer focus-visible:outline-none focus-visible:underline"
                      >
                        {tx.description}
                      </button>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#536B85]">
                        <span className="font-medium text-[#0C2340]">
                          {tx.projectTitle || "General Operations (Shared)"}
                        </span>
                        {tx.isInvestmentReturn && (
                          <>
                            <span>&bull;</span>
                            <span className="text-[#347A63] font-semibold">Realized Capital Return</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          typePillStyles[tx.type]
                        }`}
                      >
                        {tx.type === "Income" && <ArrowUpRight className="w-2.5 h-2.5" />}
                        {tx.type === "Expense" && <ArrowDownRight className="w-2.5 h-2.5" />}
                        {tx.type === "Investment" && <Building2 className="w-2.5 h-2.5" />}
                        {tx.type}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-[#536B85] whitespace-nowrap">
                      {tx.category}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          tx.type === "Income"
                            ? "text-[#347A63]"
                            : tx.type === "Expense"
                            ? "text-[#8C3B2B]"
                            : "text-[#0C2340]"
                        }
                      >
                        {tx.type === "Expense" ? "-" : "+"}
                        {formatMYR(tx.amount)}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectTransaction(tx.id)}
                          className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
                          aria-label={`View details: ${tx.description}`}
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
                          aria-label={`Edit transaction: ${tx.description}`}
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded text-[#536B85] hover:text-[#8C3B2B] hover:bg-[#FBEAE8] transition-colors cursor-pointer"
                          aria-label={`Delete transaction: ${tx.description}`}
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#0C2340]">No matching transactions found</h3>
            <p className="text-xs text-[#536B85] max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any financial records matching your active filter or search criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium text-white bg-[#0C2340] hover:bg-[#0C2340]/90 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters &amp; Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
