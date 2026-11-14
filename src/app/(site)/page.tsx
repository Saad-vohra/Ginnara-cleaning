import { Hero, ReviewStrip } from "@/components/homepage/Hero";
import { CategoryTiles } from "@/components/homepage/ServiceShowcase";
import { AboutStrip, AppPromo, Testimonials } from "@/components/homepage/Community";
import { CtaBand, FaqSection, HowItWorks, LocationsSection, TrustSection, WhyUs } from "@/components/sections/InfoSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ReviewStrip />
      <CategoryTiles />
      <HowItWorks />
      <WhyUs />
      <Testimonials />
      <AboutStrip />
      <TrustSection />
      <FaqSection />
      <LocationsSection />
      <AppPromo />
      <CtaBand />
    </>
  );
}
