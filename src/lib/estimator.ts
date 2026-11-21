import { services, type ServiceSlug } from "@/content/services";

export type ComplexityLevel = "starter" | "standard" | "integrated";

export type ReadinessLevel = "idea-only" | "notes-ready" | "assets-ready";

export type EstimatorFeatureId =
  | "responsive-ui"
  | "auth-roles"
  | "database-search"
  | "ai-workflow"
  | "whatsapp-automation"
  | "iot-telemetry"
  | "reports-csv"
  | "seo-a11y";

export type EstimatorFeature = {
  id: EstimatorFeatureId;
  label: string;
  description: string;
  points: number;
  briefLabel: string;
};

export type EstimatorInput = {
  serviceSlug: ServiceSlug;
  complexity: ComplexityLevel;
  features: readonly EstimatorFeatureId[];
  readiness: ReadinessLevel;
};

export type ScopeTier =
  | "Focused Starter Scope"
  | "Standard Studio Build"
  | "Comprehensive Multi-Phase Scope";

export type EstimatorResult = {
  serviceTitle: string;
  complexityLabel: string;
  readinessLabel: string;
  selectedFeatureLabels: readonly string[];
  score: number;
  maxReferenceScore: number;
  scopeTier: ScopeTier;
  indicativeHorizon: string;
  recommendedApproach: string;
  deliverables: readonly string[];
  breakdown: {
    basePoints: number;
    complexityPoints: number;
    featurePoints: number;
    readinessAdjustment: number;
  };
  disclaimer: string;
};

export const COMPLEXITY_OPTIONS: ReadonlyArray<{
  id: ComplexityLevel;
  label: string;
  description: string;
  points: number;
}> = [
  {
    id: "starter",
    label: "Starter / Proof of Concept",
    description:
      "Validate an idea quickly with a focused core workflow or landing presence.",
    points: 10,
  },
  {
    id: "standard",
    label: "Standard Custom Build",
    description:
      "Production-ready application, multi-page platform, or structured automation.",
    points: 24,
  },
  {
    id: "integrated",
    label: "Multi-Module / Integrated System",
    description:
      "Multiple roles, connected integrations, hardware/IoT pipelines, or phased rollout.",
    points: 40,
  },
];

export const READINESS_OPTIONS: ReadonlyArray<{
  id: ReadinessLevel;
  label: string;
  description: string;
  adjustment: number;
}> = [
  {
    id: "idea-only",
    label: "Early idea (needs discovery)",
    description: "We will help clarify requirements, flows, and architecture first.",
    adjustment: 8,
  },
  {
    id: "notes-ready",
    label: "Rough notes or sketches ready",
    description: "Core problem and desired workflow are already outlined.",
    adjustment: 3,
  },
  {
    id: "assets-ready",
    label: "Clear brief & content ready",
    description: "Requirements, copy, or reference material are ready to build from.",
    adjustment: 0,
  },
];

export const ESTIMATOR_FEATURES: readonly EstimatorFeature[] = [
  {
    id: "responsive-ui",
    label: "Multi-page responsive UI",
    description: "Mobile, tablet, and desktop layouts with clear navigation.",
    points: 6,
    briefLabel: "Responsive web dashboard / portal",
  },
  {
    id: "auth-roles",
    label: "User accounts & role permissions",
    description: "Sign-in flows and separate admin/member access rules.",
    points: 12,
    briefLabel: "User accounts & role permissions",
  },
  {
    id: "database-search",
    label: "Structured database & search/filter",
    description: "Persistent records with instant search and multi-filter views.",
    points: 10,
    briefLabel: "Searchable catalog or directory",
  },
  {
    id: "ai-workflow",
    label: "Structured AI workflow / triage",
    description: "Schema-validated AI classification, extraction, or review pipeline.",
    points: 14,
    briefLabel: "AI-assisted workflow / document triage",
  },
  {
    id: "whatsapp-automation",
    label: "WhatsApp / email inquiry flow",
    description: "Guided handoff, preformatted templates, or notification triggers.",
    points: 6,
    briefLabel: "WhatsApp or email inquiry automation",
  },
  {
    id: "iot-telemetry",
    label: "IoT sensor / hardware integration",
    description: "Microcontroller sensing, telemetry dashboard, or CAD enclosure.",
    points: 16,
    briefLabel: "IoT sensor telemetry & hardware integration",
  },
  {
    id: "reports-csv",
    label: "Printable reports & CSV export",
    description: "Structured A4 summaries or spreadsheet import/export.",
    points: 8,
    briefLabel: "Printable reports / CSV import-export",
  },
  {
    id: "seo-a11y",
    label: "SEO metadata & accessibility polish",
    description: "Structured metadata, sitemap, keyboard nav, and performance checks.",
    points: 5,
    briefLabel: "Landing page & SEO setup",
  },
];

