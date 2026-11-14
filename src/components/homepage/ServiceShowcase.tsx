"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { LinkButton } from "@/components/common/Button";
import { Photo, PillTabs, Reveal, SectionHeading } from "@/components/common/ui";
import { ServiceCard } from "@/components/services/Cards";
import { useActiveServices, useStore } from "@/hooks/useStore";
import { bookingHref, serviceHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const TILE_COLORS = ["bg-brand", "bg-sun", "bg-sky", "bg-blush", "bg-mint", "bg-lilac"];

/** Bold colour tiles — the playful entry point to each service */
export function CategoryTiles() {
  const featured = ["residential-cleaning", "office-cleaning", "deep-cleaning", "move-in-move-out-cleaning", "special-event-cleaning"];
  const services = useActiveServices();
  const tiles = featured.map((slug) => services.find((s) => s.slug === slug)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const settings = useStore("settings");
  const subtitle: Record<string, string> = {
    "residential-cleaning": "dusting, vacuuming, mopping",
    "office-cleaning": "before or after hours",
    "deep-cleaning": "plus bathroom cleaning",
    "move-in-move-out-cleaning": "plus kitchen cleaning",
    "special-event-cleaning": "before & after the party",
  };
  return (
    <section className="py-16 lg:py-24">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 0.08}>
              <Link href={serviceHref(s.slug)} className={cn("group relative block aspect-[3/2] overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift", TILE_COLORS[i])}>
                <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden">
                  <Photo src={s.image} alt="" fill sizes="(max-width: 640px) 60vw, 280px" className="transition duration-700 group-hover:scale-105 [mask-image:linear-gradient(to_right,transparent,black_35%)]" />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
                  <div>
                    <h3 className={cn("max-w-[62%] text-[1.8rem] leading-[0.95] font-extrabold sm:text-[2.1rem]", i === 0 ? "text-white" : "text-ink")}>{s.name.replace(" Cleaning", "").replace("/", "/​")}</h3>
                    <p className={cn("mt-2 text-[17px]", i === 0 ? "text-white/90" : "text-ink/80")}>{subtitle[s.slug]}</p>
                  </div>
                  <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition", i === 0 ? "bg-white text-ink" : "bg-ink text-white", "group-hover:gap-3")}>
                    from £{s.hourlyRate.toFixed(2)}/hr <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
          <Reveal delay={0.16}>
            <div className="relative flex aspect-[3/2] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-soft sm:p-8">
              <div className="absolute -top-10 -right-10 size-40 rounded-full bg-brand/30" />
              <div className="relative">
                <h3 className="text-[1.8rem] leading-[0.95] font-extrabold sm:text-[2.1rem]">Need a quote?</h3>
                <p className="mt-2 text-[17px] text-white/80">Talk to our London team</p>
              </div>
              <div className="relative space-y-2 text-[15px]">
                <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 font-semibold hover:text-sun">
                  <Phone className="size-4 text-sun" /> {settings.supportPhone}
                </a>
                <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 break-all hover:text-sun">
                  <Mail className="size-4 shrink-0 text-sun" /> {settings.supportEmail}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function PopularServices() {
  const services = useActiveServices();
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className="py-16 lg:py-20">
      <div className="container-site">
        <SectionHeading
          title="Popular cleaning services"
          className="!mb-8"
          action={
            <div className="flex gap-2">
              <button aria-label="Scroll left" onClick={() => scroll(-1)} className="grid size-12 place-items-center rounded-full border-2 border-line bg-white transition hover:border-ink">
                <ChevronLeft className="size-5" />
              </button>
              <button aria-label="Scroll right" onClick={() => scroll(1)} className="grid size-12 place-items-center rounded-full border-2 border-line bg-white transition hover:border-ink">
                <ChevronRight className="size-5" />
              </button>
            </div>
          }
        />
      </div>
      <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-6 sm:scroll-px-6 sm:px-6 xl:px-[max(2rem,calc((100vw-1240px)/2+2rem))] xl:scroll-px-[max(2rem,calc((100vw-1240px)/2+2rem))]">
        {services.map((s, i) => (
          <ServiceCard key={s.id} service={s} priority={i < 3} className="w-[82vw] max-w-[360px] shrink-0 snap-start sm:w-[340px]" />
        ))}
      </div>
    </section>
  );
}

/** Interactive explorer: pick a service type, see what's included */
export function ServiceExplorer() {
  const services = useActiveServices();
  const featured = ["residential-cleaning", "office-cleaning", "deep-cleaning", "move-in-move-out-cleaning", "special-event-cleaning"].map((s) => services.find((x) => x.slug === s)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const [active, setActive] = useState(featured[0]?.slug ?? "");
  const svc = featured.find((s) => s.slug === active) ?? featured[0];
  if (!svc) return null;
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="container-site">
        <SectionHeading eyebrow="Find your clean" title="Every kind of clean, one trusted team" intro="From weekly upkeep to move-out deep cleans, choose the service that fits your home and your week." />
        <PillTabs tabs={featured.map((f) => ({ value: f.slug, label: f.name }))} value={active} onChange={setActive} className="mb-8" />
        <AnimatePresence mode="wait">
          <motion.div key={svc.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="grid overflow-hidden rounded-[36px] bg-white shadow-soft lg:grid-cols-2">
            <div className="relative min-h-[300px] lg:min-h-[520px]">
              <Photo src={svc.image} alt={svc.name} fill sizes="(max-width: 1024px) 100vw, 620px" />
              <span className="absolute top-5 left-5 rounded-full bg-white px-4 py-2 text-sm font-bold shadow">{svc.tagline}</span>
            </div>
            <div className="flex flex-col p-7 sm:p-10 lg:p-12">
              <h3 className="text-3xl font-extrabold sm:text-4xl">{svc.name}</h3>
              <p className="mt-3 text-[17px] text-ink-soft">{svc.description}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {svc.includes.map((inc) => (
                  <li key={inc} className="flex items-start gap-2.5 text-[15px]">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {inc}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-muted">Hourly rate from</p>
                  <p className="font-display text-4xl font-extrabold">
                    £{svc.hourlyRate.toFixed(2)}
                    <span className="text-lg font-semibold text-muted">/hr</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <Clock className="size-4" /> Minimum {svc.minHours} {svc.minHours === 1 ? "hour" : "hours"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={serviceHref(svc.slug)} variant="outline">
                    Learn more
                  </LinkButton>
                  <LinkButton href={bookingHref({ service: svc.slug })}>Book now</LinkButton>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/** Alternating split feature rows for signature services */
export function SpotlightRows() {
  const services = useActiveServices();
  const rows = [
    { slug: "residential-cleaning", color: "bg-brand", eyebrow: "Residential cleaning · £16.50/hr", title: "Your weekends, back.", points: ["Dusting, vacuuming and mopping", "Save 10% on weekly bookings", "Same cleaner every visit"] },
    { slug: "office-cleaning", color: "bg-sky", eyebrow: "Office cleaning · £16.50/hr", title: "A workspace your team will love.", points: ["Before or after business hours", "Desks, kitchens and washrooms", "Daily, weekly or one-off"] },
    { slug: "move-in-move-out-cleaning", color: "bg-blush", eyebrow: "Move-in/move-out · £18/hr", title: "Moving home? We'll handle the clean.", points: ["Deep clean plus full kitchen clean", "Ready for landlord inspection", "Perfect for empty properties"] },
  ];
  return (
    <section className="overflow-x-clip py-20 lg:py-28">
      <div className="container-site space-y-20 lg:space-y-28">
        {rows.map((row, i) => {
          const s = services.find((x) => x.slug === row.slug);
          if (!s) return null;
          return (
            <div key={row.slug} className={cn("grid items-center gap-10 lg:grid-cols-2 lg:gap-20", i % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
              <Reveal className="relative">
                <div className={cn("absolute -inset-3 rotate-[-3deg] rounded-[44px]", row.color)} />
                <div className="relative aspect-[5/4] overflow-hidden rounded-[40px]">
                  <Photo src={s.image} alt={s.name} fill sizes="(max-width: 1024px) 100vw, 600px" />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mb-3 text-[13px] font-bold tracking-[0.14em] text-brand uppercase">{row.eyebrow}</p>
                <h2 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl">{row.title}</h2>
                <p className="mt-4 text-lg text-ink-soft">{s.description}</p>
                <ul className="mt-6 space-y-3">
                  {row.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 font-medium">
                      <span className="grid size-7 place-items-center rounded-full bg-ink text-white">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <LinkButton href={bookingHref({ service: s.slug })} size="lg">
                    Book {s.name.toLowerCase()}
                  </LinkButton>
                  <Link href={serviceHref(s.slug)} className="font-semibold underline underline-offset-4 hover:text-brand">
                    See prices & details
                  </Link>
                </div>
              </Reveal>
            </div>
          );
        })}
      </div>
    </section>
  );
}
