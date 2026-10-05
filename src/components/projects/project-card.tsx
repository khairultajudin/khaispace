import Image from "next/image";
import Link from "next/link";
import { ProjectVisual } from "@/components/projects/project-visual";
import { CornerMarks } from "@/components/ui/corner-marks";
import type { Project, ProjectVisualKind } from "@/content/projects";
import { cn } from "@/lib/cn";

const tones: Record<ProjectVisualKind, { label: string; rule: string }> = {
  software: { label: "text-primary", rule: "border-t-primary" },
  iot: { label: "text-primary", rule: "border-t-primary" },
  agri: { label: "text-accent-strong", rule: "border-t-accent" },
  prototype: { label: "text-foreground", rule: "border-t-foreground/50" },
};

type ProjectCardProps = {
  project: Project;
  /** Zero-based position, shown as a two-digit case number. */
  index?: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  const { slug, title, category, summary, status, visual, cover, href } =
    project;
  const tone = tones[visual];
  const isDraft = status === "Draft concept";

  return (
    <article
      id={slug}
      className={cn(
        "group flex scroll-mt-24 flex-col border border-t-2 border-border bg-surface transition-colors duration-200 hover:border-primary/60",
        tone.rule,
      )}
    >
      <div className="relative aspect-[8/5] overflow-hidden border-b border-border">
        {cover ? (
          <Image
            src={cover}
            alt={`${title} cover`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <ProjectVisual kind={visual} />
        )}
        <span
          className={cn(
            "absolute left-4 top-4 bg-surface px-2.5 py-1 text-xs font-medium text-accent-strong",
            isDraft ? "border border-dashed border-accent-strong/60" : "border border-border",
          )}
        >
          {status}
        </span>
      </div>
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <CornerMarks />
        <p
          className={cn(
            "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em]",
            tone.label,
          )}
        >
          {index !== undefined && (
            <span className="font-heading text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {category}
        </p>
        <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {summary}
        </p>
        <div className="mt-6 border-t border-border pt-4 text-sm font-medium">
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center gap-2 text-primary transition-colors hover:text-foreground"
            >
              View Project <span aria-hidden>→</span>
            </Link>
          ) : (
            <span className="text-muted">Details coming soon</span>
          )}
        </div>
      </div>
    </article>
  );
}
