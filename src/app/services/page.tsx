import type { Metadata } from "next";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { Container } from "@/components/ui/container";
import { CornerMarks } from "@/components/ui/corner-marks";
import { DisciplineMarker } from "@/components/ui/discipline-marker";
import { PageIntro } from "@/components/ui/page-intro";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Ways to collaborate with Khai Space: software and digital, embedded and IoT, design and prototyping, and research and experiments.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Services"
        title="Ways we can work together."
        lead="Khai Space is an independent studio, so collaboration is hands-on and project by project. Here is where it can help."
      />

      <section aria-label="Capability areas" className="py-20 sm:py-28">
        <Container>
          <ol className="border-t border-foreground/30">
            {services.map((service, i) => {
              const n = String(i + 1).padStart(2, "0");
              return (
                <li
                  key={service.title}
                  className="grid gap-8 border-b border-border py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-14"
                >
                  <div className="flex gap-5 lg:block">
                    <div className="relative h-16 w-16 shrink-0 border border-border bg-surface p-3.5 text-primary lg:h-20 lg:w-20 lg:p-4">
                      <CornerMarks />
                      <DisciplineMarker kind={service.marker} />
                    </div>
                    <div className="lg:mt-8">
                      <p className="font-heading text-xs font-semibold text-muted">
                        Discipline {n}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                        {service.title}
                      </h2>
                      <p className="mt-3 max-w-sm text-muted">
                        {service.summary}
                      </p>
                    </div>
                  </div>
                  <div className="lg:pt-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Possible scope
                    </p>
                    <ul className="mt-4 border-t border-foreground/30">
                      {service.scope.map((item, j) => (
                        <li
                          key={item}
                          className="flex gap-4 border-b border-border py-4 text-[0.95rem]"
                        >
                          <span className="w-8 shrink-0 font-heading text-xs font-semibold text-primary">
                            {i + 1}.{j + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-8 flex max-w-2xl items-start gap-3 text-sm text-muted">
            <span aria-hidden className="mt-2 h-px w-8 shrink-0 bg-accent" />
            Scope, timing and fit are discussed openly up front. If an idea is
            outside what Khai Space can do well, that will be said plainly.
          </p>
        </Container>
      </section>

      <CollaborationCta
        title="Have a project to discuss?"
        copy="Share what you have in mind and let's see whether there is a good fit."
        label="Discuss a Project"
      />
    </>
  );
}
