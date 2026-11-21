"use client";

import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  MessageCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { EstimatorHandoffPayload } from "@/components/start-project/project-estimator";
import { services } from "@/content/services";
import { cn } from "@/lib/cn";
import { buildBriefInquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

const FEATURE_OPTIONS = [
  "Responsive web dashboard / portal",
  "WhatsApp or email inquiry automation",
  "AI-assisted workflow / document triage",
  "User accounts & role permissions",
  "Searchable catalog or directory",
  "IoT sensor telemetry & hardware integration",
  "Printable reports / CSV import-export",
  "Landing page & SEO setup",
] as const;

const BUDGET_OPTIONS = [
  "Not decided yet",
  "Small starter scope / MVP prototype",
  "Standard custom build",
  "Multi-phase product / ongoing partnership",
] as const;

const TIMELINE_OPTIONS = [
  "Flexible",
  "Within 2–4 weeks",
  "1–2 months",
  "Exploring feasibility first",
] as const;

const STEPS = [
  { id: 1, title: "Category" },
  { id: 2, title: "Idea & Features" },
  { id: 3, title: "Timeline & Scope" },
  { id: 4, title: "Contact & Review" },
] as const;

export function ProjectBriefBuilder({
  initialPreset,
}: {
  initialPreset?: EstimatorHandoffPayload | null;
}) {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");
  const matchedServiceTitle = useMemo(
    () => services.find((item) => item.slug === serviceParam)?.title,
    [serviceParam],
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialPreset ? 2 : 1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialPreset?.serviceTitle ?? null,
  );
  const category = selectedCategory ?? matchedServiceTitle ?? services[1].title;
  const [problemOrIdea, setProblemOrIdea] = useState(
    initialPreset?.summaryNote ?? "",
  );
  const [desiredFeatures, setDesiredFeatures] = useState<string[]>(
    initialPreset ? [...initialPreset.featureLabels] : [],
  );
  const [customFeatures, setCustomFeatures] = useState("");
  const [budgetRange, setBudgetRange] = useState<string>(BUDGET_OPTIONS[0]);
  const [timeline, setTimeline] = useState<string>(TIMELINE_OPTIONS[0]);
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleFeature(feature: string) {
    setDesiredFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((item) => item !== feature)
        : [...prev, feature],
    );
  }

  function validateStep(currentStep: 1 | 2 | 3 | 4): string | null {
    if (currentStep === 1 && !category.trim()) {
      return "Please select a project category to continue.";
    }
    if (currentStep === 2 && problemOrIdea.trim().length < 12) {
      return "Please share at least a short sentence (12+ characters) describing your idea or problem.";
    }
    if (currentStep === 4) {
      if (name.trim().length < 2) {
        return "Please enter your name so we know how to address you.";
      }
      if (contactMethod.trim().length < 3) {
        return "Please enter your preferred contact detail (WhatsApp number or email).";
      }
    }
    return null;
  }

  function handleNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  }

  function handleBack() {
    setError(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  }

  const isReviewReady =
    category.trim().length > 0 &&
    problemOrIdea.trim().length >= 12 &&
    name.trim().length >= 2 &&
    contactMethod.trim().length >= 3;

  const generatedMessage = useMemo(
    () =>
      buildBriefInquiryMessage({
        name: name || "[Your Name]",
        contactMethod: contactMethod || "[Your WhatsApp / Email]",
        category,
        problemOrIdea: problemOrIdea || "[Describe your idea or problem]",
        desiredFeatures,
        customFeatures,
        budgetRange,
        timeline,
      }),
    [
      name,
      contactMethod,
      category,
      problemOrIdea,
      desiredFeatures,
      customFeatures,
      budgetRange,
      timeline,
    ],
  );

  const whatsappHref = useMemo(
    () => buildWhatsAppUrl(generatedMessage),
    [generatedMessage],
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="studio-card overflow-hidden rounded-3xl">
      {/* Progress Header */}
      <div className="border-b border-border bg-surface-muted/60 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-electric">
            Guided Project Brief Builder · Step {step} of {STEPS.length}
          </p>
          <p className="text-xs text-muted">
            Nothing is auto-sent — you review before opening WhatsApp.
          </p>
        </div>

        <ol
          aria-label="Brief builder progress"
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {STEPS.map((item) => {
            const isCurrent = step === item.id;
            const isDone = step > item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.id <= step) {
                      setError(null);
                      setStep(item.id);
                    }
                  }}
                  disabled={item.id > step}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    isCurrent &&
                      "border-electric bg-surface text-electric shadow-xs",
                    isDone &&
                      "border-electric/25 bg-primary-soft text-navy hover:border-electric",
                    !isCurrent &&
                      !isDone &&
                      "cursor-not-allowed border-border bg-background/60 text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                      isCurrent && "bg-electric text-white",
                      isDone && "bg-navy text-white",
                      !isCurrent && !isDone && "bg-border text-muted",
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : item.id}
                  </span>
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step Body */}
      <div className="p-6 sm:p-8">
        {initialPreset && (
          <div className="mb-6 rounded-xl border border-electric/20 bg-primary-soft/60 px-4 py-3 text-xs font-medium text-navy">
            Pre-filled from your Scope Estimator selection (
            <strong>{initialPreset.serviceTitle}</strong>). You can customize
            every field freely below.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        )}

        {/* Step 1: Project Category */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-navy sm:text-2xl">
              What kind of digital solution are you looking to build?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Choose the closest category — we can always refine or combine
              areas when we chat.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const active = category === service.title;
                return (
                  <button
                    key={service.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(service.title);
                      setError(null);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      active
                        ? "border-electric bg-primary-soft/75 ring-2 ring-electric/20"
                        : "border-border bg-background hover:border-electric/50 hover:bg-surface",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading text-sm font-bold text-navy">
                        {service.title}
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          active
                            ? "border-electric bg-electric text-white"
                            : "border-border-strong bg-surface",
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {service.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Problem / Idea & Desired Features */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy sm:text-2xl">
                Tell us about your idea or the problem to solve.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Plain language is perfect — describe who will use it and what
                you want it to make easier.
              </p>
            </div>

            <div>
              <label
                htmlFor="brief-problem"
                className="block text-sm font-semibold text-navy"
              >
                Problem, Idea, or Goal{" "}
                <span className="text-electric">*</span>
              </label>
              <textarea
                id="brief-problem"
                rows={4}
                value={problemOrIdea}
                onChange={(event) => {
                  setProblemOrIdea(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Example: I run a small workshop and need a simple web dashboard to track bookings, send WhatsApp confirmations, and export monthly summaries..."
                className="mt-2 w-full rounded-xl border border-border-strong bg-background p-3.5 text-sm text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-navy">
                Desired Functionality{" "}
                <span className="font-normal text-muted">(optional)</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((feature) => {
                  const selected = desiredFeatures.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        selected
                          ? "border-electric bg-electric text-white"
                          : "border-border bg-background text-navy hover:border-electric",
                      )}
                    >
                      {feature}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="brief-custom-features"
                className="block text-sm font-semibold text-navy"
              >
                Other Specific Requirements{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="brief-custom-features"
                type="text"
                value={customFeatures}
                onChange={(event) => setCustomFeatures(event.target.value)}
                placeholder="e.g. Malay & English UI, mobile-first layout, integration with Google Sheets"
                className="mt-2 h-11 w-full rounded-xl border border-border-strong bg-background px-3.5 text-sm text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Budget & Timeline (Optional) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy sm:text-2xl">
                Indicative scope &amp; target timeline
              </h2>
              <p className="mt-2 text-sm text-muted">
                Both fields are optional. They simply help us suggest realistic
                phasing — never a binding quote.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-navy">
                Preferred Engagement Scale (optional)
              </p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {BUDGET_OPTIONS.map((option) => {
                  const active = budgetRange === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBudgetRange(option)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        active
                          ? "border-electric bg-primary-soft text-navy ring-1 ring-electric"
                          : "border-border bg-background text-muted hover:border-electric hover:text-navy",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-navy">
                Target Timeline (optional)
              </p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {TIMELINE_OPTIONS.map((option) => {
                  const active = timeline === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTimeline(option)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        active
                          ? "border-violet bg-violet-soft text-navy ring-1 ring-violet"
                          : "border-border bg-background text-muted hover:border-violet hover:text-navy",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Contact Details & Review Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy sm:text-2xl">
                Your contact details &amp; brief review
              </h2>
              <p className="mt-2 text-sm text-muted">
                Review or edit any section below. When ready, click{" "}
                <strong className="text-navy">Open Brief in WhatsApp</strong> to
                send your preformatted brief directly to Khai Space.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="brief-name"
                  className="block text-sm font-semibold text-navy"
                >
                  Your Name <span className="text-electric">*</span>
                </label>
                <input
                  id="brief-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Aiman / Sarah"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border-strong bg-background px-3.5 text-sm text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="brief-contact"
                  className="block text-sm font-semibold text-navy"
                >
                  Preferred Contact (WhatsApp / Email){" "}
                  <span className="text-electric">*</span>
                </label>
                <input
                  id="brief-contact"
                  type="text"
                  value={contactMethod}
                  onChange={(event) => {
                    setContactMethod(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. +60 12-xxx xxxx or name@domain.com"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border-strong bg-background px-3.5 text-sm text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
                />
              </div>
            </div>

            {/* Editable Summary */}
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy">
                  Brief Summary
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-electric hover:text-navy"
                  >
                    <Edit3 className="h-3 w-3" aria-hidden />
                    Edit Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-electric hover:text-navy"
                  >
                    <Edit3 className="h-3 w-3" aria-hidden />
                    Edit Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-electric hover:text-navy"
                  >
                    <Edit3 className="h-3 w-3" aria-hidden />
                    Edit Timeline
                  </button>
                </div>
              </div>

              <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-navy sm:text-sm">
                {generatedMessage}
              </pre>
            </div>

            {/* Explicit User Action for WhatsApp Handoff */}
            <div className="flex flex-wrap items-center gap-3">
              {isReviewReady ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#16A34A] bg-[#16A34A] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#15803D] sm:text-base"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  <span>Open Brief in WhatsApp</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const validationError = validateStep(4);
                    setError(
                      validationError ??
                        "Please complete the required fields above first.",
                    );
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-navy bg-navy px-6 text-sm font-semibold text-white transition-colors hover:bg-electric sm:text-base"
                >
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  <span>Validate &amp; Enable WhatsApp Handoff</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-5 text-sm font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#16A34A]" aria-hidden />
                    <span>Copied Brief</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden />
                    <span>Copy Message Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span>Previous</span>
            </button>
          ) : (
            <span className="text-xs text-muted">Step 1 of 4</span>
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-electric px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-electric-dark"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
