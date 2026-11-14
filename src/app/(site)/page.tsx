import { Hero, ReviewStrip } from "@/components/homepage/Hero";
import { CategoryTiles, PopularServices, ServiceExplorer, SpotlightRows } from "@/components/homepage/ServiceShowcase";
import { AboutStrip, AppPromo, Testimonials } from "@/components/homepage/Community";
import { CtaBand, FaqSection, HowItWorks, LocationsSection, TrustSection, WhyUs } from "@/components/sections/InfoSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ReviewStrip />
      <CategoryTiles />
      <PopularServices />
      <HowItWorks />
      <ServiceExplorer />
      <SpotlightRows />
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
