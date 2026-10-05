import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { Capabilities } from "@/components/sections/capabilities";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { Hero } from "@/components/sections/hero";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Capabilities />
      <FeaturedProjects />
      <About />
      <CollaborationCta />
    </>
  );
}
