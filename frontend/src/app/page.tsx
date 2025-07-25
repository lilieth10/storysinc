import React from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { TargetAudience } from "@/components/landing/TargetAudience";
import { Integrations } from "@/components/landing/Integrations";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <FeaturesGrid />
      <TargetAudience />
      <Integrations />
      <CtaSection />
      <Footer />
    </div>
  );
}
