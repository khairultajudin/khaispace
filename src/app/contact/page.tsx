import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { CornerMarks } from "@/components/ui/corner-marks";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Khai Space about software, embedded systems, prototyping or a new collaboration.",
  alternates: { canonical: "/contact" },
};

const topics = [
  "A digital or software idea you'd like to explore",
  "An embedded, IoT or monitoring concept",
  "Design, CAD or prototyping help",
  "A technical project or new collaboration",
  "General questions about Khai Space",
] as const;

export default function ContactPage() {
  const email = siteConfig.contactEmail;

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Let's talk about what you're building."
        lead="Whether it's a clear brief or just the start of an idea, a conversation is a good first step."
      />

      <section aria-labelledby="topics-title" className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              id="topics-title"
              eyebrow="What to get in touch about"
              title="Good reasons to say hello."
            />
            <ul className="mt-10 border-t border-foreground/30">
              {topics.map((topic, i) => (
                <li
                  key={topic}
                  className="flex items-center gap-4 border-b border-border py-4 text-sm"
                >
                  <span className="font-heading text-xs font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            id="contact-details"
            className="relative self-start border border-t-2 border-border border-t-primary bg-surface p-7 sm:p-10"
          >
            <CornerMarks />
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Channel · 01
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Direct Correspondence</h2>
            {email ? (
              <>
                <p className="mt-4 text-muted">
                  Have an idea worth building? Get in touch at{" "}
                  <a
                    href={`mailto:${email}`}
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    {email}
                  </a>
                  . A short description of your project or inquiry is plenty to start.
                </p>
                <div className="mt-6 border border-border bg-surface-muted/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Official Email
                  </p>
                  <p className="mt-1 break-all font-heading text-lg font-semibold sm:text-xl">
                    <a
                      href={`mailto:${email}`}
                      className="text-foreground transition-colors hover:text-primary"
                    >
                      {email}
                    </a>
                  </p>
                </div>
                <ButtonLink href={`mailto:${email}`} className="mt-8">
                  Send an Email
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="mt-4 text-muted">
                  A public contact address is being set up and will appear
                  here soon.
                </p>
                <div className="mt-6 border border-dashed border-border bg-surface-muted/60 px-4 py-3 text-sm text-muted">
                  Email address: to be announced
                </div>
                <p className="mt-6 text-sm text-muted">
                  In the meantime, please check back shortly or explore{" "}
                  <Link
                    href="/projects"
                    className="text-primary underline underline-offset-4 hover:text-foreground"
                  >
                    current projects
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/services"
                    className="text-primary underline underline-offset-4 hover:text-foreground"
                  >
                    services
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
