import Link from "next/link";
import { Container } from "@/components/ui/container";
import { mainNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-heading text-lg font-bold">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm text-muted">
            {siteConfig.positioning}
          </p>
          {siteConfig.contactEmail && (
            <p className="mt-4 text-sm">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-muted transition-colors hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          )}
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col gap-1 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>{siteConfig.tagline}</p>
        </Container>
      </div>
    </footer>
  );
}
