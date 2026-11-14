import type { Metadata } from "next";
import { Suspense } from "react";
import { CITIES, cityBySlug } from "@/data/mock-cities";
import { SEED_SERVICES } from "@/data/mock-services";
import { CityPage } from "@/components/services/CityPage";
import { ServicePageClient } from "@/components/services/ServicePage";
import { Spinner } from "@/components/common/ui";

export function generateStaticParams() {
  return [...SEED_SERVICES.filter((s) => s.kind === "cleaning").map((s) => ({ slug: s.slug })), ...CITIES.map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({ params }: PageProps<"/cleaning/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (city) return { title: `Cleaners in ${city.name}`, description: city.intro };
  const svc = SEED_SERVICES.find((s) => s.slug === slug);
  return { title: svc ? `${svc.name} near you` : "Cleaning service", description: svc?.short };
}

export default async function CleaningSlugPage({ params }: PageProps<"/cleaning/[slug]">) {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (city) {
    return (
      <Suspense fallback={<Spinner />}>
        <CityPage city={city} />
      </Suspense>
    );
  }
  return <ServicePageClient slug={slug} />;
}
