"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CalendarCheck, Check, ChevronRight, Clock, FileCheck2, Home, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Service } from "@/types";
import { LinkButton } from "@/components/common/Button";
import { Badge, EmptyState, Photo, Reveal, SectionHeading } from "@/components/common/ui";
import { PostcodeSearch } from "./PostcodeSearch";
import { ReviewCarousel } from "@/components/common/ReviewCarousel";
import { CtaBand, FaqSection, HowItWorks, RelatedServices } from "@/components/sections/InfoSections";
import { useStore } from "@/hooks/useStore";
import { extraById } from "@/lib/extras";
import { recommendedHours } from "@/lib/pricing";
import { bookingHref } from "@/lib/routes";
import { cn, gbp2 } from "@/lib/utils";

export function Breadcrumbs({ items, light }: { items: { href?: string; label: string }[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1.5 text-sm", light ? "text-white/80" : "text-muted")}>
      <Link href="/" className="hover:underline" aria-label="Home">
        <Home className="size-4" />
      </Link>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5" />
          {it.href ? (
            <Link href={it.href} className="hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className={cn("font-semibold", light ? "text-white" : "text-ink")}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function ServiceHero({ service }: { service: Service }) {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="container-site grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
        <div>
          <Breadcrumbs items={[{ href: "/domestic-cleaning", label: "Cleaning" }, { label: service.name }]} />
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-[2.6rem] leading-[1] font-extrabold text-balance sm:text-6xl">
            {service.name} near you
          </motion.h1>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-[15px] text-ink-soft">
            <Star className="size-5 fill-sun text-sun" /> <strong className="text-ink">4.9/5</strong> · 12,480 reviews
          </p>
          <ul className="mt-6 space-y-2.5 text-[17px]">
            <li className="flex items-center gap-3">
              <Check className="size-5 text-success" strokeWidth={3} /> Hourly rate from <strong>£{service.hourlyRate.toFixed(2)}/hr</strong>
            </li>
            <li className="flex items-center gap-3">
              <Check className="size-5 text-success" strokeWidth={3} /> No contract & total flexibility
            </li>
            <li className="flex items-center gap-3">
              <Check className="size-5 text-success" strokeWidth={3} /> DBS-checked pros, available {service.sameDay ? "today" : "from tomorrow"} (7/7)
            </li>
          </ul>
          <PostcodeSearch defaultService={service.slug} hideService className="mt-8 max-w-xl" ctaLabel={`Book ${service.kind === "ironing" ? "ironing" : "my cleaning"}`} />
          <p className="mt-3 text-sm text-muted">Free quote · no commitment · cancel free up to 24h before</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative">
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-[40px] shadow-lift">
            <Photo src={service.image} alt={service.name} fill priority sizes="(max-width: 1024px) 100vw, 560px" />
          </div>
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-lift sm:left-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white">
              <CalendarCheck className="size-6" />
            </span>
            <div>
              <p className="text-xs text-muted">Next available</p>
              <p className="font-bold">{service.sameDay ? "Today, from 3pm" : "Tomorrow, 9:00"}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingTable({ service }: { service: Service }) {
  const settings = useStore("settings");
  const sizes = service.kind === "ironing"
    ? [
        { label: "Small basket (≈15 items)", beds: 1, baths: 1, hours: 1 },
        { label: "Family basket (≈30 items)", beds: 2, baths: 1, hours: 2 },
        { label: "Big catch-up (≈45 items)", beds: 3, baths: 1, hours: 3 },
      ]
    : [
        { label: "Studio / 1 bedroom", beds: 1, baths: 1 },
        { label: "2 bedrooms, 1 bathroom", beds: 2, baths: 1 },
        { label: "3 bedrooms, 2 bathrooms", beds: 3, baths: 2 },
        { label: "4 bedrooms, 2 bathrooms", beds: 4, baths: 2 },
      ].map((s) => ({ ...s, hours: recommendedHours(service, s.beds, s.baths) }));
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-2 bg-ink px-5 py-4 text-sm font-semibold text-white sm:px-7">
        <span>Your home</span>
        <span>Typical time</span>
        <span className="text-right">Estimated price</span>
      </div>
      {sizes.map((s) => (
        <div key={s.label} className="grid grid-cols-[1.4fr_0.8fr_1fr] items-center gap-2 border-t border-line px-5 py-4 text-[15px] sm:px-7">
          <span className="font-medium">{s.label}</span>
          <span className="flex items-center gap-1.5 text-ink-soft">
            <Clock className="size-4" /> {s.hours}h
          </span>
          <span className="text-right font-bold">{gbp2(s.hours * service.hourlyRate)}</span>
        </div>
      ))}
      {service.allowsFrequency && (
        <div className="flex flex-wrap gap-2 border-t border-line bg-cream-2 px-5 py-4 text-sm sm:px-7">
          <Badge tone="success">Weekly −{settings.weeklyDiscount}%</Badge>
          <Badge tone="info">Fortnightly −{settings.fortnightlyDiscount}%</Badge>
          <span className="text-ink-soft">Recurring discounts apply automatically at checkout.</span>
        </div>
      )}
    </div>
  );
}

export function ServiceBody({ service }: { service: Service }) {
  const reviews = useStore("reviews");
  const services = useStore("services");
  const related = reviews.filter((r) => r.published && r.service === service.name);
  const shown = (related.length >= 3 ? related : [...related, ...reviews.filter((r) => r.published && r.service !== service.name)]).slice(0, 3);

  const storedFaqs = useStore("faqs");
  const packages = useStore("packages").filter((p) => p.active && p.serviceId === service.id);
  const faqs = useMemo(
    () => [
      { category: "Service", q: `What's included in ${service.name.toLowerCase()}?`, a: `${service.includes.join(", ")}. You can add extras such as ${service.extras.map((e) => extraById(e)?.label.toLowerCase()).filter(Boolean).slice(0, 3).join(", ")} when booking.` },
      { category: "Service", q: `How much does ${service.name.toLowerCase()} cost?`, a: `Prices start from £${service.hourlyRate.toFixed(2)} per hour with a minimum of ${service.minHours} ${service.minHours === 1 ? "hour" : "hours"}. Your exact price depends on the size of your home and any extras, and is shown in full before you book.` },
      ...storedFaqs.filter((f) => ["Booking", "Cleaners"].includes(f.category)).slice(0, 4),
    ],
    [service, storedFaqs],
  );

  const [extraInfo, setExtraInfo] = useState<string | null>(null);
  const notIncluded = service.kind === "ironing" ? ["Dry-clean-only garments", "Collection & delivery", "Laundry (add as an extra)"] : ["Exterior windows above ground floor", "Moving heavy furniture", "Carpet shampooing", "Biohazard cleaning"];

  return (
    <>
      {/* Intro + benefits */}
      <section className="pt-24 pb-16 lg:pt-28">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="mb-3 text-[13px] font-bold tracking-[0.14em] text-brand uppercase">{service.tagline}</p>
            <h2 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl">Why book {service.name.toLowerCase()} with Ginnara?</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{service.description}</p>
            <LinkButton href={bookingHref({ service: service.slug })} size="lg" className="mt-8">
              Get my price
            </LinkButton>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {service.features.map((f, i) => {
              const Icon = [BadgeCheck, CalendarCheck, FileCheck2, Star][i % 4];
              return (
              <Reveal key={f} delay={i * 0.06}>
                <div className="h-full rounded-3xl bg-cream-2 p-6 ring-1 ring-line/60">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand shadow-soft">
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-4 text-lg font-extrabold">{f}</p>
                </div>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Options + pricing */}
      <section className="bg-cream py-20 lg:py-24" id="pricing">
        <div className="container-site">
          <SectionHeading eyebrow="Service options & pricing" title="Clear prices, no surprises" intro="Your final price is calculated live in the booking form. Here's what most homes pay." />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <PricingTable service={service} />
              <div className="rounded-3xl bg-white p-6 sm:p-7">
                <h3 className="text-xl font-extrabold">Add-on extras</h3>
                <div className="mt-4 grid gap-2">
                  {service.extras.map((id) => {
                    const e = extraById(id);
                    if (!e) return null;
                    return (
                      <button key={id} onClick={() => setExtraInfo(extraInfo === id ? null : id)} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-cream-2" aria-expanded={extraInfo === id}>
                        <span className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-full bg-cream text-brand">
                            <Plus className="size-4" />
                          </span>
                          <span>
                            <span className="block font-semibold">{e.label}</span>
                            {extraInfo === id && <span className="block text-sm text-ink-soft">{e.description}</span>}
                          </span>
                        </span>
                        <span className="font-bold">+£{e.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 sm:p-8">
              <h3 className="text-xl font-extrabold">What&apos;s included</h3>
              <ul className="mt-5 grid gap-3">
                {service.includes.map((inc) => (
                  <li key={inc} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    <span className="text-[15px]">{inc}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-xl font-extrabold">Not included</h3>
              <ul className="mt-4 grid gap-3">
                {notIncluded.map((inc) => (
                  <li key={inc} className="flex items-start gap-3 text-ink-soft">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                      <X className="size-4" strokeWidth={3} />
                    </span>
                    <span className="text-[15px]">{inc}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-cream-2 p-5">
                <p className="text-sm text-ink-soft">
                  Minimum booking <strong className="text-ink">{service.minHours}h</strong> · Hourly rate <strong className="text-ink">£{service.hourlyRate.toFixed(2)}</strong> · Cleaning products <strong className="text-ink">+£2/h</strong>
                </p>
                <LinkButton href={bookingHref({ service: service.slug })} className="mt-4 w-full">
                  Calculate my exact price
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {packages.length > 0 && (
        <section className="py-16 lg:py-20" id="packages">
          <div className="container-site">
            <SectionHeading eyebrow="Packages" title={`Save with a ${service.name.toLowerCase()} package`} intro="Bundle several sessions together and pay less per clean." />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => {
                const full = p.sessions * p.hoursPerSession * service.hourlyRate;
                const price = full * (1 - p.discountPct / 100);
                return (
                  <div key={p.id} className="flex flex-col rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/60">
                    <Badge tone="success" className="w-fit">Save {p.discountPct}%</Badge>
                    <h3 className="mt-3 text-xl font-extrabold">{p.name}</h3>
                    <p className="mt-1 flex-1 text-[15px] text-ink-soft">{p.description}</p>
                    <p className="mt-4 text-sm text-muted">
                      {p.sessions} sessions × {p.hoursPerSession}h
                    </p>
                    <p className="mt-1">
                      <span className="font-display text-3xl font-extrabold">{gbp2(price)}</span> <span className="text-sm text-muted line-through">{gbp2(full)}</span>
                    </p>
                    <LinkButton href={bookingHref({ service: service.slug })} className="mt-5 w-full">
                      Book this package
                    </LinkButton>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="py-20 lg:py-24">
        <div className="container-site">
          <SectionHeading eyebrow="Customer reviews" title={`What customers say about our ${service.kind === "ironing" ? "ironing" : "cleaners"}`} action={<LinkButton href="/reviews" variant="outline">All reviews</LinkButton>} />
          {shown.length ? (
            <ReviewCarousel reviews={shown} gridClassName="md:grid-cols-3" />
          ) : (
            <EmptyState title="No reviews yet" description="Be the first to review this service." />
          )}
        </div>
      </section>

      <div className="bg-cream-2">
        <HowItWorks id="steps" title={`Booking ${service.name.toLowerCase()} is easy`} />
      </div>
      <FaqSection faqs={faqs} title={`${service.name} FAQs`} />
      <div className="bg-cream-2">
        <RelatedServices excludeSlug={service.slug} />
      </div>
      <div className="pt-20">
        <CtaBand title={`Book ${service.name.toLowerCase()} today`} href={bookingHref({ service: service.slug })} text={services.length ? `From £${service.hourlyRate.toFixed(2)}/hr with vetted, insured pros near you.` : ""} />
      </div>
    </>
  );
}

/** Client wrapper: resolves the latest version of a service from the store (admin edits apply live) */
export function ServicePageClient({ slug }: { slug: string }) {
  const services = useStore("services");
  const service = services.find((s) => s.slug === slug);
  if (!service || !service.active) {
    return (
      <div className="container-site py-24">
        <EmptyState
          title={service ? "This service is currently unavailable" : "Service not found"}
          description="It may have been paused or removed. Browse our other cleaning services instead."
          action={<LinkButton href="/domestic-cleaning">View all services</LinkButton>}
        />
      </div>
    );
  }
  return (
    <>
      <ServiceHero service={service} />
      <ServiceBody service={service} />
    </>
  );
}
