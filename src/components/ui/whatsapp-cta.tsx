import { ArrowUpRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type WhatsAppCtaProps = {
  label?: string;
  message?: string;
  variant?: "solid" | "outline" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  showExternalIcon?: boolean;
};

const variantStyles = {
  solid:
    "bg-[#16A34A] text-white border-[#16A34A] hover:bg-[#15803D] hover:border-[#15803D] shadow-sm",
  outline:
    "bg-surface text-navy border-border-strong hover:border-[#16A34A] hover:text-[#15803D] hover:bg-[#F0FDF4]",
  dark: "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40",
};

export function WhatsAppCta({
  label = "Chat on WhatsApp",
  message,
  variant = "solid",
  size = "md",
  className,
  showExternalIcon = true,
}: WhatsAppCtaProps) {
  const href = buildWhatsAppUrl(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-sm sm:text-base",
        size === "lg" && "h-12 px-6 text-base",
        variantStyles[variant],
        className,
      )}
    >
      <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
      {showExternalIcon && (
        <ArrowUpRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      )}
    </a>
  );
}
