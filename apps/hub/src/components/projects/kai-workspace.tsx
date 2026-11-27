"use client";

import React, { useState } from "react";
import {
  Bot,
  Box,
  CheckCircle2,
  Cpu,
  Gauge,
  GitCommitHorizontal,
  Layers,
  Terminal,
  Wrench,
} from "lucide-react";

type KaiTab = "ecosystem" | "cad" | "timeline";

const KAI_PILLARS = [
  {
    name: "1. Hermes Agent Runtime (WSL2)",
    status: "Active",
    tech: "WSL2 Ubuntu • DeepSeek API • Telegram Gateway • SQLite Kanban",
    desc: "Ejen autonomi teras KAI yang beroperasi 24/7 di WSL2 dengan integrasi Telegram, SOUL.md, kanban.db, dan Obsidian Vault (E:\\KAI AI\\Obsidian Vault).",
    cost: "DeepSeek API Nov: RM 75.08",
  },
  {
    name: "2. kai_orchestration (AER Relay — Phase 3)",
    status: "Active",
    tech: "Python • agy_bridge.py • aer_monitor.py • lifecycle.py",
    desc: "Lapisan orkestrasi antara Hermes (WSL) dan Antigravity (Windows) melalui spool IPC C:\\Users\\user\\kai-bridge, lengkap dengan FSM 6-fasa, approval gate, verifier & driver automasi.",
    cost: "Monorepo: E:\\KhaiSpace\\kai_orchestration",
  },
  {
    name: "3. KAI Token Telemetry & Monitoring",
    status: "Active",
    tech: "Python Collectors • Supabase Edge Function (token-usage) • Hub #tokens",
    desc: "Skrip kai_token_capture / log / sync.py menghantar data penggunaan token AI secara masa nyata ke papan pemuka Tokens di Khai Space Hub.",
    cost: "Baseline terkini: 27 Nov 2026",
  },
  {
    name: "4. KAI CAD Studio (kai_cad — Phase 0–4)",
    status: "Active • New",
    tech: "Python 3.10+ Stdlib • OpenSCAD CLI • Live STDIO MCP Server",
    desc: "Enjin CAD parametrik deterministik (unit mm, sifar pakej luar) yang menjana kod .scad & .stl daripada spesifikasi JSON serta mendedahkan 6 MCP tools terus kepada Hermes.",
    cost: "6 Komponen + 6 MCP Tools",
  },
];

const CAD_COMPONENTS = [
  { key: "custom_adapter", label: "Custom Adapter / Hose Reducer", phase: "Phase 1" },
  { key: "rectangular_block", label: "Rectangular Block (Parametric)", phase: "Phase 4 Batch 1" },
  { key: "mounting_bracket", label: "Mounting Bracket (L-Bracket / Holes)", phase: "Phase 4 Batch 1" },
  { key: "spacer_bushing", label: "Spacer & Bushing (Bore/OD Clearance)", phase: "Phase 4 Batch 1" },
  { key: "enclosure_base", label: "Electronics Enclosure — Base", phase: "Phase 4 Batch 2" },
  { key: "enclosure_lid", label: "Electronics Enclosure — Lid", phase: "Phase 4 Batch 2" },
];

const MCP_TOOLS = [
  "cad_generate_design",
  "cad_validate_design",
  "cad_export_stl",
  "cad_get_design",
  "cad_list_designs",
  "cad_get_design_artifact",
];

const KAI_TIMELINE = [
  {
    date: "27 Nov 2026",
    commit: "sample/",
    phase: "Phase 4 Samples",
    title: "18 Sampel Rujukan CAD & Baseline Token Terkini",
    desc: "18 imej rujukan perkakasan ditambah ke kai_cad/sample/ dan baseline telemetry token dikemas kini.",
  },
  {
    date: "25 Nov 2026",
    commit: "42298c1",
    phase: "CAD Phase 4B",
    title: "Parametric Enclosure Library (Base & Lid)",
    desc: "Menambah penjana enclosure elektronik (enclosure_base & enclosure_lid) dengan clearance bebas per-permukaan.",
  },
  {
    date: "25 Nov 2026",
    commit: "c3c9877",
    phase: "CAD Phase 4A",
    title: "Parametric Component Library Batch 1",
    desc: "Menambah rectangular_block, mounting_bracket & spacer_bushing dengan semakan integriti poligon 2D CCW.",
  },
  {
    date: "25 Nov 2026",
    commit: "5f609e1",
    phase: "CAD Phase 3",
    title: "Hermes MCP Server + WSL2 OpenSCAD Interop",
    desc: "Integrasi terus KAI CAD MCP Server bersama Hermes Agent dan kebolehoperasian OpenSCAD merentas WSL2.",
  },
  {
    date: "25 Nov 2026",
    commit: "5149fe1",
    phase: "CAD Phase 2–2.1",
    title: "Live STDIO MCP Server & Security Hardening",
    desc: "6 MCP tools aktif dengan sekatan ketat OPENSCAD_BIN (additionalProperties: false) & rantaian audit kekal.",
  },
  {
    date: "20–24 Nov 2026",
    commit: "6faec7a",
    phase: "AER & Tokens",
    title: "AER Token Telemetry & Autonomous Drivers",
    desc: "Penjejakan token + tempoh terus daripada AER Relay serta pemacu automasi khai_space_2_0 & october_insight.",
  },
];

