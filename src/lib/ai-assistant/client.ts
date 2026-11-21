import { LocalGuidedAssistantProvider } from "@/lib/ai-assistant/local-guide";
import type {
  AssistantRequest,
  AssistantResponse,
  ProjectAssistantProvider,
} from "@/lib/ai-assistant/types";

/**
 * Future remote adapter for an approved server-side proxy (e.g. Cloudflare Worker).
 * Security boundary: accepts ONLY a public proxy endpoint URL — NEVER an LLM API key.
 */
export class RemoteBackendAssistantProvider
  implements ProjectAssistantProvider
{
  readonly mode = "remote-backend" as const;
  readonly providerLabel = "Studio AI Proxy";
  private readonly endpointUrl: string;
  private readonly fallback = new LocalGuidedAssistantProvider();

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl.replace(/\/+$/, "");
  }

  async advise(request: AssistantRequest): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.endpointUrl}/v1/assistant/advise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return this.fallback.advise(request);
      }

      const data = (await response.json()) as Partial<AssistantResponse>;
      if (typeof data.reply !== "string" || !Array.isArray(data.recommendations)) {
        return this.fallback.advise(request);
      }

      return {
        reply: data.reply,
        mode: "remote-backend",
        recommendations: data.recommendations,
        suggestedServiceSlug: data.suggestedServiceSlug,
        transparencyNote:
          data.transparencyNote ??
          "Served via approved server-side AI proxy. Recommendations remain preliminary until confirmed directly with Khai Space.",
      };
    } catch {
      return this.fallback.advise(request);
    }
  }
}

/**
 * Returns the active ProjectAssistantProvider.
 * Defaults safely to LocalGuidedAssistantProvider whenever no approved
 * server-side proxy URL (NEXT_PUBLIC_ASSISTANT_API_URL) is configured.
 */
export function getProjectAssistantProvider(
  overrideEndpoint?: string,
): ProjectAssistantProvider {
  const endpoint =
    overrideEndpoint ?? process.env.NEXT_PUBLIC_ASSISTANT_API_URL?.trim();

  if (endpoint && /^https:\/\//i.test(endpoint)) {
    return new RemoteBackendAssistantProvider(endpoint);
  }

  return new LocalGuidedAssistantProvider();
}
