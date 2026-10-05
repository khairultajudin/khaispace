import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { CornerMarks } from "@/components/ui/corner-marks";

type CollaborationCtaProps = {
  title?: string;
  copy?: string;
  label?: string;
  href?: string;
};

export function CollaborationCta({
  title = "Have an idea worth building?",
  copy = "Whether it's a digital solution, technical project, or a new collaboration, let's explore what's possible.",
  label = "Start a Conversation",
  href = "/contact",
}: CollaborationCtaProps) {
  return (
    <section
      aria-labelledby="cta-title"
      className="px-4 pb-20 sm:px-6 sm:pb-28"
    >
      <Container className="relative overflow-hidden border border-border bg-primary-soft px-6 py-16 sm:px-14 sm:py-20">
        <div
          aria-hidden
          className="blueprint-grid absolute inset-0 opacity-70 [mask-image:linear-gradient(to_left,#000,transparent_70%)]"
        />
        <svg
          aria-hidden
          focusable="false"
          viewBox="0 0 120 120"
          fill="none"
          className="absolute -right-4 -top-4 hidden h-40 w-40 sm:block"
        >
          <circle cx="60" cy="60" r="36" stroke="var(--primary)" strokeOpacity="0.45" />
          <circle cx="60" cy="60" r="18" stroke="var(--primary)" strokeOpacity="0.45" strokeDasharray="2 4" />
          <path d="M10 60H110M60 10V110" stroke="var(--primary)" strokeOpacity="0.35" />
          <rect x="55" y="55" width="10" height="10" fill="var(--accent)" />
        </svg>
        <CornerMarks />
        <div className="relative max-w-2xl">
          <h2
            id="cta-title"
            className="text-3xl font-semibold leading-tight sm:text-5xl"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            {copy}
          </p>
          <ButtonLink href={href} className="mt-9">
            {label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
