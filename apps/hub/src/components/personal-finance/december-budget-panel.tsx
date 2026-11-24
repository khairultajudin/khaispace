"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Circle,
  PiggyBank,
  Receipt,
  RotateCcw,
  Sparkles,
  Wallet,
} from "lucide-react";

interface BudgetItem {
  id: string;
  group: "fixed" | "variable" | "special";
  name: string;
  category: string;
  historyNote: string;
  budget: number;
  paid: boolean;
}

const STORAGE_KEY = "khai_hub_budget_dec_2026_v1";

const DEFAULT_ITEMS: BudgetItem[] = [
  // FIXED RECURRING
  {
    id: "fix-car-loan",
    group: "fixed",
    name: "Pinjaman Kereta (Hong Leong Bank)",
    category: "Loans",
    historyNote: "6/6 bulan tepat (RM 737.00)",
    budget: 737.0,
    paid: false,
  },
  {
    id: "fix-family",
    group: "fixed",
    name: "Keluarga (Mak & Ayah Abang + Sayang)",
    category: "Family",
    historyNote: "RM 100 + RM 100 setiap bulan",
    budget: 200.0,
    paid: false,
  },
  {
    id: "fix-umobile",
    group: "fixed",
    name: "Bil Telefon (U Mobile)",
    category: "Bills",
    historyNote: "Jul–Okt: RM 92.70 – RM 117.85",
    budget: 100.0,
    paid: false,
  },
  {
    id: "fix-spaylater-lefant",
    group: "fixed",
    name: "Ansuran SPayLater — Lefant Robot Vacuum (5/6)",
    category: "Loans / SPayLater",
    historyNote: "Ansuran ke-5/6 (tamat Jan 2027)",
    budget: 97.66,
    paid: false,
  },
  {
    id: "fix-google-one",
    group: "fixed",
    name: "Langganan — Google One AI",
    category: "Subscription",
    historyNote: "Sep–Nov: RM 97.99/bln",
    budget: 97.99,
    paid: false,
  },
  {
    id: "fix-netflix",
    group: "fixed",
    name: "Langganan — Netflix (via TNG eWallet)",
    category: "Subscription",
    historyNote: "Okt–Nov: RM 33.90/bln",
    budget: 33.9,
    paid: false,
  },
  {
    id: "fix-canva",
    group: "fixed",
    name: "Langganan — Canva",
    category: "Subscription",
    historyNote: "Ogo, Okt, Nov: RM 30.00/bln",
    budget: 30.0,
    paid: false,
  },
  {
    id: "fix-chatgpt",
    group: "fixed",
    name: "Langganan — ChatGPT (OpenAI)",
    category: "Subscription",
    historyNote: "6/6 bulan tepat (RM 24.00/bln)",
    budget: 24.0,
    paid: false,
  },

  // VARIABLE RECURRING
  {
    id: "var-food",
    group: "variable",
    name: "Makanan & Minuman (Food)",
    category: "Food",
    historyNote: "Trend Sep–Nov: RM 538 / RM 587 / RM 488 (24h) · ~RM 20/hari",
    budget: 600.0,
    paid: false,
  },
  {
    id: "var-groceries",
    group: "variable",
    name: "Barang Dapur & Runcit (Groceries)",
    category: "Groceries",
    historyNote: "Purata Jun–Okt: RM 354.62 · Nov (24h): RM 424.85",
    budget: 400.0,
    paid: false,
  },
  {
    id: "var-fuel",
    group: "variable",
    name: "Minyak Kereta & Motor (Setel / Petronas)",
    category: "Fuel",
    historyNote: "Trend Sep–Nov: RM 143 / RM 183 / RM 125 (~4x RM 40)",
    budget: 180.0,
    paid: false,
  },
  {
    id: "var-medical",
    group: "variable",
    name: "Kesihatan & Farmasi (Klinik / Watson's)",
    category: "Medical & Pharmacy",
    historyNote: "Purata gabungan: ~RM 104/bln · Nov: RM 191.80",
    budget: 120.0,
    paid: false,
  },
  {
    id: "var-toll-parking",
    group: "variable",
    name: "Tol & Parkir (Kad TNG)",
    category: "Toll & Parking",
    historyNote: "Trend Sep–Nov: RM 41 / RM 81 / RM 23",
    budget: 80.0,
    paid: false,
  },
  {
    id: "var-household",
    group: "variable",
    name: "Barangan Rumah (MR DIY / Eco Shop / Gas)",
    category: "Household",
    historyNote: "Konsisten Jul–Nov: RM 61 – RM 91/bln",
    budget: 80.0,
    paid: false,
  },
  {
    id: "var-misc",
    group: "variable",
    name: "Pakaian / Sedekah / Dobi / Lain-lain",
    category: "Others",
    historyNote: "Alter baju, Masjid Sembilang, dobi, alat tulis",
    budget: 100.0,
    paid: false,
  },

  // SPECIAL ONE-OFF DEC 2026
  {
    id: "spc-nabihah",
    group: "special",
    name: "Bayar Balik Pinjaman Nabihah (Mak & Ayah Nov)",
    category: "Pelarasan Keluarga",
    historyNote: "Pinjaman tunai RM 100 pada Nov 2026",
    budget: 100.0,
    paid: false,
  },
  {
    id: "spc-mk-venture",
    group: "special",
    name: "Pelarasan Bersih kepada MK Venture",
    category: "Pelarasan Syarikat",
    historyNote: "Baki bersih setakat 24 Nov 2026 (termasuk claim DeepSeek RM 8.87)",
    budget: 67.99,
    paid: false,
  },
  {
    id: "spc-spaylater-extra",
    group: "special",
    name: "Baki Bil SPayLater Nov (Unpaid — isi jumlah jika ada)",
    category: "SPayLater",
    historyNote: "Selain ansuran Lefant RM 97.66 di atas",
    budget: 0.0,
    paid: false,
  },
];

