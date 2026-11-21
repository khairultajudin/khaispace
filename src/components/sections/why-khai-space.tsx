import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { whyKhaiSpacePillars } from "@/content/studio";
import { cn } from "@/lib/cn";

const badgeAccents = {
  blue: "bg-primary-soft text-electric border-electric/20",
  violet: "bg-violet-soft text-violet border-violet/20",
  cyan: "bg-cyan-soft text-[#0891B2] border-cyan/30",
  navy: "bg-navy-soft text-navy border-navy/15",
} as const;

export function WhyKhaiSpace() {
  return (
    <section
      id="why-khai-space"
      aria-labelledby="why-khai-space-title"
      className="border-t border-border bg-surface py-16 sm:py-24"
    >
      <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
        <SectionHeading
          id="why-khai-space-title"
          eyebrow="Why Khai Space"
          title="Honest engineering with studio-level care."
          description="We avoid hype, inflated promises, and bloated templates — focusing instead on clear communication, clean architecture, and software you can rely on."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {whyKhaiSpacePillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                  badgeAccents[pillar.accent],
                )}
              >
                <Check className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
