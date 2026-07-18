import { Hero } from "@/components/landing/Hero";
import { WhySection } from "@/components/landing/WhySection";
import { AiSection } from "@/components/landing/AiSection";
import { EditorSection } from "@/components/landing/EditorSection";
import { HowSection } from "@/components/landing/HowSection";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { CrmSection } from "@/components/landing/CrmSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/site/Footer";

export default function HomePage() {
  return (
    <div style={{ background: "#E8EDF6", color: "#111827" }}>
      <Hero />
      <WhySection />
      <AiSection />
      <EditorSection />
      <HowSection />
      <IntegrationsSection />
      <CrmSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
