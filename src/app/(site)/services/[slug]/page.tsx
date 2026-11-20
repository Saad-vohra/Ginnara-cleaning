import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SEED_SERVICES } from "@/data/mock-services";
import { OTHER_SERVICE_SLUGS } from "@/lib/routes";
import { ServicePageClient } from "@/components/services/ServicePage";

export function generateStaticParams() {
  return OTHER_SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const svc = SEED_SERVICES.find((s) => s.slug === slug);
  return { title: svc ? `${svc.name} — free quote on WhatsApp` : "Home services", description: svc?.short };
}

export default async function OtherServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  if (!OTHER_SERVICE_SLUGS.includes(slug)) notFound();
  return <ServicePageClient slug={slug} />;
}
