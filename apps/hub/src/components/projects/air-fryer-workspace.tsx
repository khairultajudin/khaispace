"use client";

import React, { useEffect, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  ChefHat,
  Circle,
  Clock,
  Flame,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  ShoppingBasket,
} from "lucide-react";

type AfTab = "menus" | "timer" | "shopping";

interface AirFryerRecipe {
  id: string;
  day: string;
  title: string;
  category: string;
  categoryName: string;
  desc: string;
  temp: string;
  time: string;
  timeMins: number;
  servings: string;
  portion: string;
  powders: string[];
  ingredients: string[];
  steps: string[];
}

const BASE = "/portfolio/air-fryer-dashboard";
const CHECKLIST_KEY = "khai_hub_air_fryer_checklist_v1";

const SHOPPING_ITEMS = [
  { id: "chicken", group: "Protein Mingguan", label: "Dada Ayam Tanpa Tulang (2 kg = 5 x 400g)" },
  { id: "oil", group: "Protein Mingguan", label: "Minyak Zaitun / Cooking Oil Spray" },
  { id: "paprika", group: "6 Rempah Minimalis", label: "Smoked Paprika Powder" },
  { id: "garlic", group: "6 Rempah Minimalis", label: "Garlic Powder (Serbuk Bawang Putih)" },
  { id: "onion", group: "6 Rempah Minimalis", label: "Onion Powder (Serbuk Bawang Besar)" },
  { id: "oregano", group: "6 Rempah Minimalis", label: "Dried Oregano / Mixed Herbs" },
  { id: "pepper", group: "6 Rempah Minimalis", label: "Black Pepper (Lada Hitam Kasar)" },
  { id: "seasoning", group: "6 Rempah Minimalis", label: "Chicken Seasoning / Garam Halus" },
];

