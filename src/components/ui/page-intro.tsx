import { Container } from "@/components/ui/container";
import { CornerMarks } from "@/components/ui/corner-marks";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  lead: string;
};

/** Shared inner-page header. Renders the page's single <h1>. */
export function PageIntro({ eyebrow, title, lead }: PageIntroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="blueprint-grid blueprint-fade absolute inset-0"
      />
      <Container className="relative py-16 sm:py-24">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span aria-hidden className="h-px w-8 bg-accent" />
          {eyebrow}
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {lead}
        </p>
        <div
          aria-hidden
          className="relative mt-12 hidden h-px w-full bg-border sm:block"
        >
          <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 bg-primary" />
          <span className="absolute left-1/3 top-1/2 h-3 w-px -translate-y-1/2 bg-border" />
          <span className="absolute left-2/3 top-1/2 h-3 w-px -translate-y-1/2 bg-border" />
          <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 bg-accent" />
          <CornerMarks />
        </div>
      </Container>
    </section>
  );
}
