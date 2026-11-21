import type { ServiceSlug } from "@/content/services";

export type AssistantProviderMode = "local-guided" | "remote-backend";

export type AssistantRole = "user" | "assistant";

export type AssistantRecommendation = {
  kind: "service" | "project" | "lab" | "brief";
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  timestampIso: string;
  mode: AssistantProviderMode;
  recommendations?: readonly AssistantRecommendation[];
  suggestedServiceSlug?: ServiceSlug;
};

export type AssistantRequest = {
  prompt: string;
  history: readonly Pick<AssistantMessage, "role" | "content">[];
  pageContext?: string;
};

export type AssistantResponse = {
  reply: string;
  mode: AssistantProviderMode;
  recommendations: readonly AssistantRecommendation[];
  suggestedServiceSlug?: ServiceSlug;
  /** Clearly communicates whether live LLM inference is connected or deferred. */
  transparencyNote: string;
};

/**
 * Extensible provider contract for the Khai Space AI Project Assistant.
 * - Today: implemented by LocalGuidedAssistantProvider (deterministic studio advisor, zero secrets).
 * - Future: drop-in RemoteBackendAssistantProvider calling a secured server-side proxy
 *   (e.g., Cloudflare Worker with Turnstile + rate limiting + server-side API key).
 */
export interface ProjectAssistantProvider {
  readonly mode: AssistantProviderMode;
  readonly providerLabel: string;
  advise(request: AssistantRequest): Promise<AssistantResponse>;
}
