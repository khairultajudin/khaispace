import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground border-primary hover:bg-foreground hover:border-foreground",
  secondary:
    "bg-transparent text-foreground border-foreground/25 hover:border-foreground hover:bg-surface",
  ghost:
    "bg-transparent text-primary border-transparent px-0 hover:text-foreground",
};

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: "md" | "sm";
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 border font-medium transition-colors duration-200",
        "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        size === "md" ? "h-12 px-6 text-base" : "h-10 px-4 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
