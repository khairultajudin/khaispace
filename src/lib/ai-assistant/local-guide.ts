import { projects } from "@/content/projects";
import { services, type ServiceSlug } from "@/content/services";
import type {
  AssistantRecommendation,
  AssistantRequest,
  AssistantResponse,
  ProjectAssistantProvider,
} from "@/lib/ai-assistant/types";

type ServiceKeywordRule = {
  slug: ServiceSlug;
  keywords: readonly string[];
  guidance: string;
};

const SERVICE_RULES: readonly ServiceKeywordRule[] = [
  {
    slug: "ai-automation",
    keywords: [
      "ai",
      "llm",
      "automat",
      "workflow",
      "triage",
      "bot",
      "chatbot",
      "document",
      "summary",
      "pipeline",
      "agent",
    ],
    guidance:
      "For AI & Automation ideas, Khai Space focuses on structured, schema-validated workflows with human review checkpoints so outputs stay predictable and safe.",
  },
  {
    slug: "iot-engineering",
    keywords: [
      "iot",
      "sensor",
      "esp32",
      "hardware",
      "arduino",
      "hydropon",
      "hidroponik",
      "3d",
      "cad",
      "print",
      "enclosure",
      "telemetry",
      "temperature",
      "monitor",
    ],
    guidance:
      "For IoT & Engineering projects, we connect microcontroller sensing and iterative 3D CAD prototyping with clean web telemetry dashboards.",
  },
  {
    slug: "web-applications",
    keywords: [
      "app",
      "dashboard",
      "portal",
      "saas",
      "fee",
      "yuran",
      "booking",
      "inventory",
      "crm",
      "tracker",
      "admin",
      "spreadsheet",
      "database",
      "system",
    ],
    guidance:
      "For Web Applications, we build focused Next.js + TypeScript dashboards and portals that replace messy spreadsheets with structured, mobile-friendly workflows.",
  },
  {
    slug: "website-design",
    keywords: [
      "website",
      "landing",
      "portfolio",
      "redesign",
      "seo",
      "company site",
      "brand",
      "web design",
      "page",
    ],
    guidance:
      "For Website Design, we craft fast, static-first Next.js websites with crisp Bento hierarchy, strong SEO foundations, and clear WhatsApp conversion paths.",
  },
  {
    slug: "custom-digital-solutions",
    keywords: [
      "reader",
      "comic",
      "novel",
      "publish",
      "calculator",
      "utility",
      "interactive",
      "tool",
      "creator",
      "media",
    ],
    guidance:
      "For Custom Digital Solutions, we build specialized interactive hubs, readers, and domain-specific micro-tools tailored to ideas that standard templates cannot handle.",
  },
  {
    slug: "technical-consulting",
    keywords: [
      "consult",
      "advice",
      "mvp",
      "scope",
      "stack",
      "feasib",
      "architecture",
      "review",
      "audit",
      "plan",
      "cost",
      "quote",
      "price",
    ],
    guidance:
      "If you are still validating feasibility or comparing architecture options, a Technical Consulting sprint helps clarify scope and trade-offs before committing to a full build.",
  },
];

export const LOCAL_TRANSPARENCY_NOTE =
  "Guided Local Mode: matches your request against Khai Space's verified services, projects, and lab modules using transparent local rules. Live LLM backend is intentionally deferred until an approved server-side proxy is deployed.";

export class LocalGuidedAssistantProvider implements ProjectAssistantProvider {
  readonly mode = "local-guided" as const;
  readonly providerLabel = "Studio Guided Mode (Local Rules)";

  async advise(request: AssistantRequest): Promise<AssistantResponse> {
    const normalized = request.prompt.trim().toLowerCase();

    if (!normalized) {
      return {
        reply:
          "Describe what you want to build or the problem you are trying to solve — for example, a fee dashboard, an AI triage workflow, an IoT sensor monitor, or a business website.",
        mode: this.mode,
        recommendations: [
          {
            kind: "brief",
            title: "Start a Guided Project Brief",
            description:
              "Walk through 4 quick steps and generate a structured WhatsApp brief.",
            href: "/start-a-project",
            badge: "Recommended",
          },
          {
            kind: "lab",
            title: "Explore the Interactive Lab",
            description:
              "Try safe synthetic demos of dashboards, automation, and IoT monitoring.",
            href: "/lab",
            badge: "Interactive",
          },
        ],
        transparencyNote: LOCAL_TRANSPARENCY_NOTE,
      };
    }

    const scored = SERVICE_RULES.map((rule) => {
      const hits = rule.keywords.reduce(
        (count, keyword) => (normalized.includes(keyword) ? count + 1 : count),
        0,
      );
      return { rule, hits };
    }).sort((a, b) => b.hits - a.hits);

    const bestMatch = scored[0] && scored[0].hits > 0 ? scored[0].rule : null;
    const matchedService = bestMatch
      ? services.find((item) => item.slug === bestMatch.slug)
      : undefined;

    const recommendations: AssistantRecommendation[] = [];

    if (matchedService) {
      recommendations.push({
        kind: "service",
        title: matchedService.title,
        description: matchedService.summary,
        href: `/services#${matchedService.slug}`,
        badge: "Matching Service",
      });

      const relatedProject = projects.find(
        (project) => project.serviceSlug === matchedService.slug,
      );
      if (relatedProject) {
        recommendations.push({
          kind: "project",
          title: relatedProject.title,
          description: relatedProject.subtitle,
          href: `/projects/${relatedProject.slug}`,
          badge: relatedProject.status,
        });
      }

      recommendations.push({
        kind: "brief",
        title: `Start a ${matchedService.shortTitle} Brief`,
        description:
          "Pre-select this category in our Project Brief Builder and prepare a WhatsApp message.",
        href: `/start-a-project?service=${matchedService.slug}`,
        badge: "Next Step",
      });

      return {
        reply: `${bestMatch?.guidance} Based on what you shared, **${matchedService.title}** looks like the closest starting point. You can inspect related studio work below, test our preliminary scope estimator, or start a pre-selected project brief.`,
        mode: this.mode,
        recommendations,
        suggestedServiceSlug: matchedService.slug,
        transparencyNote: LOCAL_TRANSPARENCY_NOTE,
      };
    }

    return {
      reply:
        "That sounds like a great topic to scope directly. Khai Space works across AI & Automation, Web Applications, IoT & Engineering, Custom Digital Solutions, Website Design, and Technical Consulting. Try our Project Scope Estimator to map complexity, or prepare a quick brief for WhatsApp.",
      mode: this.mode,
      recommendations: [
        {
          kind: "brief",
          title: "Open Project Brief Builder & Estimator",
          description:
            "Map your complexity tier and structure your idea for a direct WhatsApp discussion.",
          href: "/start-a-project",
          badge: "Start Here",
        },
        {
          kind: "service",
          title: "Browse All 6 Services",
          description:
            "Compare problems solved, capabilities, and typical deliverables.",
          href: "/services",
          badge: "Overview",
        },
        {
          kind: "lab",
          title: "Try Interactive Lab Demos",
          description:
            "Test synthetic dashboard, workflow, and IoT sensor simulations.",
          href: "/lab",
          badge: "Sandbox",
        },
      ],
      transparencyNote: LOCAL_TRANSPARENCY_NOTE,
    };
  }
}
