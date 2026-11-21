import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-electric/20 bg-primary-soft px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-electric",
          align === "center" && "justify-center",
        )}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-electric"
        />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-4 text-3xl font-bold leading-[1.12] tracking-tight text-navy sm:text-4xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