const SERVICE_BASE_POINTS: Record<ServiceSlug, number> = {
  "website-design": 10,
  "technical-consulting": 8,
  "custom-digital-solutions": 16,
  "web-applications": 18,
  "ai-automation": 18,
  "iot-engineering": 20,
};

export const ESTIMATOR_DISCLAIMER =
  "Preliminary indicative scope estimate only — not a binding commercial quote. Exact timelines and commercial pricing are confirmed only after a direct scope discussion.";

/**
 * Pure deterministic scope/complexity estimator.
 * Intentionally avoids fabricating commercial RM rates or unapproved pricing.
 */
export function calculateProjectEstimate(
  input: EstimatorInput,
): EstimatorResult {
  const service =
    services.find((item) => item.slug === input.serviceSlug) ?? services[1];
  const complexity =
    COMPLEXITY_OPTIONS.find((item) => item.id === input.complexity) ??
    COMPLEXITY_OPTIONS[1];
  const readiness =
    READINESS_OPTIONS.find((item) => item.id === input.readiness) ??
    READINESS_OPTIONS[1];

  const uniqueFeatureIds = Array.from(new Set(input.features));
  const selectedFeatures = ESTIMATOR_FEATURES.filter((feature) =>
    uniqueFeatureIds.includes(feature.id),
  );

  const basePoints = SERVICE_BASE_POINTS[service.slug];
  const complexityPoints = complexity.points;
  const featurePoints = selectedFeatures.reduce(
    (sum, item) => sum + item.points,
    0,
  );
  const readinessAdjustment = readiness.adjustment;

  const score =
    basePoints + complexityPoints + featurePoints + readinessAdjustment;
  const maxReferenceScore = 110;

  let scopeTier: ScopeTier;
  let indicativeHorizon: string;
  let recommendedApproach: string;

  if (score <= 42) {
    scopeTier = "Focused Starter Scope";
    indicativeHorizon = "Indicative horizon: ~1–2 weeks (focused sprint)";
    recommendedApproach =
      "Single focused sprint: clarify core workflow, ship a working first version quickly, and verify with real use before adding extras.";
  } else if (score <= 72) {
    scopeTier = "Standard Studio Build";
    indicativeHorizon = "Indicative horizon: ~3–5 weeks (milestone delivery)";
    recommendedApproach =
      "Two-stage delivery: Week 1 architecture & clickable prototype, followed by iterative build milestones, QA checks, and clean deployment handover.";
  } else {
    scopeTier = "Comprehensive Multi-Phase Scope";
    indicativeHorizon =
      "Indicative horizon: ~6–10+ weeks (recommended in 2+ phases)";
    recommendedApproach =
      "Phased rollout: start with a high-value Phase 1 MVP to validate core workflows early, then layer integrations, advanced modules, and automation in Phase 2.";
  }

  const deliverables = [
    ...service.deliverables,
    ...(selectedFeatures.length > 0
      ? [
          `Tailored implementation covering ${selectedFeatures.length} selected module${selectedFeatures.length === 1 ? "" : "s"}`,
        ]
      : []),
  ];

  return {
    serviceTitle: service.title,
    complexityLabel: complexity.label,
    readinessLabel: readiness.label,
    selectedFeatureLabels: selectedFeatures.map((item) => item.label),
    score,
    maxReferenceScore,
    scopeTier,
    indicativeHorizon,
    recommendedApproach,
    deliverables,
    breakdown: {
      basePoints,
      complexityPoints,
      featurePoints,
      readinessAdjustment,
    },
    disclaimer: ESTIMATOR_DISCLAIMER,
  };
}
