"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { ctaNav, mainNav } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border text-foreground transition-colors hover:bg-surface"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          {open ? (
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" />
          ) : (
            <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" />
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-foreground/15 backdrop-blur-[2px]"
          />
          <nav
            id="mobile-nav-panel"
            aria-label="Mobile"
            className="absolute inset-x-0 top-full z-40 border-b border-border bg-background px-6 pb-6 pt-2 shadow-lg"
          >
            <ul className="flex flex-col">
              {mainNav.map((item) => (
                <li key={item.href} className="border-b border-border">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-lg font-medium transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink
              href={ctaNav.href}
              onClick={() => setOpen(false)}
              className="mt-6 w-full"
            >
              {ctaNav.label}
            </ButtonLink>
          </nav>
        </>
      )}
    </div>
  );
}
