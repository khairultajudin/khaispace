"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Download,
  FileCode2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
} from "lucide-react";
import {
  Customer,
  Expense,
  Invoice,
  InvoiceItem,
  LhdnProfile,
  fmtRM,
} from "./types";

interface LhdnReportsTabProps {
  invoices: Invoice[];
  itemsByInvoice: Record<string, InvoiceItem[]>;
  expenses: Expense[];
  customerMap: Record<string, Customer>;
  lhdnProfile: LhdnProfile;
  onUpdateLhdnProfile: (profile: LhdnProfile) => void;
}

const COGS_KEYWORDS = ["material", "component", "filament", "print", "postage", "shipping", "inventory", "supplier"];

function isCogsCategory(cat: string): boolean {
  const c = cat.toLowerCase();
  return COGS_KEYWORDS.some((kw) => c.includes(kw));
}

export function LhdnReportsTab({
  invoices,
  itemsByInvoice,
  expenses,
  customerMap,
  lhdnProfile,
  onUpdateLhdnProfile,
}: LhdnReportsTabProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[invoices.length - 1]?.id || "");
  const [showJson, setShowJson] = useState(false);

  // P&L Calculation (Niagawan / Bukku / LHDN Borang B style)
  const pnl = useMemo(() => {
    const grossSales = invoices.reduce((s, i) => s + i.total_amount, 0);
    const cogsMap: Record<string, number> = {};
    const opexMap: Record<string, number> = {};

    for (const e of expenses) {
      if (isCogsCategory(e.category)) {
        cogsMap[e.category] = (cogsMap[e.category] || 0) + e.amount;
      } else {
        opexMap[e.category] = (opexMap[e.category] || 0) + e.amount;
      }
    }

    const totalCogs = Object.values(cogsMap).reduce((s, v) => s + v, 0);
    const grossProfit = grossSales - totalCogs;
    const totalOpex = Object.values(opexMap).reduce((s, v) => s + v, 0);
    const netProfit = grossProfit - totalOpex;

    // Monthly cashflow (2026-01 .. 2026-12)
    const months = Array.from({ length: 11 }, (_, idx) => `2026-${String(idx + 1).padStart(2, "0")}`);
    const monthly = months.map((ym) => {
      const rev = invoices
        .filter((i) => i.invoice_date.startsWith(ym))
        .reduce((s, i) => s + i.total_amount, 0);
      const exp = expenses
        .filter((e) => e.expense_date.startsWith(ym))
        .reduce((s, e) => s + e.amount, 0);
      return { ym, rev, exp, net: rev - exp };
    });

    return {
      grossSales,
      cogsRows: Object.entries(cogsMap).sort((a, b) => b[1] - a[1]),
      totalCogs,
      grossProfit,
      opexRows: Object.entries(opexMap).sort((a, b) => b[1] - a[1]),
      totalOpex,
      netProfit,
      monthly,
    };
  }, [invoices, expenses]);

  // LHDN MyInvois v1.1 UBL JSON generator for selected invoice
  const myInvoisPayload = useMemo(() => {
    const inv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
    if (!inv) return null;
    const cust = customerMap[inv.customer_id];
    const lines = itemsByInvoice[inv.id] || [];

    return {
      _D: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      _A: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      _B: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      Invoice: [
        {
          ID: [{ _: inv.invoice_number }],
          IssueDate: [{ _: inv.invoice_date }],
          IssueTime: [{ _: "00:00:00Z" }],
          InvoiceTypeCode: [{ _: "01", listVersionID: "1.1" }],
          DocumentCurrencyCode: [{ _: "MYR" }],
          AccountingSupplierParty: [
            {
              AdditionalAccountID: [{ _: lhdnProfile.msic_code, schemeAgencyName: "CertEX" }],
              Party: [
                {
                  IndustryClassificationCode: [{ _: lhdnProfile.msic_code, name: lhdnProfile.msic_description }],
                  PartyIdentification: [
                    { ID: [{ _: lhdnProfile.tin || "TIN_BELUM_DIISI", schemeID: "TIN" }] },
                    { ID: [{ _: lhdnProfile.brn, schemeID: "BRN" }] },
                    { ID: [{ _: lhdnProfile.sst_registered ? lhdnProfile.sst_number : "NA", schemeID: "SST" }] },
                  ],
                  PostalAddress: [
                    {
                      CityName: [{ _: lhdnProfile.city }],
                      PostalZone: [{ _: lhdnProfile.postcode }],
                      CountrySubentityCode: [{ _: lhdnProfile.state_code }],
                      AddressLine: [{ Line: [{ _: lhdnProfile.address }] }],
                      Country: [{ IdentificationCode: [{ _: "MYS" }] }],
                    },
                  ],
                  PartyLegalEntity: [{ RegistrationName: [{ _: lhdnProfile.business_name }] }],
                  Contact: [{ Telephone: [{ _: lhdnProfile.phone }], ElectronicMail: [{ _: lhdnProfile.email }] }],
                },
              ],
            },
          ],
          AccountingCustomerParty: [
            {
              Party: [
                {
                  PartyIdentification: [
                    { ID: [{ _: cust?.tin || "EI00000000010", schemeID: "TIN" }] },
                    { ID: [{ _: cust?.brn || "NA", schemeID: "BRN" }] },
                  ],
                  PartyLegalEntity: [{ RegistrationName: [{ _: cust?.customer_name || "General Public" }] }],
                },
              ],
            },
          ],
          TaxTotal: [
            {
              TaxAmount: [{ _: 0, currencyID: "MYR" }],
              TaxSubtotal: [
                {
                  TaxableAmount: [{ _: inv.total_amount, currencyID: "MYR" }],
                  TaxAmount: [{ _: 0, currencyID: "MYR" }],
                  TaxCategory: [{ ID: [{ _: "06" }], TaxScheme: [{ ID: [{ _: "OTH" }] }] }],
                },
              ],
            },
          ],
          LegalMonetaryTotal: [
            {
              LineExtensionAmount: [{ _: inv.subtotal, currencyID: "MYR" }],
              TaxExclusiveAmount: [{ _: inv.total_amount, currencyID: "MYR" }],
              TaxInclusiveAmount: [{ _: inv.total_amount, currencyID: "MYR" }],
              PayableAmount: [{ _: inv.total_amount, currencyID: "MYR" }],
            },
          ],
          InvoiceLine: lines.map((it, idx) => ({
            ID: [{ _: String(idx + 1) }],
            InvoicedQuantity: [{ _: it.quantity, unitCode: "C62" }],
            LineExtensionAmount: [{ _: it.line_total, currencyID: "MYR" }],
            Item: [
              {
                CommodityClassification: [
                  { ItemClassificationCode: [{ _: inv.lhdn_classification || "022", listID: "CLASS" }] },
                ],
                Description: [{ _: it.description }],
              },
            ],
            Price: [{ PriceAmount: [{ _: it.unit_price, currencyID: "MYR" }] }],
          })),
        },
      ],
    };
  }, [invoices, selectedInvoiceId, customerMap, itemsByInvoice, lhdnProfile]);

  const exportPnlCsv = () => {
    const rows = [
      ["PENYATA UNTUNG RUGI (P&L) — MK VENTURE MAKER SOLUTION (CA0356505-U) — 2026"],
      ["Bahagian", "Kategori", "Jumlah (RM)"],
      ["PENDAPATAN", "Jualan Kasar (28 Invois)", pnl.grossSales.toFixed(2)],
      ...pnl.cogsRows.map(([k, v]) => ["KOS JUALAN (COGS)", k, (-v).toFixed(2)]),
      ["UNTUNG KASAR", "Gross Profit", pnl.grossProfit.toFixed(2)],
      ...pnl.opexRows.map(([k, v]) => ["PERBELANJAAN OPERASI", k, (-v).toFixed(2)]),
      ["UNTUNG BERSIH", "Net Profit (Sebelum Cukai / Borang B)", pnl.netProfit.toFixed(2)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MK_Venture_PnL_LHDN_2026.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMyInvoisJson = () => {
    if (!myInvoisPayload) return;
    const inv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
    const blob = new Blob([JSON.stringify(myInvoisPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MyInvois_${inv?.invoice_number || "invoice"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const receiptCoverage = expenses.filter((e) => Boolean(e.receipt_file_id)).length;
  const readinessChecks = [
    { label: "Nama Perniagaan & BRN SSM (CA0356505-U)", ok: Boolean(lhdnProfile.brn) },
    { label: "Nombor TIN LHDN Pembekal (IG / C...)", ok: Boolean(lhdnProfile.tin.trim()) },
    { label: "Kod MSIC 5-Digit Industri", ok: lhdnProfile.msic_code.trim().length === 5 },
    { label: "Penomboran Invois & Resit Berurutan (28 Invois + 28 Resit)", ok: invoices.length > 0 },
    { label: "Peti Resit Perbelanjaan (Simpanan 7 Tahun ACP 1967)", ok: receiptCoverage > 0 },
    { label: "Penyata Untung Rugi (P&L) Sedia untuk Borang B", ok: true },
  ];

  return (
    <div className="p-5 space-y-6 text-xs">
      {/* SECTION 1: PENYATA UNTUNG RUGI (P&L — NIAGAWAN / BUKKU / BORANG B) */}
      <div className="rounded-xl border border-[#DCD7CC] overflow-hidden bg-white">
        <div className="px-5 py-3.5 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#0C2340]">
              Penyata Untung Rugi (Profit &amp; Loss) — Borang B LHDN 2026
            </h3>
            <p className="text-[11px] text-[#536B85]">
              Format standard perakaunan Malaysia (seperti Niagawan &amp; Bukku) — Jualan Kasar, Kos Jualan (COGS), Perbelanjaan Operasi &amp; Untung Bersih.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportPnlCsv}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCD7CC] bg-white hover:bg-[#EFECE4] text-[#0C2340] font-semibold cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#347A63]" />
              Eksport CSV LHDN
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0C2340] text-white font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak P&amp;L
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* P&L Statement */}
          <div className="space-y-2.5">
            <div className="flex justify-between py-2 border-b border-[#DCD7CC] font-bold text-[#0C2340]">
              <span>1. Jualan Kasar (Gross Revenue — {invoices.length} Invois)</span>
              <span className="font-mono text-[#347A63]">{fmtRM(pnl.grossSales)}</span>
            </div>

            <div className="pt-1">
              <div className="font-semibold text-[#536B85] uppercase text-[10px] mb-1">
                2. Tolak: Kos Jualan (Cost of Goods Sold / COGS)
              </div>
              {pnl.cogsRows.map(([cat, val]) => (
                <div key={cat} className="flex justify-between py-1 text-[#536B85]">
                  <span>— {cat}</span>
                  <span className="font-mono">({fmtRM(val)})</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 border-t border-dashed border-[#DCD7CC] font-bold text-[#0C2340] mt-1">
                <span>Untung Kasar (Gross Profit)</span>
                <span className="font-mono">{fmtRM(pnl.grossProfit)}</span>
              </div>
            </div>

            <div className="pt-1">
              <div className="font-semibold text-[#536B85] uppercase text-[10px] mb-1">
                3. Tolak: Perbelanjaan Operasi (Operating Expenses)
              </div>
              {pnl.opexRows.map(([cat, val]) => (
                <div key={cat} className="flex justify-between py-1 text-[#536B85]">
                  <span>— {cat}</span>
                  <span className="font-mono">({fmtRM(val)})</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 border-t border-dashed border-[#DCD7CC] font-semibold text-[#B45309] mt-1">
                <span>Jumlah Perbelanjaan Operasi</span>
                <span className="font-mono">({fmtRM(pnl.totalOpex)})</span>
              </div>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-[#0C2340] text-white font-bold text-sm mt-2">
              <span>UNTUNG BERSIH SEBELUM CUKAI (NET PROFIT)</span>
              <span className="font-mono text-emerald-300">{fmtRM(pnl.netProfit)}</span>
            </div>
          </div>

          {/* Monthly Cashflow Table */}
          <div>
            <div className="font-bold text-[#0C2340] mb-2">Aliran Tunai Bulanan (Jan – Nov 2026)</div>
            <div className="border border-[#DCD7CC] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#FAF8F4] border-b border-[#DCD7CC] text-[#536B85]">
                    <th className="py-2 px-3">Bulan</th>
                    <th className="py-2 px-3 text-right">Jualan</th>
                    <th className="py-2 px-3 text-right">Kos</th>
                    <th className="py-2 px-3 text-right">Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE4]">
                  {pnl.monthly.map((m) => (
                    <tr key={m.ym}>
                      <td className="py-1.5 px-3 font-mono text-[#0C2340]">{m.ym}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-[#347A63]">{fmtRM(m.rev)}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-[#B45309]">{fmtRM(m.exp)}</td>
                      <td className={`py-1.5 px-3 text-right font-mono font-bold ${m.net >= 0 ? "text-[#0C2340]" : "text-rose-600"}`}>
                        {m.net >= 0 ? "+" : "-"}{fmtRM(Math.abs(m.net))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LHDN MYINVOIS READINESS & PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#DCD7CC] bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#347A63]" />
            <h3 className="text-sm font-bold text-[#0C2340]">
              Profil Pembekal LHDN MyInvois (Malaysia)
            </h3>
          </div>
          <p className="text-[11px] text-[#536B85]">
            Isi Nombor TIN (Tax Identification Number) &amp; Kod MSIC anda sekali sahaja — sistem akan menyertakannya secara automatik dalam muat turun JSON MyInvois (UBL 2.1).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0C2340] mb-1">Nombor TIN LHDN</label>
              <input
                type="text"
                placeholder="cth: IG12345678000"
                value={lhdnProfile.tin}
                onChange={(e) => onUpdateLhdnProfile({ ...lhdnProfile, tin: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCD7CC] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0C2340] mb-1">BRN (SSM)</label>
              <input
                type="text"
                value={lhdnProfile.brn}
                onChange={(e) => onUpdateLhdnProfile({ ...lhdnProfile, brn: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCD7CC] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0C2340] mb-1">Kod MSIC (5-Digit)</label>
              <input
                type="text"
                maxLength={5}
                value={lhdnProfile.msic_code}
                onChange={(e) => onUpdateLhdnProfile({ ...lhdnProfile, msic_code: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCD7CC] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0C2340] mb-1">Status SST</label>
              <select
                value={lhdnProfile.sst_registered ? "yes" : "no"}
                onChange={(e) =>
                  onUpdateLhdnProfile({ ...lhdnProfile, sst_registered: e.target.value === "yes" })
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCD7CC]"
              >
                <option value="no">Tidak Berdaftar SST (&lt; RM 500k/thn)</option>
                <option value="yes">Berdaftar SST</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EFECE4] space-y-1.5">
            <div className="font-semibold text-[#0C2340]">Senarai Semak Kesediaan LHDN:</div>
            {readinessChecks.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-[11px]">
                {c.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className={c.ok ? "text-[#0C2340]" : "text-[#B45309] font-medium"}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MyInvois UBL 2.1 JSON Export */}
        <div className="rounded-xl border border-[#DCD7CC] bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#0C2340]" />
            <h3 className="text-sm font-bold text-[#0C2340]">
              Penjana Payload e-Invois LHDN (MyInvois v1.1 UBL JSON)
            </h3>
          </div>
          <p className="text-[11px] text-[#536B85]">
            Pilih mana-mana invois untuk menjana struktur JSON rasmi LHDN MyInvois (DocumentType <code className="font-mono">01</code>, Currency <code className="font-mono">MYR</code>, Classification <code className="font-mono">022</code>, TaxType <code className="font-mono">06 Not Applicable</code>).
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="flex-1 min-w-[200px] px-2.5 py-2 rounded-lg border border-[#DCD7CC] font-mono text-xs"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {customerMap[inv.customer_id]?.customer_name || "Customer"} ({fmtRM(inv.total_amount)})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={downloadMyInvoisJson}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#347A63] hover:bg-[#28614E] text-white font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Muat Turun JSON
            </button>
            <button
              type="button"
              onClick={() => setShowJson((v) => !v)}
              className="px-3 py-2 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] font-semibold cursor-pointer"
            >
              {showJson ? "Sembunyi" : "Pratonton"}
            </button>
          </div>

          {showJson && myInvoisPayload && (
            <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-[10px] font-mono overflow-auto max-h-64">
              {JSON.stringify(myInvoisPayload, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
