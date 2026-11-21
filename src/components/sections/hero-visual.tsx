import Link from "next/link";
import {
  Activity,
  AppWindow,
  ArrowUpRight,
  Bot,
  Cpu,
  FlaskConical,
  Sparkles,
} from "lucide-react";

/**
 * Controlled Bento-style studio visual for the homepage Hero.
 * Communicates Khai Space's cross-disciplinary interactive digital studio identity
 * without heavy client JS or gratuitous animations.
 */
export function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-electric/12 via-violet/10 to-cyan/14 blur-2xl"
      />

      <div className="relative grid grid-cols-2 gap-3.5 sm:gap-4">
        {/* Card 1: Main Interactive Studio Focus */}
        <div className="col-span-2 rounded-2xl border border-navy/15 bg-navy p-5 text-white shadow-lg sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Studio Workbench
            </span>
            <span className="text-xs font-medium text-white/65">
              Concept → Working System
            </span>
          </div>

          <p className="mt-4 font-heading text-lg font-bold leading-snug text-white sm:text-xl">
            From rough idea to responsive software, automation, or prototype.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2.5 text-left">
            <div className="rounded-xl border border-white/10 bg-white/6 p-3">
              <Bot className="h-4 w-4 text-cyan" aria-hidden />
              <p className="mt-2 font-heading text-xs font-semibold text-white">
                AI Workflows
              </p>
              <p className="mt-0.5 text-[11px] text-white/65">
                Structured & safe
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/6 p-3">
              <AppWindow className="h-4 w-4 text-[#93C5FD]" aria-hidden />
              <p className="mt-2 font-heading text-xs font-semibold text-white">
                Web Apps
              </p>
              <p className="mt-0.5 text-[11px] text-white/65">
                Next.js & React
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/6 p-3">
              <Cpu className="h-4 w-4 text-[#C4B5FD]" aria-hidden />
              <p className="mt-2 font-heading text-xs font-semibold text-white">
                IoT & CAD
              </p>
              <p className="mt-0.5 text-[11px] text-white/65">
                Sensors & 3D
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Lab Link Tile */}
        <Link
          href="/lab"
          className="studio-card studio-card-interactive group flex flex-col justify-between rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-soft text-violet">
              <FlaskConical className="h-4 w-4" aria-hidden />
            </span>
            <ArrowUpRight
              className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet"
              aria-hidden
            />
          </div>
          <div className="mt-4">
            <p className="font-heading text-sm font-bold text-navy">
              Interactive Lab
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Try safe synthetic workflow &amp; sensor demos.
            </p>
          </div>
        </Link>

        {/* Card 3: Project Brief Builder Tile */}
        <Link
          href="/start-a-project"
          className="studio-card studio-card-interactive group flex flex-col justify-between rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-soft text-[#0891B2]">
              <Activity className="h-4 w-4" aria-hidden />
            </span>
            <ArrowUpRight
              className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-electric"
              aria-hidden
            />
          </div>
          <div className="mt-4">
            <p className="font-heading text-sm font-bold text-navy">
              Project Brief Builder
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Shape your scope and hand off cleanly to WhatsApp.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
