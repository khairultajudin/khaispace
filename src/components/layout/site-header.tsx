import Link from "next/link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { ctaNav, mainNav, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
        >
          <span aria-hidden className="relative block h-5 w-5">
            <span className="absolute inset-0 border-[1.5px] border-primary" />
            <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 bg-accent" />
          </span>
          {siteConfig.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href={ctaNav.href} size="sm">
            {ctaNav.label}
          </ButtonLink>
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
