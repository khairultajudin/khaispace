import type { DisciplineKind } from "@/components/ui/discipline-marker";

export type Service = {
  title: string;
  summary: string;
  scope: readonly string[];
  marker: DisciplineKind;
};

/** Honest, early-stage scope descriptions. No delivery-scale claims. */
export const services: readonly Service[] = [
  {
    title: "Software & Digital",
    summary: "Web applications, automation and digital platforms.",
    marker: "software",
    scope: [
      "Small web applications and internal tools",
      "Automating repetitive digital tasks",
      "Prototyping digital product ideas",
    ],
  },
  {
    title: "Embedded & IoT",
    summary: "Connected devices, monitoring and smart systems.",
    marker: "iot",
    scope: [
      "Sensor-based monitoring concepts",
      "Connected device prototypes",
      "Linking hardware readings to simple dashboards",
    ],
  },
  {
    title: "Design & Prototyping",
    summary: "3D printing, CAD concepts and physical prototypes.",
    marker: "prototype",
    scope: [
      "CAD concepts for parts and enclosures",
      "3D-printed prototypes and iterations",
      "Turning a sketch into a testable object",
    ],
  },
  {
    title: "Research & Experiments",
    summary: "Exploring ideas, testing concepts and learning by building.",
    marker: "research",
    scope: [
      "Proof-of-concept builds",
      "Feasibility exploration for early ideas",
      "Documenting what was tried and learned",
    ],
  },
];
