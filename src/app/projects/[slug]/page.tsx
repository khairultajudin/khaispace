import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Info,
  Layers,
  Target,
  Wrench,
} from "lucide-react";
import {
  ProjectCard,
  ProjectStatusBadge,
} from "@/components/projects/project-card";
import { ProjectVisual } from "@/components/projects/project-visual";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { getProjectBySlug, projects } from "@/content/projects";
import { getServiceBySlug } from "@/content/services";
import { buildProjectInquiryMessage } from "@/lib/whatsapp";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: `${project.title} — ${project.categoryLabel}`,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.title} | Khai Space`,
      description: project.summary,
      type: "article",
      images: project.coverImage ? [project.coverImage] : undefined,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const relatedService = getServiceBySlug(project.serviceSlug);
  const relatedProjects = projects
    .filter((item) => item.slug !== project.slug)
    .sort((a, b) => {
      const aSame = a.serviceSlug === project.serviceSlug ? 1 : 0;
      const bSame = b.serviceSlug === project.serviceSlug ? 1 : 0;
      return bSame - aSame;
    })
    .slice(0, 2);

  return (
    <>
      {/* Project Header */}
      <section className="relative overflow-hidden border-b border-border bg-surface/70 py-12 sm:py-16">
        <div
          aria-hidden
          className="studio-grid studio-grid-fade absolute inset-0"
        />
        <Container className="relative">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-electric"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>Back to All Projects</span>
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-electric/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-electric">
              {project.categoryLabel}
            </span>
            <ProjectStatusBadge status={project.status} />
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              {project.year}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.08] text-navy sm:text-5xl">
            {project.title}
          </h1>
          <p className="mt-2 font-heading text-lg font-semibold text-electric">
            {project.subtitle}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {project.summary}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {project.demoHref && (
              <ButtonLink href={project.demoHref} variant="navy">
                <span>{project.demoLabel ?? "Explore Demo"}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            )}
            <WhatsAppCta
              label="Discuss a Similar Project"
              message={buildProjectInquiryMessage(project.title)}
            />
            <ButtonLink
              href={`/start-a-project?service=${project.serviceSlug}`}
              variant="secondary"
            >
              <span>Prepare a Brief</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Main Visual & Story */}
      <section className="py-12 sm:py-16">
        <Container className="space-y-12">
          {/* Primary Visual Showcase */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-md">
              <ProjectVisual project={project} priority />
            </div>
            {project.visualNote && (
              <p className="flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-electric"
                  aria-hidden
                />
                <span>{project.visualNote}</span>
              </p>
            )}
          </div>

          {/* Problem / Approach / Outcome Bento */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="studio-card rounded-2xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-soft text-violet">
                <Target className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-xl font-bold text-navy">The Problem</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {project.problem}
              </p>
            </div>

            <div className="studio-card rounded-2xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-electric">
                <Wrench className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-xl font-bold text-navy">Our Approach</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {project.approach}
              </p>
            </div>

            <div className="studio-card rounded-2xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-soft text-[#0891B2]">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-xl font-bold text-navy">
                Verified Outcome
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {project.outcome}
              </p>
            </div>
          </div>

          {/* Features + Tech Stack */}
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="studio-card rounded-2xl p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <Layers className="h-5 w-5 text-electric" aria-hidden />
                Key Features &amp; Highlights
              </h2>
              <ul className="mt-5 space-y-3.5">
                {project.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm leading-relaxed text-muted sm:text-base"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-electric"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-6">
              <div className="studio-card rounded-2xl p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                  <Cpu className="h-5 w-5 text-violet" aria-hidden />
                  Technologies Used
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-navy"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              {relatedService && (
                <div className="rounded-2xl border border-electric/20 bg-primary-soft/60 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-electric">
                    Related Service Area
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-navy">
                    {relatedService.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">
                    {relatedService.tagline}
                  </p>
                  <Link
                    href={`/services#${relatedService.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:text-navy"
                  >
                    <span>View Service Details</span>
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Authentic Visual if Present */}
          {project.galleryImage && project.galleryAlt && (
            <figure className="space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
                <Image
                  src={project.galleryImage}
                  alt={project.galleryAlt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 1080px"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="text-xs text-muted">
                Additional view — {project.galleryAlt}
              </figcaption>
            </figure>
          )}
        </Container>
      </section>

      {/* Related Projects */}
      <section
        aria-labelledby="related-projects-title"
        className="border-t border-border bg-surface py-14 sm:py-20"
      >
        <Container>
          <div className="flex items-center justify-between gap-4">
            <h2
              id="related-projects-title"
              className="text-2xl font-bold text-navy sm:text-3xl"
            >
              More From Khai Space
            </h2>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:text-navy"
            >
              <span>All Projects</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {relatedProjects.map((item) => (
              <ProjectCard key={item.slug} project={item} />
            ))}
          </div>
        </Container>
      </section>

      <CollaborationCta
        eyebrow="Interested in Something Similar?"
        title={`Let's talk about building a tailored solution like ${project.title}.`}
        copy="Start a guided project brief or open WhatsApp with a preformatted note referencing this project."
        whatsappMessage={buildProjectInquiryMessage(project.title)}
      />
    </>
  );
}
