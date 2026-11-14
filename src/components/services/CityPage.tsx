"use client";

import { ArrowRight, BadgeCheck, MapPin, Star, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { City } from "@/types";
import { LinkButton } from "@/components/common/Button";
import { Accordion, Photo, Reveal, SectionHeading, Stars } from "@/components/common/ui";
import { PostcodeSearch } from "./PostcodeSearch";
import { ReviewCard } from "./Cards";
import { Breadcrumbs } from "./ServicePage";
import { CtaBand, HowItWorks } from "@/components/sections/InfoSections";
import { useActiveServices, useStore } from "@/hooks/useStore";
import { CITIES } from "@/data/mock-cities";
import { bookingHref, serviceHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function CityPage({ city }: { city: City }) {
  const params = useSearchParams();
  const highlight = params.get("service") ?? "";
  const services = useActiveServices();
  const reviews = useStore("reviews").filter((r) => r.published);
  const pros = useStore("pros").filter((p) => p.status === "approved").slice(0, 4);
  const local = reviews.filter((r) => r.city === city.name);
  const shown = [...local, ...reviews.filter((r) => r.city !== city.name)].slice(0, 3);
  const highlighted = services.find((s) => s.slug === highlight);

  const faqs = [
    { q: `How much does a cleaner cost in ${city.name}?`, a: `Cleaning in ${city.name} starts from £${city.hourlyFrom.toFixed(2)} per hour for residential and office cleaning. Deep and move-in/move-out cleans are £18 per hour. You'll see your exact price before booking.` },
    { q: `Which areas of ${city.name} do you cover?`, a: `Our pros cover ${city.areas.join(", ")} and surrounding areas (postcodes ${city.postcodes.slice(0, 6).join(", ")}${city.postcodes.length > 6 ? "…" : ""}). Coverage shown here is demo data.` },
    { q: `How quickly can I get a cleaner in ${city.name}?`, a: `Most ${city.name} customers find a pro available from tomorrow. Same-day cleaning is often available if you book before 2pm.` },
    { q: "Are your cleaners vetted and insured?", a: "Yes. Every pro passes ID, right-to-work, DBS and reference checks, and every booking is insured up to £5 million." },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Photo src={city.image} alt={`${city.name}`} fill priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20" />
        </div>
        <div className="container-site py-14 lg:py-24">
          <Breadcrumbs light items={[{ href: "/domestic-cleaning", label: "Cleaning" }, { label: city.name }]} />
          <h1 className="mt-6 max-w-3xl text-[2.6rem] leading-[1] font-extrabold text-balance text-white sm:text-6xl">
            {highlighted ? `${highlighted.name} in ${city.name}` : `Domestic cleaners in ${city.name}`}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">{city.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white">
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur">
              <Users className="size-4 text-sun" /> {city.pros.toLocaleString()} local pros
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur">
              <Star className="size-4 fill-sun text-sun" /> {city.avgRating}/5 average
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur">from £{city.hourlyFrom.toFixed(2)}/hr</span>
          </div>
          <PostcodeSearch defaultService={highlight} className="mt-8 max-w-3xl" />
          <p className="mt-3 text-sm text-white/70">Demo coverage: {city.postcodes.slice(0, 8).join(", ")} postcode areas</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-site">
          <div className="mb-10 flex items-center gap-3 rounded-3xl bg-sun/30 px-5 py-4 text-[15px] font-medium">
            <BadgeCheck className="size-5 shrink-0 text-ink" /> {city.highlight}
          </div>
          <SectionHeading title={`Cleaning services in ${city.name}`} intro="Prices shown are the local starting hourly rate." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const rate = Math.max(city.hourlyFrom, s.hourlyRate - (18.9 - city.hourlyFrom));
              return (
                <div key={s.id} className={cn("flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-line/60 transition", s.slug === highlight && "ring-2 ring-brand")}>
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
                    <Photo src={s.image} alt="" fill sizes="80px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={serviceHref(s.slug)} className="font-extrabold hover:text-brand">
                      {s.name}
                    </Link>
                    <p className="text-sm text-muted">from £{rate.toFixed(2)}/hr</p>
                    <Link href={bookingHref({ service: s.slug })} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:gap-2">
                      Book in {city.name} <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-cream py-16 lg:py-20">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading title={`Areas we cover in ${city.name}`} className="!mb-6" />
            <div className="flex flex-wrap gap-2">
              {city.areas.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-soft">
                  <MapPin className="size-4 text-brand" /> {a}
                </span>
              ))}
            </div>
            <h3 className="mt-10 mb-4 text-2xl font-extrabold">Top-rated local pros</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {pros.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                  <span className="relative size-14 overflow-hidden rounded-full">
                    <Photo src={p.avatar} alt={p.name} fill sizes="56px" />
                  </span>
                  <div>
                    <p className="font-bold">{p.name.split(" ")[0]} {p.name.split(" ")[1]?.[0]}.</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Stars value={p.rating} size={12} /> {p.rating.toFixed(2)} · {p.jobs} cleans
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Demo profiles. Pros are matched automatically after booking.</p>
          </div>
          <div>
            <SectionHeading title={`${city.name} FAQs`} className="!mb-6" />
            <Accordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-site">
          <SectionHeading title={`Reviews from ${city.name} homes`} />
          <div className="grid gap-5 md:grid-cols-3">
            {shown.map((r) => (
              <Reveal key={r.id}>
                <ReviewCard review={r} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-cream-2">
        <HowItWorks id="steps" />
      </div>

      <section className="py-16">
        <div className="container-site">
          <h2 className="mb-5 text-2xl font-extrabold">Other cities</h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
              <LinkButton key={c.slug} href={`/cleaning/${c.slug}`} variant="soft" size="sm">
                Cleaners in {c.name}
              </LinkButton>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title={`Book a cleaner in ${city.name}`} />
    </>
  );
}
