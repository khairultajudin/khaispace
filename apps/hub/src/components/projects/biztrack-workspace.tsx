"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  GitCommitHorizontal,
  Images,
  Layers,
  Lock,
  Receipt,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";

type BtTab = "overview" | "releases" | "gallery" | "architecture";

const BASE = "/portfolio/biztrack/assets";

const BIZTRACK_INVOICES = [
  {
    no: "INV2609018",
    date: "16 Sep 2026",
    client: "Pusat Tuisyen Hana (Pn. Norhana)",
    item: "BizTrack Initial System Setup & Deployment",
    amount: "RM 500.00",
    status: "PAID",
  },
  {
    no: "INV2610024",
    date: "19 Okt 2026",
    client: "Pusat Tuisyen Hana (Pn. Norhana)",
    item: "Monthly Subscription — Oktober 2026",
    amount: "RM 69.00",
    status: "PAID",
  },
  {
    no: "INV2611027",
    date: "21 Nov 2026",
    client: "Pusat Tuisyen Hana",
    item: "BizTrack System Upgrade (Multi-Branch & Salary Privacy)",
    amount: "RM 500.00",
    status: "PAID",
  },
  {
    no: "INV2611028",
    date: "21 Nov 2026",
    client: "Pusat Tuisyen Hana",
    item: "Monthly Subscription — November 2026",
    amount: "RM 69.00",
    status: "PAID",
  },
];

const RELEASES = [
  {
    date: "15 Nov 2026",
    commit: "56c2cf4",
    tag: "Access Control",
    title: "Role-Gated Add Teacher CTA",
    desc: "Sembunyikan butang Add Teacher dalam empty state bagi peranan bukan pentadbir.",
  },
  {
    date: "15 Nov 2026",
    commit: "65020b7",
    tag: "Migration 09",
    title: "Multi-Branch Teacher Assignment (Task 4)",
    desc: "Pengagihan guru merentas berbilang cawangan dengan kawalan keizinan cawangan.",
  },
  {
    date: "14 Nov 2026",
    commit: "a1712a9",
    tag: "Migration 08",
    title: "Branch-Level Salary Privacy Controls (Phase 2.5–2.7)",
    desc: "Kawalan privasi gaji mengikut cawangan, perlindungan hard/soft delete staff_payments (FK RESTRICT + trigger audit), race-safe Expenses fetch, dan 96/96 ujian lulus (0 ralat).",
  },
  {
    date: "09 Nov 2026",
    commit: "4a5e0d6",
    tag: "Settings & Auth",
    title: "Admin Business Settings & Password Toggle",
    desc: "Membenarkan akses Business Settings untuk Admin serta togol tunjuk/sembunyi kata laluan pada skrin log masuk.",
  },
  {
    date: "07 Nov 2026",
    commit: "c35a1d8",
    tag: "Core Upgrade",
    title: "Multi-Branch Management",
    desc: "Sokongan penuh pengurusan operasi, pelajar, dan kewangan bagi pusat tuisyen berbilang cawangan.",
  },
  {
    date: "01 Nov 2026",
    commit: "f6b9e8c",
    tag: "Payments",
    title: "Secure Invoice PDF Upload",
    desc: "Muat naik bukti/invois PDF secara selamat terus pada setiap rekod bayaran.",
  },
];

const SCREENSHOTS = [
  {
    title: "Papan Pemuka Utama BizTrack",
    desc: "Ringkasan KPI operasi, yuran pelajar, status bayaran dan prestasi cawangan.",
    src: `${BASE}/biztrack-dashboard.jpg`,
  },
  {
    title: "Analitik & Laporan Kewangan",
    desc: "Carta trend kutipan bulanan, pecahan perbelanjaan dan laporan untung rugi.",
    src: `${BASE}/biztrack-analytics.jpg`,
  },
];

