import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { howWeWorkSteps } from "@/content/studio";

export function HowWeWork() {
  return (
    <section
      id="how-we-work"
      aria-labelledby="how-we-work-title"
      className="py-16 sm:py-24"
    >
      <Container>
        <SectionHeading
          id="how-we-work-title"
          eyebrow="How We Work"
          title="A clear, low-friction path from idea to launch."
          description="No mysterious black-box process. Every project moves through transparent milestones so you stay in control of scope, priorities, and timing."
        />

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howWeWorkSteps.map((item) => (
            <li
              key={item.step}
              className="studio-card relative flex flex-col rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy font-heading text-xs font-bold text-white">
                  {item.step}
                </span>
                <span
                  aria-hidden
                  className="h-1.5 w-8 rounded-full bg-gradient-to-r from-electric to-cyan"
                />
              </div>
              <h3 className="mt-5 text-lg font-bold text-navy">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
