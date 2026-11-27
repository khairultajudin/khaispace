"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Download,
  FileText,
  Images,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
} from "lucide-react";

type MjTab = "dashboard" | "novel" | "komik" | "karakter" | "dokumen";

const BASE = "/portfolio/memburu-jejak";

const CHARACTER_GALLERY = [
  { name: "Khalid (v2)", file: "khalid_concept_v2.webp" },
  { name: "Khalid", file: "khalid_concept.jpg" },
  { name: "Fahmi", file: "fahmi_concept.jpg" },
  { name: "Edy", file: "edy_concept.jpg" },
  { name: "Kit", file: "kit_concept.jpg" },
  { name: "Mariam", file: "mariam_concept.jpg" },
  { name: "Zamani", file: "zamani_concept.jpg" },
  { name: "Yana", file: "yana_concept.jpg" },
  { name: "Suria", file: "suria_concept.jpg" },
  { name: "Haziq", file: "haziq_concept.jpg" },
  { name: "Munir", file: "munir_concept.jpg" },
  { name: "Saiful", file: "saiful_concept.jpg" },
  { name: "Zubir", file: "zubir_concept.jpg" },
  { name: "Amri & Jeffri", file: "amri_jeffri_concept.jpg" },
  { name: "Safwan & Hazwan", file: "safwan_hazwan_concept.jpg" },
  { name: "Siti Halijah & Syikin", file: "siti_halijah_syikin_concept.jpg" },
  { name: "Prof. Tarmizi", file: "prof_tarmizi_concept.jpg" },
  { name: "Cikgu Bakar", file: "cikgu_bakar_concept.jpg" },
  { name: "Cikgu Fatimah", file: "cikgu_fatimah_concept.jpg" },
  { name: "Cikgu Fauziah", file: "cikgu_fauziah_concept.jpg" },
  { name: "Cikgu Malik", file: "cikgu_malik_concept.jpg" },
  { name: "Cikgu Muzammil", file: "cikgu_muzammil_concept.jpg" },
  { name: "Cikgu Rahim", file: "cikgu_rahim_concept.jpg" },
  { name: "Ustazah Rahimah", file: "ustazah_rahimah_concept.jpg" },
  { name: "Lencana SMK Sri Dian", file: "lencana_smk_sri_dian.jpg" },
];

const EDITORIAL_DOCS = [
  {
    title: "Master Character Bible",
    desc: "Pangkalan data penuh watak, latar belakang, perhubungan & konsistensi visual.",
    href: `${BASE}/master-character-bible.md`,
  },
  {
    title: "Panduan Adaptasi Komik",
    desc: "Garis panduan visual, gaya lukisan & pecahan episod adaptasi komik.",
    href: `${BASE}/Komik/PANDUAN_ADAPTASI_KOMIK.md`,
  },
  {
    title: "Papan Cerita — Episod 01",
    desc: "Susunan panel dan arahan visual untuk Komik Episod 01.",
    href: `${BASE}/Komik/papan_cerita/Papan_Cerita_Episod_01.md`,
  },
  {
    title: "Skrip Komik — Episod 01",
    desc: "Dialog dan skrip penuh Episod 01.",
    href: `${BASE}/Komik/skrip/Episod_01_Skrip_Komik.md`,
  },
  {
    title: "Laporan Editorial Batch 4",
    desc: "Laporan penyempurnaan editorial manuskrip novel.",
    href: `${BASE}/batch4-editorial-completion-report.md`,
  },
  {
    title: "Semakan Database Karakter Global",
    desc: "Laporan validasi konsistensi watak merentas bab.",
    href: `${BASE}/global-character-database-validation.md`,
  },
  {
    title: "Senarai Semak Persediaan Karakter",
    desc: "Checklist rujukan konsep visual watak.",
    href: `${BASE}/midjourney-character-preparation-checklist.md`,
  },
];

