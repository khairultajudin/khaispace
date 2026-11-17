"use client";

import React from "react";
import { BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TransactionItem } from "../../types/dashboard";
import {
  calculateMonthlyTrends,
  formatMYR,
  formatSignedMYR,
} from "../../utils/finance-utils";

interface FinancialTrendsProps {
  transactions: TransactionItem[];
}

export function FinancialTrends({ transactions }: FinancialTrendsProps) {
  const trends = calculateMonthlyTrends(transactions);

  // Find max value across all months for proportional scaling
  const maxVal = Math.max(
    ...trends.flatMap((t) => [t.income, t.expenses, Math.abs(t.netCashflow)]),
    1000
  );

  if (trends.length === 0) {
    return (
      <div className="p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0C2340]">No Financial Trend Data</h3>
        <p className="text-xs text-[#536B85] max-w-sm mx-auto">
          Add dated transactions to generate monthly income, expense, and net cashflow visualizations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <BarChart3 className="w-4 h-4" />
              <span>Multi-Month Trajectory</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
              Monthly Financial Trends
            </h2>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Comparative monthly analysis contrasting realized operational income against recurring operational overhead. Capital hardware outlays are isolated to preserve operating cashflow fidelity.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#347A63]"></span>
              <span className="text-[#0C2340]">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#8C3B2B]"></span>
              <span className="text-[#0C2340]">Expenses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#1D4ED8]"></span>
              <span className="text-[#0C2340]">Net Cashflow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart Card */}
      <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#536B85]">
          Monthly Comparison Visualizer
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trends.map((m) => {
            const incomePercent = Math.min(100, Math.round((m.income / maxVal) * 100));
            const expensePercent = Math.min(100, Math.round((m.expenses / maxVal) * 100));

            return (
              <div
                key={m.month}
                className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-[#DCD7CC] pb-2">
                  <span className="font-bold text-sm text-[#0C2340]">{m.monthLabel}</span>
                  <span
                    className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                      m.netCashflow >= 0
                        ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                        : "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]"
                    }`}
                  >
                    Net: {formatSignedMYR(m.netCashflow)}
                  </span>
                </div>

                {/* Progress Comparison Bars */}
                <div className="space-y-3 text-xs font-mono">
                  {/* Income Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#536B85] text-[11px]">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-[#347A63]" />
                        Income
                      </span>
                      <span className="font-semibold text-[#0C2340]">{formatMYR(m.income)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#E9E5DC] overflow-hidden">
                      <div
                        className="h-full bg-[#347A63] rounded-full transition-all duration-300"
                        style={{ width: `${incomePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Expenses Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#536B85] text-[11px]">
                      <span className="flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3 text-[#8C3B2B]" />
                        Expenses
                      </span>
                      <span className="font-semibold text-[#8C3B2B]">{formatMYR(m.expenses)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#E9E5DC] overflow-hidden">
                      <div
                        className="h-full bg-[#8C3B2B] rounded-full transition-all duration-300"
                        style={{ width: `${expensePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Capital Investment note if present */}
                  {m.investment > 0 && (
                    <div className="text-[11px] text-[#536B85] pt-1 border-t border-[#E9E5DC] flex justify-between">
                      <span>Capital Outlay:</span>
                      <span className="font-semibold text-[#0C2340]">{formatMYR(m.investment)}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#536B85] pt-2 border-t border-[#DCD7CC] italic">
                  Operating Ratio: {m.income > 0 ? ((m.expenses / m.income) * 100).toFixed(0) : 0}% of revenue consumed
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
