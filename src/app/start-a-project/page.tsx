import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { StartProjectWorkspace } from "@/components/start-project/start-project-workspace";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { siteConfig } from "@/lib/site";
import { whatsappQrBase64 } from "@/lib/whatsapp-qr-base64";

export const metadata: Metadata = {
  title: "Start a Project",
  description:
    "Use the Khai Space Project Brief Builder, transparent Scope Estimator, or Guided Project Advisor — then hand off cleanly to WhatsApp when ready.",
  alternates: { canonical: "/start-a-project" },
};

export default function StartAProjectPage() {
  return (
    <>
      <PageIntro
        eyebrow="Start a Project"
        title="Scope your idea and hand it straight to WhatsApp."
        lead="Choose the 4-step Project Brief Builder, estimate indicative complexity with our transparent Scope Estimator, or get quick track recommendations from our Guided Project Advisor."
      />

      <section
        aria-label="Interactive project planning tools and direct contact"
        className="py-12 sm:py-20"
      >
        <Container className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <Suspense
            fallback={
              <div className="studio-card rounded-3xl p-8 text-sm text-muted">
                Loading project planning workspace...
              </div>
            }
          >
            <StartProjectWorkspace />
          </Suspense>

          {/* Direct Verified Contact Channels */}
          <aside className="space-y-6">
            <div className="studio-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#15803D]">
                  Primary Channel
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  WhatsApp
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold text-navy">
                Prefer to message directly?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Skip the tools anytime and start a direct WhatsApp conversation
                with Khai Space.
              </p>

              <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row">
                <div className="shrink-0 rounded-xl border border-border bg-white p-2 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={whatsappQrBase64}
                    alt={`WhatsApp QR code for Khai Space (${siteConfig.whatsappNumber})`}
                    width={104}
                    height={104}
                    className="h-24 w-24 object-contain"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    Verified Number
                  </p>
                  <p className="mt-1 font-heading text-base font-bold text-navy">
                    {siteConfig.whatsappNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Scan on mobile or tap below to open WhatsApp.
                  </p>
                </div>
              </div>

              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span>Open WhatsApp Chat</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </div>

            <div className="studio-card rounded-3xl p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-electric">
                Fallback Channel
              </p>
              <h2 className="mt-2 text-lg font-bold text-navy">
                Email Correspondence
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Have documents or formal specifications to attach? Send them to
                our studio inbox:
              </p>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="mt-4 flex items-center gap-2.5 rounded-xl border border-border bg-background p-3.5 text-sm font-semibold text-navy transition-colors hover:border-electric hover:text-electric"
              >
                <Mail className="h-4 w-4 shrink-0 text-electric" aria-hidden />
                <span className="truncate">{siteConfig.contactEmail}</span>
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-surface-muted/70 p-5 text-xs leading-relaxed text-muted">
              <p className="flex items-center gap-2 font-semibold text-navy">
                <ShieldCheck className="h-4 w-4 text-electric" aria-hidden />
                Clear &amp; Privacy-Respecting Flow
              </p>
              <p className="mt-2">
                Your inputs stay in your browser until you explicitly click{" "}
                <strong>Open Brief in WhatsApp</strong> or send an email. No
                hidden tracking or third-party form brokers.
              </p>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