export function BizTrackWorkspace() {
  const [activeTab, setActiveTab] = useState<BtTab>("overview");
  const [lightbox, setLightbox] = useState<{ title: string; src: string } | null>(null);

  return (
    <div className="rounded-xl border border-[#DCD7CC] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                Production SaaS &bull; MK Venture
              </span>
              <span className="text-[10px] font-mono text-[#536B85]">
                Vite 8 &bull; React 19 &bull; TS 6 &bull; Supabase &bull; Vercel
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0C2340] mt-1">
              BizTrack: Sistem Pengurusan Operasi, Guru &amp; Yuran
            </h2>
            <p className="text-xs text-[#536B85] mt-0.5 max-w-2xl">
              Sistem SaaS produksi untuk pengurusan pelajar, berbilang cawangan, privasi gaji staf, invois PDF, dan laporan kewangan — digunakan aktif oleh Pusat Tuisyen Hana.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold shrink-0">
          <Lock className="w-3.5 h-3.5" />
          <span>Strict Production Isolation</span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="px-4 bg-white border-b border-[#DCD7CC] flex items-center gap-1 overflow-x-auto">
        {(
          [
            { id: "overview", label: "Ringkasan & Hasil Komersial", icon: TrendingUp },
            { id: "releases", label: `Log Kemas Kini (${RELEASES.length})`, icon: GitCommitHorizontal },
            { id: "gallery", label: "Paparan Sistem (2)", icon: Images },
            { id: "architecture", label: "Seni Bina & Keselamatan", icon: ShieldCheck },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? "border-[#347A63] text-[#347A63]"
                  : "border-transparent text-[#536B85] hover:text-[#0C2340]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & COMMERCIAL REVENUE */}
      {activeTab === "overview" && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/50">
              <div className="text-xs text-[#347A63] font-medium">Jumlah Hasil 2026</div>
              <div className="text-2xl font-bold font-mono text-[#347A63] mt-1">RM 1,138.00</div>
              <div className="text-[11px] text-[#347A63]/80 mt-1">4 invois lunas (Sep–Nov 2026)</div>
            </div>
            <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60">
              <div className="text-xs text-[#536B85] font-medium">MRR Aktif</div>
              <div className="text-2xl font-bold font-mono text-[#0C2340] mt-1">RM 69.00/bln</div>
              <div className="text-[11px] text-[#536B85] mt-1">Pelanggan: Pusat Tuisyen Hana</div>
            </div>
            <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60">
              <div className="text-xs text-[#536B85] font-medium">Status Ujian Automatik</div>
              <div className="text-2xl font-bold font-mono text-[#0C2340] mt-1">96 / 96</div>
              <div className="text-[11px] text-[#536B85] mt-1">0 ralat (Phase 2.7 Salary Privacy)</div>
            </div>
            <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60">
              <div className="text-xs text-[#536B85] font-medium">Migrasi DB Terkini</div>
              <div className="text-2xl font-bold font-mono text-[#0C2340] mt-1">Migration 09</div>
              <div className="text-[11px] text-[#536B85] mt-1">Multi-Branch + Teacher Assignment</div>
            </div>
          </div>

          {/* Commercial Invoice Ledger */}
          <div className="rounded-xl border border-[#DCD7CC] overflow-hidden">
            <div className="px-4 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div className="text-xs font-bold text-[#0C2340] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#347A63]" />
                <span>Rekod Invois Komersial BizTrack (MK Venture 2026)</span>
              </div>
              <span className="text-[11px] font-mono text-[#347A63] font-semibold">100% PAID</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCD7CC] bg-white text-[11px] text-[#536B85]">
                    <th className="py-2.5 px-4">No. Invois</th>
                    <th className="py-2.5 px-4">Tarikh</th>
                    <th className="py-2.5 px-4">Pelanggan</th>
                    <th className="py-2.5 px-4">Perincian</th>
                    <th className="py-2.5 px-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE4]">
                  {BIZTRACK_INVOICES.map((inv) => (
                    <tr key={inv.no} className="hover:bg-[#FAF8F4]/60">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0C2340]">{inv.no}</td>
                      <td className="py-2.5 px-4 text-[#536B85] whitespace-nowrap">{inv.date}</td>
                      <td className="py-2.5 px-4 font-medium text-[#0C2340]">{inv.client}</td>
                      <td className="py-2.5 px-4 text-[#536B85]">{inv.item}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#347A63]">
                        {inv.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RELEASES */}
      {activeTab === "releases" && (
        <div className="p-5 sm:p-6 space-y-3">
          {RELEASES.map((rel) => (
            <div
              key={rel.commit}
              className="p-4 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                    {rel.tag}
                  </span>
                  <span className="text-xs font-bold text-[#0C2340]">{rel.title}</span>
                </div>
                <p className="text-xs text-[#536B85] leading-relaxed">{rel.desc}</p>
              </div>
              <div className="text-right shrink-0 font-mono text-[11px] text-[#536B85]">
                <div className="font-semibold text-[#0C2340]">{rel.commit}</div>
                <div>{rel.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: GALLERY */}
      {activeTab === "gallery" && (
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {SCREENSHOTS.map((s) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setLightbox({ title: s.title, src: s.src })}
              className="group rounded-xl border border-[#DCD7CC] bg-[#FAF8F4] overflow-hidden text-left hover:border-[#347A63] transition-all cursor-pointer"
            >
              <div className="aspect-video overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="text-sm font-bold text-[#0C2340]">{s.title}</div>
                <div className="text-xs text-[#536B85]">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* TAB 4: ARCHITECTURE & ISOLATION */}
      {activeTab === "architecture" && (
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-5 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 space-y-2.5">
            <div className="font-bold text-sm text-[#0C2340] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#347A63]" />
              <span>Stack &amp; Repositori Bebas</span>
            </div>
            <ul className="space-y-1.5 text-[#536B85]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                <span><strong>Local Path:</strong> <code className="font-mono">C:\Users\user\BizTrack</code></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                <span><strong>GitHub:</strong> <code className="font-mono">khairultajudin/BizTrack</code> (branch <code className="font-mono">main</code>)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                <span><strong>Frontend:</strong> Vite 8.1 + React 19.2 + TypeScript 6 + Recharts + Zod 4 + Oxlint</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                <span><strong>Backend &amp; Hosting:</strong> Projek Supabase berasingan + Vercel Production</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2.5">
            <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Polisi Sempadan Isolasi (Strict Boundary)</span>
            </div>
            <p className="text-amber-900/80 leading-relaxed">
              BizTrack mempunyai pangkalan data pelanggan produksi yang aktif (Pusat Tuisyen Hana). Oleh itu, kod sumber, migrasi SQL, dan kelayakan Supabase BizTrack dikekalkan terasing sepenuhnya daripada monorepo <code className="font-mono">E:\KhaiSpace</code>. Hub ini menyimpan ringkasan prestasi, invois komersial, dan sejarah keluaran sahaja.
            </p>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div className="font-bold text-xs text-[#0C2340]">{lightbox.title}</div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="p-1 rounded hover:bg-[#EFECE4] text-[#536B85] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.src} alt={lightbox.title} className="max-h-[78vh] w-auto rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
