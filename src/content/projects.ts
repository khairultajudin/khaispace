import type { ServiceSlug } from "@/content/services";

export type ProjectStatus =
  | "Production"
  | "Live"
  | "Active Experiment"
  | "Completed"
  | "Prototype"
  | "Studio Concept"
  | "Interactive Demo";

export type ProjectVisualPreset =
  | "image"
  | "culinary-utility"
  | "studio-platform"
  | "cad-prototype"
  | "ai-workflow"
  | "iot-telemetry";

export type ProjectItem = {
  slug: string;
  title: string;
  subtitle: string;
  serviceSlug: ServiceSlug;
  categoryLabel: string;
  status: ProjectStatus;
  featured: boolean;
  year: string;
  summary: string;
  problem: string;
  approach: string;
  outcome: string;
  technologies: readonly string[];
  features: readonly string[];
  visualPreset: ProjectVisualPreset;
  coverImage?: string;
  coverAlt: string;
  galleryImage?: string;
  galleryAlt?: string;
  visualNote?: string;
  /** Safe, working demo route or URL only. Omit if not publicly hosted. */
  demoHref?: string;
  demoLabel?: string;
};

/**
 * Curated, authentic Khai Space public project catalog.
 * - Excludes permanently discontinued/deleted items and private Hub records.
 * - Clearly labels prototypes, concepts, and illustrative/synthetic visuals.
 * - Contains zero invented client names, metrics, testimonials, or prices.
 */
