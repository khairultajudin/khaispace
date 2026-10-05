import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeading } from "@/components/ui/section-heading";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected explorations and builds from Khai Space across software, IoT, smart agriculture and prototyping. Current entries are draft concepts.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const drafts = projects.filter((p) => p.status === "Draft concept");
  const inProgress = projects.filter((p) => p.status === "In development");
  const completed = projects.filter((p) => p.status === "Completed");

  return (
    <>
      <PageIntro
        eyebrow="Projects"
        title="Selected explorations and builds."
        lead="A look at the ideas Khai Space is exploring across software, embedded systems and physical prototyping."
      />

      <nav
        aria-label="Project index"
        className="border-b border-border bg-surface-muted/60"
      >
        <Container>
          <ol className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {projects.map((project, i) => (
              <li key={project.slug} className="lg:px-6 lg:first:pl-0">
                <Link
                  href={`#${project.slug}`}
                  className="group flex items-baseline gap-3 py-4 transition-colors"
                >
                  <span className="font-heading text-xs font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold group-hover:text-primary">
                      {project.title}
                    </span>
                    <span className="block text-xs text-muted">
                      {project.category}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </nav>

      {completed.length > 0 && (
        <ProjectGroup
          id="completed"
          eyebrow="Completed"
          title="Public projects."
          items={completed}
        />
      )}

      {inProgress.length > 0 && (
        <ProjectGroup
          id="in-development"
          eyebrow="In development"
          title="Currently being built."
          items={inProgress}
        />
      )}

      <section aria-labelledby="drafts-title" className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              id="drafts-title"
              eyebrow="Draft concepts"
              title="Ideas still taking shape."
            />
            <p className="max-w-xs border-l-2 border-accent pl-4 text-sm text-muted">
              These are early concepts, not finished products. Project pages
              will be added as real details are ready.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {drafts.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                index={projects.indexOf(project)}
              />
            ))}
          </div>
          {completed.length === 0 && (
            <p className="mt-10 border border-dashed border-border px-6 py-4 text-sm text-muted">
              No completed public projects are listed yet.
            </p>
          )}
        </Container>
      </section>

      <CollaborationCta
        title="Have an idea of your own?"
        copy="If one of these explorations resonates, or you have something different in mind, let's talk."
      />
    </>
  );
}

function ProjectGroup({
  id,
  eyebrow,
  title,
  items,
}: {
  id: string;
  eyebrow: string;
  title: string;
  items: typeof projects;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="py-20 sm:py-28">
      <Container>
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={projects.indexOf(project)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
