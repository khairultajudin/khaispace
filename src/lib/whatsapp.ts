import type { EstimatorResult } from "@/lib/estimator";
import { siteConfig } from "@/lib/site";

export type ProjectBriefDraft = {
  name: string;
  contactMethod: string;
  category: string;
  problemOrIdea: string;
  desiredFeatures: readonly string[];
  customFeatures?: string;
  budgetRange?: string;
  timeline?: string;
};

/**
 * Builds a verified WhatsApp link using ONLY the verified public Khai Space number.
 * - Without a preformatted message: uses the verified business short link.
 * - With a preformatted message: uses wa.me/<verified-e164>?text=<encoded>
 *   for reliable mobile and desktop WhatsApp compatibility.
 */
export function buildWhatsAppUrl(message?: string): string {
  const trimmed = message?.trim();
  if (!trimmed) {
    return siteConfig.whatsappUrl;
  }
  return `https://wa.me/${siteConfig.whatsappE164}?text=${encodeURIComponent(trimmed)}`;
}

export function buildServiceInquiryMessage(serviceTitle: string): string {
  return [
    "Hi Khai Space,",
    `I'm interested in discussing a project under *${serviceTitle}*.`,
    "Here is a quick overview of what I have in mind:",
    "- Goal / problem:",
    "- Target timeline (optional):",
  ].join("\n");
}

export function buildProjectInquiryMessage(projectTitle: string): string {
  return [
    "Hi Khai Space,",
    `I saw *${projectTitle}* on khaispace.com and would like to discuss a similar digital solution.`,
    "Here is a quick note about my idea:",
  ].join("\n");
}

export function buildBriefInquiryMessage(draft: ProjectBriefDraft): string {
  const featuresList = [
    ...draft.desiredFeatures,
    ...(draft.customFeatures?.trim() ? [draft.customFeatures.trim()] : []),
  ];

  const lines = [
    "Hi Khai Space, I prepared a project brief on khaispace.com:",
    "",
    `*Name / Contact:* ${draft.name.trim()} (${draft.contactMethod.trim()})`,
    `*Project Category:* ${draft.category}`,
    "",
    "*Problem / Idea:*",
    draft.problemOrIdea.trim(),
  ];

  if (featuresList.length > 0) {
    lines.push("", "*Desired Functionality:*");
    for (const feature of featuresList) {
      lines.push(`- ${feature}`);
    }
  }

  if (draft.budgetRange && draft.budgetRange !== "Not decided yet") {
    lines.push("", `*Indicative Engagement Scale:* ${draft.budgetRange}`);
  }

  if (draft.timeline && draft.timeline !== "Flexible") {
    lines.push(`*Target Timeline:* ${draft.timeline}`);
  }

  lines.push("", "Looking forward to discussing next steps.");
  return lines.join("\n");
}

export function buildEstimatorInquiryMessage(result: EstimatorResult): string {
  const lines = [
    "Hi Khai Space, I used the Project Scope Estimator on khaispace.com:",
    "",
    `*Project Type:* ${result.serviceTitle}`,
    `*Complexity Tier:* ${result.complexityLabel}`,
    `*Readiness:* ${result.readinessLabel}`,
    `*Preliminary Scope Tier:* ${result.scopeTier} (${result.indicativeHorizon})`,
  ];

  if (result.selectedFeatureLabels.length > 0) {
    lines.push("", "*Selected Modules:*");
    for (const label of result.selectedFeatureLabels) {
      lines.push(`- ${label}`);
    }
  }

  lines.push(
    "",
    "_Note: Understood that this is a preliminary indicative scope summary, not a binding quote._",
    "I would like to discuss exact scope and next steps.",
  );

  return lines.join("\n");
}
