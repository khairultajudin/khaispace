"use client";

import {
  Bot,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type PipelineResult = {
  detectedCategory: string;
  priority: "Standard" | "High Focus";
  extractedSignals: readonly string[];
  schemaChecks: ReadonlyArray<{ field: string; passed: boolean }>;
  draftReply: string;
};

const SAMPLE_INQUIRIES = [
  {
    id: "fee-system",
    label: "Academy Operations & Fee Portal",
    text: "We manage 90 students across 6 classes in spreadsheets and want a web dashboard with overdue fee tracking and printable monthly summaries.",
  },
  {
    id: "sensor-alert",
    label: "Smart Greenhouse Sensor Monitor",
    text: "Need an ESP32 temperature and water-level monitor for our hydroponic trays that shows live status on mobile with low-water warnings.",
  },
  {
    id: "website-redesign",
    label: "Studio Website & WhatsApp Lead Flow",
    text: "Looking to redesign our outdated business website so visitors understand our services clearly and can send structured inquiries to WhatsApp.",
  },
] as const;

function runDeterministicTriage(input: string): PipelineResult {
  const lower = input.toLowerCase();

  let detectedCategory = "Custom Digital Solutions";
  const signals: string[] = [];

  if (
    lower.includes("esp32") ||
    lower.includes("sensor") ||
    lower.includes("hydropon") ||
    lower.includes("water") ||
    lower.includes("iot")
  ) {
    detectedCategory = "IoT & Engineering";
    signals.push("Hardware / Sensor Telemetry", "Threshold Alerting");
  } else if (
    lower.includes("dashboard") ||
    lower.includes("fee") ||
    lower.includes("student") ||
    lower.includes("spreadsheet") ||
    lower.includes("portal")
  ) {
    detectedCategory = "Web Applications";
    signals.push("Operational Ledger", "Structured Reporting");
  } else if (
    lower.includes("website") ||
    lower.includes("redesign") ||
    lower.includes("landing") ||
    lower.includes("seo")
  ) {
    detectedCategory = "Website Design";
    signals.push("Brand Hierarchy", "WhatsApp Lead Capture");
  } else if (
    lower.includes("ai") ||
    lower.includes("automat") ||
    lower.includes("workflow")
  ) {
    detectedCategory = "AI & Automation";
    signals.push("Structured Pipeline", "Human Review Gate");
  } else {
    signals.push("Custom Discovery Needed");
  }

  if (lower.includes("whatsapp")) signals.push("WhatsApp Integration");
  if (lower.includes("mobile")) signals.push("Mobile-First UX");
  if (lower.includes("print") || lower.includes("summary")) {
    signals.push("Exportable Summaries");
  }

  const hasEnoughDetail = input.trim().length >= 30;
  const priority: PipelineResult["priority"] =
    signals.length >= 2 ? "High Focus" : "Standard";

  const schemaChecks = [
    { field: "intent_text_present", passed: input.trim().length >= 10 },
    { field: "category_classified", passed: true },
    { field: "scope_context_sufficient", passed: hasEnoughDetail },
    { field: "human_approval_required", passed: true },
  ];

  const draftReply = `Thanks for reaching out to Khai Space! This looks like a strong fit for our ${detectedCategory} track (${signals.join(", ")}). Next step: confirm key users, must-have milestones, and preferred timeline before we propose a focused Phase 1 scope.`;

  return {
    detectedCategory,
    priority,
    extractedSignals: signals,
    schemaChecks,
    draftReply,
  };
}

export function WorkflowAutomationDemo() {
  const [inputText, setInputText] = useState<string>(SAMPLE_INQUIRIES[0].text);
  const [result, setResult] = useState<PipelineResult | null>(() =>
    runDeterministicTriage(SAMPLE_INQUIRIES[0].text),
  );
  const [approved, setApproved] = useState(false);

  function handleRun(textToProcess: string = inputText) {
    setApproved(false);
    setResult(runDeterministicTriage(textToProcess));
  }

  function handlePreset(text: string) {
    setInputText(text);
    setApproved(false);
    setResult(runDeterministicTriage(text));
  }

  function handleReset() {
    setInputText(SAMPLE_INQUIRIES[0].text);
    setApproved(false);
    setResult(runDeterministicTriage(SAMPLE_INQUIRIES[0].text));
  }

  return (
    <article
      id="workflow-demo"
      className="studio-card scroll-mt-24 overflow-hidden rounded-3xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface-muted/60 p-6 sm:p-7">
        <div className="flex items-start gap-3.5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
            <Bot className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-violet">
                Demo 02 · AI &amp; Automation
              </span>
              <span className="rounded-full border border-violet/25 bg-violet-soft px-2.5 py-0.5 text-[11px] font-semibold text-violet">
                Simulated Local Pipeline
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
              Structured Intake &amp; Triage Workflow
            </h2>
            <p className="mt-1 text-sm text-muted">
              Test how incoming requests pass through intake parsing, schema
              validation, routing, and a mandatory human approval gate.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-xs font-semibold text-navy transition-colors hover:border-violet hover:text-violet"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left: Input + Presets */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
              1. Pick a Sample Inquiry or Type Your Own
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SAMPLE_INQUIRIES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset.text)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    inputText === preset.text
                      ? "border-violet bg-violet text-white"
                      : "border-border bg-background text-navy hover:border-violet",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="lab-workflow-input"
              className="block text-xs font-semibold text-navy"
            >
              Simulated Incoming Request Payload
            </label>
            <textarea
              id="lab-workflow-input"
              rows={4}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-strong bg-background p-3.5 text-sm text-navy focus:border-violet focus:bg-surface focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => handleRun()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-navy"
          >
            <Play className="h-4 w-4" aria-hidden />
            <span>Run Simulated Pipeline</span>
          </button>
        </div>

        {/* Right: 4 Pipeline Stages */}
        {result && (
          <div className="space-y-3 rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-navy">
                <Sparkles className="h-3.5 w-3.5 text-violet" aria-hidden />
                2. Deterministic Pipeline Output
              </p>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-electric">
                {result.priority}
              </span>
            </div>

            {/* Stage 1 & 2 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Stage 1 · Classification
                </p>
                <p className="mt-1 font-heading text-sm font-bold text-navy">
                  {result.detectedCategory}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.extractedSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-md bg-violet-soft px-2 py-0.5 text-[11px] font-medium text-violet"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Stage 2 · Schema Checks
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  {result.schemaChecks.map((check) => (
                    <li
                      key={check.field}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-mono text-[11px] text-muted">
                        {check.field}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          check.passed ? "text-emerald-700" : "text-amber-700",
                        )}
                      >
                        {check.passed ? "PASS" : "REVIEW"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stage 3 & 4: Human Approval Gate */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-navy">
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-electric"
                    aria-hidden
                  />
                  Stage 3 &amp; 4 · Draft Response &amp; Human Gate
                </p>
                {approved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    Approved Locally
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {result.draftReply}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setApproved(true)}
                  disabled={approved}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                    approved
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-navy text-white hover:bg-electric",
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  <span>
                    {approved ? "Approved (Simulated)" : "Approve Draft Output"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
