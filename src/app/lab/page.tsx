import type { Metadata } from "next";
import { ArrowRight, Calculator, FlaskConical, ShieldCheck } from "lucide-react";
import { ProjectAssistantPanel } from "@/components/assistant/project-assistant-panel";
import { IotTelemetryDemo } from "@/components/lab/iot-telemetry-demo";
import { MiniDashboardDemo } from "@/components/lab/mini-dashboard-demo";
import { WebAppUtilityDemo } from "@/components/lab/webapp-utility-demo";
import { WorkflowAutomationDemo } from "@/components/lab/workflow-automation-demo";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageIntro } from "@/components/ui/page-intro";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";

export const metadata: Metadata = {
  title: "Interactive Lab",
  description:
    "Try Khai Space's Interactive Lab — four live, browser-side synthetic demonstrations covering dashboards, workflow automation, simulated IoT telemetry, and web utilities.",
  alternates: { canonical: "/lab" },
};

const LAB_JUMPS = [
  { href: "#dashboard-demo", label: "01 · Mini Dashboard" },
  { href: "#workflow-demo", label: "02 · Workflow Automation" },
  { href: "#iot-demo", label: "03 · IoT Sensor Telemetry" },
  { href: "#utility-demo", label: "04 · Batch Scaler & Timer" },
  { href: "#studio-advisor", label: "05 · Project Advisor" },
] as const;

export default function LabPage() {
  return (
    <>
      <PageIntro
        eyebrow="Interactive Lab"
        title="Try interactive digital systems directly in your browser."
        lead="Test self-contained Khai Space prototypes covering operational dashboards, structured automation pipelines, simulated IoT telemetry, and responsive web utilities — all powered strictly by synthetic data."
        actions={
          <>
            <ButtonLink href="/start-a-project?tab=estimator" size="sm">
              <Calculator className="h-4 w-4" aria-hidden />
              <span>Open Scope Estimator</span>
            </ButtonLink>
            <ButtonLink href="/start-a-project" variant="secondary" size="sm">
              <span>Start a Project Brief</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <WhatsAppCta
              label="Discuss a Prototype"
              variant="outline"
              size="sm"
            />
          </>
        }
      />

      {/* Quick Anchor Bar */}
      <nav
        aria-label="Jump to Interactive Lab demo"
        className="border-b border-border bg-surface py-3.5"
      >
        <Container className="flex flex-wrap gap-2">
          {LAB_JUMPS.map((jump) => (
            <a
              key={jump.href}
              href={jump.href}
              className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-electric hover:bg-primary-soft hover:text-electric"
            >
              {jump.label}
            </a>
          ))}
        </Container>
      </nav>

      <section aria-label="Interactive lab demonstrations" className="py-12 sm:py-16">
        <Container className="space-y-8">
          {/* Mandatory Synthetic Simulation Safety Notice */}
          <div className="flex flex-col gap-3 rounded-2xl border border-electric/20 bg-primary-soft/65 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-electric"
                aria-hidden
              />
              <div>
                <p className="font-heading text-sm font-bold text-navy">
                  100% Synthetic Client-Side Simulations
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">
                  Every demo below runs locally in your browser with fictional
                  synthetic datasets. Zero connections to production databases,
                  private Hub workspaces, or real customer accounts.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-cyan/30 bg-surface px-3 py-1 text-xs font-semibold text-[#0E7490] sm:self-center">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              Safe Sandbox
            </span>
          </div>

          <MiniDashboardDemo />
          <WorkflowAutomationDemo />
          <IotTelemetryDemo />
          <WebAppUtilityDemo />
          <ProjectAssistantPanel pageContext="/lab" />
        </Container>
      </section>

      <CollaborationCta
        eyebrow="From Lab Prototype to Real Tool"
        title="Want a working prototype built around your own workflow?"
        copy="Start with a focused proof of concept so you can test usability with real users before investing in a larger build."
      />
    </>
  );
}
