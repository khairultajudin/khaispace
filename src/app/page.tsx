import type { Metadata } from "next";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { Hero } from "@/components/sections/hero";
import { HowWeWork } from "@/components/sections/how-we-work";
import { LabPreview } from "@/components/sections/lab-preview";
import { ServicesOverview } from "@/components/sections/services-overview";
import { StudioIntro } from "@/components/sections/studio-intro";
import { WhyKhaiSpace } from "@/components/sections/why-khai-space";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.brandHeadline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StudioIntro />
      <ServicesOverview />
      <FeaturedProjects />
      <LabPreview />
      <HowWeWork />
      <WhyKhaiSpace />
      <CollaborationCta />
    </>
  );
}