export function KaiWorkspace() {
  const [activeTab, setActiveTab] = useState<KaiTab>("ecosystem");

  const jumpHash = (hash: string) => {
    if (typeof window !== "undefined") {
      window.location.hash = hash;
    }
  };

  return (
    <div className="rounded-xl border border-[#DCD7CC] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                Autonomous AI Ecosystem &bull; Active
              </span>
              <span className="text-[10px] font-mono text-[#536B85]">
                Hermes WSL2 &bull; AER Relay &bull; Token Telemetry &bull; KAI CAD Studio
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0C2340] mt-1">
              KAI (AI Assistant &amp; Engineering Automation)
            </h2>
            <p className="text-xs text-[#536B85] mt-0.5 max-w-2xl">
              Ekosistem pembantu AI peribadi Khai — menggabungkan ejen autonomi Hermes (DeepSeek + Telegram + Obsidian), lapisan orkestrasi AER, pemantauan token masa nyata, dan KAI CAD Studio (OpenSCAD + MCP).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => jumpHash("#tokens")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C2340] hover:bg-[#17365D] text-white text-xs font-semibold cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Buka Token Monitor</span>
          </button>
          <button
            type="button"
            onClick={() => jumpHash("#subscriptions")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDF5F2] hover:bg-[#DCF0E6] text-[#347A63] border border-[#A8CFC2] text-xs font-semibold cursor-pointer"
          >
            <span>DeepSeek API (RM 75.08)</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="px-4 bg-white border-b border-[#DCD7CC] flex items-center gap-1 overflow-x-auto">
        {(
          [
            { id: "ecosystem", label: "4 Tonggak Ekosistem KAI", icon: Cpu },
            { id: "cad", label: "KAI CAD Studio (Phase 0–4)", icon: Box },
            { id: "timeline", label: `Log Kemas Kini (${KAI_TIMELINE.length})`, icon: GitCommitHorizontal },
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

      {/* TAB 1: ECOSYSTEM */}
      {activeTab === "ecosystem" && (
        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {KAI_PILLARS.map((p) => (
              <div
                key={p.name}
                className="p-5 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#0C2340]">{p.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2] shrink-0">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#347A63]">{p.tech}</div>
                  <p className="text-xs text-[#536B85] leading-relaxed">{p.desc}</p>
                </div>
                <div className="pt-2.5 border-t border-[#DCD7CC] text-[11px] font-mono text-[#0C2340]">
                  {p.cost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: KAI CAD STUDIO */}
      {activeTab === "cad" && (
        <div className="p-5 sm:p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 6 Parametric Components */}
            <div className="p-5 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 space-y-3">
              <div className="font-bold text-sm text-[#0C2340] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#347A63]" />
                <span>Pustaka Komponen Parametrik (6 Jenis)</span>
              </div>
              <div className="space-y-2">
                {CAD_COMPONENTS.map((c) => (
                  <div
                    key={c.key}
                    className="p-2.5 rounded-lg bg-white border border-[#DCD7CC] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-[#0C2340]">{c.label}</div>
                      <div className="font-mono text-[10px] text-[#536B85]">{c.key}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                      {c.phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6 MCP Tools + Guarantees */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-[#DCD7CC] bg-white space-y-3">
                <div className="font-bold text-sm text-[#0C2340] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#347A63]" />
                  <span>Live STDIO MCP Server (6 Tools)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MCP_TOOLS.map((tool) => (
                    <span
                      key={tool}
                      className="px-2.5 py-1 rounded-md bg-[#FAF8F4] border border-[#DCD7CC] font-mono text-[11px] font-semibold text-[#0C2340]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#536B85] pt-2 border-t border-[#EFECE4]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                    <span>Kitaran Hayat 6-Negeri: <code className="font-mono">Draft → Generated → Validated → Exported → Imported → Completed</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                    <span>Aliran TinkerCAD: <code className="font-mono">.json</code> &amp; <code className="font-mono">.scad</code> kekal sumber asal; <code className="font-mono">.stl</code> untuk import mesh.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0C2340] text-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Arahan Pantas CLI &amp; MCP</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`python -m kai_cad generate --type enclosure_base \\
  --config kai_cad/examples/enclosure_base_electronics.example.json \\
  --output build/enclosure_base.scad

python -m kai_cad.mcp_server --workspace ./kai_cad/.workspace`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="p-5 sm:p-6 space-y-3">
          {KAI_TIMELINE.map((ev, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                    {ev.phase}
                  </span>
                  <span className="text-xs font-bold text-[#0C2340]">{ev.title}</span>
                </div>
                <p className="text-xs text-[#536B85] leading-relaxed">{ev.desc}</p>
              </div>
              <div className="text-right shrink-0 font-mono text-[11px] text-[#536B85]">
                <div className="font-semibold text-[#0C2340]">{ev.commit}</div>
                <div>{ev.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
