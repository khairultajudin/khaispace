import Link from "next/link";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { services } from "@/content/services";
import { ctaNav, mainNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1.1fr]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-heading text-lg font-bold text-navy"
          >
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-white"
            >
              <span className="h-2.5 w-2.5 rounded-[2px] border-2 border-cyan" />
            </span>
            {siteConfig.name}
          </Link>
          <p className="mt-3 font-heading text-sm font-semibold text-electric">
            {siteConfig.brandHeadline}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            {siteConfig.description}
          </p>
        </div>

        <nav aria-label="Studio navigation">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-navy">
            Studio
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted transition-colors hover:text-electric"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={ctaNav.href}
                className="font-medium text-electric transition-colors hover:text-navy"
              >
                {ctaNav.label}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Service areas">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-navy">
            Services
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services#${service.slug}`}
                  className="text-muted transition-colors hover:text-electric"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-navy">
            Direct Contact
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-navy transition-colors hover:border-[#16A34A] hover:bg-[#F0FDF4]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#16A34A] text-white">
                <MessageCircle className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#15803D]">
                  WhatsApp (Primary)
                </span>
                <span className="block truncate font-medium text-navy">
                  {siteConfig.whatsappNumber}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            </a>

            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-muted transition-colors hover:border-electric hover:text-navy"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-electric">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate">
                {siteConfig.contactEmail}
              </span>
            </a>
          </div>
        </div>
      </Container>

      <div className="border-t border-border bg-background/60">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name} — {siteConfig.positioning}. All rights
            reserved.
          </p>
          <p>{siteConfig.tagline}</p>
        </Container>
      </div>
    </footer>
  );
}
