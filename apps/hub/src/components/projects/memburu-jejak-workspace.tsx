"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GitBranch,
  Layers,
  Loader2,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type MjTab = "overview" | "chapters" | "reader" | "characters" | "komik" | "docs";
type CharSubTab = "grid" | "relationships" | "continuity";

interface ChapterMeta {
  num: number;
  title: string;
  shortTitle: string;
  words: number;
  cast: string[];
  category: string;
  tension: number;
  summary: string;
  highlight: string;
}

interface CharacterItem {
  id: number;
  name: string;
  alias: string;
  role: string;
  category: string;
  count: number;
  image?: string;
  status: string;
  batch: number;
  desc: string;
}

interface RelationshipItem {
  pair: string;
  type: string;
  dynamic: string;
  chapters: string;
}

interface ContinuityIssue {
  id: string;
  character: string;
  chapter: string;
  desc: string;
  status: string;
  resolution: string;
}

interface KomikPage {
  src: string;
  title: string;
  sub: string;
}

interface HubData {
  chapters: ChapterMeta[];
  characters: CharacterItem[];
  dossiers: Record<string, Record<string, unknown>>;
  relationships: RelationshipItem[];
  continuityIssues: ContinuityIssue[];
  komikPages: KomikPage[];
}

interface ReaderChapter {
  num: number;
  fullTitle: string;
  title: string;
  content: string;
  wordCount: number;
}

const BASE = "/portfolio/memburu-jejak";

const EDITORIAL_DOCS = [
  {
    title: "Master Character Bible",
    desc: "Pangkalan data penuh 40 watak, latar belakang, perhubungan & konsistensi visual.",
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
    desc: "Laporan validasi konsistensi watak merentas 32 bab.",
    href: `${BASE}/global-character-database-validation.md`,
  },
  {
    title: "Senarai Semak Persediaan Karakter",
    desc: "Checklist rujukan konsep visual watak.",
    href: `${BASE}/midjourney-character-preparation-checklist.md`,
  },
];

function renderDossierSection(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map((v) => String(v)).join(" • ");
  if (typeof val === "object") {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
      .join("\n");
  }
  return String(val);
}

