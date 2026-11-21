"use client";

import {
  Activity,
  Droplets,
  Flame,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Thermometer,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type SensorReading = {
  tick: number;
  tempC: number;
  humidityPct: number;
  waterPct: number;
  ecMs: number;
};

const INITIAL_HISTORY: readonly SensorReading[] = [
  { tick: 1, tempC: 27.4, humidityPct: 65, waterPct: 84, ecMs: 1.4 },
  { tick: 2, tempC: 27.8, humidityPct: 64, waterPct: 83, ecMs: 1.4 },
  { tick: 3, tempC: 28.1, humidityPct: 63, waterPct: 82, ecMs: 1.5 },
  { tick: 4, tempC: 28.5, humidityPct: 62, waterPct: 81, ecMs: 1.5 },
  { tick: 5, tempC: 28.2, humidityPct: 64, waterPct: 80, ecMs: 1.4 },
  { tick: 6, tempC: 28.6, humidityPct: 63, waterPct: 79, ecMs: 1.5 },
];

function nextSimulatedReading(prev: SensorReading): SensorReading {
  const nextTick = prev.tick + 1;
  const wave = Math.sin(nextTick * 0.9);
  const tempC = Number(
    Math.min(38, Math.max(22, prev.tempC + wave * 0.65)).toFixed(1),
  );
  const humidityPct = Math.round(
    Math.min(88, Math.max(40, prev.humidityPct - wave * 2)),
  );
  const waterPct = Math.max(15, prev.waterPct - (nextTick % 2 === 0 ? 1 : 0));
  const ecMs = Number(
    Math.min(2.4, Math.max(1.0, prev.ecMs + wave * 0.05)).toFixed(2),
  );

  return { tick: nextTick, tempC, humidityPct, waterPct, ecMs };
}

export function IotTelemetryDemo() {
  const [history, setHistory] = useState<SensorReading[]>([...INITIAL_HISTORY]);
  const [streaming, setStreaming] = useState(false);
  const [maxTempThreshold, setMaxTempThreshold] = useState(31);
  const [minWaterThreshold, setMinWaterThreshold] = useState(40);

  useEffect(() => {
    if (!streaming) return;
    const timer = window.setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const next = nextSimulatedReading(last);
        return [...prev.slice(-11), next];
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [streaming]);

  const latest = history[history.length - 1];
  const tempAlert = latest.tempC >= maxTempThreshold;
  const waterAlert = latest.waterPct <= minWaterThreshold;
  const hasAlert = tempAlert || waterAlert;

  function stepOnce() {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      return [...prev.slice(-11), nextSimulatedReading(last)];
    });
  }

  function injectHeatSpike() {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev.slice(-11),
        {
          ...last,
          tick: last.tick + 1,
          tempC: Number((maxTempThreshold + 2.4).toFixed(1)),
          humidityPct: 48,
        },
      ];
    });
  }

  function injectLowWater() {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev.slice(-11),
        {
          ...last,
          tick: last.tick + 1,
          waterPct: Math.max(12, minWaterThreshold - 14),
        },
      ];
    });
  }

  function resetSimulation() {
    setStreaming(false);
    setMaxTempThreshold(31);
    setMinWaterThreshold(40);
    setHistory([...INITIAL_HISTORY]);
  }

  // Build responsive SVG polyline points for temperature history (20°C..40°C)
  const svgPoints = history
    .map((reading, index) => {
      const x =
        history.length > 1 ? (index / (history.length - 1)) * 300 : 150;
      const clamped = Math.min(40, Math.max(20, reading.tempC));
      const y = 90 - ((clamped - 20) / 20) * 76;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const thresholdY = 90 - ((maxTempThreshold - 20) / 20) * 76;

  return (
    <article
      id="iot-demo"
      className="studio-card scroll-mt-24 overflow-hidden rounded-3xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-navy p-6 text-white sm:p-7">
        <div className="flex items-start gap-3.5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/20 text-cyan">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-cyan">
                Demo 03 · IoT &amp; Engineering
              </span>
              <span className="rounded-full border border-cyan/35 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Simulated Sensor Stream
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              Connected Environment Telemetry Monitor
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Adjust alert thresholds, inject anomalies, or step/stream
              synthetic hydroponic sensor readings.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStreaming((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-cyan px-3.5 text-xs font-bold text-navy transition-colors hover:bg-white"
          >
            {streaming ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden />
                <span>Start Simulated Tick</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={stepOnce}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <StepForward className="h-3.5 w-3.5" aria-hidden />
            <span>Step</span>
          </button>
          <button
            type="button"
            onClick={resetSimulation}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        {/* Alert Banner */}
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold sm:text-sm",
            hasAlert
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          <span className="inline-flex items-center gap-2">
            {hasAlert ? (
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Activity className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {hasAlert
              ? `Threshold Alert Triggered: ${[
                  tempAlert
                    ? `Temperature (${latest.tempC}°C ≥ ${maxTempThreshold}°C)`
                    : null,
                  waterAlert
                    ? `Reservoir Level (${latest.waterPct}% ≤ ${minWaterThreshold}%)`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}`
              : "All simulated telemetry channels are within configured thresholds."}
          </span>
          <span className="font-mono text-[11px] opacity-80">
            Tick #{latest.tick}
          </span>
        </div>

        {/* Live Telemetry Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            className={cn(
              "rounded-2xl border p-4",
              tempAlert
                ? "border-red-300 bg-red-50/70"
                : "border-border bg-background",
            )}
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <Thermometer className="h-3.5 w-3.5 text-electric" aria-hidden />
              Air Temp
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-navy">
              {latest.tempC}°C
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <Droplets className="h-3.5 w-3.5 text-[#0891B2]" aria-hidden />
              Humidity
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-navy">
              {latest.humidityPct}%
            </p>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-4",
              waterAlert
                ? "border-red-300 bg-red-50/70"
                : "border-border bg-background",
            )}
          >
            <p className="text-xs font-medium text-muted">Reservoir Level</p>
            <p className="mt-1 font-heading text-2xl font-bold text-navy">
              {latest.waterPct}%
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted">Nutrient EC</p>
            <p className="mt-1 font-heading text-2xl font-bold text-navy">
              {latest.ecMs} mS
            </p>
          </div>
        </div>

        {/* Chart + Interactive Controls */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold text-navy">
                Simulated Temperature Trend (°C)
              </span>
              <span>Alert line: {maxTempThreshold}°C</span>
            </div>

            <svg
              viewBox="0 0 300 100"
              role="img"
              aria-label={`Simulated temperature chart with latest reading ${latest.tempC} degrees Celsius`}
              className="mt-3 h-32 w-full overflow-visible"
            >
              {/* Threshold dashed line */}
              <line
                x1="0"
                x2="300"
                y1={thresholdY}
                y2={thresholdY}
                stroke="#dc2626"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
              {/* Trend polyline */}
              <polyline
                fill="none"
                stroke="var(--electric)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgPoints}
              />
              {history.map((reading, index) => {
                const x =
                  history.length > 1
                    ? (index / (history.length - 1)) * 300
                    : 150;
                const clamped = Math.min(40, Math.max(20, reading.tempC));
                const y = 90 - ((clamped - 20) / 20) * 76;
                const isOver = reading.tempC >= maxTempThreshold;
                return (
                  <circle
                    key={reading.tick}
                    cx={x}
                    cy={y}
                    r="3.2"
                    fill={isOver ? "#dc2626" : "var(--cyan)"}
                    stroke="var(--navy)"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-navy">
                <label htmlFor="lab-max-temp">Max Temp Alert Threshold</label>
                <span>{maxTempThreshold}°C</span>
              </div>
              <input
                id="lab-max-temp"
                type="range"
                min={26}
                max={36}
                value={maxTempThreshold}
                onChange={(event) =>
                  setMaxTempThreshold(Number(event.target.value))
                }
                className="mt-2 w-full accent-electric"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-navy">
                <label htmlFor="lab-min-water">Min Reservoir Water Alert</label>
                <span>{minWaterThreshold}%</span>
              </div>
              <input
                id="lab-min-water"
                type="range"
                min={20}
                max={75}
                value={minWaterThreshold}
                onChange={(event) =>
                  setMinWaterThreshold(Number(event.target.value))
                }
                className="mt-2 w-full accent-electric"
              />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={injectHeatSpike}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100"
              >
                <Flame className="h-3.5 w-3.5" aria-hidden />
                <span>Simulate Heat Spike</span>
              </button>
              <button
                type="button"
                onClick={injectLowWater}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <Droplets className="h-3.5 w-3.5" aria-hidden />
                <span>Simulate Low Water</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
