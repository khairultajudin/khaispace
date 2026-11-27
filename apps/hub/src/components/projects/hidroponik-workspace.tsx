"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Beaker,
  BookOpen,
  CheckCircle2,
  Droplets,
  Leaf,
  Loader2,
  Sprout,
  X,
} from "lucide-react";

type HidroTab = "pakchoy" | "salad" | "calculator" | "directory";

interface JournalEntry {
  day: string;
  date: string;
  images: { src: string; alt: string }[];
  summary: string;
  highlights: string[];
  extraNotes: string[];
}

interface DirectorySection {
  category: string;
  items: { name: string; details: string }[];
}

interface HidroData {
  pakChoy: JournalEntry[];
  salad: JournalEntry[];
  directory: DirectorySection[];
}

const BASE = "/portfolio/hidroponik";

const SALAD_RISKS = [
  {
    title: "1. Daun Terbakar (Tip Burn)",
    cause: "EC terlalu tinggi (>1.4 mS/cm) atau aliran udara panas & tersekat.",
    fix: "Kekalkan EC salad antara 0.8–1.2 mS/cm dan pastikan pengudaraan baik.",
  },
  {
    title: "2. Batang Tinggi & Daun Pahit (Bolting)",
    cause: "Suhu air/persekitaran terlalu panas (>30°C) memaksa pokok berbunga awal.",
    fix: "Letak di lokasi teduh separa (4–6 jam cahaya pagi) dan balut takung dengan foil.",
  },
  {
    title: "3. Anak Pokok Kutilang (Etiolation)",
    cause: "Kurang cahaya matahari selepas percambahan (Hari 2–5).",
    fix: "Dedahkan segera kepada cahaya matahari pagi sebaik sahaja tunas keluar.",
  },
  {
    title: "4. Lumut Hijau Dalam Takungan",
    cause: "Cahaya matahari menembusi dinding bekas lutsinar yang mengandungi baja AB.",
    fix: "Gunakan takung legap atau balut balang kaca dengan aluminium foil / plastik hitam.",
  },
];

const QUICK_PLANTS = [
  { name: "Pak Choy Hijau", type: "Sayur Daun (Kratky)", ec: "1.2 – 1.8 mS/cm", harvest: "30 – 38 hari" },
  { name: "Salad / Lettuce (Framoc)", type: "Sayur Daun (Kratky)", ec: "0.8 – 1.2 mS/cm", harvest: "35 – 45 hari" },
  { name: "Kangkung & Bayam", type: "Sayur Daun Cepat Tuai", ec: "1.0 – 1.5 mS/cm", harvest: "21 – 28 hari" },
  { name: "Daun Bawang (Ubi Dapur)", type: "Herba Aromatik", ec: "0.8 – 1.2 mS/cm", harvest: "10 – 14 hari (potong berulang)" },
  { name: "Pudina & Selasih (Basil)", type: "Herba Masakan", ec: "1.0 – 1.6 mS/cm", harvest: "25 – 35 hari" },
  { name: "Cili / Tomato Ceri", type: "Berbuah (Dutch Bucket 10–18L)", ec: "2.0 – 2.8 mS/cm", harvest: "70 – 90 hari" },
];

