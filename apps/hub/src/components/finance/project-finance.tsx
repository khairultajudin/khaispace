"use client";

import React from "react";
import { FolderKanban } from "lucide-react";
import { TransactionItem } from "../../types/dashboard";
import { CATALOGED_PROJECTS } from "../../data/sample-dashboard-data";
import {
  calculateProjectFinance,
  formatMYR,
  formatSignedMYR,
  formatPercent,
} from "../../utils/finance-utils";

interface ProjectFinanceProps {
  transactions: TransactionItem[];
}

export function ProjectFinance({ transactions }: ProjectFinanceProps) {
  const projectSummaries = calculateProjectFinance(transactions, CATALOGED_PROJECTS);

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <FolderKanban className="w-4 h-4" />
              <span>Project Economics &amp; Capital Attribution</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
              Project Finance Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Consolidated financial attribution across workspaces. Separates ongoing operating cashflow from capital hardware investments, calculating ROI exclusively where direct capital yields exist.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Entities: <strong className="font-semibold">{projectSummaries.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F4] border-b border-[#DCD7CC] text-[#536B85] uppercase tracking-wider text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Project &amp; Category</th>
                <th className="py-3 px-4 font-semibold text-right">Income</th>
                <th className="py-3 px-4 font-semibold text-right">Operating Exp.</th>
                <th className="py-3 px-4 font-semibold text-right">Net Cashflow</th>
                <th className="py-3 px-4 font-semibold text-right">Capital Outlay</th>
                <th className="py-3 px-4 font-semibold text-right">Realized ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E5DC]">
              {projectSummaries.map((summary) => (
                <tr key={summary.projectId} className="hover:bg-[#FAF8F4]/80 transition-colors">
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="font-semibold text-sm text-[#0C2340]">
                      {summary.projectTitle}
                    </div>
                    <div className="text-[11px] font-mono text-[#536B85]">
                      {summary.category}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#0C2340]">
                    {formatMYR(summary.income)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#8C3B2B]">
                    {formatMYR(summary.expenses)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium">
                    <span
                      className={
                        summary.netCashflow > 0
                          ? "text-[#347A63]"
                          : summary.netCashflow < 0
                          ? "text-[#8C3B2B]"
                          : "text-[#536B85]"
                      }
                    >
                      {formatSignedMYR(summary.netCashflow)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#0C2340]">
                    {formatMYR(summary.investment)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    {summary.roiPercent !== null ? (
                      <div className="space-y-0.5">
                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded border inline-block ${
                            summary.roiPercent >= 0
                              ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                              : "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]"
                          }`}
                        >
                          {formatPercent(summary.roiPercent)}
                        </span>
                        <div
                          className="text-[10px] text-[#536B85] truncate max-w-[180px] ml-auto"
                          title={summary.roiNote}
                        >
                          {summary.roiNote}
                        </div>
                      </div>
                    ) : (
                      <span
                        className="text-[11px] text-[#536B85] italic cursor-help"
                        title={summary.roiNote}
                      >
                        {summary.roiNote}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Grid View */}
      <div className="md:hidden space-y-4">
        {projectSummaries.map((summary) => (
          <div
            key={summary.projectId}
            className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs p-5 space-y-3.5"
          >
            <div className="space-y-0.5 border-b border-[#E9E5DC] pb-2.5">
              <h3 className="font-semibold text-sm text-[#0C2340]">
                {summary.projectTitle}
              </h3>
              <span className="text-[11px] font-mono text-[#536B85] block">
                {summary.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
                <span className="text-[10px] text-[#536B85] block uppercase">Income</span>
                <span className="text-sm font-semibold text-[#0C2340]">
                  {formatMYR(summary.income)}
                </span>
              </div>
              <div className="p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
                <span className="text-[10px] text-[#536B85] block uppercase">Operating Exp</span>
                <span className="text-sm font-semibold text-[#8C3B2B]">
                  {formatMYR(summary.expenses)}
                </span>
              </div>
              <div className="p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
                <span className="text-[10px] text-[#536B85] block uppercase">Net Cashflow</span>
                <span
                  className={`text-sm font-semibold ${
                    summary.netCashflow >= 0 ? "text-[#347A63]" : "text-[#8C3B2B]"
                  }`}
                >
                  {formatSignedMYR(summary.netCashflow)}
                </span>
              </div>
              <div className="p-2 rounded bg-[#FAF8F4] border border-[#DCD7CC]">
                <span className="text-[10px] text-[#536B85] block uppercase">Capital Outlay</span>
                <span className="text-sm font-semibold text-[#0C2340]">
                  {formatMYR(summary.investment)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E9E5DC] flex items-center justify-between text-xs">
              <span className="text-[#536B85] font-medium">Realized ROI</span>
              {summary.roiPercent !== null ? (
                <span
                  className={`font-semibold font-mono text-xs px-2 py-0.5 rounded border ${
                    summary.roiPercent >= 0
                      ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                      : "bg-[#FBEAE8] text-[#8C3B2B] border-[#E8C2BA]"
                  }`}
                >
                  {formatPercent(summary.roiPercent)}
                </span>
              ) : (
                <span className="text-[11px] text-[#536B85] italic">
                  {summary.roiNote}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