export function MemburuJejakWorkspace() {
  const [activeTab, setActiveTab] = useState<MjTab>("overview");
  const [data, setData] = useState<HubData | null>(null);
  const [readerChapters, setReaderChapters] = useState<ReaderChapter[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chapter Explorer state
  const [chapterSearch, setChapterSearch] = useState("");
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);

  // Novel Reader state
  const [readerIdx, setReaderIdx] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(16);

  // Character Dossier state
  const [charSubTab, setCharSubTab] = useState<CharSubTab>("grid");
  const [charSearch, setCharSearch] = useState("");
  const [charCategory, setCharCategory] = useState("ALL");
  const [selectedChar, setSelectedChar] = useState<CharacterItem | null>(null);

  // Komik state
  const [komikMode, setKomikMode] = useState<"page" | "webtoon">("page");
  const [komikIdx, setKomikIdx] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/hub-data.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuatkan data Memburu Jejak.");
        return res.json();
      })
      .then((json: HubData) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Ralat memuatkan data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lazy-load full novel text only when Reader tab is opened
  useEffect(() => {
    if (activeTab !== "reader" || readerChapters) return;
    let cancelled = false;
    fetch(`${BASE}/novel-chapters.json`)
      .then((res) => res.json())
      .then((json: ReaderChapter[]) => {
        if (!cancelled) setReaderChapters(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeTab, readerChapters]);

  const totalWords = useMemo(
    () => (data?.chapters || []).reduce((s, c) => s + (c.words || 0), 0),
    [data]
  );

  const avgWords = useMemo(
    () => (data && data.chapters.length > 0 ? Math.round(totalWords / data.chapters.length) : 0),
    [data, totalWords]
  );

  const maxWords = useMemo(
    () => Math.max(1, ...(data?.chapters || []).map((c) => c.words || 0)),
    [data]
  );

  const filteredChapters = useMemo(() => {
    if (!data) return [];
    const q = chapterSearch.trim().toLowerCase();
    if (!q) return data.chapters;
    return data.chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.cast.some((n) => n.toLowerCase().includes(q))
    );
  }, [data, chapterSearch]);

  const activeChapter = useMemo(() => {
    if (!data) return null;
    return data.chapters.find((c) => c.num === selectedChapterNum) || data.chapters[0] || null;
  }, [data, selectedChapterNum]);

  const charCategories = useMemo(() => {
    if (!data) return ["ALL"];
    return ["ALL", ...Array.from(new Set(data.characters.map((c) => c.category)))];
  }, [data]);

  const filteredChars = useMemo(() => {
    if (!data) return [];
    const q = charSearch.trim().toLowerCase();
    return data.characters.filter((c) => {
      if (charCategory !== "ALL" && c.category !== charCategory) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.alias.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q)
      );
    });
  }, [data, charSearch, charCategory]);

  const arcsGrouped = useMemo(() => {
    if (!data) return [];
    const map: Record<string, ChapterMeta[]> = {};
    for (const ch of data.chapters) {
      if (!map[ch.category]) map[ch.category] = [];
      map[ch.category].push(ch);
    }
    return Object.entries(map);
  }, [data]);

  const jumpToReaderChapter = (chapterNum: number) => {
    setReaderIdx(Math.max(0, chapterNum - 1));
    setActiveTab("reader");
  };

  if (loading) {
    return (
      <div className="p-10 rounded-xl border border-[#DCD7CC] bg-white flex items-center justify-center gap-2 text-xs text-[#536B85]">
        <Loader2 className="w-4 h-4 animate-spin text-[#347A63]" />
        <span>Memuatkan Studio Memburu Jejak...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || "Data Memburu Jejak tidak ditemui."}</span>
      </div>
    );
  }

  const tabs: { id: MjTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Ringkasan & Metrik", icon: BarChart3 },
    { id: "chapters", label: `Penjelajah Bab (${data.chapters.length})`, icon: BookMarked },
    { id: "reader", label: "Baca Novel", icon: BookOpen },
    { id: "characters", label: `Dossier Watak (${data.characters.length})`, icon: Users },
    { id: "komik", label: `Komik Ep. 01 (${data.komikPages.length} Muka)`, icon: Sparkles },
    { id: "docs", label: `Penerbitan & Dokumen (${EDITORIAL_DOCS.length})`, icon: FileText },
  ];

  const resolvedIssuesCount = data.continuityIssues.filter((i) =>
    i.status.toLowerCase().includes("selesai") || i.status.toLowerCase().includes("resolved")
  ).length;

  return (
    <div className="space-y-5">
      {/* Unified Editorial Hero Header (Khai Space Theme) */}
      <div className="rounded-xl border border-[#DCD7CC] bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/cover_front.jpg`}
              alt="Kulit Novel Memburu Jejak"
              className="w-16 h-22 object-cover rounded-md border border-[#DCD7CC] shadow-sm shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                  Novel &amp; Adaptasi Komik
                </span>
                <span className="text-[10px] font-mono text-[#536B85]">
                  {data.chapters.length} Bab &bull; {totalWords.toLocaleString("en-MY")} Perkataan &bull; {data.characters.length} Watak Canon
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0C2340] tracking-tight">
                Memburu Jejak: Langkah Pertama
              </h2>
              <p className="text-xs text-[#536B85] max-w-2xl leading-relaxed">
                Hab penerbitan bersepadu — analisis 32 bab, pembaca novel penuh, pangkalan data 40 watak canon, matriks hubungan, audit kesinambungan, dan komik Episod 01.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("reader")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mula Membaca</span>
            </button>
            <a
              href={`${BASE}/Komik/Memburu_Jejak_Episod_01_Komik.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EDF5F2] hover:bg-[#DCF0E6] text-[#347A63] border border-[#A8CFC2] text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Komik Ep. 01</span>
            </a>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="px-4 bg-white border-b border-[#DCD7CC] flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
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

        {/* ============================================================ */}
        {/* TAB 1: RINGKASAN & METRIK                                    */}
        {/* ============================================================ */}
        {activeTab === "overview" && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60">
                <div className="text-xs text-[#536B85] font-medium">Jumlah Perkataan</div>
                <div className="text-2xl font-bold text-[#0C2340] font-mono mt-1">
                  {totalWords.toLocaleString("en-MY")}
                </div>
                <div className="text-[11px] text-[#536B85] mt-1">
                  Purata {avgWords.toLocaleString("en-MY")} patah/bab (~{Math.round(totalWords / 220)} minit bacaan)
                </div>
              </div>
              <div className="p-4 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/50">
                <div className="text-xs text-[#347A63] font-medium">Struktur Manuskrip</div>
                <div className="text-2xl font-bold text-[#347A63] font-mono mt-1">
                  {data.chapters.length} Bab
                </div>
                <div className="text-[11px] text-[#347A63]/80 mt-1">
                  {arcsGrouped.length} arka naratif lengkap (Batch 4)
                </div>
              </div>
              <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60">
                <div className="text-xs text-[#536B85] font-medium">Pangkalan Data Watak</div>
                <div className="text-2xl font-bold text-[#0C2340] font-mono mt-1">
                  {data.characters.length} Watak
                </div>
                <div className="text-[11px] text-[#536B85] mt-1">
                  {Object.keys(data.dossiers).length} dossier lengkap &bull; {data.relationships.length} hubungan teras
                </div>
              </div>
              <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60">
                <div className="text-xs text-[#536B85] font-medium">Audit Kesinambungan</div>
                <div className="text-2xl font-bold text-[#0C2340] font-mono mt-1">
                  {resolvedIssuesCount}/{data.continuityIssues.length}
                </div>
                <div className="text-[11px] text-[#536B85] mt-1">
                  Semakan editorial &amp; konsistensi plot
                </div>
              </div>
            </div>

            {/* Word Count & Tension Distribution across 32 Chapters */}
            <div className="p-5 rounded-lg border border-[#DCD7CC] bg-white space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#0C2340]">
                    Taburan Perkataan &amp; Ketegangan Plot (Bab 1 – {data.chapters.length})
                  </h3>
                  <p className="text-[11px] text-[#536B85]">
                    Klik mana-mana bar bab untuk melihat ringkasan &amp; watak bab tersebut.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#536B85]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#347A63]" /> Ketegangan Tinggi (≥8)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0C2340]" /> Sederhana
                  </span>
                </div>
              </div>

              <div className="h-44 flex items-end gap-1 pt-4 overflow-x-auto pb-1">
                {data.chapters.map((ch) => {
                  const hPct = Math.max(12, Math.round((ch.words / maxWords) * 100));
                  const highTension = (ch.tension || 0) >= 8;
                  return (
                    <button
                      key={ch.num}
                      type="button"
                      onClick={() => {
                        setSelectedChapterNum(ch.num);
                        setActiveTab("chapters");
                      }}
                      title={`${ch.title} — ${ch.words} perkataan (Tension: ${ch.tension}/10)`}
                      className="flex-1 min-w-[16px] flex flex-col items-center gap-1 group cursor-pointer h-full justify-end"
                    >
                      <div
                        className={`w-full rounded-t transition-opacity group-hover:opacity-80 ${
                          highTension ? "bg-[#347A63]" : "bg-[#0C2340]/80"
                        }`}
                        style={{ height: `${hPct}%` }}
                      />
                      <span className="text-[9px] font-mono text-[#536B85]">{ch.num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arka Penceritaan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#347A63]" />
                <h3 className="text-sm font-bold text-[#0C2340]">Arka Penceritaan Mengikut Fasa</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arcsGrouped.map(([arcName, list]) => {
                  const arcWords = list.reduce((s, c) => s + c.words, 0);
                  return (
                    <div
                      key={arcName}
                      className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4]/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0C2340]">{arcName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DCD7CC] text-[#347A63]">
                          {list.length} Bab
                        </span>
                      </div>
                      <div className="text-[11px] text-[#536B85] font-mono">
                        {arcWords.toLocaleString("en-MY")} perkataan
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {list.map((ch) => (
                          <button
                            key={ch.num}
                            type="button"
                            onClick={() => {
                              setSelectedChapterNum(ch.num);
                              setActiveTab("chapters");
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[#DCD7CC] text-[#0C2340] hover:border-[#347A63] hover:text-[#347A63] cursor-pointer"
                          >
                            Bab {ch.num}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PENJELAJAH BAB (32 BAB)                               */}
        {/* ============================================================ */}
        {activeTab === "chapters" && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Cari bab, watak, atau plot..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
                />
              </div>
              <div className="border border-[#DCD7CC] rounded-lg divide-y divide-[#EFECE4] max-h-[600px] overflow-y-auto bg-white">
                {filteredChapters.map((ch) => {
                  const active = activeChapter?.num === ch.num;
                  return (
                    <button
                      key={ch.num}
                      type="button"
                      onClick={() => setSelectedChapterNum(ch.num)}
                      className={`w-full p-3 text-left transition-colors cursor-pointer ${
                        active ? "bg-[#EDF5F2] border-l-4 border-l-[#347A63]" : "hover:bg-[#FAF8F4]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0C2340]">
                          Bab {ch.num}: {ch.shortTitle || ch.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#536B85] shrink-0">
                          {ch.words}w
                        </span>
                      </div>
                      <div className="text-[10px] text-[#536B85] mt-0.5 flex items-center justify-between">
                        <span>{ch.category}</span>
                        <span>Tension {ch.tension}/10</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Detail */}
            <div className="lg:col-span-8">
              {activeChapter && (
                <div className="p-6 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/50 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#DCD7CC]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#DCD7CC] text-[#347A63]">
                        {activeChapter.category}
                      </span>
                      <h3 className="text-xl font-bold text-[#0C2340] mt-2">
                        {activeChapter.title}
                      </h3>
                      <div className="text-xs text-[#536B85] font-mono mt-1">
                        {activeChapter.words.toLocaleString("en-MY")} perkataan &bull; Ketegangan Plot:{" "}
                        <strong>{activeChapter.tension}/10</strong> &bull; {activeChapter.cast.length} watak
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToReaderChapter(activeChapter.num)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Baca Bab {activeChapter.num}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#536B85]">
                      Ringkasan Bab
                    </div>
                    <p className="text-sm text-[#0C2340] leading-relaxed bg-white p-4 rounded-lg border border-[#DCD7CC]">
                      {activeChapter.summary}
                    </p>
                  </div>

                  {activeChapter.highlight && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#347A63]">
                        Momen Penting / Sorotan
                      </div>
                      <div className="p-4 rounded-lg bg-[#EDF5F2] border border-[#A8CFC2] text-xs text-[#0C2340] leading-relaxed italic">
                        &ldquo;{activeChapter.highlight}&rdquo;
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#536B85]">
                      Watak Terlibat ({activeChapter.cast.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeChapter.cast.map((name) => (
                        <span
                          key={name}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-[#DCD7CC] text-[#0C2340]"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: BACA NOVEL (NATIVE KHAI SPACE EDITORIAL READER)       */}
        {/* ============================================================ */}
        {activeTab === "reader" && (
          <div className="p-5 sm:p-6 space-y-4 bg-[#FAF8F4]/60">
            {!readerChapters ? (
              <div className="p-10 text-center text-xs text-[#536B85] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#347A63]" />
                <span>Memuatkan teks penuh 32 bab novel...</span>
              </div>
            ) : (
              <>
                {/* Reader Controls */}
                <div className="p-3.5 rounded-lg bg-white border border-[#DCD7CC] flex flex-wrap items-center justify-between gap-3 sticky top-2 z-10 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={readerIdx === 0}
                      onClick={() => setReaderIdx((i) => Math.max(0, i - 1))}
                      className="p-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#EFECE4] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#0C2340]" />
                    </button>
                    <select
                      value={readerIdx}
                      onChange={(e) => setReaderIdx(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-semibold text-[#0C2340] max-w-[260px]"
                    >
                      {readerChapters.map((c, idx) => (
                        <option key={c.num} value={idx}>
                          {c.fullTitle || `Bab ${c.num} — ${c.title}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={readerIdx >= readerChapters.length - 1}
                      onClick={() => setReaderIdx((i) => Math.min(readerChapters.length - 1, i + 1))}
                      className="p-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#EFECE4] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-[#0C2340]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#536B85] font-mono hidden sm:inline">
                      {readerChapters[readerIdx]?.wordCount?.toLocaleString("en-MY")} perkataan
                    </span>
                    <button
                      type="button"
                      onClick={() => setFontSize((s) => Math.max(13, s - 1))}
                      className="px-2 py-1 rounded border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#EFECE4] font-semibold text-[#0C2340] cursor-pointer"
                    >
                      A-
                    </button>
                    <span className="font-mono text-[11px] text-[#536B85] w-8 text-center">
                      {fontSize}px
                    </span>
                    <button
                      type="button"
                      onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                      className="px-2 py-1 rounded border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#EFECE4] font-semibold text-[#0C2340] cursor-pointer"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Editorial Manuscript Paper */}
                {readerChapters[readerIdx] && (
                  <article className="max-w-3xl mx-auto bg-white rounded-xl border border-[#DCD7CC] shadow-xs p-6 sm:p-10 space-y-6">
                    <div className="border-b border-[#EFECE4] pb-4 text-center space-y-1">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-[#347A63]">
                        Memburu Jejak: Langkah Pertama &bull; Bab {readerChapters[readerIdx].num}
                      </div>
                      <h2 className="text-2xl font-bold text-[#0C2340]">
                        {readerChapters[readerIdx].title}
                      </h2>
                    </div>

                    <div
                      className="text-[#1F2D3D] leading-[1.9] space-y-4 [&>p]:mb-4"
                      style={{ fontSize: `${fontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: readerChapters[readerIdx].content }}
                    />

                    <div className="pt-6 border-t border-[#EFECE4] flex items-center justify-between">
                      <button
                        type="button"
                        disabled={readerIdx === 0}
                        onClick={() => setReaderIdx((i) => Math.max(0, i - 1))}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] hover:bg-[#EFECE4] text-xs font-semibold text-[#0C2340] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Bab Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={readerIdx >= readerChapters.length - 1}
                        onClick={() => setReaderIdx((i) => Math.min(readerChapters.length - 1, i + 1))}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Bab Seterusnya <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: DOSSIER WATAK (40) + MATRIKS HUBUNGAN + AUDIT         */}
        {/* ============================================================ */}
        {activeTab === "characters" && (
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: "grid", label: `Semua Watak (${data.characters.length})` },
                    { id: "relationships", label: `Matriks Hubungan (${data.relationships.length})` },
                    { id: "continuity", label: `Audit Kesinambungan (${data.continuityIssues.length})` },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCharSubTab(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      charSubTab === st.id
                        ? "bg-[#0C2340] text-white"
                        : "bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC] hover:text-[#0C2340]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {charSubTab === "grid" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#536B85] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={charSearch}
                      onChange={(e) => setCharSearch(e.target.value)}
                      placeholder="Cari watak..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] w-44"
                    />
                  </div>
                  <select
                    value={charCategory}
                    onChange={(e) => setCharCategory(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]"
                  >
                    {charCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "ALL" ? "Semua Kategori" : cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {charSubTab === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredChars.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChar(ch)}
                    className="rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 hover:bg-white hover:border-[#347A63] transition-all overflow-hidden text-left flex flex-col cursor-pointer shadow-xs"
                  >
                    {ch.image ? (
                      <div className="h-44 bg-slate-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${BASE}/${ch.image}`}
                          alt={ch.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="h-20 bg-[#EDF5F2] flex items-center justify-center text-[#347A63] font-bold text-lg">
                        {ch.alias.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="p-3.5 space-y-1.5 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#DCD7CC] text-[#347A63]">
                          {ch.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#536B85]">{ch.count} bab</span>
                      </div>
                      <div className="font-bold text-sm text-[#0C2340]">{ch.name}</div>
                      <div className="text-[11px] font-medium text-[#536B85]">{ch.role}</div>
                      <p className="text-[11px] text-[#536B85] line-clamp-3 leading-relaxed">
                        {ch.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {charSubTab === "relationships" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.relationships.map((rel, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-[#0C2340] flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-[#347A63]" />
                        <span>{rel.pair}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                        {rel.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#536B85] leading-relaxed">{rel.dynamic}</p>
                    <div className="text-[10px] font-mono text-[#536B85] pt-1">
                      Rujukan Bab: {rel.chapters}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {charSubTab === "continuity" && (
              <div className="overflow-x-auto border border-[#DCD7CC] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F4] border-b border-[#DCD7CC] text-[11px] uppercase text-[#536B85]">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Watak / Bab</th>
                      <th className="py-2.5 px-3">Isu Dikesan</th>
                      <th className="py-2.5 px-3">Penyelesaian</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4]">
                    {data.continuityIssues.map((iss) => (
                      <tr key={iss.id} className="hover:bg-[#FAF8F4]/60">
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#0C2340]">{iss.id}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-[#0C2340]">{iss.character}</div>
                          <div className="text-[10px] text-[#536B85]">{iss.chapter}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#536B85]">{iss.desc}</td>
                        <td className="py-2.5 px-3 text-[#0C2340]">{iss.resolution}</td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                            <CheckCircle2 className="w-3 h-3" />
                            {iss.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: KOMIK EPISOD 01 (NATIVE VIEWER)                       */}
        {/* ============================================================ */}
        {activeTab === "komik" && (
          <div className="p-5 sm:p-6 space-y-5 bg-[#FAF8F4]/60">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-[#DCD7CC]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKomikMode("page")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    komikMode === "page"
                      ? "bg-[#0C2340] text-white"
                      : "bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC]"
                  }`}
                >
                  Mod Muka Surat ({data.komikPages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setKomikMode("webtoon")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    komikMode === "webtoon"
                      ? "bg-[#0C2340] text-white"
                      : "bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC]"
                  }`}
                >
                  Mod Webtoon (Skrol)
                </button>
              </div>
              <a
                href={`${BASE}/Komik/Memburu_Jejak_Episod_01_Komik.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#347A63] text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Muat Turun PDF Penuh
              </a>
            </div>

            {komikMode === "page" && data.komikPages[komikIdx] && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-white rounded-xl border border-[#DCD7CC] p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#0C2340]">
                        {data.komikPages[komikIdx].title}
                      </div>
                      <div className="text-xs text-[#536B85]">{data.komikPages[komikIdx].sub}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={komikIdx === 0}
                        onClick={() => setKomikIdx((i) => Math.max(0, i - 1))}
                        className="p-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono px-2">
                        {komikIdx + 1} / {data.komikPages.length}
                      </span>
                      <button
                        type="button"
                        disabled={komikIdx >= data.komikPages.length - 1}
                        onClick={() => setKomikIdx((i) => Math.min(data.komikPages.length - 1, i + 1))}
                        className="p-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${BASE}/${data.komikPages[komikIdx].src}`}
                    alt={data.komikPages[komikIdx].title}
                    className="w-full h-auto rounded-lg border border-[#DCD7CC]"
                  />
                </div>
              </div>
            )}

            {komikMode === "webtoon" && (
              <div className="max-w-2xl mx-auto space-y-4">
                {data.komikPages.map((pg, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-[#DCD7CC] p-3 space-y-2">
                    <div className="text-xs font-bold text-[#0C2340]">{pg.title}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${BASE}/${pg.src}`}
                      alt={pg.title}
                      loading="lazy"
                      className="w-full h-auto rounded border border-[#DCD7CC]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: PENERBITAN & DOKUMEN                                  */}
        {/* ============================================================ */}
        {activeTab === "docs" && (
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="p-4 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4] space-y-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BASE}/cover_front.jpg`}
                  alt="Kulit Hadapan Rasmi"
                  className="w-full max-w-[240px] mx-auto rounded-lg border border-[#DCD7CC] shadow-sm"
                />
                <div className="text-xs font-bold text-[#0C2340]">
                  Kulit Hadapan Rasmi — Memburu Jejak
                </div>
                <a
                  href={`${BASE}/cover_front.jpg`}
                  download="Memburu_Jejak_Cover.jpg"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0C2340] text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Muat Turun Kulit
                </a>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-3">
              <h3 className="text-sm font-bold text-[#0C2340]">
                Dokumen Editorial, Bible Watak &amp; Skrip Komik
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
          </div>
        )}
      </div>

      {/* CHARACTER DOSSIER MODAL */}
      {selectedChar && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedChar(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-[#DCD7CC] overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#FAF8F4] border-b border-[#DCD7CC] flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedChar.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`${BASE}/${selectedChar.image}`}
                    alt={selectedChar.name}
                    className="w-14 h-14 rounded-lg object-cover object-top border border-[#DCD7CC]"
                  />
                )}
                <div>
                  <div className="text-base font-bold text-[#0C2340]">{selectedChar.name}</div>
                  <div className="text-xs text-[#536B85]">{selectedChar.role}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2] font-semibold">
                      {selectedChar.status}
                    </span>
                    <span className="font-mono text-[#536B85]">
                      Muncul dalam {selectedChar.count} bab
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChar(null)}
                className="p-1.5 rounded-lg text-[#536B85] hover:bg-[#EFECE4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
              <p className="text-[#0C2340] leading-relaxed bg-[#FAF8F4] p-3.5 rounded-lg border border-[#DCD7CC]">
                {selectedChar.desc}
              </p>

              {(() => {
                const dossier = data.dossiers[String(selectedChar.id)];
                if (!dossier) return null;
                const sections: Array<[string, string]> = [
                  ["s1_identity", "Identiti & Latar Belakang"],
                  ["s2_personality", "Personaliti & Sifat"],
                  ["s3_emotional", "Arka Emosi"],
                  ["s4_development", "Perkembangan Watak"],
                  ["s5_relationships", "Hubungan Utama"],
                  ["s6_visual", "Rujukan Visual"],
                  ["s8_mangaNotes", "Nota Adaptasi Komik"],
                ];
                return sections.map(([key, label]) => {
                  const text = renderDossierSection(dossier[key]);
                  if (!text) return null;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="font-bold text-[#347A63] uppercase text-[10px] tracking-wider">
                        {label}
                      </div>
                      <div className="text-[#0C2340] whitespace-pre-line leading-relaxed bg-white p-3 rounded border border-[#EFECE4]">
                        {text}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
