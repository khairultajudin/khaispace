import Image from "next/image";
import {
  Activity,
  Bot,
  Box,
  CheckCircle2,
  Flame,
  LayoutGrid,
  Sparkles,
  Timer,
} from "lucide-react";
import type { ProjectItem } from "@/content/projects";
import { cn } from "@/lib/cn";

type ProjectVisualProps = {
  project: ProjectItem;
  priority?: boolean;
  className?: string;
};

export function ProjectVisual({
  project,
  priority = false,
  className,
}: ProjectVisualProps) {
  if (project.visualPreset === "image" && project.coverImage) {
    return (
      <div
        className={cn(
          "relative aspect-[16/10] w-full overflow-hidden bg-surface-muted",
          className,
        )}
      >
        <Image
          src={project.coverImage}
          alt={project.coverAlt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-navy/25 to-transparent"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={project.coverAlt}
      className={cn(
        "relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden p-5",
        project.visualPreset === "culinary-utility" &&
          "bg-gradient-to-br from-[#FFF7ED] via-surface to-primary-soft",
        project.visualPreset === "studio-platform" &&
          "bg-gradient-to-br from-navy via-[#102E54] to-[#1D4ED8]",
        project.visualPreset === "cad-prototype" &&
          "bg-gradient-to-br from-surface-muted via-surface to-cyan-soft",
        project.visualPreset === "ai-workflow" &&
          "bg-gradient-to-br from-violet-soft via-surface to-primary-soft",
        project.visualPreset === "iot-telemetry" &&
          "bg-gradient-to-br from-navy via-[#0F2C4D] to-[#0E7490]",
        className,
      )}
    >
      <div aria-hidden className="studio-grid absolute inset-0 opacity-60" />

      {project.visualPreset === "culinary-utility" && (
        <div className="relative w-full max-w-[300px] rounded-xl border border-border bg-surface p-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy">
              <Flame className="h-3.5 w-3.5 text-amber-600" />
              5-Day Air Fryer Planner
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              190°C · 14m
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {["Smoked Paprika", "Garlic Herb", "Black Pepper"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border bg-background px-1.5 py-2 text-[10px] font-medium text-navy"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-primary-soft px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-electric">
              <Timer className="h-3.5 w-3.5" />
              Countdown Utility
            </span>
            <span className="font-heading font-bold text-navy">400g / 2 pax</span>
          </div>
        </div>
      )}

      {project.visualPreset === "studio-platform" && (
        <div className="relative w-full max-w-[310px] rounded-xl border border-white/15 bg-white/10 p-4 text-white shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <LayoutGrid className="h-3.5 w-3.5 text-cyan" />
              Khai Space 2.0
            </span>
            <span className="rounded-full bg-cyan/20 px-2 py-0.5 text-[10px] font-semibold text-cyan">
              Bento UI
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="col-span-2 rounded-lg bg-white/15 p-2.5">
              <div className="h-2 w-16 rounded bg-cyan/80" />
              <div className="mt-2 h-2 w-24 rounded bg-white/60" />
              <div className="mt-1.5 h-2 w-20 rounded bg-white/35" />
            </div>
            <div className="rounded-lg bg-electric/60 p-2.5">
              <Sparkles className="h-4 w-4 text-white" />
              <div className="mt-2 h-2 w-8 rounded bg-white/70" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/75">
            <span>Next.js 16 · Tailwind 4</span>
            <span>Static Export</span>
          </div>
        </div>
      )}

      {project.visualPreset === "cad-prototype" && (
        <div className="relative flex w-full max-w-[300px] items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-md">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-cyan/30 bg-cyan-soft text-[#0891B2]">
            <Box className="h-10 w-10 stroke-[1.5]" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <span className="inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
              CAD · FDM Iteration
            </span>
            <p className="font-heading text-sm font-bold text-navy">
              Parametric Enclosures
            </p>
            <div className="flex gap-1.5 text-[10px] text-muted">
              <span className="rounded bg-background px-1.5 py-0.5">0.2mm</span>
              <span className="rounded bg-background px-1.5 py-0.5">Fit Test</span>
              <span className="rounded bg-background px-1.5 py-0.5">STL/STEP</span>
            </div>
          </div>
        </div>
      )}

      {project.visualPreset === "ai-workflow" && (
        <div className="relative w-full max-w-[310px] rounded-xl border border-violet/20 bg-surface p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet">
              <Bot className="h-4 w-4" />
              Structured Triage Pipeline
            </span>
            <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-semibold text-violet">
              Concept
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { step: "1. Intake", state: "Parsed" },
              { step: "2. Schema Validation", state: "Verified" },
              { step: "3. Human Review", state: "Ready" },
            ].map((row) => (
              <div
                key={row.step}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-navy">{row.step}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-electric">
                  <CheckCircle2 className="h-3 w-3" />
                  {row.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.visualPreset === "iot-telemetry" && (
        <div className="relative w-full max-w-[310px] rounded-xl border border-cyan/25 bg-navy/85 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan">
              <Activity className="h-4 w-4" />
              Sensor Telemetry Concept
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
              Simulated
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/8 p-2">
              <span className="block text-[10px] text-white/65">Temp</span>
              <span className="font-heading text-sm font-bold text-white">
                28.4°C
              </span>
            </div>
            <div className="rounded-lg bg-white/8 p-2">
              <span className="block text-[10px] text-white/65">Humidity</span>
              <span className="font-heading text-sm font-bold text-cyan">
                66%
              </span>
            </div>
            <div className="rounded-lg bg-white/8 p-2">
              <span className="block text-[10px] text-white/65">Level</span>
              <span className="font-heading text-sm font-bold text-emerald-300">
                Normal
              </span>
            </div>
          </div>
          <div className="mt-3 flex h-7 items-end gap-1">
            {[42, 55, 48, 64, 72, 60, 76, 68, 82, 74, 69, 78].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-t bg-gradient-to-t from-electric to-cyan opacity-85"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
