import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="scroll-mt-16 border-t border-border py-20 sm:py-28"
    >
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading
          id="about-title"
          eyebrow="About"
          title="Curiosity drives creation."
        />
        <div className="relative border-l border-foreground/30 pl-6 sm:pl-10">
          <span
            aria-hidden
            className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent"
          />
          <div className="max-w-xl space-y-6 text-lg leading-relaxed text-muted">
            <p>
              Khai Space is a personal technology studio built around
              curiosity, experimentation, and practical problem-solving.
            </p>
            <p>
              From digital products to physical prototypes, every project
              begins with an idea and grows through exploration.
            </p>
            <ButtonLink href="/about" variant="ghost" className="!h-auto pt-2">
              More About Khai Space <span aria-hidden>→</span>
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
