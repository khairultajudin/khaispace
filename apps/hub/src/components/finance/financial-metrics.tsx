"use client";

import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Building2,
  Percent,
  Info,
} from "lucide-react";
import { TransactionItem } from "../../types/dashboard";
import {
  formatMYR,
  formatSignedMYR,
  formatPercent,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalInvestment,
  calculateNetOperatingCashflow,
  calculateOverallROI,
} from "../../utils/finance-utils";

interface FinancialMetricsProps {
  transactions: TransactionItem[];
}

export function FinancialMetrics({ transactions }: FinancialMetricsProps) {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  const investment = calculateTotalInvestment(transactions);
  const netCashflow = calculateNetOperatingCashflow(income, expenses);
  const roiData = calculateOverallROI(transactions);

  return (
    <div className="space-y-4">
      {/* 5-Card Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Income */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Total Income</span>
              <ArrowUpRight className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {formatMYR(income)}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Realized client &amp; sales inflows
          </span>
        </div>

        {/* 2. Total Operating Expenses */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Operating Expenses</span>
              <ArrowDownRight className="w-4 h-4 text-[#8C3B2B]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {formatMYR(expenses)}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Excludes capital outlay
          </span>
        </div>

        {/* 3. Net Operating Cashflow */}
        <div className="p-5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/40 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#347A63]">
              <span className="font-medium">Net Cashflow</span>
              <Wallet className="w-4 h-4 text-[#347A63]" />
            </div>
            <div
              className={`text-2xl font-bold tracking-tight font-mono ${
                netCashflow >= 0 ? "text-[#347A63]" : "text-[#8C3B2B]"
              }`}
            >
              {formatSignedMYR(netCashflow)}
            </div>
          </div>
          <span className="text-[11px] text-[#347A63]/80 pt-2 border-t border-[#A8CFC2]/60 mt-2 block font-medium">
            Income &minus; Operating Expenses
          </span>
        </div>

        {/* 4. Total Capital Investment */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Capital Investment</span>
              <Building2 className="w-4 h-4 text-[#0C2340]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {formatMYR(investment)}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Hardware, racks &amp; assets
          </span>
        </div>

        {/* 5. Realized ROI */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Realized Asset ROI</span>
              <Percent className="w-4 h-4 text-[#347A63]" />
            </div>
            <div
              className={`text-2xl font-bold tracking-tight font-mono ${
                roiData.roiPercent !== null && roiData.roiPercent >= 0
                  ? "text-[#347A63]"
                  : roiData.roiPercent !== null
                  ? "text-[#8C3B2B]"
                  : "text-[#536B85]"
              }`}
            >
              {roiData.roiPercent !== null
                ? formatPercent(roiData.roiPercent)
                : "N/A"}
            </div>
          </div>
          <span
            className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block truncate"
            title={roiData.basisNote}
          >
            {roiData.basisNote}
          </span>
        </div>
      </div>

      {/* Transparent Calculation & Sample Disclosure */}
      <div className="px-4 py-3 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-2.5 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Accounting Conventions &amp; Sample Disclaimer:</strong>{" "}
          Figures presented are illustrative sample data for interface modeling. Operating cashflow is calculated as{" "}
          <code className="font-mono bg-[#FAF8F4] px-1 py-0.5 rounded border border-[#DCD7CC] text-[#0C2340]">
            Income &minus; Operating Expenses
          </code>
          . Capital outlays for physical hardware/fabrication are tracked under Capital Investment and are evaluated separately using{" "}
          <code className="font-mono bg-[#FAF8F4] px-1 py-0.5 rounded border border-[#DCD7CC] text-[#0C2340]">
            ROI = ((Realized Return &minus; Capital Outlay) / Capital Outlay) &times; 100
          </code>
          .
        </div>
      </div>
    </div>
  );
}
