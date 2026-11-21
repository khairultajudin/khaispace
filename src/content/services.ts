export type ServiceSlug =
  | "ai-automation"
  | "web-applications"
  | "iot-engineering"
  | "custom-digital-solutions"
  | "website-design"
  | "technical-consulting";

export type ServiceIconName =
  | "bot"
  | "app-window"
  | "cpu"
  | "layers"
  | "layout-template"
  | "compass";

export type ServiceAccent = "blue" | "violet" | "cyan" | "navy";

export type ServiceCategory = {
  slug: ServiceSlug;
  title: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  icon: ServiceIconName;
  accent: ServiceAccent;
  problemsSolved: readonly string[];
  capabilities: readonly string[];
  deliverables: readonly string[];
  relatedProjectSlugs: readonly string[];
  whatsappTopic: string;
};

export const services: readonly ServiceCategory[] = [
  {
    slug: "ai-automation",
    title: "AI & Automation",
    shortTitle: "AI & Automation",
    tagline: "Practical workflows that remove repetitive manual work.",
    summary:
      "Design and integrate structured AI pipelines, automated triage, and lightweight internal tooling with clear guardrails and human control.",
    icon: "bot",
    accent: "violet",
    problemsSolved: [
      "Hours lost repeating manual data entry, sorting, or document formatting",
      "Disconnected tools that require copying information across spreadsheets and messages",
      "Uncertainty around how to apply AI safely without unreliable outputs",
    ],
    capabilities: [
      "Structured LLM workflows with schema validation and fallback rules",
      "Automated intake, triage, and summary pipelines",
      "API integrations connecting web forms, notifications, and records",
      "Human-in-the-loop review interfaces for operational confidence",
    ],
    deliverables: [
      "Workflow architecture map & automation prototype",
      "Working integration scripts or web-based control panel",
      "Prompt, validation, and operational handover notes",
    ],
    relatedProjectSlugs: ["ai-workflow-triage", "biztrack"],
    whatsappTopic: "AI & Automation",
  },
  {
    slug: "web-applications",
    title: "Web Applications",
    shortTitle: "Web Apps",
    tagline: "Focused, responsive software built around real daily workflows.",
    summary:
      "Build full-stack web applications, operational dashboards, and interactive client portals engineered with modern TypeScript and React.",
    icon: "app-window",
    accent: "blue",
    problemsSolved: [
      "Outgrowing messy spreadsheets for operations, tracking, or fee management",
      "Needing a tailored portal or utility that off-the-shelf SaaS does not fit",
      "Slow or cluttered interfaces that frustrate daily users on mobile and desktop",
    ],
    capabilities: [
      "Next.js, React, and TypeScript application architecture",
      "Role-aware dashboards, search/filter views, and printable reporting",
      "Data modeling, CSV import/export workflows, and clean REST integrations",
      "Mobile-responsive interfaces designed for clarity and speed",
    ],
    deliverables: [
      "Interactive UI architecture & functional web application",
      "Structured data schema and maintainable TypeScript codebase",
      "Deployment setup and walkthrough documentation",
    ],
    relatedProjectSlugs: ["biztrack", "air-fryer-dashboard"],
    whatsappTopic: "Web Applications",
  },
  {
    slug: "iot-engineering",
    title: "IoT & Engineering",
    shortTitle: "IoT & Engineering",
    tagline: "Bridging sensors, microcontrollers, CAD, and live web interfaces.",
    summary:
      "Prototype connected monitoring devices, environmental sensing setups, and 3D-printed hardware enclosures linked to clear digital dashboards.",
    icon: "cpu",
    accent: "cyan",
    problemsSolved: [
      "Need to monitor real-world conditions without manually checking on site",
      "Hardware concepts stuck as sketches without a testable physical build",
      "Bridging microcontroller readings into an understandable web visualization",
    ],
    capabilities: [
      "ESP32 & microcontroller sensor integration prototypes",
      "Telemetry visualization dashboards and alerting concepts",
      "3D CAD enclosure design and iterative 3D-printed prototyping",
      "Smart agriculture, environmental tracking, and experimental logging",
    ],
    deliverables: [
      "Hardware wiring concept and microcontroller prototype firmware",
      "CAD files / 3D-printed physical prototype iterations",
      "Companion web dashboard or structured growth/telemetry tracker",
    ],
    relatedProjectSlugs: [
      "hidroponik",
      "3d-printing-prototyping",
      "iot-telemetry-console",
    ],
    whatsappTopic: "IoT & Engineering",
  },
  {
    slug: "custom-digital-solutions",
    title: "Custom Digital Solutions",
    shortTitle: "Custom Solutions",
    tagline: "Bespoke digital products for ideas that do not fit a standard template.",
    summary:
      "Craft specialized interactive platforms — from digital publishing suites and readers to niche calculators, micro-tools, and creator utilities.",
    icon: "layers",
    accent: "navy",
    problemsSolved: [
      "Unique creative or operational ideas constrained by rigid website builders",
      "Needing an interactive reader, media hub, or domain-specific digital utility",
      "Combining content, analytics, and interaction into one cohesive experience",
    ],
    capabilities: [
      "Interactive publishing hubs, story/comic readers, and structured archives",
      "Domain-specific calculators, trackers, and guided decision tools",
      "Cross-device offline-friendly or static-first digital experiences",
      "Rapid proof-of-concept prototyping to validate ideas early",
    ],
    deliverables: [
      "Tailored product concept and interactive prototype",
      "Custom web build optimized for desktop and mobile browsers",
      "Self-contained deployment ready for your audience",
    ],
    relatedProjectSlugs: ["memburu-jejak", "air-fryer-dashboard"],
    whatsappTopic: "Custom Digital Solutions",
  },
  {
    slug: "website-design",
    title: "Website Design",
    shortTitle: "Website Design",
    tagline: "Fast, credible studio websites built to clarify value and drive inquiries.",
    summary:
      "Design and engineer modern business websites, product showcases, and landing experiences with strong typography, accessibility, and SEO foundations.",
    icon: "layout-template",
    accent: "blue",
    problemsSolved: [
      "Outdated or generic websites that fail to reflect the quality of your work",
      "Unclear messaging where visitors leave without knowing how to get in touch",
      "Slow, bloated sites with poor mobile layout or weak search visibility",
    ],
    capabilities: [
      "Information architecture, messaging hierarchy, and Bento layout design",
      "Responsive Next.js static and hybrid builds with fast page loads",
      "WhatsApp inquiry flows, lead capture journeys, and clear CTAs",
      "Technical SEO, Open Graph metadata, sitemap, and WCAG accessibility",
    ],
    deliverables: [
      "Cohesive visual design system and reusable component library",
      "Responsive multi-page website with SEO and accessibility checks",
      "Production deployment and clean source code handover",
    ],
    relatedProjectSlugs: ["khai-space-studio", "memburu-jejak"],
    whatsappTopic: "Website Design",
  },
  {
    slug: "technical-consulting",
    title: "Technical Consulting",
    shortTitle: "Tech Consulting",
    tagline: "Honest technical guidance before you commit time or budget.",
    summary:
      "Help founders, creators, and small teams evaluate feasibility, scope MVPs cleanly, pick pragmatic stacks, and untangle technical bottlenecks.",
    icon: "compass",
    accent: "violet",
    problemsSolved: [
      "Unsure whether an idea is technically feasible or how to phase an MVP",
      "Overwhelmed by conflicting tool, cloud, or AI stack recommendations",
      "Needing a second pair of engineering eyes before building or redesigning",
    ],
    capabilities: [
      "MVP scoping, feature prioritization, and phased roadmapping",
      "Architecture, stack selection, and build-vs-buy trade-off reviews",
      "Feasibility spikes and small technical proofs of concept",
      "UX, performance, and maintainability audits for existing web projects",
    ],
    deliverables: [
      "Clear written technical brief and prioritized implementation plan",
      "Architecture diagram and risk/trade-off breakdown",
      "Actionable next-step recommendations without lock-in",
    ],
    relatedProjectSlugs: ["khai-space-studio", "ai-workflow-triage"],
    whatsappTopic: "Technical Consulting",
  },
];

export function getServiceBySlug(slug: string): ServiceCategory | undefined {
  return services.find((service) => service.slug === slug);
}
