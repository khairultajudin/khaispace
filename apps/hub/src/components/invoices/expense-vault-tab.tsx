"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileUp,
  FolderArchive,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Expense, fmtDate, fmtRM } from "./types";
import {
  StoredReceiptFile,
  deleteReceiptFile,
  fileToDataUrl,
  getReceiptFile,
  saveReceiptFile,
} from "./receipt-vault-db";

interface ExpenseVaultTabProps {
  expenses: Expense[];
  filteredExpenses: Expense[];
  onAttachReceipt: (expenseId: string, meta: { id: string; name: string; type: string }) => void;
  onRemoveReceipt: (expenseId: string) => void;
  onAddExpense: (exp: Expense) => void;
}

const EXPENSE_CATEGORIES = [
  "Materials & Components",
  "API / AI Subscription",
  "Utilities & Internet",
  "Home Loan / Office",
  "Postage & Shipping",
  "Software & Tools",
  "Marketing & Ads",
  "Transport & Fuel",
  "Operating & Tools / General Expense",
  "Professional Fees / SSM",
];

export function ExpenseVaultTab({
  expenses,
  filteredExpenses,
  onAttachReceipt,
  onRemoveReceipt,
  onAddExpense,
}: ExpenseVaultTabProps) {
  const [previewFile, setPreviewFile] = useState<{ exp: Expense; file: StoredReceiptFile } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Add Expense form state
  const todayIso = new Date().toISOString().slice(0, 10);
  const [expDate, setExpDate] = useState(todayIso);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Maybank M2U");
  const [desc, setDesc] = useState("");
  const [taxDeductible, setTaxDeductible] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const withReceiptCount = useMemo(
    () => expenses.filter((e) => Boolean(e.receipt_file_id)).length,
    [expenses]
  );
  const receiptPct = expenses.length > 0 ? Math.round((withReceiptCount / expenses.length) * 100) : 0;

  const handleFileUpload = async (exp: Expense, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Saiz fail maksimum ialah 10 MB.");
      return;
    }
    setUploadingId(exp.id);
    try {
      const dataUrl = await fileToDataUrl(file);
      const fileId = `rcp-file-${exp.id}-${Date.now()}`;
      await saveReceiptFile({
        id: fileId,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
      onAttachReceipt(exp.id, { id: fileId, name: file.name, type: file.type });
    } catch (err) {
      alert(`Gagal menyimpan resit: ${String(err)}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleViewReceipt = async (exp: Expense) => {
    if (!exp.receipt_file_id) return;
    const stored = await getReceiptFile(exp.receipt_file_id);
    if (!stored) {
      alert("Fail resit tidak ditemui dalam storan pelayar ini. Sila muat naik semula.");
      return;
    }
    setPreviewFile({ exp, file: stored });
  };

  const handleDeleteReceipt = async (exp: Expense) => {
    if (exp.receipt_file_id) {
      await deleteReceiptFile(exp.receipt_file_id).catch(() => {});
    }
    onRemoveReceipt(exp.id);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!recipient.trim() || !Number.isFinite(amt) || amt <= 0) return;

    const mm = expDate.slice(5, 7);
    const yy = expDate.slice(2, 4);
    const nextSeq = expenses.length + 1;
    const expId = `exp-${Date.now()}`;
    const expNo = `EXP${yy}${mm}${String(nextSeq).padStart(3, "0")}`;

    let receiptMeta: { id?: string; name?: string; type?: string } = {};
    if (pendingFile) {
      const dataUrl = await fileToDataUrl(pendingFile);
      const fileId = `rcp-file-${expId}-${Date.now()}`;
      await saveReceiptFile({
        id: fileId,
        name: pendingFile.name,
        type: pendingFile.type || "application/octet-stream",
        size: pendingFile.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
      receiptMeta = { id: fileId, name: pendingFile.name, type: pendingFile.type };
    }

    onAddExpense({
      id: expId,
      expense_number: expNo,
      expense_date: expDate,
      category,
      recipient_name: recipient.trim(),
      amount: Number(amt.toFixed(2)),
      payment_method: method,
      description: desc.trim() || undefined,
      receipt_file_id: receiptMeta.id,
      receipt_file_name: receiptMeta.name,
      receipt_file_type: receiptMeta.type,
      tax_deductible: taxDeductible,
    });

    setShowAddModal(false);
    setRecipient("");
    setAmount("");
    setDesc("");
    setPendingFile(null);
  };

  return (
    <div className="space-y-4">
      {/* Receipt Vault Status Banner */}
      <div className="mx-4 mt-4 p-4 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[#0C2340]">
              Peti Resit Perbelanjaan (Audit LHDN 7 Tahun — Seksyen 82 ACP 1967)
            </div>
            <div className="text-[#536B85] mt-0.5">
              Muat naik resit PDF / JPG / PNG terus ke setiap rekod perbelanjaan. Disimpan secara setempat dalam storan pelayar (IndexedDB, sehingga 10 MB/fail).
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-40 h-2 rounded-full bg-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full bg-[#347A63] rounded-full transition-all"
                  style={{ width: `${receiptPct}%` }}
                />
              </div>
              <span className="font-semibold text-[#0C2340]">
                {withReceiptCount}/{expenses.length} rekod ada resit ({receiptPct}%)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Kos &amp; Resit
        </button>
      </div>

      {/* Expense Table with Receipt Upload/Preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4]/60 text-[11px] uppercase tracking-wider text-[#536B85]">
              <th className="py-3 px-4 font-semibold">Tarikh</th>
              <th className="py-3 px-4 font-semibold">Kategori</th>
              <th className="py-3 px-4 font-semibold">Penerima / Pembekal</th>
              <th className="py-3 px-4 font-semibold">Perincian</th>
              <th className="py-3 px-4 font-semibold text-right">Jumlah</th>
              <th className="py-3 px-4 font-semibold text-right">Resit (Peti Simpanan)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFECE4] text-xs">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-[#FAF8F4] transition-colors">
                <td className="py-3 px-4 text-[#536B85] whitespace-nowrap">
                  {fmtDate(exp.expense_date)}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[#0C2340] text-[10px] font-semibold">
                    {exp.category}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-[#0C2340]">
                  {exp.recipient_name}
                </td>
                <td className="py-3 px-4 text-[#536B85] max-w-xs truncate" title={exp.description || ""}>
                  {exp.description || exp.payment_method}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-[#B45309] whitespace-nowrap">
                  {fmtRM(exp.amount)}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {exp.receipt_file_id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#347A63] bg-[#EBF5F0] border border-[#C8E6D7] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Ada Resit
                      </span>
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(exp)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#DCD7CC] bg-white hover:bg-[#FAF8F4] text-[#0C2340] text-[11px] font-medium cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        Lihat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReceipt(exp)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                        title="Buang resit"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-dashed border-[#A9B5C4] bg-white hover:bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340] text-[11px] font-medium cursor-pointer">
                      <FileUp className="w-3 h-3" />
                      {uploadingId === exp.id ? "Memuat naik..." : "Muat Naik Resit"}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(exp, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateExpense}
            className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8"
          >
            <div className="px-5 py-3.5 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div className="font-bold text-sm text-[#0C2340]">Tambah Perbelanjaan &amp; Resit</div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[#536B85] hover:bg-[#EFECE4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Tarikh</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Jumlah (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Penerima / Pembekal</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Cytron Technologies / DeepSeek / Digi"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Kaedah Bayaran</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                  >
                    <option value="Maybank M2U">Maybank M2U</option>
                    <option value="DuitNow QR">DuitNow QR</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Claim Khai (CIMB)">Claim Khai (CIMB)</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxDeductible}
                      onChange={(e) => setTaxDeductible(e.target.checked)}
                    />
                    <span className="font-semibold text-[#0C2340]">Boleh Tolak Cukai LHDN</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Perincian / Nota</label>
                <input
                  type="text"
                  placeholder="Penerangan ringkas pembelian"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Lampirkan Resit (PDF / Gambar)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#536B85]"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#FAF8F4] border-t border-[#DCD7CC] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-[#DCD7CC] bg-white text-xs font-semibold text-[#536B85] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer"
              >
                Simpan Perbelanjaan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8">
            <div className="px-5 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-[#0C2340]">
                  Resit: {previewFile.exp.recipient_name} ({fmtRM(previewFile.exp.amount)})
                </div>
                <div className="text-[#536B85]">{previewFile.file.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.file.dataUrl}
                  download={previewFile.file.name}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0C2340] text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Muat Turun
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-lg text-[#536B85] hover:bg-[#EFECE4] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 max-h-[75vh] overflow-auto flex justify-center">
              {previewFile.file.type.includes("pdf") ? (
                <iframe
                  src={previewFile.file.dataUrl}
                  title={previewFile.file.name}
                  className="w-full h-[68vh] rounded border border-slate-300 bg-white"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewFile.file.dataUrl}
                  alt={previewFile.file.name}
                  className="max-h-[68vh] w-auto rounded shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
