export type ProjectStatus =
  | "Draft concept"
  | "In development"
  | "Completed"
  | "Ongoing Experiment";

export type ProjectVisualKind = "software" | "iot" | "agri" | "prototype";

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  status: ProjectStatus;
  visual: ProjectVisualKind;
  /** Optional cover image path (under /public). Falls back to generated visual. */
  cover?: string;
  /** Only set once a real project page exists. */
  href?: string;
};

/**
 * Static project content.
 * All entries below are DRAFT placeholders — no case studies, metrics or
 * client names. Update summary/status/href as real details become ready.
 */
export const projects: readonly Project[] = [
  {
    slug: "biztrack",
    title: "BizTrack",
    category: "Software / SaaS",
    summary:
      "A business tracking concept exploring practical tools for everyday operations.",
    status: "Draft concept",
    visual: "software",
  },
  {
    slug: "smart-rain-gauge",
    title: "Smart Rain Gauge",
    category: "IoT / Embedded Systems",
    summary:
      "A connected rainfall measurement device concept built around embedded sensing.",
    status: "Draft concept",
    visual: "iot",
  },
  {
    slug: "hidroponik",
    title: "Panduan Hidroponik Pak Choy Hijau",
    category: "Smart Agriculture / Hydroponics",
    summary:
      "Interactive guide and growth journal tracking daily Kratky passive hydroponics progress, nutrient mixing, and seedling health.",
    status: "Ongoing Experiment",
    visual: "agri",
    cover: "/projects/hidroponik/assets/hari-13-takung-biru-penuh.jpg",
    href: "/projects/hidroponik/",
  },
  {
    slug: "pixelpop",
    title: "PixelPop: Mainan Refleks & Memori",
    category: "3D Printing & Embedded Systems",
    summary:
      "Projek penyertaan Domechy Maker Challenge x Creality — mainan refleks interaktif berasaskan Cytron Maker ESP32 dan reka bentuk 3D mesra kanak-kanak.",
    status: "In development",
    visual: "prototype",
    href: "/projects/pixelpop/",
  },
  {
    slug: "air-fryer-dashboard",
    title: "Air Fryer Dada Ayam Chef",
    category: "Culinary & Lifestyle Utility",
    summary:
      "Dashboard interaktif 5 menu dada ayam seminggu (400g / 2 pax) menggunakan gabungan rempah minimalis, kalkulator kos Lotus's, dan pemasa masakan.",
    status: "Completed",
    visual: "software",
    href: "/projects/air-fryer-dashboard/",
  },
  {
    slug: "3d-printing-prototyping",
    title: "3D Printing & Prototyping",
    category: "Engineering",
    summary:
      "Turning CAD concepts into physical prototypes through iterative printing.",
    status: "Draft concept",
    visual: "prototype",
  },
];

