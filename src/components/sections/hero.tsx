import { ArrowRight, CheckCircle2 } from "lucide-react";
import { HeroVisual } from "@/components/sections/hero-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { siteConfig } from "@/lib/site";

const audienceHighlights = [
  "Individuals turning ideas into real tools",
  "Freelancers, creators & entrepreneurs",
  "Small businesses modernizing workflows",
] as const;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-border bg-surface/55"
    >
      <div
        aria-hidden
        className="studio-grid studio-grid-fade absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-12 h-80 w-80 rounded-full bg-electric/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-violet/8 blur-3xl"
      />

      <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-electric/20 bg-primary-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-electric">
            <span aria-hidden className="h-2 w-2 rounded-full bg-cyan" />
            {siteConfig.name} · {siteConfig.positioning}
          </p>

          <h1
            id="hero-title"
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-5xl lg:text-[3.65rem]"
          >
            Ideas into{" "}
            <span className="studio-gradient-text">Digital Solutions.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Khai Space helps individuals, creators, entrepreneurs, and small
            businesses turn practical ideas and operational challenges into
            clean web applications, AI workflows, IoT prototypes, and modern
            websites.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/start-a-project" size="lg">
              <span>Start a Project</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary" size="lg">
              Explore Projects
            </ButtonLink>
            <WhatsAppCta
              label="WhatsApp Directly"
              variant="outline"
              size="lg"
            />
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-xs font-medium text-muted sm:text-sm">
            {audienceHighlights.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-electric"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}