export function HidroponikWorkspace() {
  const [activeTab, setActiveTab] = useState<HidroTab>("pakchoy");
  const [data, setData] = useState<HidroData | null>(null);
  const [loading, setLoading] = useState(true);

  const [pakChoyIdx, setPakChoyIdx] = useState(0);
  const [saladIdx, setSaladIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  // AB Nutrient Calculator
  const [crop, setCrop] = useState<"pakchoy" | "salad">("pakchoy");
  const [stage, setStage] = useState<"semaian" | "vegetatif" | "matang">("vegetatif");
  const [liters, setLiters] = useState<string>("5");

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/hub-data.json`)
      .then((r) => r.json())
      .then((json: HidroData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // EC targets & ml per liter (standard 100x AB stock)
  const calc = (() => {
    const vol = Math.max(0.5, parseFloat(liters) || 1);
    const table = {
      pakchoy: {
        semaian: { ec: "0.6 – 0.8", ppm: "300 – 400", mlPerL: 3 },
        vegetatif: { ec: "1.2 – 1.5", ppm: "600 – 750", mlPerL: 6 },
        matang: { ec: "1.5 – 1.8", ppm: "750 – 900", mlPerL: 8 },
      },
      salad: {
        semaian: { ec: "0.4 – 0.6", ppm: "200 – 300", mlPerL: 2.5 },
        vegetatif: { ec: "0.8 – 1.0", ppm: "400 – 500", mlPerL: 4.5 },
        matang: { ec: "1.0 – 1.2", ppm: "500 – 600", mlPerL: 5.5 },
      },
    };
    const cfg = table[crop][stage];
    return {
      ...cfg,
      mlA: (vol * cfg.mlPerL).toFixed(1),
      mlB: (vol * cfg.mlPerL).toFixed(1),
      vol,
    };
  })();

  if (loading) {
    return (
      <div className="p-10 rounded-xl border border-[#DCD7CC] bg-white flex items-center justify-center gap-2 text-xs text-[#536B85]">
        <Loader2 className="w-4 h-4 animate-spin text-[#347A63]" />
        <span>Memuatkan Hab Hidroponik...</span>
      </div>
    );
  }

  const pakChoyList = data?.pakChoy || [];
  const saladList = data?.salad || [];

  const renderJournalView = (
    list: JournalEntry[],
    idx: number,
    setIdx: (n: number) => void,
    badgeLabel: string
  ) => {
    const entry = list[idx];
    if (!entry) {
      return <div className="p-8 text-center text-xs text-[#536B85]">Tiada log dijumpai.</div>;
    }
    return (
      <div className="p-5 sm:p-6 space-y-5">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {list.map((e, i) => {
            const shortLabel = e.day.match(/Hari\s*(?:Ke-)?\d+/i)?.[0] || `Log ${i + 1}`;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  idx === i
                    ? "bg-[#347A63] text-white shadow-xs"
                    : "bg-[#FAF8F4] text-[#0C2340] border border-[#DCD7CC] hover:bg-[#EDF5F2]"
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>

        {/* Active Log Card */}
        <div className="rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/50 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCD7CC]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                {badgeLabel}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#0C2340] mt-1.5">
                {entry.day}
              </h3>
            </div>
            {entry.date && (
              <span className="text-xs font-mono text-[#536B85]">{entry.date}</span>
            )}
          </div>

          {/* Photo Grid */}
          {entry.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entry.images.map((im, i) => {
                const src = `${BASE}/${im.src}`;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox({ src, alt: im.alt })}
                    className="group rounded-lg overflow-hidden border border-[#DCD7CC] bg-white text-left cursor-pointer"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={im.alt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    {im.alt && (
                      <div className="px-3 py-2 text-[11px] text-[#536B85] truncate">
                        {im.alt}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Summary & AI Diagnosis */}
          <div className="bg-white rounded-lg border border-[#DCD7CC] p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#347A63]">
              Analisis &amp; Diagnosis Tumbesaran
            </div>
            {entry.summary && (
              <p className="text-xs text-[#0C2340] leading-relaxed">{entry.summary}</p>
            )}
            {entry.highlights.length > 0 && (
              <ul className="space-y-1.5 text-xs text-[#536B85]">
                {entry.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-[#DCD7CC] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#347A63] text-white flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                Kaedah Pasif Kratky
              </span>
              <span className="text-[10px] font-mono text-[#536B85]">
                {pakChoyList.length} Log Pak Choy &bull; {saladList.length} Log Salad &bull; Kalkulator Baja AB
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0C2340] mt-1">
              Hab Hidroponik: Pak Choy, Salad Framoc &amp; Direktori Tanaman
            </h2>
            <p className="text-xs text-[#536B85] mt-0.5">
              Jurnal bergambar tumbesaran harian, kalkulator bancuhan Baja AB &amp; panduan tanaman hidroponik rumah disatukan terus di dalam Hub.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="px-4 bg-white border-b border-[#DCD7CC] flex items-center gap-1 overflow-x-auto">
        {(
          [
            { id: "pakchoy", label: `Pak Choy Hijau (${pakChoyList.length} Log)`, icon: Leaf },
            { id: "salad", label: `Salad Framoc (${saladList.length} Log)`, icon: Sprout },
            { id: "calculator", label: "Kalkulator Baja AB & Risiko", icon: Beaker },
            { id: "directory", label: "Direktori Tanaman", icon: BookOpen },
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

      {activeTab === "pakchoy" &&
        renderJournalView(pakChoyList, pakChoyIdx, setPakChoyIdx, "Pak Choy Hijau • Kratky")}

      {activeTab === "salad" &&
        renderJournalView(saladList, saladIdx, setSaladIdx, "Salad / Lettuce Framoc")}

      {activeTab === "calculator" && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calculator */}
            <div className="p-5 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/70 space-y-4">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#347A63]" />
                <h3 className="text-sm font-bold text-[#0C2340]">
                  Kalkulator Bancuhan Baja AB (Stok 100x)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Jenis Sayur</label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value as "pakchoy" | "salad")}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC] bg-white"
                  >
                    <option value="pakchoy">Pak Choy Hijau</option>
                    <option value="salad">Salad / Lettuce</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Fasa Tumbesaran</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as "semaian" | "vegetatif" | "matang")}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC] bg-white"
                  >
                    <option value="semaian">Semaian (Hari 1–10)</option>
                    <option value="vegetatif">Vegetatif (Hari 11–25)</option>
                    <option value="matang">Matang (Hari 26+)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0C2340] mb-1">Isipadu Air (Liter)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#DCD7CC] bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-white border border-[#DCD7CC] text-center">
                  <div className="text-[10px] text-[#536B85] uppercase">Pati Baja A</div>
                  <div className="text-lg font-bold font-mono text-[#0C2340] mt-0.5">{calc.mlA} mL</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#DCD7CC] text-center">
                  <div className="text-[10px] text-[#536B85] uppercase">Pati Baja B</div>
                  <div className="text-lg font-bold font-mono text-[#0C2340] mt-0.5">{calc.mlB} mL</div>
                </div>
                <div className="p-3 rounded-lg bg-[#EDF5F2] border border-[#A8CFC2] text-center">
                  <div className="text-[10px] text-[#347A63] uppercase">Sasaran EC</div>
                  <div className="text-sm font-bold font-mono text-[#347A63] mt-1">{calc.ec}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#EDF5F2] border border-[#A8CFC2] text-center">
                  <div className="text-[10px] text-[#347A63] uppercase">Sasaran PPM</div>
                  <div className="text-sm font-bold font-mono text-[#347A63] mt-1">{calc.ppm}</div>
                </div>
              </div>
              <p className="text-[11px] text-[#536B85]">
                Tip: Bancuh Pati A dalam air dahulu, kacau sebati, barulah masukkan Pati B. Sahkan bacaan akhir menggunakan EC/TDS meter.
              </p>
            </div>

            {/* 4 Common Risks */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-[#0C2340]">
                  Panduan Mengatasi 4 Risiko Lazim Hidroponik
                </h3>
              </div>
              <div className="space-y-2.5">
                {SALAD_RISKS.map((r) => (
                  <div key={r.title} className="p-3.5 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/50 text-xs space-y-1">
                    <div className="font-bold text-[#0C2340]">{r.title}</div>
                    <div className="text-[#536B85]"><strong>Punca:</strong> {r.cause}</div>
                    <div className="text-[#347A63]"><strong>Solusi:</strong> {r.fix}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "directory" && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_PLANTS.map((p) => (
              <div key={p.name} className="p-4 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 space-y-1.5">
                <div className="text-sm font-bold text-[#0C2340]">{p.name}</div>
                <div className="text-[11px] font-semibold text-[#347A63]">{p.type}</div>
                <div className="pt-2 border-t border-[#DCD7CC] flex justify-between text-[11px] font-mono text-[#536B85]">
                  <span>EC: {p.ec}</span>
                  <span>Tuai: {p.harvest}</span>
                </div>
              </div>
            ))}
          </div>

          {data?.directory?.map((sec, idx) => (
            <div key={idx} className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#0C2340]">{sec.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sec.items.map((it, j) => (
                  <div key={j} className="p-4 rounded-lg border border-[#DCD7CC] bg-white space-y-1">
                    <div className="text-xs font-bold text-[#0C2340]">{it.name}</div>
                    <p className="text-[11px] text-[#536B85] leading-relaxed">{it.details}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-center justify-between">
              <div className="font-semibold text-xs text-[#0C2340] truncate">{lightbox.alt || "Foto Tumbesaran"}</div>
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
              <img src={lightbox.src} alt={lightbox.alt} className="max-h-[75vh] w-auto rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

