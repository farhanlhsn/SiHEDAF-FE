import { AboutSection } from "@/components/sections/AboutSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { HeaderSection } from "@/components/sections/HeaderSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ScrollThread } from "@/components/landing/ScrollThread";

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-paper text-primary-900">
      <HeaderSection />
      <div className="page-enter">
        <div className="relative">
          <main>
            <HeroSection />
            <AboutSection />
            <FeaturesSection />
            <ProcessSection />
            <CtaSection />
          </main>
          <ScrollThread />
        </div>
        <FooterSection />
      </div>
    </div>
  );
}
