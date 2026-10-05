/** Minimal class-name joiner (avoids adding clsx/tailwind-merge for now). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
