import { HeroArtwork } from "@/components/sections/hero-artwork";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site";

const pillars = siteConfig.tagline.split(" · ");

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-border"
    >
      <div
        aria-hidden
        className="blueprint-grid blueprint-fade absolute inset-0"
      />
      <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-28">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span aria-hidden className="h-px w-8 bg-accent" />
            {siteConfig.positioning}
          </p>
          <h1
            id="hero-title"
            className="mt-7 text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-[3.75rem]"
          >
            Ideas into reality.{" "}
            <span className="text-primary">
              Through technology and thoughtful design.
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/#projects">Explore Projects</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Get in Touch
            </ButtonLink>
          </div>
        </div>

        <figure className="mx-auto w-full max-w-sm lg:max-w-none">
          <HeroArtwork className="h-auto w-full" />
          <figcaption className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>Fig. 01</span>
            <span>Concept study: software, embedded, prototype</span>
          </figcaption>
        </figure>
      </Container>

      <div className="relative border-t border-border bg-background/70">
        <Container>
          <ul className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {pillars.map((pillar, i) => (
              <li
                key={pillar}
                className="flex items-center gap-3 py-4 text-sm font-medium sm:px-6 sm:first:pl-0"
              >
                <span className="font-heading text-xs text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {pillar}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
