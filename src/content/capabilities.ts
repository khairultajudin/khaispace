import type { DisciplineKind } from "@/components/ui/discipline-marker";

export type Capability = {
  title: string;
  description: string;
  tone: "blue" | "green" | "neutral";
  marker: DisciplineKind;
};

export const capabilities: readonly Capability[] = [
  {
    title: "Software & Digital",
    description: "Web applications, automation and digital platforms.",
    tone: "blue",
    marker: "software",
  },
  {
    title: "Embedded & IoT",
    description: "Connected devices, monitoring and smart systems.",
    tone: "green",
    marker: "iot",
  },
  {
    title: "Design & Prototyping",
    description: "3D printing, CAD concepts and physical prototypes.",
    tone: "neutral",
    marker: "prototype",
  },
  {
    title: "Research & Experiments",
    description:
      "Exploring ideas, testing concepts and learning by building.",
    tone: "blue",
    marker: "research",
  },
];
