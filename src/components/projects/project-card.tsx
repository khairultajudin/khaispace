import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectVisual } from "@/components/projects/project-visual";
import type { ProjectItem, ProjectStatus } from "@/content/projects";
import { cn } from "@/lib/cn";

const statusStyles: Record<ProjectStatus, string> = {
  Production: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Live: "bg-primary-soft text-electric border-electric/20",
  "Active Experiment": "bg-cyan-soft text-[#0E7490] border-cyan/30",
  Completed: "bg-navy-soft text-navy border-navy/15",
  Prototype: "bg-violet-soft text-violet border-violet/20",
  "Studio Concept": "bg-amber-50 text-amber-800 border-amber-200",
  "Interactive Demo": "bg-violet-soft text-violet border-violet/20",
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

export function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectItem;
  priority?: boolean;
}) {
  return (
    <article className="studio-card studio-card-interactive group flex h-full flex-col overflow-hidden rounded-2xl">
      <Link
        href={`/projects/${project.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-electric"
      >
        <ProjectVisual project={project} priority={priority} />
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-electric">
            {project.categoryLabel}
          </span>
          <ProjectStatusBadge status={project.status} />
        </div>

        <h3 className="mt-3 text-xl font-bold text-navy transition-colors group-hover:text-electric">
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="mt-1 text-xs font-medium text-muted">{project.subtitle}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {project.summary}
        </p>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((tech) => (
            <li
              key={tech}
              className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-navy"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric transition-colors hover:text-navy"
          >
            <span>Explore Case Study</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          {project.demoHref && (
            <Link
              href={project.demoHref}
              className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-electric transition-colors hover:bg-electric hover:text-white"
            >
              Demo
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
