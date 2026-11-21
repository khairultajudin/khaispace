import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceIcon } from "@/components/ui/service-icon";
import { services } from "@/content/services";

export function ServicesOverview() {
  return (
    <section
      id="services"
      aria-labelledby="services-overview-title"
      className="scroll-mt-20 border-y border-border bg-surface py-16 sm:py-24"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="services-overview-title"
            eyebrow="Services"
            title="Six ways Khai Space turns ideas into working digital systems."
            description="Every engagement is scoped honestly around what you actually need — from a focused prototype to a production web application."
          />
          <ButtonLink href="/services" variant="secondary" size="sm">
            <span>View Full Services</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services#${service.slug}`}
              className="studio-card studio-card-interactive group flex flex-col justify-between rounded-2xl p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <ServiceIcon name={service.icon} accent={service.accent} />
                  <ArrowUpRight
                    className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-electric"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-5 text-xl font-bold text-navy transition-colors group-hover:text-electric">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {service.summary}
                </p>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-medium text-navy">
                  {service.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
