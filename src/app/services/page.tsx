import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  PackageCheck,
} from "lucide-react";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { ServiceIcon } from "@/components/ui/service-icon";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { getProjectBySlug } from "@/content/projects";
import { services } from "@/content/services";
import { buildServiceInquiryMessage } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore six core capabilities at Khai Space: AI & Automation, Web Applications, IoT & Engineering, Custom Digital Solutions, Website Design, and Technical Consulting.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Services"
        title="Practical digital capabilities built around real problems."
        lead="Khai Space partners directly with individuals, creators, founders, and small businesses across six core disciplines. Scope, trade-offs, and fit are always discussed openly up front."
        actions={
          <>
            <ButtonLink href="/start-a-project">
              <span>Build a Project Brief</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="/start-a-project?tab=estimator"
              variant="secondary"
            >
              <span>Estimate Project Scope</span>
            </ButtonLink>
            <WhatsAppCta label="Ask on WhatsApp" variant="outline" />
          </>
        }
      />

      {/* Quick Category Jump Bar */}
      <nav
        aria-label="Jump to service category"
        className="border-b border-border bg-surface py-4"
      >
        <Container className="flex flex-wrap gap-2">
          {services.map((service) => (
            <a
              key={service.slug}
              href={`#${service.slug}`}
              className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-electric hover:bg-primary-soft hover:text-electric sm:text-sm"
            >
              {service.title}
            </a>
          ))}
        </Container>
      </nav>

      {/* Six Service Categories */}
      <section aria-label="Service categories" className="py-14 sm:py-20">
        <Container className="space-y-10">
          {services.map((service, index) => {
            const relatedProjects = service.relatedProjectSlugs
              .map((slug) => getProjectBySlug(slug))
              .filter((project): project is NonNullable<typeof project> =>
                Boolean(project),
              );

            return (
              <article
                key={service.slug}
                id={service.slug}
                className="studio-card scroll-mt-24 overflow-hidden rounded-3xl"
              >
                <div className="border-b border-border bg-surface-muted/55 p-6 sm:p-8 lg:flex lg:items-start lg:justify-between lg:gap-10">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3.5">
                      <ServiceIcon
                        name={service.icon}
                        accent={service.accent}
                      />
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-electric">
                          Service {String(index + 1).padStart(2, "0")}
                        </p>
                        <h2 className="text-2xl font-bold text-navy sm:text-3xl">
                          {service.title}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-4 text-base font-medium text-navy">
                      {service.tagline}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                      {service.summary}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2.5 lg:mt-0 lg:shrink-0 lg:flex-col">
                    <WhatsAppCta
                      label={`Discuss ${service.shortTitle}`}
                      message={buildServiceInquiryMessage(service.title)}
                      size="sm"
                    />
                    <ButtonLink
                      href={`/start-a-project?service=${service.slug}`}
                      variant="secondary"
                      size="sm"
                    >
                      <span>Start Brief</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </ButtonLink>
                  </div>
                </div>

                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-3">
                  {/* Problems Solved */}
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-navy">
                      <CircleAlert
                        className="h-4 w-4 text-violet"
                        aria-hidden
                      />
                      Problems We Solve
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                      {service.problemsSolved.map((problem) => (
                        <li key={problem} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet"
                          />
                          <span>{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Capabilities */}
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-navy">
                      <CheckCircle2
                        className="h-4 w-4 text-electric"
                        aria-hidden
                      />
                      Core Capabilities
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                      {service.capabilities.map((capability) => (
                        <li key={capability} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-electric"
                          />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliverables */}
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-navy">
                      <PackageCheck
                        className="h-4 w-4 text-[#0891B2]"
                        aria-hidden
                      />
                      Typical Deliverables
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                      {service.deliverables.map((deliverable) => (
                        <li key={deliverable} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan"
                          />
                          <span>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Related Projects Strip */}
                {relatedProjects.length > 0 && (
                  <div className="border-t border-border bg-background/70 px-6 py-4 sm:px-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                        Related Work:
                      </span>
                      {relatedProjects.map((project) => (
                        <Link
                          key={project.slug}
                          href={`/projects/${project.slug}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
                        >
                          <span>{project.title}</span>
                          <span className="text-muted">({project.status})</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </Container>
      </section>

      <CollaborationCta
        eyebrow="Not Sure Which Category Fits?"
        title="Tell us the problem — we will help map the simplest solution."
        copy="Many ideas combine web software, light automation, or custom interfaces. Use our guided Project Brief Builder or message Khai Space directly on WhatsApp."
      />
    </>
  );
}
