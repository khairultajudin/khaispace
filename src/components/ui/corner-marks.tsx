import { cn } from "@/lib/cn";

/** Decorative drawing-sheet corner ticks. Parent must be `relative`. */
export function CornerMarks({ className }: { className?: string }) {
  const base = "absolute h-2.5 w-2.5 border-primary/50";
  return (
    <span aria-hidden className={cn("pointer-events-none", className)}>
      <span className={cn(base, "-left-px -top-px border-l border-t")} />
      <span className={cn(base, "-right-px -top-px border-r border-t")} />
      <span className={cn(base, "-bottom-px -left-px border-b border-l")} />
      <span className={cn(base, "-bottom-px -right-px border-b border-r")} />
    </span>
  );
}
