export const howWeWorkSteps = [
  {
    step: "01",
    title: "Clarify the Problem",
    description:
      "Start with a plain conversation on WhatsApp or via our Project Brief Builder. We align on goals, constraints, and what actually needs to be built first.",
  },
  {
    step: "02",
    title: "Shape the Architecture",
    description:
      "Translate your idea into a clear technical scope, interface structure, and phased build plan — surfacing trade-offs early before writing production code.",
  },
  {
    step: "03",
    title: "Build & Iterate Openly",
    description:
      "Ship working milestones you can click, test, and refine on real devices. Short feedback loops keep the solution grounded in real-world use.",
  },
  {
    step: "04",
    title: "Launch & Hand Over Cleanly",
    description:
      "Deploy with attention to speed, accessibility, and maintainability — along with clear documentation and ongoing support options when needed.",
  },
] as const;

export const whyKhaiSpacePillars = [
  {
    title: "Direct Studio Collaboration",
    description:
      "You talk directly with the builder designing and engineering your solution — no layers of account handoffs or lost context.",
    accent: "blue" as const,
  },
  {
    title: "Cross-Disciplinary Problem Solving",
    description:
      "Combining web software, practical AI workflows, and physical/IoT prototyping lets us solve problems that cross digital and real-world boundaries.",
    accent: "violet" as const,
  },
  {
    title: "Honest Scope & Pragmatic Tech",
    description:
      "We recommend the simplest reliable architecture for your stage. If a smaller tool or phased MVP makes more sense, we say so up front.",
    accent: "cyan" as const,
  },
  {
    title: "Crafted for Clarity & Speed",
    description:
      "Every interface is built to load fast, read clearly on mobile and desktop, and remain easy to maintain long after launch.",
    accent: "navy" as const,
  },
] as const;

export const labPreviewItems = [
  {
    id: "dashboard-demo",
    title: "Mini Operations Dashboard",
    category: "Web Applications",
    badge: "Synthetic Data",
    description:
      "Filter sample records, inspect status breakdowns, and preview how clean operational views turn raw entries into decisions.",
  },
  {
    id: "workflow-demo",
    title: "Workflow Automation Simulator",
    category: "AI & Automation",
    badge: "Simulated Pipeline",
    description:
      "Step through a sample intake-to-triage automation flow showing structured classification, validation checks, and human review.",
  },
  {
    id: "iot-demo",
    title: "IoT Sensor Telemetry Monitor",
    category: "IoT & Engineering",
    badge: "Simulated Sensors",
    description:
      "Adjust synthetic environmental thresholds and observe live-style temperature, humidity, and reservoir level alerts.",
  },
  {
    id: "utility-demo",
    title: "Interactive Feature & Scope Sandbox",
    category: "Custom Digital Solutions",
    badge: "Interactive Utility",
    description:
      "Toggle modular capabilities to see how web utilities respond instantly on the client without heavy server round-trips.",
  },
] as const;

export const studioTechAreas = [
  {
    area: "Web & Interface Engineering",
    items: [
      "Next.js App Router",
      "React & TypeScript",
      "Tailwind CSS",
      "Responsive Bento UI",
      "WCAG Accessibility",
      "Technical SEO",
    ],
  },
  {
    area: "AI & Workflow Tooling",
    items: [
      "Structured LLM Pipelines",
      "Schema Validation",
      "Document & Inquiry Triage",
      "API Orchestration",
      "Human-in-the-Loop Controls",
    ],
  },
  {
    area: "Embedded, IoT & Physical",
    items: [
      "ESP32 Microcontrollers",
      "Environmental Sensing",
      "Telemetry Visualization",
      "Parametric 3D CAD",
      "FDM 3D Prototyping",
    ],
  },
  {
    area: "Data & Cloud Delivery",
    items: [
      "PostgreSQL & RLS",
      "Static-First Edge Delivery",
      "Cloudflare Pages",
      "Clean Git Workflows",
      "Maintainable Documentation",
    ],
  },
] as const;
