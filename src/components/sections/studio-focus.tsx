import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const FOCUS_AREAS = [
  {
    code: "01",
    area: "Software & Web Engineering",
    title: "Full-Stack Web Applications & Internal Tools",
    summary:
      "Design and engineering of resilient web platforms, structured data systems, and focused operational dashboards built for clarity and longevity.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Cloud Architecture"],
  },
  {
    code: "02",
    area: "Applied AI & Automation",
    title: "Workflow Automation & Practical AI Systems",
    summary:
      "Integrating language models, structured validation, and automated pipelines into real-world workflows without sacrificing reliability or control.",
    tags: ["AI Workflows", "Data Pipelines", "Structured Output", "Tooling"],
  },
  {
    code: "03",
    area: "Embedded & Physical Prototyping",
    title: "Hardware Exploration, CAD & Iterative Fabrication",
    summary:
      "Connecting microcontrollers, environmental sensing, and 3D-printed enclosures to turn early hardware concepts into tangible prototypes.",
    tags: ["ESP32", "IoT Sensing", "3D CAD", "Rapid Prototyping"],
  },
  {
    code: "04",
    area: "Editorial & Digital Product Design",
    title: "Structured Publishing & Thoughtful Interfaces",
    summary:
      "Crafting calm, typography-led digital reading experiences, interactive utilities, and maintainable design systems.",
    tags: ["Design Systems", "Interactive UI", "Editorial Web", "Documentation"],
  },
] as const;

export function StudioFocus() {
  return (
    <section
      id="focus"
      aria-labelledby="studio-focus-title"
      className="scroll-mt-16 py-20 sm:py-28"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="studio-focus-title"
            eyebrow="Studio Focus"
            title="What we design and build."
          />
          <p className="max-w-xs border-l-2 border-accent pl-4 text-sm text-muted">
            Khai Space focuses on practical software, applied engineering, and
            disciplined product craft across select domains.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FOCUS_AREAS.map((item) => (
            <article
              key={item.code}
              className="flex flex-col justify-between border border-border bg-surface p-7 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {item.area}
                  </span>
                  <span className="font-heading text-xs text-muted">
                    {item.code}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.summary}
                </p>
              </div>

              <ul className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                {item.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-border bg-background px-2.5 py-1 text-xs text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-start">
          <ButtonLink href="/services" variant="secondary">
            View Studio Services
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

