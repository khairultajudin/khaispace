"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRightCircle,
  FilePlus2,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import {
  Customer,
  Quotation,
  QuotationItem,
  fmtDate,
  fmtRM,
} from "./types";

interface QuotationsTabProps {
  quotations: Quotation[];
  customers: Customer[];
  customerMap: Record<string, Customer>;
  onCreateQuotation: (qt: Quotation, newCustomer?: Customer) => void;
  onUpdateQuotationStatus: (id: string, status: Quotation["status"]) => void;
  onConvertToInvoice: (qt: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
}

export function QuotationsTab({
  quotations,
  customers,
  customerMap,
  onCreateQuotation,
  onUpdateQuotationStatus,
  onConvertToInvoice,
  onDeleteQuotation,
}: QuotationsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [previewQt, setPreviewQt] = useState<Quotation | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const defaultValidIso = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [qtDate, setQtDate] = useState(todayIso);
  const [validUntil, setValidUntil] = useState(defaultValidIso);
  const [customerId, setCustomerId] = useState(customers[0]?.id || "new");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState(
    "Sebut harga ini sah selama 14 hari dari tarikh dikeluarkan. Deposit 50% diperlukan untuk pengesahan tempahan."
  );
  const [lines, setLines] = useState<Array<{ description: string; quantity: string; unit_price: string }>>([
    { description: "", quantity: "1", unit_price: "0" },
  ]);

  const nextQuotationNumber = useMemo(() => {
    const mm = (qtDate || todayIso).slice(5, 7);
    const yy = (qtDate || todayIso).slice(2, 4);
    const maxSeq = quotations.reduce((max, q) => {
      const m = q.quotation_number.match(/(\d{3})$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `QT${yy}${mm}${String(maxSeq + 1).padStart(3, "0")}`;
  }, [quotations, qtDate, todayIso]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let resolvedCustId = customerId;
    let createdCust: Customer | undefined;

    if (customerId === "new" && newCustomerName.trim()) {
      resolvedCustId = `cust-${Date.now()}`;
      createdCust = {
        id: resolvedCustId,
        customer_name: newCustomerName.trim(),
        address: newCustomerAddress.trim() || undefined,
      };
    }

    const parsedItems: QuotationItem[] = lines
      .filter((l) => l.description.trim())
      .map((l, idx) => {
        const qty = Math.max(1, parseFloat(l.quantity) || 1);
        const price = Math.max(0, parseFloat(l.unit_price) || 0);
        return {
          id: `qi-${Date.now()}-${idx}`,
          description: l.description.trim(),
          quantity: qty,
          unit_price: price,
          line_total: Number((qty * price).toFixed(2)),
        };
      });

    if (parsedItems.length === 0) return;

    const subtotal = Number(parsedItems.reduce((s, i) => s + i.line_total, 0).toFixed(2));
    const disc = Math.max(0, parseFloat(discount) || 0);
    const total = Math.max(0, Number((subtotal - disc).toFixed(2)));

    const qt: Quotation = {
      id: `qt-${Date.now()}`,
      quotation_number: nextQuotationNumber,
      customer_id: resolvedCustId,
      quotation_date: qtDate,
      valid_until: validUntil,
      status: "draft",
      items: parsedItems,
      subtotal,
      discount_amount: disc,
      total_amount: total,
      notes: notes.trim() || undefined,
    };

    onCreateQuotation(qt, createdCust);
    setShowModal(false);
    setLines([{ description: "", quantity: "1", unit_price: "0" }]);
    setNewCustomerName("");
    setNewCustomerAddress("");
    setDiscount("0");
    setPreviewQt(qt);
  };

  const statusBadge = (s: Quotation["status"]) => {
    switch (s) {
      case "converted":
        return "bg-[#EBF5F0] text-[#347A63] border-[#C8E6D7]";
      case "accepted":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "sent":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "expired":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]";
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0C2340]">
            Penjana Sebut Harga (Quotation) — MK Venture
          </h3>
          <p className="text-[11px] text-[#536B85] mt-0.5">
            Cipta sebut harga rasmi ({nextQuotationNumber}), cetak/simpan PDF untuk pelanggan, dan tukar terus kepada Invois dengan 1 klik apabila pelanggan setuju.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer shrink-0"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
          Cipta Sebut Harga Baru
        </button>
      </div>

      <div className="overflow-x-auto border border-[#DCD7CC] rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4] text-[11px] uppercase tracking-wider text-[#536B85]">
              <th className="py-2.5 px-4 font-semibold">No. Sebut Harga</th>
              <th className="py-2.5 px-4 font-semibold">Tarikh / Sah Hingga</th>
              <th className="py-2.5 px-4 font-semibold">Pelanggan</th>
              <th className="py-2.5 px-4 font-semibold">Perincian</th>
              <th className="py-2.5 px-4 font-semibold text-right">Jumlah</th>
              <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFECE4]">
            {quotations.map((q) => {
              const cust = customerMap[q.customer_id];
              const summary = q.items.map((i) => i.description).join(" + ");
              return (
                <tr key={q.id} className="hover:bg-[#FAF8F4]/70">
                  <td className="py-3 px-4 font-mono font-bold text-[#0C2340] whitespace-nowrap">
                    <div>{q.quotation_number}</div>
                    {q.converted_invoice_number && (
                      <div className="text-[10px] text-[#347A63] font-normal">
                        → {q.converted_invoice_number}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#536B85] whitespace-nowrap">
                    <div>{fmtDate(q.quotation_date)}</div>
                    <div className="text-[10px]">Sah: {fmtDate(q.valid_until)}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0C2340]">
                    {cust?.customer_name || "-"}
                  </td>
                  <td className="py-3 px-4 text-[#536B85] max-w-xs truncate" title={summary}>
                    {summary}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#0C2340] whitespace-nowrap">
                    {fmtRM(q.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={q.status}
                      onChange={(e) =>
                        onUpdateQuotationStatus(q.id, e.target.value as Quotation["status"])
                      }
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border cursor-pointer ${statusBadge(
                        q.status
                      )}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="converted">Converted</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewQt(q)}
                        className="px-2.5 py-1 rounded border border-[#DCD7CC] bg-white hover:bg-[#FAF8F4] text-[#0C2340] text-[11px] font-medium cursor-pointer"
                      >
                        Lihat / PDF
                      </button>
                      {q.status !== "converted" && (
                        <button
                          type="button"
                          onClick={() => onConvertToInvoice(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#347A63] hover:bg-[#28614E] text-white text-[11px] font-semibold cursor-pointer"
                          title="Tukar sebut harga ini menjadi Invois rasmi"
                        >
                          <ArrowRightCircle className="w-3 h-3" />
                          Tukar ke Invois
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteQuotation(q.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                        title="Padam sebut harga"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#536B85]">
                  Belum ada sebut harga lagi. Klik <strong>Cipta Sebut Harga Baru</strong> di atas untuk mula menjana Quotation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8"
          >
            <div className="px-5 py-3.5 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#0C2340]">Cipta Sebut Harga (Quotation)</div>
                <div className="text-[11px] font-mono text-[#347A63] font-semibold">
                  Nombor Automatik: {nextQuotationNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#536B85] hover:bg-[#EFECE4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Tarikh Sebut Harga</label>
                  <input
                    type="date"
                    value={qtDate}
                    onChange={(e) => setQtDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Sah Hingga (Valid Until)</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Pelanggan</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name}
                    </option>
                  ))}
                  <option value="new">+ Pelanggan Baharu...</option>
                </select>
                {customerId === "new" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <input
                      type="text"
                      required
                      placeholder="Nama Pelanggan / Syarikat"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                    />
                    <input
                      type="text"
                      placeholder="Alamat (pilihan)"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      className="px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#0C2340]">Item / Servis</label>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((prev) => [...prev, { description: "", quantity: "1", unit_price: "0" }])
                    }
                    className="inline-flex items-center gap-1 text-[#347A63] font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>
                {lines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Perincian item / servis"
                      value={l.description}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                        )
                      }
                      className="col-span-6 px-2.5 py-1.5 rounded border border-[#DCD7CC]"
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={l.quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x))
                        )
                      }
                      className="col-span-2 px-2 py-1.5 rounded border border-[#DCD7CC] text-right"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Harga (RM)"
                      value={l.unit_price}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, unit_price: e.target.value } : x))
                        )
                      }
                      className="col-span-3 px-2 py-1.5 rounded border border-[#DCD7CC] text-right"
                    />
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                        className="col-span-1 text-rose-500 flex justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Diskaun (RM)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#0C2340] mb-1">Nota &amp; Terma Sebut Harga</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#FAF8F4] border-t border-[#DCD7CC] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-[#DCD7CC] bg-white text-xs font-semibold text-[#536B85] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer"
              >
                Jana Sebut Harga ({nextQuotationNumber})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUOTATION PREVIEW MODAL */}
      {previewQt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8">
            <div className="px-5 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between print:hidden">
              <div className="font-semibold text-sm text-[#0C2340]">
                Pratonton Sebut Harga — {previewQt.quotation_number}
              </div>
              <div className="flex items-center gap-2">
                {previewQt.status !== "converted" && (
                  <button
                    type="button"
                    onClick={() => {
                      onConvertToInvoice(previewQt);
                      setPreviewQt(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#347A63] hover:bg-[#28614E] text-white text-xs font-semibold cursor-pointer"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    Tukar ke Invois
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewQt(null)}
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
                  <div className="text-2xl font-black tracking-tight text-[#0C2340]">QUOTATION</div>
                  <div className="mt-1 inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold uppercase text-[10px]">
                    {previewQt.status}
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
                    13700 Perai, Pulau Pinang, Malaysia<br />
                    Phone: 0187604289 | mkventuremakersolution@gmail.com
                  </div>
                </div>
                <div className="space-y-1 sm:text-right">
                  <div><span className="text-slate-500 font-semibold">Quotation No :</span> <span className="ml-1 font-mono font-bold text-[#0C2340]">{previewQt.quotation_number}</span></div>
                  <div><span className="text-slate-500 font-semibold">Date :</span> <span className="ml-1">{fmtDate(previewQt.quotation_date)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Valid Until :</span> <span className="ml-1 font-semibold">{fmtDate(previewQt.valid_until)}</span></div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Quotation For :</div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {customerMap[previewQt.customer_id]?.customer_name || "Customer"}
                </div>
                {customerMap[previewQt.customer_id]?.address && (
                  <div className="text-slate-600 mt-0.5">
                    {customerMap[previewQt.customer_id]?.address}
                  </div>
                )}
              </div>

              <table className="w-full border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-[#0C2340] text-white text-[11px]">
                    <th className="py-2 px-3 text-left w-10">No.</th>
                    <th className="py-2 px-3 text-left">Item / Service</th>
                    <th className="py-2 px-3 text-right w-20">Qty</th>
                    <th className="py-2 px-3 text-right w-28">Price (RM)</th>
                    <th className="py-2 px-3 text-right w-28">Amount (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewQt.items.map((it, idx) => (
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

              <div className="flex flex-col items-end gap-1">
                {previewQt.discount_amount > 0 && (
                  <div className="text-slate-600">
                    Discount: <span className="font-mono">-{fmtRM(previewQt.discount_amount)}</span>
                  </div>
                )}
                <div className="bg-slate-100 border border-slate-300 rounded px-4 py-2.5 flex items-center gap-6">
                  <span className="font-bold text-slate-700">ESTIMATED TOTAL (RM) :</span>
                  <span className="font-mono font-black text-base text-slate-900">
                    {previewQt.total_amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900">Terms &amp; Notes</div>
                <div>{previewQt.notes || "Quotation valid for 14 days."}</div>
                <div className="pt-2">
                  Payment Account: <strong className="text-slate-900">MK VENTURE MAKER SOLUTION</strong> —{" "}
                  <strong className="font-mono text-slate-900">MAYBANK 5686 0305 3567</strong>
                </div>
                <div className="pt-1 italic text-[11px] text-slate-500">
                  This is a computer-generated quotation. No signature is required.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
