import Link from "next/link";
import { ArrowRight, FlaskConical, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { labPreviewItems } from "@/content/studio";

export function LabPreview() {
  return (
    <section
      id="lab-preview"
      aria-labelledby="lab-preview-title"
      className="border-y border-border bg-surface-muted/70 py-16 sm:py-24"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="lab-preview-title"
            eyebrow="Interactive Lab"
            title="Test studio concepts directly in your browser."
            description="Try safe, self-contained demonstrations of dashboards, workflow automation, and simulated IoT monitoring — built purely with synthetic data."
          />
          <ButtonLink href="/lab" variant="navy" size="sm">
            <FlaskConical className="h-4 w-4" aria-hidden />
            <span>Open Interactive Lab</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {labPreviewItems.map((item) => (
            <Link
              key={item.id}
              href={`/lab#${item.id}`}
              className="studio-card studio-card-interactive group flex flex-col justify-between rounded-2xl p-6"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-violet">
                    {item.category}
                  </span>
                  <span className="rounded-full border border-cyan/30 bg-cyan-soft px-2.5 py-0.5 text-xs font-semibold text-[#0E7490]">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-navy transition-colors group-hover:text-electric">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-electric">
                <span>Launch in Lab</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-electric" aria-hidden />
          All Interactive Lab demos run locally in your browser using synthetic
          sample data — never connected to live client accounts or production
          databases.
        </p>
      </Container>
    </section>
  );
}