export function AirFryerWorkspace() {
  const [activeTab, setActiveTab] = useState<AfTab>("menus");
  const [recipes, setRecipes] = useState<AirFryerRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  // Countdown Timer state
  const [timerLabel, setTimerLabel] = useState("Dada Ayam 180°C (12 Min)");
  const [secondsLeft, setSecondsLeft] = useState(12 * 60);
  const [initialSeconds, setInitialSeconds] = useState(12 * 60);
  const [running, setRunning] = useState(false);

  // Oven -> Air Fryer Converter
  const [ovenTemp, setOvenTemp] = useState("200");
  const [ovenMins, setOvenMins] = useState("20");

  // Shopping checklist
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/hub-data.json`)
      .then((r) => r.json())
      .then((json: { recipes: AirFryerRecipe[] }) => {
        if (!cancelled && Array.isArray(json.recipes)) {
          setRecipes(json.recipes);
          if (json.recipes[0]) setSelectedId(json.recipes[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const startRecipeTimer = (r: AirFryerRecipe) => {
    const secs = Math.max(60, (r.timeMins || 12) * 60);
    setTimerLabel(`${r.day}: ${r.title} (${r.temp})`);
    setInitialSeconds(secs);
    setSecondsLeft(secs);
    setRunning(true);
    setActiveTab("timer");
  };

  const setPreset = (label: string, mins: number) => {
    setRunning(false);
    setTimerLabel(label);
    setInitialSeconds(mins * 60);
    setSecondsLeft(mins * 60);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const afTemp = Math.max(120, (parseFloat(ovenTemp) || 200) - 20);
  const afMins = Math.max(1, Math.round((parseFloat(ovenMins) || 20) * 0.8));

  const activeRecipe = recipes.find((r) => r.id === selectedId) || recipes[0] || null;

  if (loading) {
    return (
      <div className="p-10 rounded-xl border border-[#DCD7CC] bg-white flex items-center justify-center gap-2 text-xs text-[#536B85]">
        <Loader2 className="w-4 h-4 animate-spin text-[#347A63]" />
        <span>Memuatkan Air Fryer Dada Ayam Chef...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#DCD7CC] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-[#FAF8F4] border-b border-[#DCD7CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                400g / 2 Pax &bull; 6 Rempah Minimalis
              </span>
              <span className="text-[10px] font-mono text-[#536B85]">
                Isnin – Jumaat &bull; Dry Rub Air Fryer
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0C2340] mt-1">
              Air Fryer Dada Ayam Chef
            </h2>
            <p className="text-xs text-[#536B85] mt-0.5">
              5 menu dada ayam seminggu tanpa sos berat — lengkap dengan pemasa masak langsung, kalkulator oven→air fryer, dan senarai beli Lotus&apos;s.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="px-4 bg-white border-b border-[#DCD7CC] flex items-center gap-1 overflow-x-auto">
        {(
          [
            { id: "menus", label: `5 Menu Seminggu (${recipes.length})`, icon: Flame },
            { id: "timer", label: "Pemasa Masak & Kalkulator Oven", icon: Clock },
            { id: "shopping", label: "Senarai Beli Lotus's & Stok", icon: ShoppingBasket },
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

      {/* TAB 1: 5 MENUS */}
      {activeTab === "menus" && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Day selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {recipes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeRecipe?.id === r.id
                    ? "bg-[#0C2340] text-white shadow-xs"
                    : "bg-[#FAF8F4] text-[#0C2340] border border-[#DCD7CC] hover:bg-[#EDF5F2]"
                }`}
              >
                {r.day} — {r.title}
              </button>
            ))}
          </div>

          {activeRecipe && (
            <div className="rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/50 p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#DCD7CC]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF5F2] text-[#347A63] border border-[#A8CFC2]">
                    {activeRecipe.day} &bull; {activeRecipe.categoryName}
                  </span>
                  <h3 className="text-xl font-bold text-[#0C2340] mt-2">{activeRecipe.title}</h3>
                  <p className="text-xs text-[#536B85] mt-1 max-w-2xl">{activeRecipe.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startRecipeTimer(activeRecipe)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#347A63] hover:bg-[#28614E] text-white text-xs font-semibold cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Mula Pemasa ({activeRecipe.time})</span>
                </button>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white border border-[#DCD7CC]">
                  <div className="text-[10px] text-[#536B85] uppercase">Suhu</div>
                  <div className="font-bold font-mono text-[#0C2340] mt-0.5">{activeRecipe.temp}</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#DCD7CC]">
                  <div className="text-[10px] text-[#536B85] uppercase">Masa</div>
                  <div className="font-bold font-mono text-[#0C2340] mt-0.5">{activeRecipe.time}</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#DCD7CC]">
                  <div className="text-[10px] text-[#536B85] uppercase">Hidangan</div>
                  <div className="font-bold text-[#0C2340] mt-0.5">{activeRecipe.servings}</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#DCD7CC]">
                  <div className="text-[10px] text-[#536B85] uppercase">Saiz Ayam</div>
                  <div className="font-bold text-[#0C2340] mt-0.5">{activeRecipe.portion}</div>
                </div>
              </div>

              {/* Spice Tags */}
              <div className="flex flex-wrap gap-1.5">
                {activeRecipe.powders.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-[#DCD7CC] text-[#0C2340]"
                  >
                    {p}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-4 rounded-lg bg-white border border-[#DCD7CC] space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#347A63]">
                    Bahan-Bahan
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#0C2340]">
                    {activeRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-white border border-[#DCD7CC] space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0C2340]">
                    Langkah Memasak
                  </div>
                  <ol className="space-y-2 text-xs text-[#536B85] list-decimal list-inside">
                    {activeRecipe.steps.map((st, i) => (
                      <li key={i} className="leading-relaxed text-[#0C2340]">{st}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIMER & OVEN CONVERTER */}
      {activeTab === "timer" && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer */}
          <div className="p-6 rounded-xl border border-[#DCD7CC] bg-[#FAF8F4]/70 space-y-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-[#347A63]">
              Pemasa Masak Dada Ayam
            </div>
            <div className="text-xs text-[#536B85]">{timerLabel}</div>
            <div className="text-5xl font-black font-mono text-[#0C2340] tracking-tight py-2">
              {mm}:{ss}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0C2340] text-white text-xs font-semibold cursor-pointer"
              >
                {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{running ? "Jeda" : "Mula"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(initialSeconds);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DCD7CC] bg-white text-[#0C2340] text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
            <div className="pt-3 border-t border-[#DCD7CC] flex flex-wrap justify-center gap-1.5">
              <button type="button" onClick={() => setPreset("Dada Ayam 180°C (12 Min)", 12)} className="px-2.5 py-1 rounded bg-white border border-[#DCD7CC] text-[11px] font-medium cursor-pointer">180°C · 12m</button>
              <button type="button" onClick={() => setPreset("Kepingan Nipis 190°C (10 Min)", 10)} className="px-2.5 py-1 rounded bg-white border border-[#DCD7CC] text-[11px] font-medium cursor-pointer">190°C · 10m</button>
              <button type="button" onClick={() => setPreset("Peringatan Balikkan (6 Min)", 6)} className="px-2.5 py-1 rounded bg-white border border-[#DCD7CC] text-[11px] font-medium cursor-pointer">Flip · 6m</button>
              <button type="button" onClick={() => setPreset("Rehatkan Ayam (5 Min)", 5)} className="px-2.5 py-1 rounded bg-white border border-[#DCD7CC] text-[11px] font-medium cursor-pointer">Rehat · 5m</button>
            </div>
          </div>

          {/* Oven Converter */}
          <div className="p-6 rounded-xl border border-[#DCD7CC] bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#347A63]" />
              <h3 className="text-sm font-bold text-[#0C2340]">
                Kalkulator Tukar Oven → Air Fryer
              </h3>
            </div>
            <p className="text-xs text-[#536B85]">
              Formula standard: kurangkan suhu oven sebanyak <strong>20°C</strong> dan kurangkan masa sebanyak <strong>20%</strong>.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Suhu Oven (°C)</label>
                <input
                  type="number"
                  value={ovenTemp}
                  onChange={(e) => setOvenTemp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0C2340] mb-1">Masa Oven (Minit)</label>
                <input
                  type="number"
                  value={ovenMins}
                  onChange={(e) => setOvenMins(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] font-mono"
                />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#EDF5F2] border border-[#A8CFC2] grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#347A63]">Suhu Air Fryer</div>
                <div className="text-2xl font-black font-mono text-[#0C2340] mt-1">{afTemp}°C</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-[#347A63]">Masa Air Fryer</div>
                <div className="text-2xl font-black font-mono text-[#0C2340] mt-1">{afMins} min</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHOPPING LIST */}
      {activeTab === "shopping" && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-xs text-[#536B85]">
            Tandakan bahan yang sudah dibeli / ada di rumah (disimpan automatik dalam pelayar):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SHOPPING_ITEMS.map((item) => {
              const isDone = Boolean(checked[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3.5 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    isDone
                      ? "bg-[#EDF5F2]/60 border-[#A8CFC2]"
                      : "bg-[#FAF8F4]/60 border-[#DCD7CC] hover:bg-white"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#347A63] shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#A9B5C4] shrink-0" />
                  )}
                  <div>
                    <div className={`text-xs font-semibold ${isDone ? "line-through text-[#536B85]" : "text-[#0C2340]"}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-[#536B85]">{item.group}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

