import { cn } from "@/lib/cn";

export type DisciplineKind = "software" | "iot" | "prototype" | "research";

/** Small line-drawing glyph for each discipline. Decorative. */
export function DisciplineMarker({
  kind,
  className,
}: {
  kind: DisciplineKind;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      {kind === "software" && (
        <>
          <rect x="6" y="10" width="36" height="28" />
          <path d="M17 19l-6 6 6 6M31 19l6 6-6 6M27 17l-6 16" />
        </>
      )}
      {kind === "iot" && (
        <>
          <circle cx="24" cy="24" r="3.5" fill="var(--accent)" stroke="none" />
          <path d="M18 18a8 8 0 0 0 0 12M30 18a8 8 0 0 1 0 12M13 13a15 15 0 0 0 0 22M35 13a15 15 0 0 1 0 22" />
        </>
      )}
      {kind === "prototype" && (
        <>
          <path d="M24 6l16 9v18l-16 9-16-9V15z" />
          <path d="M8 15l16 9 16-9M24 24v18" />
          <path d="M24 24l0 0" stroke="var(--accent)" strokeWidth="4" />
        </>
      )}
      {kind === "research" && (
        <>
          <path d="M19 6h10M21 6v13L10 38a3 3 0 0 0 3 4h22a3 3 0 0 0 3-4L27 19V6" />
          <path d="M15 31h18" />
          <circle cx="22" cy="36" r="1.5" fill="var(--accent)" stroke="none" />
          <circle cx="28" cy="34" r="1.5" fill="var(--accent)" stroke="none" />
        </>
      )}
    </svg>
  );
}
