import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function WhatsAppFloatingButton() {
  if (!siteConfig.whatsappUrl) return null;

  return (
    <aside
      aria-label="Direct WhatsApp Contact"
      className="fixed bottom-5 right-5 z-30 print:hidden sm:bottom-6 sm:right-6"
    >
      <a
        href={siteConfig.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open WhatsApp chat with ${siteConfig.name} (${siteConfig.whatsappNumber})`}
        className="group flex items-center gap-3 rounded-full border border-border bg-surface/95 py-2 pl-2 pr-2 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[#16A34A]/50 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric sm:pr-4"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <MessageCircle className="h-5 w-5" aria-hidden />
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-cyan"
          />
        </span>
        <div className="hidden text-left sm:block">
          <p className="font-heading text-xs font-bold leading-tight text-navy">
            WhatsApp Studio
          </p>
          <p className="text-[11px] leading-tight text-muted">
            {siteConfig.whatsappNumber}
          </p>
        </div>
      </a>
    </aside>
  );
}