export function MemburuJejakWorkspace() {
  const [activeTab, setActiveTab] = useState<MjTab>("dashboard");
  const [expanded, setExpanded] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ name: string; src: string } | null>(null);

  const tabs: { id: MjTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Papan Pemuka Rasmi", icon: LayoutDashboard },
    { id: "novel", label: "Baca Novel", icon: BookOpen },
    { id: "komik", label: "Baca Komik (Ep. 01)", icon: Sparkles },
    { id: "karakter", label: `Galeri Karakter (${CHARACTER_GALLERY.length})`, icon: Images },
    { id: "dokumen", label: `Dokumen & Skrip (${EDITORIAL_DOCS.length})`, icon: FileText },
  ];

  const iframeHeight = expanded ? "h-[88vh]" : "h-[78vh] min-h-[640px]";

  return (
    <div className="rounded-xl border border-[#DCD7CC] bg-white shadow-xs overflow-hidden">
      {/* Unified Studio Header & Sub-Tabs */}
      <div className="px-4 sm:px-5 pt-4 pb-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE}/cover_front.jpg`}
            alt="Kulit Novel Memburu Jejak"
            className="w-10 h-14 object-cover rounded border border-[#DCD7CC] shadow-xs shrink-0"
          />
          <div>
            <div className="text-sm font-bold text-[#0C2340]">
              Studio Bersepadu: Memburu Jejak — Langkah Pertama
            </div>
            <div className="text-[11px] text-[#536B85]">
              Papan Pemuka, Pembaca Novel, Komik Episod 01, Galeri 25 Karakter &amp; Dokumen Editorial disatukan terus di sini.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`${BASE}/Komik/Memburu_Jejak_Episod_01_Komik.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#347A63] hover:bg-[#28614E] text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Komik Ep. 01</span>
          </a>
          {(activeTab === "dashboard" || activeTab === "novel" || activeTab === "komik") && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-white hover:bg-[#EFECE4] text-[#0C2340] text-xs font-medium cursor-pointer"
            >
              {expanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Saiz Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Besarkan Paparan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-[#0C2340] text-[#0C2340] bg-white rounded-t-md"
                  : "border-transparent text-[#536B85] hover:text-[#0C2340]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD PENUH */}
      {activeTab === "dashboard" && (
        <div className="bg-[#0a0d14]">
          <iframe
            src={`${BASE}/index.html`}
            title="Papan Pemuka Rasmi Memburu Jejak"
            className={`w-full ${iframeHeight} border-0 block`}
          />
        </div>
      )}

      {/* TAB 2: NOVEL READER */}
      {activeTab === "novel" && (
        <div className="bg-[#0a0d14]">
          <iframe
            src={`${BASE}/reader.html`}
            title="Pembaca Novel Memburu Jejak"
            className={`w-full ${iframeHeight} border-0 block`}
          />
        </div>
      )}

      {/* TAB 3: KOMIK READER */}
      {activeTab === "komik" && (
        <div className="bg-[#0a0d14]">
          <iframe
            src={`${BASE}/komik_reader.html`}
            title="Pembaca Komik Memburu Jejak Episod 01"
            className={`w-full ${iframeHeight} border-0 block`}
          />
        </div>
      )}

      {/* TAB 4: GALERI KARAKTER */}
      {activeTab === "karakter" && (
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CHARACTER_GALLERY.map((c) => {
            const src = `${BASE}/Komik/karakter/${c.file}`;
            return (
              <button
                key={c.file}
                type="button"
                onClick={() => setLightboxImg({ name: c.name, src })}
                className="group rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] overflow-hidden text-left hover:border-[#347A63] transition-all cursor-pointer"
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="px-2.5 py-2 text-xs font-semibold text-[#0C2340] truncate">
                  {c.name}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 5: DOKUMEN & SKRIP */}
      {activeTab === "dokumen" && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {EDITORIAL_DOCS.map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/70 hover:bg-[#EDF5F2] hover:border-[#A8CFC2] transition-colors flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#0C2340]">{doc.title}</div>
                <div className="text-[11px] text-[#536B85] leading-relaxed">{doc.desc}</div>
              </div>
              <FileText className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Character Art */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div className="font-bold text-sm text-[#0C2340]">{lightboxImg.name}</div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImg.src}
                  download
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0C2340] text-white text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Muat Turun
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImg(null)}
                  className="p-1 rounded hover:bg-[#EFECE4] text-[#536B85] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-900 flex justify-center max-h-[80vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImg.src}
                alt={lightboxImg.name}
                className="max-h-[74vh] w-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

