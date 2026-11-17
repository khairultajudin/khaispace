import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { Capabilities } from "@/components/sections/capabilities";
import { CollaborationCta } from "@/components/sections/collaboration-cta";
import { Hero } from "@/components/sections/hero";
import { StudioFocus } from "@/components/sections/studio-focus";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Capabilities />
      <StudioFocus />
      <About />
      <CollaborationCta />
    </>
  );
}
