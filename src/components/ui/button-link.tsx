import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "navy" | "secondary" | "whatsapp" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-electric text-white border-electric shadow-sm hover:bg-electric-dark hover:border-electric-dark",
  navy: "bg-navy text-white border-navy shadow-sm hover:bg-electric hover:border-electric",
  secondary:
    "bg-surface text-navy border-border-strong hover:border-electric hover:text-electric hover:bg-primary-soft/50",
  whatsapp:
    "bg-[#16A34A] text-white border-[#16A34A] shadow-sm hover:bg-[#15803D] hover:border-[#15803D]",
  ghost:
    "bg-transparent text-electric border-transparent px-0 hover:text-navy",
};

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: "md" | "sm" | "lg";
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
        "inline-flex items-center justify-center gap-2 border font-medium transition-all duration-200",
        "rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
        size === "lg" && "h-13 px-6 text-base",
        size === "md" && "h-11 px-5 text-sm sm:text-base",
        size === "sm" && "h-9 px-4 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
