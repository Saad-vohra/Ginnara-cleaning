"use client";

import { Check, Search, SlidersHorizontal, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, Photo, PillTabs, SectionHeading } from "@/components/common/ui";
import { PostcodeSearch } from "./PostcodeSearch";
import { ServiceCard } from "./Cards";
import { Breadcrumbs } from "./ServicePage";
import { CtaBand, FaqSection, HowItWorks, LocationsSection, WhyUs } from "@/components/sections/InfoSections";
import { useActiveServices } from "@/hooks/useStore";
import { IMG } from "@/data/images";
import { Button } from "@/components/common/Button";

type Filter = "all" | "regular" | "intensive" | "flexible" | "laundry";
type Sort = "popular" | "price-asc" | "price-desc" | "name";

const FILTERS: { value: Filter; label: string; match: (slug: string) => boolean }[] = [
  { value: "all", label: "All services", match: () => true },
  { value: "regular", label: "Homes", match: (s) => ["residential-cleaning", "deep-cleaning", "move-in-move-out-cleaning"].includes(s) },
  { value: "intensive", label: "Deep & move-out", match: (s) => ["deep-cleaning", "move-in-move-out-cleaning"].includes(s) },
  { value: "flexible", label: "Recurring", match: (s) => ["residential-cleaning", "office-cleaning"].includes(s) },
  { value: "laundry", label: "Business & events", match: (s) => ["office-cleaning", "special-event-cleaning"].includes(s) },
];

export function DomesticCleaningHub() {
  const services = useActiveServices();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.value === filter)!;
    const term = q.trim().toLowerCase();
    const out = services.filter((s) => f.match(s.slug) && (!term || `${s.name} ${s.short} ${s.includes.join(" ")}`.toLowerCase().includes(term)));
    return [...out].sort((a, b) => {
      if (sort === "price-asc") return a.hourlyRate - b.hourlyRate;
      if (sort === "price-desc") return b.hourlyRate - a.hourlyRate;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.popular) - Number(a.popular);
    });
  }, [services, filter, sort, q]);

  return (
    <>
      <section className="bg-cream">
        <div className="container-site grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div>
            <Breadcrumbs items={[{ label: "Cleaning services" }]} />
            <h1 className="mt-5 text-[2.7rem] leading-[1] font-extrabold sm:text-6xl">Home & office cleaning in London</h1>
            <p className="mt-4 flex items-center gap-2 text-ink-soft">
              <Star className="size-5 fill-sun text-sun" /> <strong className="text-ink">4.9/5</strong> · 12,480 reviews
            </p>
            <ul className="mt-6 space-y-2.5 text-[17px]">
              {["Hourly rate from £16.50/hr", "No contract & total flexibility", "DBS-checked pros, available from tomorrow (7/7)"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <Check className="size-5 text-success" strokeWidth={3} /> {t}
                </li>
              ))}
            </ul>
            <PostcodeSearch className="mt-8 max-w-2xl" ctaLabel="Book my cleaning" />
            <p className="mt-3 text-sm text-muted">Free quote · no commitment</p>
          </div>
          <div className="relative hidden aspect-[4/3.4] overflow-hidden rounded-[40px] shadow-lift lg:block">
            <Photo src={IMG.livingBright} alt="Clean bright living room" fill priority sizes="560px" />
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24" id="services">
        <div className="container-site">
          <SectionHeading title="Our cleaning services" intro="Filter by what you need, or search for a task like “bathroom” or “desks”." />
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PillTabs tabs={FILTERS.map((f) => ({ value: f.value, label: f.label, count: services.filter((s) => f.match(s.slug)).length }))} value={filter} onChange={setFilter} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative">
                <span className="sr-only">Search services</span>
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services" className="h-11 w-full rounded-full border-[1.5px] border-line bg-white pr-4 pl-10 text-sm focus:border-ink focus:outline-none sm:w-56" />
              </label>
              <label className="relative flex items-center">
                <SlidersHorizontal className="pointer-events-none absolute left-4 size-4 text-muted" />
                <span className="sr-only">Sort by</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 w-full appearance-none rounded-full border-[1.5px] border-line bg-white pr-6 pl-10 text-sm font-semibold focus:border-ink focus:outline-none">
                  <option value="popular">Most popular</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>
          </div>
          {list.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No services match"
              description="Try a different search term or filter."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQ("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </section>

      <WhyUs />
      <HowItWorks />
      <section className="bg-cream-2 py-16 lg:py-24">
        <div className="container-site max-w-4xl space-y-6 text-[17px] leading-relaxed text-ink-soft">
          <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">About Ginnara Cleaning Service</h2>
          <p>Ginnara delivers dependable domestic cleaning across the UK. Whether you need a weekly cleaner, a one-off refresh before guests or a deep clean before moving out, we match you with a vetted professional near you and handle the admin.</p>
          <h3 className="pt-2 text-xl font-extrabold text-ink">Customised to your home</h3>
          <p>Tell us the size of your home and your priorities and we&apos;ll recommend the right duration. Add extras like inside the oven, fridge or interior windows in one tap.</p>
          <h3 className="pt-2 text-xl font-extrabold text-ink">No contracts, no hassle</h3>
          <p>Modify or cancel bookings for free up to 24 hours before your appointment. Recurring customers save up to 10% and can pause any time.</p>
        </div>
      </section>
      <LocationsSection title="Ginnara cleaners near you" />
      <FaqSection />
      <CtaBand />
    </>
  );
}
