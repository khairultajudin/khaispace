import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Cpu, Sparkles } from "lucide-react";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { HowWeWork } from "@/components/sections/how-we-work";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceIcon } from "@/components/ui/service-icon";
import { services } from "@/content/services";
import { studioTechAreas } from "@/content/studio";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Khai Space — an independent interactive digital studio turning practical ideas into web applications, AI workflows, IoT prototypes, and custom digital solutions.",
  alternates: { canonical: "/about" },
};

const studioPrinciples = [
  {
    icon: Compass,
    title: "Curiosity Grounded in Real Use",
    text: "We enjoy exploring new technology, but every studio project is judged by whether it solves a real problem simply and reliably.",
  },
  {
    icon: Cpu,
    title: "Cross-Disciplinary Craft",
    text: "Software, structured AI workflows, environmental sensing, and physical 3D prototyping often reinforce each other when treated as one connected craft.",
  },
  {
    icon: Sparkles,
    title: "Transparent Scope & Honest Delivery",
    text: "No exaggerated claims, fabricated metrics, or bloated retainers. We communicate trade-offs clearly and build incrementally.",
  },
] as const;

const verifiedFocusTrack = [
  "Production multi-tenant web applications for small-business operations and fee workflows",
  "Custom digital publishing suites combining interactive reading, data visualization, and web comics",
  "Self-contained web utilities and static-first sites deployed cleanly on Cloudflare Pages",
  "Hands-on passive hydroponics growth tracking, ESP32 sensing experiments, and 3D CAD prototyping",
  "Structured AI triage prototypes built around deterministic schema validation and human review",
] as const;

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About Khai Space"
        title="Turning practical ideas into reliable digital solutions."
        lead="Khai Space is an independent interactive digital studio based in Malaysia — built around hands-on software engineering, applied AI workflows, and physical-digital prototyping."
        actions={
          <ButtonLink href="/start-a-project">
            <span>Start a Project</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        }
      />

      {/* Studio Story & Principles */}
      <section aria-labelledby="studio-story-title" className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <SectionHeading
            id="studio-story-title"
            eyebrow="Studio Philosophy"
            title="Built for people who have a real problem worth solving."
            description="Great technology does not have to feel intimidating or over-engineered. Khai Space bridges the gap between an early idea and a working, maintainable product."
          />

          <div className="space-y-5">
            {studioPrinciples.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="studio-card flex gap-4 rounded-2xl p-6"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-electric">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-navy">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Capabilities Snapshot */}
      <section
        aria-labelledby="about-capabilities-title"
        className="border-y border-border bg-surface py-16 sm:py-24"
      >
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              id="about-capabilities-title"
              eyebrow="Capabilities"
              title="Six areas where Khai Space helps."
            />
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:text-navy"
            >
              <span>See Full Service Details</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services#${service.slug}`}
                className="flex items-start gap-3.5 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-electric/40 hover:bg-primary-soft/30"
              >
                <ServiceIcon name={service.icon} accent={service.accent} />
                <div>
                  <h3 className="font-heading text-base font-bold text-navy">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {service.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Technology Areas */}
      <section
        aria-labelledby="tech-areas-title"
        className="py-16 sm:py-24"
      >
        <Container>
          <SectionHeading
            id="tech-areas-title"
            eyebrow="Technology Areas"
            title="Modern, dependable tools chosen for longevity."
            description="We pick pragmatic, well-supported technologies that remain fast to iterate on and straightforward to hand over."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {studioTechAreas.map((group) => (
              <div
                key={group.area}
                className="studio-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-navy">{group.area}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-navy"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Verified Hands-on Experience */}
      <section
        aria-labelledby="verified-experience-title"
        className="border-t border-border bg-surface-muted/65 py-16 sm:py-24"
      >
        <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeading
            id="verified-experience-title"
            eyebrow="Verified Track"
            title="What has actually been built in the studio."
            description="Everything showcased on khaispace.com reflects real studio builds, documented experiments, or clearly labeled interactive prototypes."
          />

          <ul className="studio-card space-y-4 rounded-2xl p-6 sm:p-8">
            {verifiedFocusTrack.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-navy sm:text-base"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-electric"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <HowWeWork />

      <CollaborationCta
        eyebrow="Work With Khai Space"
        title="Let's explore what we can build together."
        copy="Whether you are mapping a first prototype or upgrading an existing workflow, start with a quick brief or message us on WhatsApp."
      />
    </>
  );
}
