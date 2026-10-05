import { ProjectCard } from "@/components/projects/project-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { projects } from "@/content/projects";

export function FeaturedProjects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="scroll-mt-16 py-20 sm:py-28"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="projects-title"
            eyebrow="Featured Projects"
            title="Selected explorations and builds."
          />
          <p className="max-w-xs border-l-2 border-accent pl-4 text-sm text-muted">
            Project details are being prepared. Entries below are draft
            concepts.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
