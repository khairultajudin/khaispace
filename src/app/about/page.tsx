import type { Metadata } from "next";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { Container } from "@/components/ui/container";
import { DisciplineMarker, type DisciplineKind } from "@/components/ui/discipline-marker";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "About",
  description:
    "Khai Space is a personal technology studio built around curiosity, experimentation and practical problem-solving.",
  alternates: { canonical: "/about" },
};

const philosophy = [
  {
    title: "Curiosity",
    text: "Every project starts with a question worth asking, and a willingness to look at it from more than one angle.",
  },
  {
    title: "Experimentation",
    text: "Ideas are tested by making them. Prototypes, small builds and honest iteration beat speculation.",
  },
  {
    title: "Practical problem-solving",
    text: "The goal is something that works in the real world: simple, useful and understandable.",
  },
] as const;

const approach = [
  { step: "Explore", text: "Understand the problem, the context and the constraints." },
  { step: "Design", text: "Shape a clear concept through sketches, models and structure." },
  { step: "Build", text: "Turn the concept into working software or a physical prototype." },
  { step: "Refine", text: "Test, learn and improve until it does its job well." },
] as const;

const interests: ReadonlyArray<{ label: string; marker: DisciplineKind }> = [
  { label: "Software", marker: "software" },
  { label: "Engineering", marker: "research" },
  { label: "Embedded systems", marker: "iot" },
  { label: "Prototyping", marker: "prototype" },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="Curiosity drives creation."
        lead="Khai Space is a personal technology studio built around curiosity, experimentation, and practical problem-solving."
      />

      <section aria-labelledby="what-title" className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            id="what-title"
            eyebrow="What it is"
            title="An independent studio for ideas that need building."
          />
          <div className="relative border-l border-foreground/30 pl-6 sm:pl-10">
            <span
              aria-hidden
              className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent"
            />
            <div className="max-w-xl space-y-6 text-lg leading-relaxed text-muted">
              <p>
                Khai Space is an independent technology and innovation studio.
                It explores and builds solutions across software, engineering
                and digital innovation.
              </p>
              <p>
                From digital products to physical prototypes, every project
                begins with an idea and grows through exploration.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="philosophy-title"
        className="border-y border-border bg-surface-muted/60 py-20 sm:py-28"
      >
        <Container>
          <SectionHeading
            id="philosophy-title"
            eyebrow="Philosophy"
            title="Three ideas behind the work."
          />
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
            {philosophy.map((item, i) => (
              <li
                key={item.title}
                className="border-t border-foreground/30 pt-6 md:pr-8 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-l-border md:[&:not(:first-child)]:pl-8"
              >
                <span className="font-heading text-sm font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="approach-title" className="py-20 sm:py-28">
        <Container>
          <SectionHeading
            id="approach-title"
            eyebrow="Working approach"
            title="Explore, design, build, refine."
          />
          <ol className="mt-16 ml-1.5 grid gap-0 lg:grid-cols-4 lg:gap-8">
            {approach.map((item, i) => (
              <li
                key={item.step}
                className="relative border-l border-foreground/30 pb-10 pl-8 last:pb-0 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-8"
              >
                <span
                  aria-hidden
                  className={
                    "absolute -left-[6px] top-0 h-3 w-3 lg:-top-[6px] lg:left-0 " +
                    (i === approach.length - 1 ? "bg-accent" : "bg-primary")
                  }
                />
                <p className="font-heading text-xs font-semibold text-muted">
                  Step {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{item.step}</h3>
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-12 flex items-center gap-3 text-sm text-muted">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Refinement often leads back to exploration.
          </p>
        </Container>
      </section>

      <section
        aria-labelledby="interests-title"
        className="border-t border-border pb-20 pt-20 sm:pb-28 sm:pt-28"
      >
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            id="interests-title"
            eyebrow="Areas of interest"
            title="Where the curiosity leads."
          />
          <ul className="grid border-t border-foreground/30 sm:grid-cols-2 sm:gap-x-10">
            {interests.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-4 border-b border-border py-5"
              >
                <span className="h-9 w-9 shrink-0 text-primary">
                  <DisciplineMarker kind={item.marker} />
                </span>
                <span className="font-heading text-lg font-semibold">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CollaborationCta
        title="Curious what we could build together?"
        copy="If you have an idea, a question or a project in mind, get in touch and let's talk it through."
        label="Get in Touch"
      />
    </>
  );
}
