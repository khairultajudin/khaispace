import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { projects, projectStatuses } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Search and filter authentic Khai Space builds, web applications, interactive publishing suites, hydroponics experiments, and studio prototypes.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Projects Directory"
        title="Explore authentic builds, experiments, and studio prototypes."
        lead="Search by keyword or filter by service category and project status. Every production build, active experiment, prototype, and studio concept is clearly labeled."
        actions={
          <ButtonLink href="/start-a-project" size="sm">
            <span>Have a Similar Project?</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        }
      />

      <section aria-label="Project explorer" className="py-14 sm:py-20">
        <Container>
          <ProjectExplorer items={projects} statuses={projectStatuses} />
        </Container>
      </section>

      <CollaborationCta
        eyebrow="Build With Khai Space"
        title="Want to create something tailored to your own workflow?"
        copy="Share the outcome you are aiming for and we can scope a focused first version together."
      />
    </>
  );
}
