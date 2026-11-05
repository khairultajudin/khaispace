import { HubProject, SummaryMetric, ActivityEntry, TaskEntry } from "../types/dashboard";

export const SAMPLE_SUMMARY_METRICS: SummaryMetric[] = [
  {
    id: "total-projects",
    label: "Total Projects",
    value: "8",
    sublabel: "Cataloged in repository",
    badgeText: "Cataloged",
    note: "All active, in-development, documented & planned projects",
  },
  {
    id: "active-projects",
    label: "Active Projects",
    value: "5",
    sublabel: "Ongoing maintenance / dev",
    badgeText: "In Progress",
    note: "Website (Prod), Hub (Dev), BizTrack (Active), Memburu Jejak (Active), PixelPop (Active)",
  },
  {
    id: "pending-tasks",
    label: "Pending Tasks",
    value: "8",
    sublabel: "Sample milestone items",
    badgeText: "Sample Data",
    note: "Illustrative task queue — not connected to external tracker",
  },
  {
    id: "monthly-expenses",
    label: "Monthly Subscriptions",
    value: "RM 380",
    sublabel: "Sample estimates",
    badgeText: "Sample Data",
    note: "Illustrative budget figure only — no live financial integration",
  },
];

export const CATALOGED_PROJECTS: HubProject[] = [
  {
    id: "website",
    title: "Khai Space Website",
    category: "Production Web",
    status: "Production",
    location: "Repository Root (src/)",
    description: "Public portfolio and services website built with Next.js 16 App Router and Tailwind CSS.",
    tags: ["Next.js 16", "Tailwind CSS", "Cloudflare Pages"],
    fullDescription:
      "Public-facing website presenting Khai Space capabilities, creative works, and consulting services. Built using the Next.js 16 App Router with static HTML export for fast, resilient global delivery.",
    metadata: {
      scope: "Public Portfolio & Client Services",
      techStack: "Next.js 16.3.8, React 19.2.8, Tailwind CSS v4, TypeScript 5",
      deliveryModel: "Static HTML Export (out/) deployed to Cloudflare Pages",
      repositoryPath: "Repository Root (src/app, public/, next.config.ts)",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
  {
    id: "hub",
    title: "Khai Space Hub",
    category: "Internal Platform",
    status: "In Development",
    location: "apps/hub",
    description:
      "Personal business and project command center for centralized workspace navigation, project visibility, and operational planning.",
    tags: ["Next.js 16", "Tailwind CSS", "Command Center"],
    fullDescription:
      "Internal operational command center designed to provide consolidated visibility over all projects, assets, and future initiatives in the Khai Space ecosystem without interfering with production website builds.",
    metadata: {
      scope: "Internal Workspace & Project Catalog",
      techStack: "Next.js 16.3.8, React 19.2.8, Tailwind CSS v4, Lucide React",
      deliveryModel: "Independent Static Export (apps/hub/out) targeting Cloudflare Pages",
      repositoryPath: "apps/hub/ (isolated package & tsconfig)",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
  {
    id: "biztrack",
    title: "BizTrack",
    category: "Standalone Client",
    status: "Active",
    location: "public/projects/biztrack",
    description:
      "Standalone business and analytics dashboard client. Maintained as an independent asset in the repository.",
    tags: ["Analytics", "Dashboard", "Standalone Asset"],
    fullDescription:
      "Client-side business analytics dashboard prototype featuring revenue summaries, client tracking charts, and visual performance indicators. Maintained as a self-contained static web application.",
    metadata: {
      scope: "Business Analytics & Tracking Prototype",
      techStack: "HTML5, Vanilla JavaScript, CSS3 Assets",
      deliveryModel: "In-Tree Static Client Asset Bundle",
      repositoryPath: "public/projects/biztrack/ (index.html, assets/)",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
  {
    id: "ourduit",
    title: "OurDuit",
    category: "Finance & Budgeting",
    status: "Planning",
    location: "None (Conceptual / Planned Module)",
    description:
      "Personal and household cash-flow tracking module scheduled for future integration in the Hub ecosystem.",
    tags: ["Budgeting", "Cash Flow", "Under Design"],
    fullDescription:
      "Personal and household cash-flow tracking system currently in conceptual architecture planning. Aimed at providing transparent expenditure modeling and subscription management.",
    metadata: {
      scope: "Personal Financial Tracking Module (Planning)",
      techStack: "Proposed: React / Next.js Component Library (Not yet implemented)",
      deliveryModel: "Future Hub Feature Integration (Planned)",
      repositoryPath: "None (Conceptual / Not yet implemented on filesystem)",
      verificationStatus: "Planned / Not Yet Implemented",
      pathStatus: "Planned Location (Not on filesystem)",
      stackStatus: "Proposed / Not Implemented",
    },
  },
  {
    id: "hidroponik",
    title: "Hidroponics",
    category: "IoT & Research",
    status: "Documented",
    location: "public/projects/hidroponik",
    description:
      "Urban farming logbooks, photo documentation, and harvest guides for Pak Choy and Salad Framoc.",
    tags: ["Plant Logs", "Harvest Guides", "Static Media"],
    fullDescription:
      "Empirical cultivation logbook and urban hydroponic farming documentation spanning day-by-day germination records, EC/pH monitoring, photo timelines, and harvest cooking guides for Pak Choy and Salad Framoc.",
    metadata: {
      scope: "Urban Agriculture & IoT Plant Tracking",
      techStack: "Static HTML, Photography Asset Library, Markdown Guides",
      deliveryModel: "Static Logbook Pages & High-Resolution Image Records",
      repositoryPath: "public/projects/hidroponik/ (index.html, salad.html, assets/)",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
  {
    id: "memburu-jejak",
    title: "Memburu Jejak",
    category: "Creative Media",
    status: "Active",
    location: "public/projects/memburu-jejak",
    description:
      "Interactive digital comic reader, character dossier bible, and narrative timeline data.",
    tags: ["Web Comic", "Character Bible", "Reader Engine"],
    fullDescription:
      "Digital narrative and transmedia comic adaptation suite. Contains a responsive web reader, episodic panel archives, master character bible dossiers, and structured novel analysis data in JSON format.",
    metadata: {
      scope: "Digital Web Comic & Narrative Engine",
      techStack: "Custom HTML5 Reader Engine, Character Bible JSON, Panel Imagery",
      deliveryModel: "In-Tree Interactive Comic Reader & Dossier Browser",
      repositoryPath: "public/projects/memburu-jejak/ (reader.html, dashboard.html, Komik/)",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
  {
    id: "pixelpop",
    title: "PixelPop",
    category: "Hardware Showcase",
    status: "Active",
    location: "public/projects/pixelpop",
    description:
      "Physical computing product showcase with interactive exploded CAD diagrams and 3D enclosure renders.",
    tags: ["Hardware CAD", "3D Renders", "Interactive Showcase"],
    fullDescription:
      "Product showcase website demonstrating physical computing hardware designs. Features detailed 3D enclosure CAD exploded diagrams, technical assembly breakdowns, and rendered aesthetic visuals.",
    metadata: {
      scope: "Industrial Design & Hardware Visualization",
      techStack: "Static HTML5, High-Resolution CAD Renders",
      deliveryModel: "Interactive Product Showcase Page",
      repositoryPath: "public/projects/pixelpop/ (index.html, assets/)",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
  {
    id: "clicker",
    title: "3D Printing Clicker",
    category: "Hardware & Workshop",
    status: "Documented",
    location: "public/Bambu_Lab_A1_Combo_Workshop.pptx",
    description:
      "3D printer workshop documentation, slicing presets, and physical clicker mechanism designs.",
    tags: ["3D Printing", "Workshop Slide deck", "Physical Tool"],
    fullDescription:
      "Physical computing and 3D fabrication documentation prepared for the Bambu Lab A1 Combo Workshop. Encompasses slicer profiles, mechanical clicker mechanism specifications, and workshop curriculum slides.",
    metadata: {
      scope: "Digital Fabrication & Maker Workshop Curriculum",
      techStack: "Microsoft PowerPoint Presentation (.pptx), Slicer Configurations",
      deliveryModel: "Downloadable Presentation & Documentation File",
      repositoryPath: "public/Bambu_Lab_A1_Combo_Workshop.pptx",
      verificationStatus: "Verified In-Tree",
      pathStatus: "Verified Filesystem Path",
      stackStatus: "Active Implementation",
    },
  },
];

export const SAMPLE_ACTIVITY_FEED: ActivityEntry[] = [
  {
    id: "act-2",
    action: "Hub Phase 1.1 light-theme design finalized and target domain documented",
    project: "Khai Space Hub",
    date: "November 5, 2026",
    category: "Scaffold",
  },
  {
    id: "act-1",
    action: "Harvest guide and Pak Choy Day 36 documentation finalized",
    project: "Hidroponics",
    date: "November 4, 2026",
    category: "Documentation",
  },
  {
    id: "act-3",
    action: "Batch 4 character dossier attribution updated in character bible",
    project: "Memburu Jejak",
    date: "November 3, 2026",
    category: "Design",
  },
  {
    id: "act-4",
    action: "Initial module structure and schema drafted for cash-flow tracking",
    project: "OurDuit",
    date: "November 1, 2026",
    category: "Planning",
  },
];

export const SAMPLE_UPCOMING_TASKS: TaskEntry[] = [
  {
    id: "task-1",
    title: "Verify responsive mobile layout on Hub dashboard",
    project: "Khai Space Hub",
    dueDate: "November 7, 2026",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "task-2",
    title: "Review schema requirements for OurDuit database",
    project: "OurDuit",
    dueDate: "November 12, 2026",
    priority: "Medium",
    status: "Pending",
  },
  {
    id: "task-3",
    title: "Prepare next batch harvest photos for Salad Framoc",
    project: "Hidroponics",
    dueDate: "November 15, 2026",
    priority: "Normal",
    status: "Pending",
  },
  {
    id: "task-4",
    title: "Audit Bambu Lab A1 Combo slide deck formatting",
    project: "3D Printing Clicker",
    dueDate: "November 20, 2026",
    priority: "Normal",
    status: "Pending",
  },
];
