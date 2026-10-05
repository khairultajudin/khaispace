import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  id?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <span aria-hidden className="h-px w-8 bg-accent" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
    </div>
  );
}
