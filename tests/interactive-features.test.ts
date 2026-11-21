import assert from "node:assert/strict";
import test from "node:test";
import { projects } from "@/content/projects";
import { services } from "@/content/services";
import {
  getProjectAssistantProvider,
  RemoteBackendAssistantProvider,
} from "@/lib/ai-assistant/client";
import { LocalGuidedAssistantProvider } from "@/lib/ai-assistant/local-guide";
import {
  calculateProjectEstimate,
  ESTIMATOR_FEATURES,
} from "@/lib/estimator";
import { siteConfig } from "@/lib/site";
import {
  buildBriefInquiryMessage,
  buildEstimatorInquiryMessage,
  buildProjectInquiryMessage,
  buildServiceInquiryMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

test("Services catalog contains all 6 required categories and valid related projects", () => {
  const expectedTitles = [
    "AI & Automation",
    "Web Applications",
    "IoT & Engineering",
    "Custom Digital Solutions",
    "Website Design",
    "Technical Consulting",
  ];
  assert.deepEqual(
    services.map((s) => s.title),
    expectedTitles,
  );

  const projectSlugs = new Set(projects.map((p) => p.slug));
  for (const service of services) {
    assert.ok(service.problemsSolved.length >= 3);
    assert.ok(service.capabilities.length >= 3);
    assert.ok(service.deliverables.length >= 3);
    for (const slug of service.relatedProjectSlugs) {
      assert.ok(
        projectSlugs.has(slug),
        `Service ${service.slug} references missing project ${slug}`,
      );
    }
  }
});

test("Public projects catalog excludes permanently deleted projects", () => {
  const bannedFragments = [
    "pixelpop",
    "smart-rain-gauge",
    "nano33ble",
    "esp32-s3-casing",
    "tiktok",
  ];
  for (const project of projects) {
    const haystack = `${project.slug} ${project.title}`.toLowerCase();
    for (const banned of bannedFragments) {
      assert.equal(
        haystack.includes(banned),
        false,
        `Deleted project fragment "${banned}" must not appear in public catalog`,
      );
    }
  }
});

test("Project Estimator calculates deterministic scope tiers without fabricated currency pricing", () => {
  const starter = calculateProjectEstimate({
    serviceSlug: "website-design",
    complexity: "starter",
    features: ["seo-a11y"],
    readiness: "assets-ready",
  });
  assert.equal(starter.scopeTier, "Focused Starter Scope");
  assert.equal(starter.score, 25);

  const standard = calculateProjectEstimate({
    serviceSlug: "web-applications",
    complexity: "standard",
    features: ["responsive-ui", "database-search", "whatsapp-automation"],
    readiness: "notes-ready",
  });
  assert.equal(standard.scopeTier, "Standard Studio Build");
  assert.equal(standard.score, 67);

  const comprehensive = calculateProjectEstimate({
    serviceSlug: "iot-engineering",
    complexity: "integrated",
    features: ESTIMATOR_FEATURES.map((f) => f.id),
    readiness: "idea-only",
  });
  assert.equal(comprehensive.scopeTier, "Comprehensive Multi-Phase Scope");
  assert.ok(comprehensive.score > 72);

  // Governance check: zero fabricated RM or USD prices anywhere in estimator outputs
  const serialized = JSON.stringify([starter, standard, comprehensive]);
  assert.equal(/\bRM\s?\d|\$\d/i.test(serialized), false);
  assert.match(starter.disclaimer, /not a binding/i);
});

test("WhatsApp helper uses only verified Khai Space number and encodes messages safely", () => {
  assert.equal(buildWhatsAppUrl(), siteConfig.whatsappUrl);
  assert.equal(siteConfig.whatsappNumber, "+60 18-760 4289");
  assert.equal(siteConfig.whatsappE164, "60187604289");

  const serviceMsg = buildServiceInquiryMessage("AI & Automation");
  const serviceUrl = buildWhatsAppUrl(serviceMsg);
  assert.ok(serviceUrl.startsWith("https://wa.me/60187604289?text="));
  assert.ok(serviceUrl.includes(encodeURIComponent("AI & Automation")));

  const projectMsg = buildProjectInquiryMessage("BizTrack");
  assert.match(projectMsg, /BizTrack/);

  const briefMsg = buildBriefInquiryMessage({
    name: "Aiman",
    contactMethod: "+60 12-345 6789",
    category: "Web Applications",
    problemOrIdea: "Need a clean booking and invoice portal.",
    desiredFeatures: ["Responsive web dashboard / portal"],
    budgetRange: "Standard custom build",
    timeline: "1–2 months",
  });
  assert.match(briefMsg, /\*Name \/ Contact:\* Aiman/);
  assert.match(briefMsg, /\*Project Category:\* Web Applications/);
  assert.match(briefMsg, /- Responsive web dashboard \/ portal/);

  const est = calculateProjectEstimate({
    serviceSlug: "ai-automation",
    complexity: "standard",
    features: ["ai-workflow"],
    readiness: "idea-only",
  });
  const estMsg = buildEstimatorInquiryMessage(est);
  assert.match(estMsg, /not a binding quote/i);
  assert.match(estMsg, /AI & Automation/);
});

test("AI Project Assistant provider defaults safely to local guided mode and maps intents", async () => {
  const defaultProvider = getProjectAssistantProvider("");
  assert.equal(defaultProvider.mode, "local-guided");

  const local = new LocalGuidedAssistantProvider();
  const iotRes = await local.advise({
    prompt: "Can we build an ESP32 sensor telemetry dashboard for hydroponics?",
    history: [],
  });
  assert.equal(iotRes.mode, "local-guided");
  assert.equal(iotRes.suggestedServiceSlug, "iot-engineering");
  assert.ok(iotRes.recommendations.length >= 2);
  assert.match(iotRes.transparencyNote, /Guided Local Mode/i);

  const aiRes = await local.advise({
    prompt: "Looking to automate document triage with structured AI workflows",
    history: [],
  });
  assert.equal(aiRes.suggestedServiceSlug, "ai-automation");

  // Remote adapter configured with HTTPS URL switches provider mode cleanly
  const remoteProvider = getProjectAssistantProvider("https://example.invalid");
  assert.ok(remoteProvider instanceof RemoteBackendAssistantProvider);
  assert.equal(remoteProvider.mode, "remote-backend");
});
