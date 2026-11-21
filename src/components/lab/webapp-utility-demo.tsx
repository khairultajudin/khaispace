"use client";

import {
  CheckSquare,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Square,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type UtilityItem = {
  id: string;
  name: string;
  baseQty: number;
  unit: string;
  checked: boolean;
};

const BASE_BATCH_ITEMS: readonly UtilityItem[] = [
  { id: "i1", name: "Core protein / primary base", baseQty: 200, unit: "g", checked: true },
  { id: "i2", name: "Smoked paprika blend", baseQty: 1, unit: "tsp", checked: true },
  { id: "i3", name: "Garlic & onion seasoning", baseQty: 1, unit: "tsp", checked: false },
  { id: "i4", name: "Olive oil coating", baseQty: 1, unit: "tbsp", checked: false },
];

const TIMER_PRESETS = [
  { label: "2m Quick Test", seconds: 120 },
  { label: "8m Flip Check", seconds: 480 },
  { label: "14m Full Cycle", seconds: 840 },
] as const;

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function WebAppUtilityDemo() {
  const [servings, setServings] = useState(2);
  const [items, setItems] = useState<UtilityItem[]>([...BASE_BATCH_ITEMS]);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const completedCount = useMemo(
    () => items.filter((item) => item.checked).length,
    [items],
  );

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  function applyPreset(seconds: number) {
    setRunning(false);
    setSecondsLeft(seconds);
  }

  function resetAll() {
    setServings(2);
    setItems([...BASE_BATCH_ITEMS]);
    setRunning(false);
    setSecondsLeft(120);
  }

  return (
    <article
      id="utility-demo"
      className="studio-card scroll-mt-24 overflow-hidden rounded-3xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface-muted/60 p-6 sm:p-7">
        <div className="flex items-start gap-3.5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-soft text-navy">
            <Sliders className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-navy">
                Demo 04 · Custom Digital Solutions
              </span>
              <span className="rounded-full border border-border-strong bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                Interactive Micro-Utility
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
              Live Batch Scaler &amp; Countdown Timer
            </h2>
            <p className="mt-1 text-sm text-muted">
              Inspired by our Air Fryer Chef utility — scale quantities
              dynamically, check off prep steps, and run a zero-backend timer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-xs font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid gap-6 p-6 sm:p-7 md:grid-cols-2">
        {/* Dynamic Scaler & Checklist */}
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="lab-batch-servings"
              className="text-xs font-bold uppercase tracking-[0.1em] text-navy"
            >
              Batch Multiplier
            </label>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-electric">
              {servings}x ({servings * 200}g total)
            </span>
          </div>

          <input
            id="lab-batch-servings"
            type="range"
            min={1}
            max={6}
            value={servings}
            onChange={(event) => setServings(Number(event.target.value))}
            className="mt-3 w-full accent-electric"
          />

          <ul className="mt-4 space-y-2">
            {items.map((item) => {
              const scaled = Number((item.baseQty * servings).toFixed(1));
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-pressed={item.checked}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors",
                      item.checked
                        ? "border-electric/30 bg-primary-soft/50 text-navy"
                        : "border-border bg-surface text-muted hover:border-electric/50",
                    )}
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      {item.checked ? (
                        <CheckSquare
                          className="h-4 w-4 shrink-0 text-electric"
                          aria-hidden
                        />
                      ) : (
                        <Square
                          className="h-4 w-4 shrink-0 text-muted"
                          aria-hidden
                        />
                      )}
                      <span className={item.checked ? "line-through opacity-75" : ""}>
                        {item.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-navy">
                      {scaled} {item.unit}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs text-muted">
            Prep progress:{" "}
            <strong className="text-navy">
              {completedCount}/{items.length}
            </strong>{" "}
            checked
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-background p-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-navy">
              <Timer className="h-4 w-4 text-electric" aria-hidden />
              Client-Side Process Timer
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.seconds)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-6 rounded-2xl bg-navy px-6 py-7 text-center text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">
              {secondsLeft === 0
                ? "Cycle Complete"
                : running
                  ? "Timer Running"
                  : "Ready"}
            </p>
            <p
              aria-live="off"
              className="mt-2 font-mono text-4xl font-bold tracking-wider sm:text-5xl"
            >
              {formatClock(secondsLeft)}
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (secondsLeft === 0) setSecondsLeft(120);
                setRunning((v) => !v);
              }}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-electric px-4 text-sm font-semibold text-white transition-colors hover:bg-electric-dark"
            >
              {running ? (
                <>
                  <Pause className="h-4 w-4" aria-hidden />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden />
                  <span>{secondsLeft === 0 ? "Restart" : "Start Timer"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => applyPreset(120)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
