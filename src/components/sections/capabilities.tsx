import { Container } from "@/components/ui/container";
import { DisciplineMarker } from "@/components/ui/discipline-marker";
import { SectionHeading } from "@/components/ui/section-heading";
import { capabilities } from "@/content/capabilities";

export function Capabilities() {
  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-title"
      className="scroll-mt-16 border-b border-border bg-surface-muted/60 py-20 sm:py-28"
    >
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="self-start lg:sticky lg:top-28">
          <SectionHeading
            id="capabilities-title"
            eyebrow="What We Explore"
            title="Exploring ideas across disciplines."
          />
        </div>
        <ol className="border-t border-foreground/30">
          {capabilities.map((item, i) => (
            <li
              key={item.title}
              className="group flex gap-5 border-b border-border py-7 transition-colors duration-200 hover:bg-surface/70 sm:gap-7 sm:px-2"
            >
              <div className="h-12 w-12 shrink-0 text-primary transition-colors duration-200 group-hover:text-accent-strong sm:h-14 sm:w-14">
                <DisciplineMarker kind={item.marker} />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xs font-semibold text-muted">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1.5 text-xl font-semibold sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-md text-muted">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
