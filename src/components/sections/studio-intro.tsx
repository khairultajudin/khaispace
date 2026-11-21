import Link from "next/link";
import { ArrowRight, Lightbulb, Sparkles, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const studioPillars = [
  {
    icon: Lightbulb,
    title: "Start With Any Real Problem",
    description:
      "You do not need a 30-page specification. Bring an idea, a bottleneck, or a rough workflow — we help shape it into an actionable technical direction.",
    accent: "bg-primary-soft text-electric",
  },
  {
    icon: Wrench,
    title: "Built Across Software, AI & Hardware",
    description:
      "From responsive web apps and structured AI automation to ESP32 sensors and 3D-printed prototypes, Khai Space connects disciplines cleanly.",
    accent: "bg-violet-soft text-violet",
  },
  {
    icon: Sparkles,
    title: "Interactive, Not Just Static Slides",
    description:
      "Explore authentic builds, test synthetic simulations in our Interactive Lab, and draft your scope with our guided Project Brief Builder.",
    accent: "bg-cyan-soft text-[#0891B2]",
  },
] as const;

export function StudioIntro() {
  return (
    <section
      aria-labelledby="studio-intro-title"
      className="py-16 sm:py-24"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="studio-intro-title"
            eyebrow="The Studio"
            title="A practical digital studio built for builders, founders, and problem-solvers."
            description="Whether you are launching a fresh concept, replacing manual spreadsheets, or prototyping a connected device, we focus on clear engineering that works in everyday use."
          />
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric transition-colors hover:text-navy"
          >
            <span>More About Khai Space</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {studioPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="studio-card flex flex-col rounded-2xl p-6 sm:p-7"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${pillar.accent}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold text-navy">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
