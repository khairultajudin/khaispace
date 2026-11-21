import { ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { featuredProjects } from "@/content/projects";

export function FeaturedProjects() {
  return (
    <section
      id="projects"
      aria-labelledby="featured-projects-title"
      className="scroll-mt-20 py-16 sm:py-24"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="featured-projects-title"
            eyebrow="Featured Work"
            title="Real builds, experiments, and digital products."
            description="A transparent look at authentic platforms, interactive readers, engineering experiments, and utilities created at Khai Space."
          />
          <ButtonLink href="/projects" variant="secondary" size="sm">
            <span>Browse All Projects</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {featuredProjects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              priority={index < 2}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
