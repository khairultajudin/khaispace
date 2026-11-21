import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { ctaNav, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-background/88 backdrop-blur-md">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg py-1 font-heading text-lg font-bold tracking-tight text-navy"
        >
          <span
            aria-hidden
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
          >
            <span className="h-3 w-3 rounded-[3px] border-2 border-cyan" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-electric" />
          </span>
          <span className="flex flex-col leading-none">
            <span>{siteConfig.name}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {siteConfig.positioning}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-3 md:flex">
          <NavLinks />
          <div className="ml-2 pl-2">
            <ButtonLink href={ctaNav.href} size="sm">
              {ctaNav.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          </div>
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
