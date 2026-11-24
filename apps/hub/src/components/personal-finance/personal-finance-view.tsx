"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  CreditCard,
  ListChecks,
  Search,
  Wallet,
} from "lucide-react";
import rawData from "../../data/personal-finance-2026.json";
import { DecemberBudgetPanel } from "./december-budget-panel";

interface CategoryRow {
  name: string;
  count: number;
  amount: number;
  pct: number;
  bar: number;
}

interface LedgerRow {
  date: string;
  sort: string;
  status: string;
  statusLabel: string;
  category: string;
  title: string;
  sub: string;
  method: string;
  direction: string;
  amount: number;
  uid: string;
  done: boolean;
}

interface CashEvent {
  date: string;
  sort: string;
  type: "in" | "out";
  label: string;
  amount: number;
  balance: number;
}

interface TngEvent {
  date: string;
  time: string;
  category: string;
  location: string;
  amount: number;
  balance: string;
}

interface MkItem {
  date: string;
  title: string;
  status: string;
  type: string;
  amount: number;
}

interface MonthData {
  key: string;
  label: string;
  closingBal: number;
  cimbIn: number;
  cimbInCount: number;
  cimbOut: number;
  cimbOutCount: number;
  odTotal: number;
  odCount: number;
  matchedCount: number;
  matchedSum: number;
  doneCount: number;
  categoryRows: CategoryRow[];
  ledger: LedgerRow[];
  cashEvents: CashEvent[];
  cashSummary: { in: number; out: number; balance: number };
  tngEvents: TngEvent[];
  tngSummary: {
    kadAwal: number;
    kadIn: number;
    tolParkir: number;
    payDirect: number;
    kadAkhir: string;
    ewSummary: string;
  };
  mkVentureItems: MkItem[];
}

interface AnnualData {
  months: string[];
  cimbInMonthly: number[];
  cimbOutMonthly: number[];
  odMonthly: number[];
  totalCimbIn: number;
  totalCimbOut: number;
  totalOd: number;
  latestClosingBal: number;
  latestCashBal: number;
  categoryRows: CategoryRow[];
}

interface FinancePayload {
  order: string[];
  months: Record<string, MonthData>;
  annual: AnnualData;
}

const DATA = rawData as unknown as FinancePayload;

type MonthSubTab = "summary" | "ledger" | "cash" | "tng";

