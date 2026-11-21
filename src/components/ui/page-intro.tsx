import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  lead: string;
  actions?: ReactNode;
};

/** Shared inner-page header. Renders the page's single <h1>. */
export function PageIntro({ eyebrow, title, lead, actions }: PageIntroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface/60">
      <div
        aria-hidden
        className="studio-grid studio-grid-fade absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet/8 blur-3xl"
      />

      <Container className="relative py-14 sm:py-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-electric/20 bg-primary-soft px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-electric">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-electric" />
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {lead}
        </p>
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </Container>
    </section>
  );
}