export const projects: readonly ProjectItem[] = [
  {
    slug: "biztrack",
    title: "BizTrack",
    subtitle: "Operations & Fee Management Web Application",
    serviceSlug: "web-applications",
    categoryLabel: "Web Applications",
    status: "Production",
    featured: true,
    year: "2026",
    summary:
      "Multi-tenant operations and fee management platform designed for academies, tuition centers, and membership-based small businesses to track enrollment, fee collections, and printable A4 audit reports.",
    problem:
      "Small academies and service centers frequently manage student rosters, recurring fees, and overdue follow-ups across disconnected spreadsheets and chat threads, creating billing blind spots and slow month-end reconciliation.",
    approach:
      "Architected a modular multi-tenant web application with strict row-level data isolation, structured fee status tracking, CSV import workflows, and print-ready A4 financial summaries designed for clarity on both desktop and mobile.",
    outcome:
      "Built and deployed as a production multi-tenant web platform supporting centralized enrollment tracking, payment status visibility, and audit-ready financial reporting.",
    technologies: [
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Row Level Security",
      "Tailwind CSS",
      "A4 Print Reporting",
    ],
    features: [
      "Multi-tenant architecture with isolated organization workspaces",
      "Student / member enrollment directory with class assignment",
      "Fee collection status tracking (Paid, Pending, Overdue)",
      "CSV import workflow and structured ledger categorization",
      "Printable A4 financial breakdown and summary views",
    ],
    visualPreset: "image",
    coverImage: "/images/projects/biztrack-dashboard.jpg",
    coverAlt:
      "BizTrack dashboard interface preview showing overview cards, revenue chart, and collection status with illustrative sample data",
    galleryImage: "/images/projects/biztrack-analytics.jpg",
    galleryAlt:
      "BizTrack financial report table preview showing billing breakdown and print audit action using synthetic sample records",
    visualNote:
      "Showcase screenshots display synthetic sample data created strictly for public demonstration — zero real customer or production records are shown.",
  },
  {
    slug: "memburu-jejak",
    title: "Memburu Jejak: Langkah Pertama",
    subtitle: "Interactive Digital Publishing & Reader Suite",
    serviceSlug: "custom-digital-solutions",
    categoryLabel: "Custom Digital Solutions",
    status: "Live",
    featured: true,
    year: "2026",
    summary:
      "A bespoke digital publishing hub and analytical companion for a 32-chapter youth mystery novel — uniting an interactive chapter reader, character dossier, narrative tension charts, and a web comic reader.",
    problem:
      "Long-form creative stories often live in flat PDFs that miss opportunities for reader immersion, structured world-building exploration, and multi-format visual storytelling.",
    approach:
      "Designed a unified static-first publishing suite combining clean editorial typography for distraction-free reading, a structured character database, chapter-by-chapter tension visualization, and a dedicated panel-based comic viewer.",
    outcome:
      "Completed as a self-contained digital publishing suite demonstrating how custom web engineering can elevate independent creative works into interactive media hubs.",
    technologies: [
      "HTML5",
      "CSS3",
      "Vanilla JavaScript",
      "JSON Story Graph",
      "Interactive Reader UI",
    ],
    features: [
      "32-chapter responsive novel reader with structured navigation",
      "Visual character dossier and relationship guide",
      "Narrative tension and chapter pacing analytics dashboard",
      "Dedicated web comic episode viewer with page controls",
    ],
    visualPreset: "image",
    coverImage: "/images/projects/memburu-jejak-cover.jpg",
    coverAlt:
      "Cover artwork for Memburu Jejak: Langkah Pertama featuring a young protagonist standing in a warm-lit wooden school corridor at dusk",
  },
  {
    slug: "hidroponik",
    title: "Hab Hidroponik",
    subtitle: "Passive Kratky Hydroponics Guide & Growth Tracker",
    serviceSlug: "iot-engineering",
    categoryLabel: "IoT & Engineering",
    status: "Active Experiment",
    featured: true,
    year: "2026",
    summary:
      "Hands-on passive Kratky hydroponics documentation and multi-crop growth tracker covering Pak Choy (Day 0 to Day 36), Salad Framoc, and a practical kitchen-herb reference directory.",
    problem:
      "Beginners experimenting with home passive hydroponics often struggle to correlate nutrient levels, container geometry, and visual plant milestones across days of growth.",
    approach:
      "Combined real physical cultivation experiments with a structured web tracker — logging photographic checkpoints, water-level behavior, container comparisons, and crop notes into an accessible multi-tab reference hub.",
    outcome:
      "Ongoing practical experiment documenting complete growth cycles from germination to harvest, serving as an authentic open reference for passive hydroponic cultivation.",
    technologies: [
      "Kratky Method",
      "HTML/CSS/JS",
      "Growth Timeline Logging",
      "Responsive Web Guide",
    ],
    features: [
      "Day-by-day photographic timeline for Pak Choy and Salad Framoc",
      "Container comparison logs (reservoir tray, glass jars, individual cups)",
      "Nutrient and water-level checkpoint documentation",
      "Expandable crop and culinary herb reference directory",
    ],
    visualPreset: "image",
    coverImage: "/images/projects/hidroponik-pakchoy.jpg",
    coverAlt:
      "Real photograph of healthy Pak Choy plants growing in a blue passive Kratky hydroponic container beside a sunlit window",
    galleryImage: "/images/projects/hidroponik-salad.jpg",
    galleryAlt:
      "Real photograph of Salad Framoc seedlings sprouting in rockwool cubes inside a black propagation tray",
    visualNote:
      "Authentic studio experiment photography captured directly from Khai Space's passive hydroponics trials.",
  },
  {
    slug: "air-fryer-dashboard",
    title: "Air Fryer Dada Ayam Chef",
    subtitle: "5-Day Minimalist Meal Planner, Cost Utility & Timer",
    serviceSlug: "web-applications",
    categoryLabel: "Web Applications",
    status: "Completed",
    featured: true,
    year: "2026",
    summary:
      "Focused daily culinary web utility featuring five 400g / 2-pax chicken breast air-fryer recipes built around a minimalist spice rack, integrated ingredient cost calculator, and built-in cooking timer.",
    problem:
      "Weekday meal prep gets abandoned when recipes require dozens of single-use ingredients, unclear temperature timing, and mental math to estimate per-serving grocery costs.",
    approach:
      "Engineered a single-screen, zero-bloat interactive web dashboard organized around six staple spices, pairing instant recipe switching with a live cost breakdown calculator and an audio-assisted countdown timer.",
    outcome:
      "Completed as a fast, mobile-friendly utility demonstrating clean interface ergonomics for everyday personal software.",
    technologies: [
      "Interactive Web UI",
      "TypeScript / JavaScript",
      "State-Driven Timer",
      "Responsive Grid",
    ],
    features: [
      "5-day rotating menu engineered around 6 core kitchen spices",
      "Live grocery cost breakdown calculator per serving",
      "Built-in temperature and countdown cooking timer",
      "Clean, single-glance kitchen-friendly mobile layout",
    ],
    visualPreset: "culinary-utility",
    coverAlt:
      "Illustrative interface mockup of the Air Fryer Dada Ayam Chef meal planner, spice matrix, and countdown timer",
    visualNote:
      "Visual card is a stylized interface representation of the completed web utility.",
  },
  {
    slug: "khai-space-studio",
    title: "Khai Space 2.0 Studio Platform",
    subtitle: "Interactive Digital Studio Website & Client Intake Architecture",
    serviceSlug: "website-design",
    categoryLabel: "Website Design",
    status: "Live",
    featured: false,
    year: "2026",
    summary:
      "The public Khai Space 2.0 digital studio platform built with Next.js App Router, Tailwind CSS 4, Bento design architecture, searchable project directory, Interactive Lab, and guided WhatsApp brief builder.",
    problem:
      "Static portfolio websites rarely help prospective clients clarify their own idea, understand service fit, or initiate a structured conversation without friction.",
    approach:
      "Designed a lightweight, static-exported Next.js 16 architecture combining clean visual hierarchy, accessible keyboard-first components, self-hosted Manrope and Inter typography, and frictionless WhatsApp conversion tools.",
    outcome:
      "Live production architecture deployed to Cloudflare Pages with fast static delivery, full metadata/sitemap support, and zero unnecessary backend overhead.",
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript Strict",
      "Tailwind CSS 4",
      "Lucide Icons",
      "Cloudflare Pages",
    ],
    features: [
      "Bento-grid visual system with Deep Navy, Electric Blue, Violet, and Cyan tokens",
      "Searchable and filterable Project Explorer with static project detail pages",
      "Guided multi-step Project Brief Builder with structured WhatsApp handoff",
      "Self-contained Interactive Lab with synthetic browser-side simulations",
    ],
    visualPreset: "studio-platform",
    coverAlt:
      "Visual preview of the Khai Space 2.0 Bento design system and interactive studio layout",
    demoHref: "/",
    demoLabel: "You are exploring it now",
  },
  {
    slug: "3d-printing-prototyping",
    title: "3D Printing & Rapid Prototyping Lab",
    subtitle: "Iterative CAD Design & Functional Fabrication",
    serviceSlug: "iot-engineering",
    categoryLabel: "IoT & Engineering",
    status: "Prototype",
    featured: false,
    year: "2026",
    summary:
      "Iterative CAD modeling and desktop FDM 3D printing workflows for custom brackets, electronics enclosures, and practical physical prototypes.",
    problem:
      "Early hardware ideas and custom physical fixtures are costly to validate when waiting on external fabrication for every millimeter-level fit adjustment.",
    approach:
      "Uses parametric CAD concepts paired with rapid desktop 3D printing iterations to test tolerances, ergonomics, and component fitment before finalizing designs.",
    outcome:
      "Active studio prototyping capability supporting physical product exploration, workshop training material, and custom enclosure iteration.",
    technologies: [
      "Parametric 3D CAD",
      "FDM 3D Printing",
      "Tolerance Testing",
      "Rapid Iteration",
    ],
    features: [
      "Custom enclosure and fixture modeling from real component dimensions",
      "Multi-revision fitment and print-orientation testing",
      "Practical workshop and introductory prototyping documentation",
    ],
    visualPreset: "cad-prototype",
    coverAlt:
      "Geometric wireframe visualization representing parametric 3D CAD modeling and layered fabrication",
    visualNote:
      "Labeled as an active studio prototyping track with stylized technical artwork.",
  },
  {
    slug: "ai-workflow-triage",
    title: "Structured AI Workflow & Triage Kit",
    subtitle: "Schema-Validated Automation & Routing Prototype",
    serviceSlug: "ai-automation",
    categoryLabel: "AI & Automation",
    status: "Studio Concept",
    featured: false,
    year: "2026",
    summary:
      "Studio R&D concept demonstrating how incoming inquiries, documents, and operational requests can be classified, validated against strict schemas, and routed for human review.",
    problem:
      "Unstructured AI prompts often produce inconsistent formatting that breaks downstream tools or requires heavy manual cleanup.",
    approach:
      "Combines deterministic validation rules with structured extraction stages so every automated step remains inspectable, reversible, and ready for human sign-off.",
    outcome:
      "Internal studio reference architecture used to scope safe, predictable AI automation projects for small teams and founders.",
    technologies: [
      "TypeScript",
      "Structured Schemas",
      "Workflow State Machines",
      "Human-in-the-Loop UI",
    ],
    features: [
      "Multi-stage intake classification with deterministic fallback states",
      "Clear confidence and review checkpoints before external actions",
      "Reusable routing blueprint adaptable to email, forms, or messaging",
    ],
    visualPreset: "ai-workflow",
    coverAlt:
      "Stylized node diagram illustrating structured AI intake, validation, and human-approved routing",
    visualNote:
      "Studio concept / prototype — interactive synthetic simulation available in the Interactive Lab.",
    demoHref: "/lab#workflow-demo",
    demoLabel: "Try Simulation in Lab",
  },
  {
    slug: "iot-telemetry-console",
    title: "Connected Sensor Telemetry Concept",
    subtitle: "Simulated Environmental Monitoring Dashboard",
    serviceSlug: "iot-engineering",
    categoryLabel: "IoT & Engineering",
    status: "Interactive Demo",
    featured: false,
    year: "2026",
    summary:
      "Interactive browser-based concept modeling how microcontroller temperature, humidity, and moisture telemetry streams into a responsive operator console with threshold alerts.",
    problem:
      "Hardware stakeholders often want to visualize how field telemetry and alerting will look to operators before investing in full sensor deployment.",
    approach:
      "Built a self-contained browser simulation using synthetic sensor streams to test alert thresholds, reading history charts, and responsive layout density.",
    outcome:
      "Available as a safe, client-side interactive demonstration inside the Khai Space Interactive Lab.",
    technologies: [
      "React",
      "TypeScript",
      "SVG Telemetry Charts",
      "Simulated Sensor Streams",
    ],
    features: [
      "Simulated real-time environmental readings (temperature, humidity, reservoir level)",
      "Configurable threshold triggers with clear alert states",
      "100% synthetic browser-side data — zero external hardware or database required",
    ],
    visualPreset: "iot-telemetry",
    coverAlt:
      "Stylized telemetry dashboard illustration showing simulated temperature, humidity, and sensor status indicators",
    visualNote:
      "Interactive concept using 100% synthetic simulated data — no live hardware or production database connection.",
    demoHref: "/lab#iot-demo",
    demoLabel: "Open Live Simulation",
  },
];

export const featuredProjects: readonly ProjectItem[] = projects.filter(
  (project) => project.featured,
);

export const projectStatuses: readonly ProjectStatus[] = Array.from(
  new Set(projects.map((project) => project.status)),
);

export function getProjectBySlug(slug: string): ProjectItem | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectsByServiceSlug(
  serviceSlug: ServiceSlug,
): readonly ProjectItem[] {
  return projects.filter((project) => project.serviceSlug === serviceSlug);
}
