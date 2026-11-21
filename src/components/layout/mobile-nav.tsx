"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/cn";
import { ctaNav, mainNav, siteConfig } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-navy transition-colors hover:border-electric hover:text-electric"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-navy/25 backdrop-blur-[2px]"
          />
          <nav
            id="mobile-nav-panel"
            aria-label="Mobile navigation"
            className="absolute inset-x-0 top-full z-40 border-b border-border bg-surface px-6 pb-7 pt-3 shadow-xl"
          >
            <ul className="flex flex-col gap-1">
              {mainNav.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        isActive
                          ? "bg-primary-soft text-electric"
                          : "text-navy hover:bg-surface-muted",
                      )}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4 opacity-50" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 grid gap-3 border-t border-border pt-5">
              <ButtonLink
                href={ctaNav.href}
                onClick={() => setOpen(false)}
                className="w-full"
              >
                {ctaNav.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-background px-4 text-sm font-medium text-navy transition-colors hover:border-[#16A34A] hover:text-[#15803D]"
              >
                <MessageCircle className="h-4 w-4 text-[#16A34A]" aria-hidden />
                <span>WhatsApp {siteConfig.whatsappNumber}</span>
              </a>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