function fmtRM(v: number): string {
  return `RM ${Number(v || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&");
}

function statusPillClass(status: string): string {
  switch (status) {
    case "matched":
      return "bg-[#EBF5F0] text-[#347A63] border-[#C8E6D7]";
    case "cimb_in":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "od_only":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "cash_topup":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
  }
}

export function PersonalFinanceView() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("annual");
  const [monthSubTab, setMonthSubTab] = useState<MonthSubTab>("summary");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");
  const [ledgerStatus, setLedgerStatus] = useState<string>("all");

  const activeMonth: MonthData | null =
    selectedPeriod === "annual" || selectedPeriod === "budget-dec"
      ? null
      : DATA.months[selectedPeriod] || null;

  const totalTransactionsAudited = useMemo(
    () => DATA.order.reduce((acc, k) => acc + (DATA.months[k]?.ledger.length || 0), 0),
    []
  );

  const filteredLedger = useMemo(() => {
    if (!activeMonth) return [];
    const q = ledgerSearch.trim().toLowerCase();
    return activeMonth.ledger.filter((row) => {
      if (ledgerStatus !== "all" && row.status !== ledgerStatus) return false;
      if (!q) return true;
      return (
        row.date.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.sub.toLowerCase().includes(q) ||
        row.statusLabel.toLowerCase().includes(q)
      );
    });
  }, [activeMonth, ledgerSearch, ledgerStatus]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#DCD7CC] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#0C2340]">
                Pengurusan Kewangan Personal (Jun – 24 Nov 2026)
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#347A63] border border-[#C8E6D7]">
                <CheckCircle2 className="w-3 h-3" />
                {totalTransactionsAudited}/{totalTransactionsAudited} Diaudit (100%)
              </span>
            </div>
            <p className="text-xs text-[#536B85] mt-1">
              Silang-semak penuh antara <strong>CIMB Bank</strong>, <strong>Our Duit (Firestore)</strong>, <strong>Dompet Tunai</strong>, <strong>Touch &apos;n Go</strong>, <strong>Setel</strong>, <strong>Grab</strong> &amp; <strong>Shopee</strong>.
            </p>
          </div>
        </div>

        {/* Period Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedPeriod("annual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedPeriod === "annual"
                ? "bg-[#0C2340] text-white shadow-xs"
                : "bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC] hover:text-[#0C2340]"
            }`}
          >
            Keseluruhan
          </button>
          {DATA.order.map((k) => {
            const mo = DATA.months[k];
            const active = selectedPeriod === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setSelectedPeriod(k);
                  setLedgerSearch("");
                  setLedgerStatus("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-[#0C2340] text-white shadow-xs"
                    : "bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC] hover:text-[#0C2340]"
                }`}
              >
                {mo.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedPeriod("budget-dec")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedPeriod === "budget-dec"
                ? "bg-[#347A63] text-white shadow-xs"
                : "bg-[#EBF5F0] text-[#347A63] border border-[#C8E6D7] hover:bg-[#DCF0E6]"
            }`}
          >
            Bajet Dis 2026
          </button>
        </div>
      </div>

      {/* DECEMBER 2026 BUDGET PLANNER */}
      {selectedPeriod === "budget-dec" && <DecemberBudgetPanel />}

      {/* ANNUAL OVERVIEW */}
      {selectedPeriod === "annual" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>Jumlah CIMB Masuk</span>
                <ArrowDownLeft className="w-4 h-4 text-[#347A63]" />
              </div>
              <div className="text-2xl font-bold text-[#0C2340] mt-1.5">
                {fmtRM(DATA.annual.totalCimbIn)}
              </div>
              <div className="text-[11px] text-[#347A63] mt-1 font-medium">
                6 bulan (Jun – 24 Nov 2026)
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>Jumlah CIMB Keluar</span>
                <ArrowUpRight className="w-4 h-4 text-[#B45309]" />
              </div>
              <div className="text-2xl font-bold text-[#0C2340] mt-1.5">
                {fmtRM(DATA.annual.totalCimbOut)}
              </div>
              <div className="text-[11px] text-[#536B85] mt-1">
                Baki akhir CIMB 24 Nov: <span className="font-semibold text-[#0C2340]">{fmtRM(DATA.annual.latestClosingBal)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>Perbelanjaan Khai (Our Duit)</span>
                <BarChart3 className="w-4 h-4 text-[#0C2340]" />
              </div>
              <div className="text-2xl font-bold text-[#0C2340] mt-1.5">
                {fmtRM(DATA.annual.totalOd)}
              </div>
              <div className="text-[11px] text-[#536B85] mt-1">
                Purata: {fmtRM(DATA.annual.totalOd / Math.max(1, DATA.order.length))} / bulan
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>Baki Tunai Semasa (Cash)</span>
                <Banknote className="w-4 h-4 text-[#347A63]" />
              </div>
              <div className="text-2xl font-bold text-[#347A63] mt-1.5">
                {fmtRM(DATA.annual.latestCashBal)}
              </div>
              <div className="text-[11px] text-[#536B85] mt-1">
                Baki bawaan setakat 24 Nov 2026
              </div>
            </div>
          </div>

          {/* Monthly Comparison Table */}
          <div className="bg-white rounded-xl border border-[#DCD7CC] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DCD7CC] bg-[#FAF8F4] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0C2340]">
                Ringkasan Bulanan (Jun – 24 Nov 2026)
              </h3>
              <span className="text-[11px] text-[#536B85]">
                Klik mana-mana bulan untuk lihat perincian penuh
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
                    <th className="py-3 px-4 font-semibold">Bulan</th>
                    <th className="py-3 px-4 font-semibold text-center">Audit</th>
                    <th className="py-3 px-4 font-semibold text-right">CIMB Masuk</th>
                    <th className="py-3 px-4 font-semibold text-right">CIMB Keluar</th>
                    <th className="py-3 px-4 font-semibold text-right">Belanja Khai (OD)</th>
                    <th className="py-3 px-4 font-semibold text-right">Baki CIMB</th>
                    <th className="py-3 px-4 font-semibold text-right">Baki Tunai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE4]">
                  {DATA.order.map((k) => {
                    const mo = DATA.months[k];
                    return (
                      <tr
                        key={k}
                        onClick={() => setSelectedPeriod(k)}
                        className="hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-semibold text-[#0C2340]">{mo.label}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF5F0] text-[#347A63] border border-[#C8E6D7]">
                            {mo.doneCount}/{mo.ledger.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#347A63] font-medium">
                          {fmtRM(mo.cimbIn)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#0C2340]">
                          {fmtRM(mo.cimbOut)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#0C2340]">
                          {fmtRM(mo.odTotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#536B85]">
                          {fmtRM(mo.closingBal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#347A63]">
                          {fmtRM(mo.cashSummary.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Annual Category Breakdown */}
          <div className="bg-white rounded-xl border border-[#DCD7CC] p-5">
            <h3 className="text-sm font-bold text-[#0C2340] mb-4">
              Pecahan Kategori Perbelanjaan Khai (Jun – 24 Nov 2026)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {DATA.annual.categoryRows.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0C2340]">
                      {cat.name}{" "}
                      <span className="text-[11px] text-[#536B85]">({cat.count} rekod)</span>
                    </span>
                    <span className="font-mono font-semibold text-[#0C2340]">
                      {fmtRM(cat.amount)}{" "}
                      <span className="text-[11px] text-[#536B85] font-normal">
                        ({cat.pct.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFECE4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0C2340]"
                      style={{ width: `${Math.min(100, Math.max(2, cat.bar))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MONTHLY VIEW */}
      {activeMonth && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>CIMB Wang Masuk</span>
                <ArrowDownLeft className="w-4 h-4 text-[#347A63]" />
              </div>
              <div className="text-2xl font-bold text-[#347A63] mt-1.5">
                {fmtRM(activeMonth.cimbIn)}
              </div>
              <div className="text-[11px] text-[#536B85] mt-1">
                {activeMonth.cimbInCount} transaksi masuk
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>CIMB Wang Keluar</span>
                <ArrowUpRight className="w-4 h-4 text-[#B45309]" />
              </div>
              <div className="text-2xl font-bold text-[#0C2340] mt-1.5">
                {fmtRM(activeMonth.cimbOut)}
              </div>
              <div className="text-[11px] text-[#536B85] mt-1">
                Baki Akhir CIMB: <strong className="text-[#0C2340]">{fmtRM(activeMonth.closingBal)}</strong>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>Belanja Khai (Our Duit)</span>
                <CheckCircle2 className="w-4 h-4 text-[#347A63]" />
              </div>
              <div className="text-2xl font-bold text-[#0C2340] mt-1.5">
                {fmtRM(activeMonth.odTotal)}
              </div>
              <div className="text-[11px] text-[#347A63] mt-1 font-medium">
                {activeMonth.odCount} rekod • Audit {activeMonth.doneCount}/{activeMonth.ledger.length} Done
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
              <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
                <span>Dompet Tunai (Cash)</span>
                <Banknote className="w-4 h-4 text-[#0C2340]" />
              </div>
              <div className="text-2xl font-bold text-[#0C2340] mt-1.5">
                {fmtRM(activeMonth.cashSummary.balance)}
              </div>
              <div className="text-[11px] text-[#536B85] mt-1">
                Masuk {fmtRM(activeMonth.cashSummary.in)} • Keluar {fmtRM(activeMonth.cashSummary.out)}
              </div>
            </div>
          </div>

          {/* Month Sub-tabs */}
          <div className="bg-white rounded-xl border border-[#DCD7CC] overflow-hidden">
            <div className="border-b border-[#DCD7CC] px-4 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF8F4]">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(
                  [
                    { id: "summary", label: "Ringkasan & Kategori", icon: BarChart3 },
                    { id: "ledger", label: `Lejar Harian (${activeMonth.ledger.length})`, icon: ListChecks },
                    { id: "cash", label: `Dompet Tunai (${activeMonth.cashEvents.length})`, icon: Banknote },
                    { id: "tng", label: `Touch 'n Go (${activeMonth.tngEvents.length})`, icon: CreditCard },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const active = monthSubTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMonthSubTab(t.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? "border-[#0C2340] text-[#0C2340] bg-white rounded-t-md"
                          : "border-transparent text-[#536B85] hover:text-[#0C2340]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {monthSubTab === "ledger" && (
                <div className="flex items-center gap-2 pb-2.5 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#536B85] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Cari transaksi / kategori..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-white text-[#0C2340] focus:outline-none focus:border-[#0C2340] w-48"
                    />
                  </div>
                  <select
                    value={ledgerStatus}
                    onChange={(e) => setLedgerStatus(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-white text-[#0C2340]"
                  >
                    <option value="all">Semua Status</option>
                    <option value="matched">Padan (CIMB + OD)</option>
                    <option value="od_only">Our Duit (Cash / TNG)</option>
                    <option value="cimb_in">CIMB Masuk</option>
                    <option value="neutral">Neutral / Pindahan</option>
                    <option value="cash_topup">ATM / Cash In</option>
                  </select>
                </div>
              )}
            </div>

            {/* SUBTAB: SUMMARY & CATEGORIES */}
            {monthSubTab === "summary" && (
              <div className="p-5 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#536B85] mb-3">
                    Kategori Perbelanjaan ({activeMonth.label})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {activeMonth.categoryRows.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#0C2340]">
                            {cat.name}{" "}
                            <span className="text-[11px] text-[#536B85]">({cat.count})</span>
                          </span>
                          <span className="font-mono font-semibold text-[#0C2340]">
                            {fmtRM(cat.amount)}{" "}
                            <span className="text-[11px] text-[#536B85] font-normal">
                              ({cat.pct.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EFECE4] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#347A63]"
                            style={{ width: `${Math.min(100, Math.max(2, cat.bar))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TNG Summary strip */}
                <div className="rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] p-4 text-xs space-y-1">
                  <div className="font-bold text-[#0C2340]">
                    Ringkasan Touch &apos;n Go ({activeMonth.label})
                  </div>
                  <div className="text-[#536B85]">
                    Kad Awal: <strong className="text-[#0C2340]">{fmtRM(activeMonth.tngSummary.kadAwal)}</strong> • Topup Kad: <strong className="text-[#0C2340]">{fmtRM(activeMonth.tngSummary.kadIn)}</strong> • Tol/Parkir: <strong className="text-[#0C2340]">{fmtRM(activeMonth.tngSummary.tolParkir)}</strong> • Baki Akhir Kad: <strong className="text-[#347A63]">RM {activeMonth.tngSummary.kadAkhir}</strong>
                  </div>
                  <div className="text-[#536B85]">{stripHtml(activeMonth.tngSummary.ewSummary)}</div>
                </div>

                {/* MK Venture notes if any */}
                {activeMonth.mkVentureItems.length > 0 && (
                  <div className="rounded-lg border border-[#C8E6D7] bg-[#EBF5F0]/50 p-4 text-xs space-y-2">
                    <div className="font-bold text-[#0C2340]">
                      Nota Silang-Semak MK Venture ({activeMonth.label})
                    </div>
                    <ul className="space-y-1.5">
                      {activeMonth.mkVentureItems.map((it, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-[#536B85]">
                          <span>
                            <span className="font-mono text-[#0C2340]">{it.date}</span> • {it.title}{" "}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#DCD7CC] text-[#0C2340]">
                              {it.status}
                            </span>
                          </span>
                          <span className="font-mono font-semibold text-[#0C2340] shrink-0">
                            {fmtRM(it.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB: LEDGER */}
            {monthSubTab === "ledger" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
                      <th className="py-3 px-4 font-semibold">Tarikh</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Butiran &amp; Nota</th>
                      <th className="py-3 px-4 font-semibold">Kategori</th>
                      <th className="py-3 px-4 font-semibold text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4]">
                    {filteredLedger.map((r) => (
                      <tr key={r.uid} className="hover:bg-[#FAF8F4] transition-colors">
                        <td className="py-2.5 px-4 text-[#536B85] whitespace-nowrap font-mono text-[11px]">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusPillClass(r.status)}`}
                          >
                            {r.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 max-w-md">
                          <div className="font-medium text-[#0C2340]">{r.title}</div>
                          {r.sub && (
                            <div className="text-[11px] text-[#536B85] mt-0.5">{r.sub}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[#536B85] whitespace-nowrap">
                          {r.category}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                            r.direction === "Masuk" ? "text-[#347A63]" : "text-[#0C2340]"
                          }`}
                        >
                          {r.direction === "Masuk" ? "+" : ""}
                          {fmtRM(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB: CASH WALLET */}
            {monthSubTab === "cash" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
                      <th className="py-3 px-4 font-semibold">Tarikh</th>
                      <th className="py-3 px-4 font-semibold">Perkara</th>
                      <th className="py-3 px-4 font-semibold text-right">Aliran Tunai</th>
                      <th className="py-3 px-4 font-semibold text-right">Baki Tunai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4]">
                    {activeMonth.cashEvents.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F4]">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#536B85] whitespace-nowrap">
                          {ev.date}
                        </td>
                        <td className="py-2.5 px-4 text-[#0C2340] font-medium">{ev.label}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                            ev.type === "in" ? "text-[#347A63]" : "text-[#B45309]"
                          }`}
                        >
                          {ev.type === "in" ? "+" : "-"}
                          {fmtRM(ev.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#0C2340] whitespace-nowrap">
                          {fmtRM(ev.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB: TNG */}
            {monthSubTab === "tng" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
                      <th className="py-3 px-4 font-semibold">Tarikh</th>
                      <th className="py-3 px-4 font-semibold">Kategori</th>
                      <th className="py-3 px-4 font-semibold">Lokasi / Butiran</th>
                      <th className="py-3 px-4 font-semibold text-right">Jumlah</th>
                      <th className="py-3 px-4 font-semibold text-right">Baki Kad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4]">
                    {activeMonth.tngEvents.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F4]">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#536B85] whitespace-nowrap">
                          {ev.date}
                        </td>
                        <td className="py-2.5 px-4 text-[#536B85] whitespace-nowrap">
                          {ev.category}
                        </td>
                        <td className="py-2.5 px-4 text-[#0C2340] font-medium">{ev.location}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                            ev.amount >= 0 ? "text-[#347A63]" : "text-[#0C2340]"
                          }`}
                        >
                          {ev.amount >= 0 ? "+" : "-"}
                          {fmtRM(Math.abs(ev.amount))}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#536B85] whitespace-nowrap">
                          RM {ev.balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

