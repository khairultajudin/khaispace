import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";

type CollaborationCtaProps = {
  eyebrow?: string;
  title?: string;
  copy?: string;
  primaryLabel?: string;
  primaryHref?: string;
  whatsappMessage?: string;
};

export function CollaborationCta({
  eyebrow = "Ready to Build?",
  title = "Have an idea, workflow bottleneck, or project in mind?",
  copy = "Prepare a quick brief in two minutes with our guided Project Brief Builder, or reach out directly on WhatsApp to talk through what is possible.",
  primaryLabel = "Start a Project",
  primaryHref = "/start-a-project",
  whatsappMessage,
}: CollaborationCtaProps) {
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-electric/35 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-violet/30 blur-3xl"
          />

          <div className="relative max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cyan" />
              {eyebrow}
            </p>
            <h2
              id="cta-title"
              className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {copy}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={primaryHref} variant="primary" size="lg">
                <span>{primaryLabel}</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <WhatsAppCta
                label="Message on WhatsApp"
                message={whatsappMessage}
                variant="dark"
                size="lg"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
