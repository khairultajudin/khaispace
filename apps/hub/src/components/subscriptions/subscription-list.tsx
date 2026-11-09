"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
  Building2,
  AlertCircle,
} from "lucide-react";
import {
  AISubscriptionItem,
  SubscriptionStatus,
} from "../../types/dashboard";
import {
  formatMYR,
  getMonthlyEquivalent,
  getDaysUntil,
} from "../../utils/subscription-utils";
import { getLocalTodayIso } from "../../utils/date-utils";

interface SubscriptionListProps {
  subscriptions: AISubscriptionItem[];
  onSelect: (sub: AISubscriptionItem) => void;
  onEdit: (sub: AISubscriptionItem) => void;
  onDelete: (sub: AISubscriptionItem) => void;
  onAddNew: () => void;
}

export function SubscriptionList({
  subscriptions,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: SubscriptionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCycle, setSelectedCycle] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("renewal-asc");

  const todayIso = getLocalTodayIso();

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => set.add(s.category));
    return Array.from(set).sort();
  }, [subscriptions]);

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchProvider = s.provider.toLowerCase().includes(q);
          const matchProduct = s.productName.toLowerCase().includes(q);
          const matchPlan = s.planName.toLowerCase().includes(q);
          const matchCategory = s.category.toLowerCase().includes(q);
          const matchPurpose = s.purpose.toLowerCase().includes(q);
          const matchProject = s.assignedProjectTitle?.toLowerCase().includes(q);
          if (
            !matchProvider &&
            !matchProduct &&
            !matchPlan &&
            !matchCategory &&
            !matchPurpose &&
            !matchProject
          ) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== "all" && s.status !== selectedStatus) {
          return false;
        }

        // Category filter
        if (selectedCategory !== "all" && s.category !== selectedCategory) {
          return false;
        }

        // Billing Cycle filter
        if (selectedCycle !== "all" && s.billingCycle !== selectedCycle) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "renewal-asc") {
          return a.nextBillingDateIso.localeCompare(b.nextBillingDateIso);
        }
        if (sortBy === "renewal-desc") {
          return b.nextBillingDateIso.localeCompare(a.nextBillingDateIso);
        }
        if (sortBy === "cost-desc") {
          return getMonthlyEquivalent(b) - getMonthlyEquivalent(a);
        }
        if (sortBy === "cost-asc") {
          return getMonthlyEquivalent(a) - getMonthlyEquivalent(b);
        }
        if (sortBy === "provider-asc") {
          return a.provider.localeCompare(b.provider);
        }
        return 0;
      });
  }, [subscriptions, searchTerm, selectedStatus, selectedCategory, selectedCycle, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedCategory !== "all" ||
    selectedCycle !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setSelectedCycle("all");
    setSortBy("renewal-asc");
  };

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
    <div className="space-y-4">
      {/* Search, Filter & Actions Toolbar */}
      <div className="p-4 sm:p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by provider, product, plan, or purpose..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Add New Subscription Button */}
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscription</span>
          </button>
        </div>

        {/* Filter Dropdowns & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Statuses ({subscriptions.length})</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Trial">Trial</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer font-medium"
            >
              <option value="renewal-asc">Renewal (Earliest First)</option>
              <option value="renewal-desc">Renewal (Latest First)</option>
              <option value="cost-desc">Cost (High to Low)</option>
              <option value="cost-asc">Cost (Low to High)</option>
              <option value="provider-asc">Provider (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Link */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#E9E5DC] flex items-center justify-between text-xs text-[#536B85]">
            <span>
              Showing <strong>{filteredSubscriptions.length}</strong> of {subscriptions.length} subscriptions
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[#347A63] hover:underline font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSubscriptions.length === 0 && (
        <div className="p-10 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#536B85] mx-auto opacity-60" />
          <h3 className="font-semibold text-sm text-[#0C2340]">No Subscriptions Match Your Filters</h3>
          <p className="text-xs text-[#536B85] max-w-sm mx-auto">
            Try adjusting your search terms or clearing your status, category, and cycle filters to view active subscriptions.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      {filteredSubscriptions.length > 0 && (
        <div className="hidden md:block rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#DCD7CC] text-[#536B85] uppercase tracking-wider text-[11px] font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tool &amp; Plan</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Billing Cycle</th>
                  <th className="py-3 px-4 font-semibold text-right">Actual Cost</th>
                  <th className="py-3 px-4 font-semibold text-right">Monthly Equiv.</th>
                  <th className="py-3 px-4 font-semibold">Next Renewal</th>
                  <th className="py-3 px-4 font-semibold">Project Attribution</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DC]">
                {filteredSubscriptions.map((sub) => {
                  const monthlyEquiv = getMonthlyEquivalent(sub);
                  const daysUntil = getDaysUntil(sub.nextBillingDateIso, todayIso);
                  const isUrgent = sub.status !== "Cancelled" && daysUntil >= 0 && daysUntil <= 7;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-[#FAF8F4]/80 transition-colors group cursor-pointer"
                      onClick={() => onSelect(sub)}
                    >
                      {/* Tool & Plan */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-semibold text-sm text-[#0C2340] group-hover:text-[#347A63] transition-colors flex items-center gap-1.5">
                          <span>{sub.productName}</span>
                          <span className="text-xs font-normal text-[#536B85]">by {sub.provider}</span>
                        </div>
                        <div className="text-[11px] text-[#536B85]">
                          {sub.planName} &bull; <span className="font-mono text-[#536B85]">{sub.category}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-[#0C2340]">
                          {sub.billingCycle}
                        </span>
                      </td>

                      {/* Actual Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-[#0C2340]">
                        {formatMYR(sub.amount)}
                        <span className="text-[10px] text-[#536B85] block">
                          /{sub.billingCycle === "Annual" ? "yr" : "mo"}
                        </span>
                      </td>

                      {/* Monthly Equivalent */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#0C2340]">
                        {sub.status === "Cancelled" ? (
                          <span className="text-[#536B85] line-through">{formatMYR(monthlyEquiv)}/mo</span>
                        ) : sub.status === "Paused" ? (
                          <span className="text-[#8C6D2B]">{formatMYR(monthlyEquiv)}/mo (paused)</span>
                        ) : (
                          <span className="text-[#347A63]">{formatMYR(monthlyEquiv)}/mo</span>
                        )}
                      </td>

                      {/* Next Renewal */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-[#0C2340]">{sub.nextBillingDate}</div>
                        {sub.status !== "Cancelled" && (
                          <div
                            className={`text-[10px] ${
                              isUrgent
                                ? "text-[#8C3B2B] font-semibold"
                                : daysUntil < 0
                                ? "text-[#536B85]"
                                : "text-[#536B85]"
                            }`}
                          >
                            {daysUntil === 0
                              ? "Due today"
                              : daysUntil === 1
                              ? "Due tomorrow"
                              : daysUntil > 0
                              ? `In ${daysUntil} days`
                              : "Passed"}
                          </div>
                        )}
                      </td>

                      {/* Project Attribution */}
                      <td className="py-3.5 px-4">
                        {sub.assignedProjectTitle ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#0C2340] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#DCD7CC]">
                            <Building2 className="w-3 h-3 text-[#347A63]" />
                            {sub.assignedProjectTitle}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#536B85] italic">
                            General Operations
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelect(sub)}
                            className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                            title="View details"
                            aria-label={`View ${sub.productName}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(sub)}
                            className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                            title="Edit subscription"
                            aria-label={`Edit ${sub.productName}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(sub)}
                            className="p-1 rounded text-[#536B85] hover:text-[#8C3B2B] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                            title="Delete subscription"
                            aria-label={`Delete ${sub.productName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card Grid View */}
      {filteredSubscriptions.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredSubscriptions.map((sub) => {
            const monthlyEquiv = getMonthlyEquivalent(sub);
            const daysUntil = getDaysUntil(sub.nextBillingDateIso, todayIso);
            const isUrgent = sub.status !== "Cancelled" && daysUntil >= 0 && daysUntil <= 7;

            return (
              <div
                key={sub.id}
                className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs p-4 space-y-3 hover:border-[#347A63] transition-colors cursor-pointer"
                onClick={() => onSelect(sub)}
              >
                <div className="flex items-start justify-between gap-2 border-b border-[#E9E5DC] pb-2.5">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-[#0C2340]">
                      {sub.productName}
                    </h3>
                    <div className="text-[11px] text-[#536B85]">
                      {sub.provider} &bull; {sub.planName}
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border shrink-0 ${getStatusBadge(
                      sub.status
                    )}`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
                    <span className="text-[10px] text-[#536B85] block uppercase">Monthly Equiv</span>
                    <span className="text-sm font-semibold text-[#0C2340]">
                      {formatMYR(monthlyEquiv)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
                    <span className="text-[10px] text-[#536B85] block uppercase">Billing Cycle</span>
                    <span className="text-sm font-semibold text-[#0C2340]">
                      {sub.billingCycle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#536B85] pt-1">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
                    {sub.nextBillingDate}
                    {isUrgent && (
                      <span className="text-[#8C3B2B] font-semibold font-mono text-[10px]">
                        ({daysUntil}d left)
                      </span>
                    )}
                  </span>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(sub)}
                      className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4]"
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(sub)}
                      className="p-1 rounded text-[#536B85] hover:text-[#8C3B2B] hover:bg-[#FAF8F4]"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
