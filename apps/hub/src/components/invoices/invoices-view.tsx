"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  Receipt,
  Scale,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import seedData from "../../data/mk-venture-invoices-2026.json";

interface Customer {
  id: string;
  customer_name: string;
  company_name?: string;
  address?: string;
  notes?: string;
}

interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  payment_terms: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  notes?: string;
  reference_no?: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_order: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: string;
  recipient_name: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  description?: string;
}

interface InvoiceStore {
  customers: Customer[];
  invoices: Invoice[];
  items: InvoiceItem[];
  expenses: Expense[];
}

type SubTab = "invoices" | "expenses" | "customers" | "settlement";

const STORAGE_KEY = "khai_hub_mk_invoices_v2";

const SEED_INVOICE_NUMBERS = new Set(
  (seedData.invoices as Invoice[]).map((inv) => inv.invoice_number)
);

const MONTH_OPTIONS = [
  { value: "all", label: "Semua Bulan (Jan – Nov 2026)" },
  { value: "2026-01", label: "Januari 2026" },
  { value: "2026-02", label: "Februari 2026" },
  { value: "2026-03", label: "Mac 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "Mei 2026" },
  { value: "2026-06", label: "Jun 2026" },
  { value: "2026-07", label: "Julai 2026" },
  { value: "2026-08", label: "Ogos 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Disember 2026" },
];

function fmtRM(val: number): string {
  return `RM ${Number(val || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string): string {
  if (!iso || !iso.includes("-")) return iso || "-";
  const [y, m, d] = iso.split("-");
  const mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d}-${mons[Math.max(0, parseInt(m, 10) - 1)] || m}-${y}`;
}

function getDefaultStore(): InvoiceStore {
  return {
    customers: seedData.customers as Customer[],
    invoices: seedData.invoices as Invoice[],
    items: seedData.items as InvoiceItem[],
    expenses: seedData.expenses as Expense[],
  };
}

export function InvoicesView() {
  const [store, setStore] = useState<InvoiceStore>(getDefaultStore);
  const [subTab, setSubTab] = useState<SubTab>("invoices");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);

  // New invoice form state
  const [newCustomerMode, setNewCustomerMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    (seedData.customers as Customer[])[0]?.id || ""
  );
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>("");
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [newPaymentTerms, setNewPaymentTerms] = useState<string>("Full Payment");
  const [newRefNo, setNewRefNo] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("paid");
  const [newLines, setNewLines] = useState<Array<{ description: string; quantity: number; unit_price: number }>>([
    { description: "3D Printing Services", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as InvoiceStore;
        if (parsed && Array.isArray(parsed.invoices) && parsed.invoices.length >= seedData.invoices.length) {
          setStore(parsed);
        }
      }
    } catch {
      // fallback to seed
    }
  }, []);

  const persistStore = (next: InvoiceStore) => {
    setStore(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const customerMap = useMemo(
    () => Object.fromEntries(store.customers.map((c) => [c.id, c])),
    [store.customers]
  );

  const itemsByInvoice = useMemo(() => {
    const map: Record<string, InvoiceItem[]> = {};
    for (const it of store.items) {
      if (!map[it.invoice_id]) map[it.invoice_id] = [];
      map[it.invoice_id].push(it);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.item_order - b.item_order);
    }
    return map;
  }, [store.items]);

  const expenseCategories = useMemo(
    () => Array.from(new Set(store.expenses.map((e) => e.category))).sort(),
    [store.expenses]
  );

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...store.invoices]
      .filter((inv) => {
        if (monthFilter !== "all" && !inv.invoice_date.startsWith(monthFilter)) return false;
        if (!q) return true;
        const cust = customerMap[inv.customer_id]?.customer_name || "";
        const desc = (itemsByInvoice[inv.id] || []).map((i) => i.description).join(" ");
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          cust.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q) ||
          (inv.reference_no || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.invoice_number.localeCompare(a.invoice_number));
  }, [store.invoices, monthFilter, searchQuery, customerMap, itemsByInvoice]);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...store.expenses]
      .filter((exp) => {
        if (monthFilter !== "all" && !exp.expense_date.startsWith(monthFilter)) return false;
        if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;
        if (!q) return true;
        return (
          exp.expense_number.toLowerCase().includes(q) ||
          exp.recipient_name.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q) ||
          (exp.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  }, [store.expenses, monthFilter, categoryFilter, searchQuery]);

  const totalRevenue = useMemo(
    () => store.invoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
    [store.invoices]
  );
  const totalExpenses = useMemo(
    () => store.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [store.expenses]
  );
  const netProfitAfterRefunds = totalRevenue - totalExpenses + 183.15;

  const nextInvoiceNumber = useMemo(() => {
    const yy = newDate.slice(2, 4) || "26";
    const mm = newDate.slice(5, 7) || "11";
    let maxSeq = 0;
    for (const inv of store.invoices) {
      const m = inv.invoice_number.match(/(\d{3})$/);
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
    return `INV${yy}${mm}${String(maxSeq + 1).padStart(3, "0")}`;
  }, [store.invoices, newDate]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = newLines.filter((l) => l.description.trim() && l.unit_price > 0 && l.quantity > 0);
    if (validLines.length === 0) return;

    let cid = selectedCustomerId;
    const nextCustomers = [...store.customers];
    if (newCustomerMode === "new" && newCustomerName.trim()) {
      cid = `c_2026_${String(nextCustomers.length + 1).padStart(3, "0")}`;
      nextCustomers.push({
        id: cid,
        customer_name: newCustomerName.trim(),
        company_name: newCustomerName.trim(),
        address: newCustomerAddress.trim(),
        notes: "Ditambah melalui Khai Space Hub",
      });
    }

    const invNo = nextInvoiceNumber;
    const invId = `inv_${Date.now()}`;
    const total = Number(
      validLines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0).toFixed(2)
    );

    const newInv: Invoice = {
      id: invId,
      customer_id: cid,
      invoice_number: invNo,
      invoice_date: newDate,
      due_date: newDate,
      status: newStatus,
      payment_terms: newPaymentTerms,
      subtotal: total,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: total,
      paid_amount: newStatus === "paid" ? total : 0,
      outstanding_amount: newStatus === "paid" ? 0 : total,
      reference_no: newRefNo.trim() || undefined,
      notes: "Dijana melalui Khai Space Hub Invoice System",
    };

    const addedItems: InvoiceItem[] = validLines.map((l, idx) => ({
      id: `itm_${Date.now()}_${idx + 1}`,
      invoice_id: invId,
      item_order: idx + 1,
      description: l.description.trim(),
      quantity: Number(l.quantity),
      unit_price: Number(l.unit_price),
      line_total: Number((l.quantity * l.unit_price).toFixed(2)),
    }));

    const nextStore: InvoiceStore = {
      ...store,
      customers: nextCustomers,
      invoices: [...store.invoices, newInv],
      items: [...store.items, ...addedItems],
    };
    persistStore(nextStore);
    setShowNewModal(false);
    setPreviewInvoice(newInv);
    setNewRefNo("");
    setNewCustomerName("");
    setNewCustomerAddress("");
    setNewLines([{ description: "3D Printing Services", quantity: 1, unit_price: 0 }]);
  };

  const handlePrintPreview = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#DCD7CC] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mk-venture-logo.svg"
            alt="MK Venture Logo"
            className="w-11 h-11 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] p-1 object-contain shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#0C2340]">
                MK Venture Maker Solution — Invoice System
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EBF5F0] text-[#347A63] border border-[#C8E6D7] font-semibold">
                CA0356505-U
              </span>
            </div>
            <p className="text-xs text-[#536B85] mt-1">
              Rekod invois rasmi (format <span className="font-mono font-semibold text-[#0C2340]">INV26MMNNN</span>), kos operasi syarikat &amp; imbangan Khai ↔ MK Venture (Jan – 24 Nov 2026 diaudit 100%).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a
            href="/invoices-2026/INVOICE_LIST_2026.csv"
            download="INVOICE_LIST_2026.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#EFECE4] text-[#0C2340] text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#347A63]" />
            Muat Turun CSV
          </a>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Invois Baru ({nextInvoiceNumber})
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Jumlah Jualan (Invois)</span>
            <Receipt className="w-4 h-4 text-[#347A63]" />
          </div>
          <div className="text-2xl font-bold text-[#0C2340] mt-1.5">{fmtRM(totalRevenue)}</div>
          <div className="text-[11px] text-[#347A63] mt-1 font-medium">
            {store.invoices.length} invois • 100% dibayar (Jan–24 Nov)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Jumlah Kos Syarikat</span>
            <Wallet className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-bold text-[#0C2340] mt-1.5">{fmtRM(totalExpenses)}</div>
          <div className="text-[11px] text-[#536B85] mt-1">
            {store.expenses.length} rekod kos (termasuk Pending Claim)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Untung Bersih (+Refund)</span>
            <Building2 className="w-4 h-4 text-[#0C2340]" />
          </div>
          <div className="text-2xl font-bold text-[#347A63] mt-1.5">{fmtRM(netProfitAfterRefunds)}</div>
          <div className="text-[11px] text-[#536B85] mt-1">
            Anggaran Baki M2U 24 Nov: RM 788.33 (Tabung MAE lunas)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCD7CC] p-4">
          <div className="flex items-center justify-between text-xs text-[#536B85] font-medium">
            <span>Imbangan Khai ↔ MK</span>
            <Scale className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-bold text-[#B45309] mt-1.5">-RM 76.86</div>
          <div className="text-[11px] text-[#536B85] mt-1">
            Claim RM 449.29 − Pulang RM 526.15
          </div>
        </div>
      </div>

      {/* Sub-Tabs & Filters */}
      <div className="bg-white rounded-xl border border-[#DCD7CC] overflow-hidden">
        <div className="border-b border-[#DCD7CC] px-4 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF8F4]">
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: "invoices", label: `Invois (${store.invoices.length})`, icon: FileText },
                { id: "expenses", label: `Kos Syarikat (${store.expenses.length})`, icon: Wallet },
                { id: "customers", label: `Pelanggan (${store.customers.length})`, icon: Users },
                { id: "settlement", label: "Imbangan Khai ↔ MK", icon: Scale },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = subTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubTab(t.id)}
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

          {(subTab === "invoices" || subTab === "expenses") && (
            <div className="flex items-center gap-2 pb-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#536B85] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari invois / pelanggan..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-white text-[#0C2340] focus:outline-none focus:border-[#0C2340] w-48"
                />
              </div>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-white text-[#0C2340] focus:outline-none focus:border-[#0C2340]"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {subTab === "expenses" && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-white text-[#0C2340] focus:outline-none focus:border-[#0C2340]"
                >
                  <option value="all">Semua Kategori</option>
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* SUBTAB 1: INVOICES */}
        {subTab === "invoices" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
                  <th className="py-3 px-4 font-semibold">No. Invois</th>
                  <th className="py-3 px-4 font-semibold">Tarikh</th>
                  <th className="py-3 px-4 font-semibold">Pelanggan</th>
                  <th className="py-3 px-4 font-semibold">Perincian</th>
                  <th className="py-3 px-4 font-semibold text-right">Jumlah</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE4] text-xs">
                {filteredInvoices.map((inv) => {
                  const cust = customerMap[inv.customer_id];
                  const invItems = itemsByInvoice[inv.id] || [];
                  const summary = invItems.map((i) => i.description.split("\n")[0]).join(" + ");
                  const hasStaticPdf = SEED_INVOICE_NUMBERS.has(inv.invoice_number);
                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#0C2340] whitespace-nowrap">
                        <div>{inv.invoice_number}</div>
                        {inv.reference_no && (
                          <div className="text-[10px] text-[#536B85] font-normal">
                            Ref: {inv.reference_no}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#536B85] whitespace-nowrap">
                        {fmtDate(inv.invoice_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0C2340]">
                        {cust?.customer_name || "-"}
                      </td>
                      <td className="py-3 px-4 text-[#536B85] max-w-xs truncate" title={summary}>
                        {summary}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#0C2340] whitespace-nowrap">
                        {fmtRM(inv.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            inv.status === "paid"
                              ? "bg-[#EBF5F0] text-[#347A63] border border-[#C8E6D7]"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="px-2.5 py-1 rounded border border-[#DCD7CC] bg-white hover:bg-[#FAF8F4] text-[#0C2340] text-[11px] font-medium cursor-pointer"
                          >
                            Lihat
                          </button>
                          {hasStaticPdf && (
                            <a
                              href={`/invoices-2026/${inv.invoice_number}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0C2340] hover:bg-[#17365D] text-white text-[11px] font-medium"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#536B85]">
                      Tiada invois sepadan dengan carian anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 2: EXPENSES */}
        {subTab === "expenses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
                  <th className="py-3 px-4 font-semibold">Tarikh</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Penerima / Pembekal</th>
                  <th className="py-3 px-4 font-semibold">Perincian</th>
                  <th className="py-3 px-4 font-semibold">Kaedah</th>
                  <th className="py-3 px-4 font-semibold text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE4] text-xs">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#FAF8F4] transition-colors">
                    <td className="py-3 px-4 text-[#536B85] whitespace-nowrap">
                      {fmtDate(exp.expense_date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340] text-[11px] font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0C2340]">{exp.recipient_name}</td>
                    <td className="py-3 px-4 text-[#536B85] max-w-md">{exp.description || "-"}</td>
                    <td className="py-3 px-4 text-[#536B85] whitespace-nowrap">{exp.payment_method}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#0C2340] whitespace-nowrap">
                      {fmtRM(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 3: CUSTOMERS */}
        {subTab === "customers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {store.customers.map((c) => {
              const cInvs = store.invoices.filter((i) => i.customer_id === c.id);
              const cSum = cInvs.reduce((s, i) => s + Number(i.total_amount || 0), 0);
              return (
                <div key={c.id} className="rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/50 p-4">
                  <div className="font-semibold text-sm text-[#0C2340]">{c.customer_name}</div>
                  {c.address && <div className="text-[11px] text-[#536B85] mt-1">{c.address}</div>}
                  <div className="mt-3 pt-2.5 border-t border-[#DCD7CC] flex items-center justify-between text-xs">
                    <span className="text-[#536B85]">{cInvs.length} invois</span>
                    <span className="font-bold text-[#347A63]">{fmtRM(cSum)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SUBTAB 4: SETTLEMENT */}
        {subTab === "settlement" && (
          <div className="p-5 space-y-5 text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#C8E6D7] bg-[#EBF5F0]/50 p-4 space-y-2">
                <div className="font-bold text-sm text-[#0C2340] flex justify-between">
                  <span>MK Venture → Khai (Pending Claims)</span>
                  <span className="text-[#347A63]">RM 449.29</span>
                </div>
                <ul className="space-y-1.5 text-[#536B85]">
                  <li className="flex justify-between line-through opacity-60"><span>06-Jul • Cytron #533938 (2x PETG) — LUNAS 24-Nov</span><span className="font-mono">RM 88.00</span></li>
                  <li className="flex justify-between"><span>22-Jul • Sign House Advertising (Cop Company)</span><span className="font-mono text-[#0C2340]">RM 40.00</span></li>
                  <li className="flex justify-between"><span>29-Sep • Cytron #551142 (Maker ESP32)</span><span className="font-mono text-[#0C2340]">RM 70.24</span></li>
                  <li className="flex justify-between"><span>29-Oct • SPayLater Okt (3D Printer Parts)</span><span className="font-mono text-[#0C2340]">RM 170.35</span></li>
                  <li className="flex justify-between"><span>29-Oct • SPayLater Okt (Creality PLA x6)</span><span className="font-mono text-[#0C2340]">RM 168.70</span></li>
                </ul>
              </div>

              <div className="rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] p-4 space-y-2">
                <div className="font-bold text-sm text-[#0C2340] flex justify-between">
                  <span>Khai → MK Venture (Pelanggan / Refund / Pulang)</span>
                  <span className="text-[#B45309]">RM 526.15</span>
                </div>
                <ul className="space-y-1.5 text-[#536B85]">
                  <li className="flex justify-between"><span>Pelanggan di CIMB Khai (Ahmad Solehin RM8 + Clean Green RM31.50 + M. Ihsan RM20)</span><span className="font-mono text-[#0C2340]">RM 59.50</span></li>
                  <li className="flex justify-between"><span>09-Oct • Refund Shipping Cytron SO-552817</span><span className="font-mono text-[#0C2340]">RM 105.00</span></li>
                  <li className="flex justify-between"><span>29-Oct • Refund TM Unifi (bil 21-Sep)</span><span className="font-mono text-[#0C2340]">RM 78.15</span></li>
                  <li className="flex justify-between"><span>Sep &amp; Okt • Pulang Komisen (RM200) + Transport (RM50)</span><span className="font-mono text-[#0C2340]">RM 250.00</span></li>
                  <li className="flex justify-between"><span>Apr, Mei &amp; Nov • Drawings Peribadi M2U (9.50 + 10.90 + 8.10 + 5.00)</span><span className="font-mono text-[#0C2340]">RM 33.50</span></li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-[#0C2340] bg-[#0C2340] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-sm">Imbangan Bersih Muktamad (Setakat 24 Nov 2026)</div>
                <div className="text-slate-300 text-[11px]">
                  Selepas claim Cytron #533938 (RM 88.00) dibayar pada 24-Nov dan parkir Panaxis (RM 5.00) direkod, Khai perlu bayar baki bersih RM 76.86 kepada MK Venture. Tabung MAE (RM 300 + RM 50) sudah 100% dikeluarkan semula ke M2U.
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-amber-300 shrink-0">-RM 76.86</div>
            </div>
          </div>
        )}
      </div>

      {/* INVOICE PREVIEW MODAL (Google Sheets Template Style) */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8">
            <div className="px-5 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between print:hidden">
              <div className="font-semibold text-sm text-[#0C2340]">
                Pratonton Invois — {previewInvoice.invoice_number}
              </div>
              <div className="flex items-center gap-2">
                {SEED_INVOICE_NUMBERS.has(previewInvoice.invoice_number) && (
                  <a
                    href={`/invoices-2026/${previewInvoice.invoice_number}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCD7CC] bg-white hover:bg-[#EFECE4] text-[#0C2340] text-xs font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF Rasmi
                  </a>
                )}
                <button
                  type="button"
                  onClick={handlePrintPreview}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1.5 rounded-lg text-[#536B85] hover:bg-[#EFECE4] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-xs text-slate-800">
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mk-venture-logo.svg" alt="MK Venture" className="h-14 w-auto" />
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight text-slate-900">INVOICE</div>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase text-[10px]">
                    {previewInvoice.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">From :</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    MK Venture Maker Solution (CA0356505-U)
                  </div>
                  <div className="text-slate-600 mt-1 leading-relaxed">
                    Desa Cemara Blok B, Persiaran Sembilang,<br />
                    13700 Perai, Pulau Pinang, Malaysia
                  </div>
                </div>
                <div className="space-y-1 sm:text-right">
                  <div><span className="text-slate-500 font-semibold">Date :</span> <span className="ml-1">{fmtDate(previewInvoice.invoice_date)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Invoice No :</span> <span className="ml-1 font-mono font-bold text-slate-900">{previewInvoice.invoice_number}</span></div>
                  {previewInvoice.reference_no && (
                    <div><span className="text-slate-500 font-semibold">Reference No :</span> <span className="ml-1 font-mono">{previewInvoice.reference_no}</span></div>
                  )}
                  <div><span className="text-slate-500 font-semibold">Payment Term :</span> <span className="ml-1">{previewInvoice.payment_terms}</span></div>
                  <div><span className="text-slate-500 font-semibold">Phone :</span> <span className="ml-1">0187604289</span></div>
                  <div><span className="text-slate-500 font-semibold">Email :</span> <span className="ml-1">mkventuremakersolution@gmail.com</span></div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">To :</div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {customerMap[previewInvoice.customer_id]?.customer_name || "Customer"}
                </div>
                {customerMap[previewInvoice.customer_id]?.address && (
                  <div className="text-slate-600 mt-0.5">
                    {customerMap[previewInvoice.customer_id]?.address}
                  </div>
                )}
              </div>

              <table className="w-full border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-800 text-white text-[11px]">
                    <th className="py-2 px-3 text-left w-10">No.</th>
                    <th className="py-2 px-3 text-left">Item</th>
                    <th className="py-2 px-3 text-right w-20">Quantity</th>
                    <th className="py-2 px-3 text-right w-28">Price (RM)</th>
                    <th className="py-2 px-3 text-right w-28">Amount (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(itemsByInvoice[previewInvoice.id] || []).map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 align-top">{idx + 1}</td>
                      <td className="py-2.5 px-3 whitespace-pre-line">{it.description}</td>
                      <td className="py-2.5 px-3 text-right align-top">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right align-top font-mono">{it.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right align-top font-mono font-semibold">{it.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="bg-slate-100 border border-slate-300 rounded px-4 py-2.5 flex items-center gap-6">
                  <span className="font-bold text-slate-700">TOTAL (RM) :</span>
                  <span className="font-mono font-black text-base text-slate-900">
                    {previewInvoice.total_amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-1 text-slate-600">
                <div>Make all checks / transfers payable to:</div>
                <div className="font-bold text-slate-900">MK VENTURE MAKER SOLUTION</div>
                <div className="font-bold text-slate-900 font-mono">MAYBANK ACC NO : 5686 0305 3567</div>
                <div className="pt-2 italic text-[11px] text-slate-500">
                  Returns / exchange will only be entertained within seven (7) days from invoice date. Returns is allowed only once per Invoice. This is computer generated, no signature is required.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW INVOICE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8"
          >
            <div className="px-5 py-3.5 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#0C2340]">Cipta Invois Baru</div>
                <div className="text-[11px] font-mono text-[#347A63] font-semibold">
                  Nombor Automatik: {nextInvoiceNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-[#536B85] hover:bg-[#EFECE4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Tarikh Invois</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Terma Bayaran</label>
                  <select
                    value={newPaymentTerms}
                    onChange={(e) => setNewPaymentTerms(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  >
                    <option value="Full Payment">Full Payment</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  >
                    <option value="paid">Paid</option>
                    <option value="sent">Invoice Sent</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#0C2340]">Pelanggan</label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewCustomerMode("existing")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${newCustomerMode === "existing" ? "bg-[#0C2340] text-white" : "bg-[#FAF8F4] text-[#536B85]"}`}
                    >
                      Sedia Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustomerMode("new")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${newCustomerMode === "new" ? "bg-[#0C2340] text-white" : "bg-[#FAF8F4] text-[#536B85]"}`}
                    >
                      + Pelanggan Baru
                    </button>
                  </div>
                </div>
                {newCustomerMode === "existing" ? (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  >
                    {store.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Nama Pelanggan / Syarikat"
                      required
                      className="px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                    />
                    <input
                      type="text"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Alamat (pilihan)"
                      className="px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Reference No (pilihan)</label>
                <input
                  type="text"
                  value={newRefNo}
                  onChange={(e) => setNewRefNo(e.target.value)}
                  placeholder="cth: PO / No. Invois Lama"
                  className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#0C2340]">Item / Servis</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewLines([...newLines, { description: "", quantity: 1, unit_price: 0 }])
                    }
                    className="text-[11px] text-[#347A63] font-semibold hover:underline cursor-pointer"
                  >
                    + Tambah Baris
                  </button>
                </div>
                {newLines.map((ln, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={ln.description}
                      onChange={(e) => {
                        const copy = [...newLines];
                        copy[idx].description = e.target.value;
                        setNewLines(copy);
                      }}
                      placeholder="Deskripsi item"
                      required
                      className="col-span-6 px-2.5 py-1.5 rounded-lg border border-[#DCD7CC]"
                    />
                    <input
                      type="number"
                      min={1}
                      value={ln.quantity}
                      onChange={(e) => {
                        const copy = [...newLines];
                        copy[idx].quantity = Number(e.target.value) || 1;
                        setNewLines(copy);
                      }}
                      className="col-span-2 px-2 py-1.5 rounded-lg border border-[#DCD7CC] text-right"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={ln.unit_price}
                      onChange={(e) => {
                        const copy = [...newLines];
                        copy[idx].unit_price = Number(e.target.value) || 0;
                        setNewLines(copy);
                      }}
                      placeholder="RM"
                      className="col-span-3 px-2 py-1.5 rounded-lg border border-[#DCD7CC] text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setNewLines(newLines.filter((_, i) => i !== idx))}
                      disabled={newLines.length === 1}
                      className="col-span-1 p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#DCD7CC] flex items-center justify-between">
                <div className="font-bold text-sm text-[#0C2340]">
                  Jumlah:{" "}
                  <span className="text-[#347A63]">
                    {fmtRM(newLines.reduce((s, l) => s + l.quantity * l.unit_price, 0))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#DCD7CC] text-[#536B85] font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white font-semibold cursor-pointer"
                  >
                    Simpan &amp; Pratonton
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