function fmtRM(v: number): string {
  return `RM ${Number(v || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function DecemberBudgetPanel() {
  const [items, setItems] = useState<BudgetItem[]>(DEFAULT_ITEMS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BudgetItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const fixedItems = useMemo(() => items.filter((i) => i.group === "fixed"), [items]);
  const variableItems = useMemo(() => items.filter((i) => i.group === "variable"), [items]);
  const specialItems = useMemo(() => items.filter((i) => i.group === "special"), [items]);

  const fixedTotal = useMemo(() => fixedItems.reduce((s, i) => s + i.budget, 0), [fixedItems]);
  const variableTotal = useMemo(() => variableItems.reduce((s, i) => s + i.budget, 0), [variableItems]);
  const specialTotal = useMemo(() => specialItems.reduce((s, i) => s + i.budget, 0), [specialItems]);
  const grandTotal = fixedTotal + variableTotal + specialTotal;

  const paidTotal = useMemo(
    () => items.filter((i) => i.paid).reduce((s, i) => s + i.budget, 0),
    [items]
  );
  const paidCount = useMemo(() => items.filter((i) => i.paid).length, [items]);
  const remainingToPay = Math.max(0, grandTotal - paidTotal);
  const paidPct = grandTotal > 0 ? Math.min(100, (paidTotal / grandTotal) * 100) : 0;

  const togglePaid = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, paid: !it.paid } : it)));
  };

  const updateBudget = (id: string, val: string) => {
    const num = parseFloat(val);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, budget: Number.isFinite(num) && num >= 0 ? num : 0 } : it))
    );
  };

  const resetDefaults = () => {
    setItems(DEFAULT_ITEMS);
  };

  const renderGroupTable = (
    title: string,
    subtitle: string,
    list: BudgetItem[],
    groupTotal: number,
    badgeClass: string
  ) => (
    <div className="bg-white rounded-xl border border-[#DCD7CC] overflow-hidden">
      <div className="px-5 py-3.5 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#0C2340]">{title}</h3>
          <p className="text-[11px] text-[#536B85] mt-0.5">{subtitle}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${badgeClass}`}>
          {fmtRM(groupTotal)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#DCD7CC] text-[#536B85] font-semibold bg-white">
              <th className="py-2.5 px-4 w-10 text-center">Selesai</th>
              <th className="py-2.5 px-3">Item / Kategori</th>
              <th className="py-2.5 px-3">Corak Sebenar (Jun–Nov 2026)</th>
              <th className="py-2.5 px-4 text-right w-40">Bajet Dis 2026 (RM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFECE4]">
            {list.map((it) => (
              <tr
                key={it.id}
                className={`transition-colors ${it.paid ? "bg-[#EBF5F0]/40" : "hover:bg-[#FAF8F4]/70"}`}
              >
                <td className="py-2.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => togglePaid(it.id)}
                    title={it.paid ? "Tandakan belum dibayar" : "Tandakan sudah dibayar / diperuntukkan"}
                    className="inline-flex items-center justify-center cursor-pointer"
                  >
                    {it.paid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#347A63]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#A9B5C4] hover:text-[#0C2340]" />
                    )}
                  </button>
                </td>
                <td className="py-2.5 px-3">
                  <div className={`font-semibold ${it.paid ? "line-through text-[#536B85]" : "text-[#0C2340]"}`}>
                    {it.name}
                  </div>
                  <div className="text-[10px] text-[#536B85]">{it.category}</div>
                </td>
                <td className="py-2.5 px-3 text-[11px] text-[#536B85]">{it.historyNote}</td>
                <td className="py-2.5 px-4 text-right">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={it.budget}
                    onChange={(e) => updateBudget(it.id, e.target.value)}
                    className="w-28 text-right font-mono font-semibold text-[#0C2340] bg-[#FAF8F4] border border-[#DCD7CC] rounded-md px-2 py-1 focus:outline-none focus:border-[#0C2340]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Info & Refund Notice */}
      <div className="bg-[#EBF5F0] border border-[#C8E6D7] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
          <div className="text-xs text-[#0C2340] space-y-0.5">
            <div className="font-bold">
              Midjourney Dibatalkan &amp; Dijangka Refund (+RM 44.75 / USD 10.80)
            </div>
            <div className="text-[#347A63]">
              Resit refund <span className="font-mono font-semibold">3985-4455-6212</span> (Invoice <span className="font-mono">Q4M6ULZ9-0001</span>) bertarikh 24 Nov 2026 — semak kredit masuk ke Mastercard 5880 (CIMB) dalam 5–10 hari (29 Nov – 4 Dis). Midjourney telah dikeluarkan daripada bajet Disember.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#C8E6D7] text-[#347A63] hover:bg-[#FAF8F4] shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Lalai
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Komitmen Tetap (Fixed)</span>
            <CalendarCheck2 className="w-4 h-4 text-[#0C2340]" />
          </div>
          <div className="text-2xl font-bold text-[#0C2340] mt-1.5">{fmtRM(fixedTotal)}</div>
          <div className="text-[11px] text-[#536B85] mt-1">
            {fixedItems.length} item (Loan Kereta, Keluarga, Bil &amp; 4 Langganan)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Perbelanjaan Harian (Variable)</span>
            <Wallet className="w-4 h-4 text-[#347A63]" />
          </div>
          <div className="text-2xl font-bold text-[#0C2340] mt-1.5">{fmtRM(variableTotal)}</div>
          <div className="text-[11px] text-[#536B85] mt-1">
            Makan + Dapur RM 1,000 (~RM 230–250/minggu)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Pelarasan Khas Disember</span>
            <Receipt className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-bold text-[#B45309] mt-1.5">{fmtRM(specialTotal)}</div>
          <div className="text-[11px] text-[#536B85] mt-1">
            Nabihah RM 100 + MK Venture RM 67.99
          </div>
        </div>

        <div className="bg-[#0C2340] rounded-xl border border-[#0C2340] p-4 text-white">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Jumlah Sasaran Bajet Dis 2026</span>
            <PiggyBank className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5">{fmtRM(grandTotal)}</div>
          <div className="text-[11px] text-emerald-300 mt-1">
            Operasi Normal: {fmtRM(fixedTotal + variableTotal)}
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-xl border border-[#DCD7CC] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div>
            <div className="text-sm font-bold text-[#0C2340]">
              Status Peruntukan &amp; Bayaran Disember 2026
            </div>
            <div className="text-[11px] text-[#536B85]">
              Tandakan item di bawah apabila telah dibayar atau diasingkan. Nilai bajet boleh diubah terus &amp; disimpan automatik di pelayar.
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-[#347A63]">{fmtRM(paidTotal)}</span>
            <span className="text-[#536B85]"> / {fmtRM(grandTotal)}</span>
            <span className="ml-2 text-[11px] font-semibold text-[#0C2340]">
              ({paidCount}/{items.length} item · Baki {fmtRM(remainingToPay)})
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#EFECE4] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#347A63] transition-all duration-300"
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>

      {/* Group 1: Fixed */}
      {renderGroupTable(
        "1. Komitmen Tetap Berulang (Fixed Recurring)",
        "Asingkan terus sejurus gaji / pendapatan masuk. Loan Rumah (RM 526.50) & TM Unifi ditanggung MK Venture; QR.IO, CapCut & Midjourney sudah dihentikan.",
        fixedItems,
        fixedTotal,
        "bg-[#FAF8F4] text-[#0C2340] border-[#DCD7CC]"
      )}

      {/* Group 2: Variable */}
      {renderGroupTable(
        "2. Perbelanjaan Harian Berulang (Variable Recurring)",
        "Ditetapkan berdasarkan trend penjimatan sebenar Sep – Nov 2026 (selepas tamat perbelanjaan kenduri & honeymoon).",
        variableItems,
        variableTotal,
        "bg-[#EBF5F0] text-[#347A63] border-[#C8E6D7]"
      )}

      {/* Group 3: Special One-Off */}
      {renderGroupTable(
        "3. Pelarasan Khas Sekali Sahaja (Disember 2026)",
        "Selesaikan dua baki ini pada awal Disember untuk tutup semua rekod tertunggak 2026.",
        specialItems,
        specialTotal,
        "bg-amber-50 text-[#B45309] border-amber-200"
      )}
    </div>
  );
}
