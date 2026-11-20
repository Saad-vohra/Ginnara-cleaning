"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Clock, Mail, Phone, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Service } from "@/types";
import { LinkButton } from "@/components/common/Button";
import { Photo, Reveal, SectionHeading } from "@/components/common/ui";
import { useActiveServices, useStore } from "@/hooks/useStore";
import { bookingHref, serviceHref } from "@/lib/routes";
import { isQuoteOnly, priceLabel } from "@/lib/services";
import { QuoteActions } from "@/components/common/WhatsApp";
import { cn } from "@/lib/utils";

const TILE_COLORS = ["bg-brand", "bg-sun", "bg-sky", "bg-blush", "bg-mint", "bg-lilac", "bg-sun", "bg-sky"];

/** Bold colour tiles — pick one to open that service's details just below */
export function CategoryTiles() {
  const featured = ["residential-cleaning", "office-cleaning", "deep-cleaning", "airbnb-cleaning", "move-in-move-out-cleaning", "special-event-cleaning", "plumbing", "house-moving"];
  const services = useActiveServices();
  const tiles = featured.map((slug) => services.find((s) => s.slug === slug)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const settings = useStore("settings");
  const [open, setOpen] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = tiles.find((s) => s.slug === open) ?? null;
  const subtitle: Record<string, string> = {
    "residential-cleaning": "dusting, vacuuming, mopping",
    "office-cleaning": "before or after hours",
    "deep-cleaning": "plus bathroom cleaning",
    "move-in-move-out-cleaning": "plus kitchen cleaning",
    "special-event-cleaning": "before & after the party",
    "airbnb-cleaning": "guest-ready turnovers",
    plumbing: "leaks, taps & toilets",
    "house-moving": "loading, moving, unloading",
  };
  const choose = (slug: string) => {
    const next = open === slug ? null : slug;
    setOpen(next);
    if (next) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };
  return (
    <section className="py-16 lg:py-24">
      <div className="container-site">
        <SectionHeading eyebrow="Our cleaning services" title="Choose your service" intro="Tap a service to see what's included, prices and how to book — or get a quote on WhatsApp." className="!mb-8" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((s, i) => {
            const isOpen = open === s.slug;
            return (
              <Reveal key={s.id} delay={(i % 3) * 0.08}>
                <button
                  type="button"
                  onClick={() => choose(s.slug)}
                  aria-expanded={isOpen}
                  aria-controls="service-details"
                  className={cn(
                    "group relative block aspect-[3/2] w-full overflow-hidden rounded-3xl text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift",
                    TILE_COLORS[i],
                    isOpen && "-translate-y-1 shadow-lift ring-4 ring-ink ring-offset-4 ring-offset-cream",
                    open && !isOpen && "opacity-70 hover:opacity-100",
                  )}
                >
                  <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden">
                    <Photo src={s.image} alt="" fill sizes="(max-width: 640px) 60vw, 280px" className="transition duration-700 group-hover:scale-105 [mask-image:linear-gradient(to_right,transparent,black_35%)]" />
                  </div>
                  <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
                    <div>
                      <h3 className={cn("max-w-[62%] text-[1.8rem] leading-[0.95] font-extrabold sm:text-[2.1rem]", i === 0 ? "text-white" : "text-ink")}>{s.name.replace(" Cleaning", "").replace("/", "/​")}</h3>
                      <p className={cn("mt-2 text-[17px]", i === 0 ? "text-white/90" : "text-ink/80")}>{subtitle[s.slug] ?? s.short}</p>
                    </div>
                    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition", i === 0 ? "bg-white text-ink" : "bg-ink text-white")}>
                      {isOpen ? "Hide details" : priceLabel(s, { from: true })}
                      <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
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
        <div ref={panelRef} id="service-details" className="scroll-mt-24">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div key={selected.slug} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="pt-8">
                  <ServiceDetail svc={selected} onClose={() => setOpen(null)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ServiceDetail({ svc, onClose }: { svc: Service; onClose: () => void }) {
  return (
    <div className="relative grid overflow-hidden rounded-[36px] bg-white shadow-soft lg:grid-cols-2">
      <button type="button" onClick={onClose} aria-label="Close service details" className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white text-ink shadow transition hover:bg-cream">
        <X className="size-5" />
      </button>
      <div className="relative min-h-[260px] lg:min-h-[480px]">
        <Photo src={svc.image} alt={svc.name} fill sizes="(max-width: 1024px) 100vw, 620px" />
        <span className="absolute top-5 left-5 rounded-full bg-white px-4 py-2 text-sm font-bold shadow">{svc.tagline}</span>
      </div>
      <div className="flex flex-col p-7 sm:p-10 lg:p-12">
        <h3 className="pr-10 text-3xl font-extrabold sm:text-4xl">{svc.name}</h3>
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
        {svc.packages?.length ? (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {svc.packages.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-2 px-4 py-3 text-[15px]">
                <span>{p.label}</span>
                <span className="font-display text-lg font-extrabold">£{p.price}</span>
              </div>
            ))}
          </div>
        ) : null}
        {svc.priceNote && <p className="mt-4 text-sm text-muted">{svc.priceNote}</p>}
        {isQuoteOnly(svc) ? (
          <div className="mt-auto pt-8">
            <QuoteActions service={svc} />
            <LinkButton href={serviceHref(svc.slug)} variant="ghost" className="mt-2">
              Learn more
            </LinkButton>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {svc.packages?.length ? (
                <>
                  <p className="text-sm text-muted">Fixed price</p>
                  <p className="font-display text-4xl font-extrabold">{priceLabel(svc)}</p>
                </>
              ) : svc.oneOffRate ? (
                <>
                  <p className="text-sm text-muted">Regular · One-off</p>
                  <p className="font-display text-4xl font-extrabold">
                    £{svc.hourlyRate}
                    <span className="text-lg font-semibold text-muted">/hr</span> · £{svc.oneOffRate}
                    <span className="text-lg font-semibold text-muted">/hr</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">Hourly rate from</p>
                  <p className="font-display text-4xl font-extrabold">
                    £{svc.hourlyRate.toFixed(2)}
                    <span className="text-lg font-semibold text-muted">/hr</span>
                  </p>
                </>
              )}
              {!svc.packages?.length && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                  <Clock className="size-4" /> Minimum {svc.minHours} {svc.minHours === 1 ? "hour" : "hours"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={serviceHref(svc.slug)} variant="outline">
                Learn more
              </LinkButton>
              <LinkButton href={bookingHref({ service: svc.slug })}>Book now</LinkButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

