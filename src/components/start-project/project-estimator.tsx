"use client";

import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  Info,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { services, type ServiceSlug } from "@/content/services";
import { cn } from "@/lib/cn";
import {
  calculateProjectEstimate,
  COMPLEXITY_OPTIONS,
  ESTIMATOR_FEATURES,
  READINESS_OPTIONS,
  type ComplexityLevel,
  type EstimatorFeatureId,
  type ReadinessLevel,
} from "@/lib/estimator";
import { buildEstimatorInquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export type EstimatorHandoffPayload = {
  serviceTitle: string;
  featureLabels: readonly string[];
  summaryNote: string;
};

type ProjectEstimatorProps = {
  onCarryToBrief?: (payload: EstimatorHandoffPayload) => void;
};

export function ProjectEstimator({ onCarryToBrief }: ProjectEstimatorProps) {
  const [serviceSlug, setServiceSlug] =
    useState<ServiceSlug>("web-applications");
  const [complexity, setComplexity] = useState<ComplexityLevel>("standard");
  const [features, setFeatures] = useState<EstimatorFeatureId[]>([
    "responsive-ui",
    "whatsapp-automation",
  ]);
  const [readiness, setReadiness] = useState<ReadinessLevel>("notes-ready");
  const [copied, setCopied] = useState(false);

  const estimate = useMemo(
    () =>
      calculateProjectEstimate({
        serviceSlug,
        complexity,
        features,
        readiness,
      }),
    [serviceSlug, complexity, features, readiness],
  );

  const whatsappMessage = useMemo(
    () => buildEstimatorInquiryMessage(estimate),
    [estimate],
  );

  const whatsappUrl = useMemo(
    () => buildWhatsAppUrl(whatsappMessage),
    [whatsappMessage],
  );

  function toggleFeature(id: EstimatorFeatureId) {
    setFeatures((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function resetEstimator() {
    setServiceSlug("web-applications");
    setComplexity("standard");
    setFeatures(["responsive-ui", "whatsapp-automation"]);
    setReadiness("notes-ready");
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  function handleCarryIntoBrief() {
    if (!onCarryToBrief) return;
    const briefFeatures = ESTIMATOR_FEATURES.filter((item) =>
      features.includes(item.id),
    ).map((item) => item.briefLabel);

    onCarryToBrief({
      serviceTitle: estimate.serviceTitle,
      featureLabels: briefFeatures,
      summaryNote: `Preliminary estimator selection: ${estimate.scopeTier} (${estimate.complexityLabel}, ${estimate.readinessLabel}).`,
    });
  }

  const meterPct = Math.min(
    100,
    Math.round((estimate.score / estimate.maxReferenceScore) * 100),
  );

  return (
    <div className="studio-card overflow-hidden rounded-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/60 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-cyan">
            <Calculator className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-electric">
              Indicative Project Scope Estimator
            </p>
            <p className="text-xs text-muted">
              Transparent complexity &amp; phasing guide — no fabricated prices.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetEstimator}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-xs font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Inputs Column */}
        <div className="space-y-6">
          {/* 1. Project Type */}
          <div>
            <p className="text-sm font-bold text-navy">1. Project Type</p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {services.map((service) => {
                const active = serviceSlug === service.slug;
                return (
                  <button
                    key={service.slug}
                    type="button"
                    onClick={() => setServiceSlug(service.slug)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold transition-colors sm:text-sm",
                      active
                        ? "border-electric bg-primary-soft text-electric ring-1 ring-electric"
                        : "border-border bg-background text-navy hover:border-electric/50",
                    )}
                  >
                    {service.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Complexity */}
          <div>
            <p className="text-sm font-bold text-navy">2. Complexity Tier</p>
            <div className="mt-2.5 grid gap-2.5">
              {COMPLEXITY_OPTIONS.map((option) => {
                const active = complexity === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setComplexity(option.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition-colors",
                      active
                        ? "border-violet bg-violet-soft/75 ring-1 ring-violet"
                        : "border-border bg-background hover:border-violet/45",
                    )}
                  >
                    <p className="text-sm font-bold text-navy">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Required Modules */}
          <div>
            <p className="text-sm font-bold text-navy">
              3. Required Capabilities &amp; Modules
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {ESTIMATOR_FEATURES.map((feature) => {
                const selected = features.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
                      selected
                        ? "border-electric bg-primary-soft/60 text-navy"
                        : "border-border bg-background text-muted hover:border-electric/45",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-electric bg-electric text-white"
                          : "border-border-strong bg-surface",
                      )}
                    >
                      {selected && <Check className="h-3 w-3" aria-hidden />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-navy">
                        {feature.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                        {feature.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Readiness */}
          <div>
            <p className="text-sm font-bold text-navy">
              4. Design &amp; Requirements Readiness
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
              {READINESS_OPTIONS.map((option) => {
                const active = readiness === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setReadiness(option.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-navy bg-navy text-white"
                        : "border-border bg-background text-navy hover:border-navy/40",
                    )}
                  >
                    <span className="block text-xs font-bold">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Scope Summary Output Column */}
        <div className="flex flex-col justify-between rounded-2xl border border-navy/15 bg-navy p-6 text-white">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan">
              Preliminary Scope Summary
            </span>

            <h3 className="mt-4 text-2xl font-bold text-white">
              {estimate.scopeTier}
            </h3>
            <p className="mt-1 text-sm font-medium text-cyan">
              {estimate.indicativeHorizon}
            </p>

            {/* Complexity Meter */}
            <div className="mt-5 rounded-xl bg-white/8 p-4">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Indicative Complexity Index</span>
                <span className="font-mono font-bold text-white">
                  {estimate.score} pts
                </span>
              </div>
              <div
                aria-hidden
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15"
              >
                <div
                  style={{ width: `${meterPct}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan via-electric to-violet transition-all duration-300"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/75">
                <span>Base track: +{estimate.breakdown.basePoints}</span>
                <span>Complexity: +{estimate.breakdown.complexityPoints}</span>
                <span>Modules: +{estimate.breakdown.featurePoints}</span>
                <span>
                  Discovery prep: +{estimate.breakdown.readinessAdjustment}
                </span>
              </div>
            </div>

            {/* Recommended Approach */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">
                Recommended Delivery Approach
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {estimate.recommendedApproach}
              </p>
            </div>

            {/* Deliverables */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">
                Expected Scope Deliverables
              </p>
              <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-white/85">
                {estimate.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preliminary Disclaimer */}
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3.5 text-xs leading-relaxed text-amber-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              <span>{estimate.disclaimer}</span>
            </div>
          </div>

          {/* Explicit Follow-Up Actions */}
          <div className="mt-6 space-y-2.5 border-t border-white/15 pt-5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              <span>Discuss This Scope on WhatsApp</span>
            </a>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {onCarryToBrief && (
                <button
                  type="button"
                  onClick={handleCarryIntoBrief}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-electric px-3.5 text-xs font-semibold text-white transition-colors hover:bg-electric-dark"
                >
                  <span>Carry Into Brief</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20",
                  !onCarryToBrief && "sm:col-span-2",
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-cyan" aria-hidden />
                    <span>Copied Summary</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    <span>Copy Scope Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
