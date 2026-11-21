import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { siteConfig } from "@/lib/site";
import { whatsappQrBase64 } from "@/lib/whatsapp-qr-base64";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Khai Space directly via WhatsApp or email, or use our guided Start a Project brief builder.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Let's talk about what you want to build."
        lead="Reach out directly on WhatsApp for the fastest reply, email our studio inbox, or prepare a structured brief in minutes."
        actions={
          <ButtonLink href="/start-a-project">
            <span>Open Project Brief Builder</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        }
      />

      <section aria-label="Direct contact channels" className="py-14 sm:py-20">
        <Container className="grid gap-6 md:grid-cols-2">
          <div className="studio-card rounded-3xl p-7 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-semibold text-[#15803D]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
              Channel 01 · Primary
            </span>
            <h2 className="mt-4 text-2xl font-bold text-navy">
              Message on WhatsApp
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Fastest way to start a conversation about web apps, AI workflows,
              IoT prototypes, or website design.
            </p>

            <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-border bg-background p-5 sm:flex-row">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Verified WhatsApp Number
                </p>
                <p className="mt-1 font-heading text-xl font-bold text-navy">
                  {siteConfig.whatsappNumber}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Tap below to open chat or scan the QR code on mobile.
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-border bg-white p-2 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={whatsappQrBase64}
                  alt={`WhatsApp QR code for ${siteConfig.name}`}
                  width={112}
                  height={112}
                  className="h-24 w-24 object-contain"
                />
              </div>
            </div>

            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D] sm:w-auto sm:text-base"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              <span>Chat on WhatsApp</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <div className="studio-card flex flex-col justify-between rounded-3xl p-7 sm:p-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-electric">
                Channel 02 · Email &amp; Guided Brief
              </span>
              <h2 className="mt-4 text-2xl font-bold text-navy">
                Direct Email or Guided Brief
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Prefer sending detailed specs by email or structuring your
                requirements step-by-step first?
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Official Studio Email
                </p>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="mt-1.5 inline-flex items-center gap-2 break-all font-heading text-lg font-bold text-navy transition-colors hover:text-electric"
                >
                  <Mail className="h-5 w-5 shrink-0 text-electric" aria-hidden />
                  <span>{siteConfig.contactEmail}</span>
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/start-a-project">
                <span>Start a Project Brief</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink
                href={`mailto:${siteConfig.contactEmail}`}
                variant="secondary"
              >
                Send an Email
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
