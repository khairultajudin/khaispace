import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { CornerMarks } from "@/components/ui/corner-marks";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/site";
import { whatsappQrBase64 } from "@/lib/whatsapp-qr-base64";

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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function ContactPage() {
  const email = siteConfig.contactEmail;
  const whatsappUrl = siteConfig.whatsappUrl;
  const whatsappNumber = siteConfig.whatsappNumber;
  const qrImage = siteConfig.whatsappQrImage;

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

          <div id="contact-details" className="space-y-8">
            {/* Channel 01: WhatsApp */}
            <div className="relative border border-t-2 border-border border-t-accent bg-surface p-7 sm:p-10">
              <CornerMarks />
              <div className="flex items-center justify-between gap-4">
                <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
                  Channel · 01
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden />
                  Instant messaging
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-semibold">Message on WhatsApp</h2>
              <p className="mt-4 text-muted">
                Fastest way to start a conversation. Reach out directly for project discussions, inquiries, or quick feedback.
              </p>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex-1 border border-border bg-surface-muted/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Contact Number
                  </p>
                  <p className="mt-1 font-heading text-lg font-semibold sm:text-xl">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground transition-colors hover:text-accent-strong"
                    >
                      {whatsappNumber}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Tap to open chat or save to contacts
                  </p>
                </div>

                <div className="flex items-center justify-center border border-border bg-white p-2.5 shrink-0 self-center sm:self-auto shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={whatsappQrBase64}
                    alt="WhatsApp QR Code"
                    width={120}
                    height={120}
                    className="h-28 w-28 object-contain"
                  />
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-sm border border-accent-strong bg-accent-strong px-6 text-base font-medium text-white transition-colors duration-200 hover:bg-foreground hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <span>Message on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Channel 02: Email */}
            <div className="relative border border-t-2 border-border border-t-primary bg-surface p-7 sm:p-10">
              <CornerMarks />
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Channel · 02
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Direct Correspondence</h2>
              {email ? (
                <>
                  <p className="mt-4 text-muted">
                    Have detailed specs or formal inquiries? Send a message to{" "}
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
                  <ButtonLink href={`mailto:${email}`} variant="secondary" className="mt-8">
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
                    In the meantime, feel free to reach out via WhatsApp above or explore{" "}
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
          </div>
        </Container>
      </section>
    </>
  );
}
