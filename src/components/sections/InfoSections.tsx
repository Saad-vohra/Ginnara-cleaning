"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, CalendarClock, CircleDollarSign, Clock4, HeartHandshake, Leaf, MapPin, Search, ShieldCheck, Sparkles, ThumbsUp, UserCheck } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/common/Button";
import { Accordion, Photo, Reveal, SectionHeading } from "@/components/common/ui";
import { IMG } from "@/data/images";
import { CITIES } from "@/data/mock-cities";
import { useActiveServices, useStore } from "@/hooks/useStore";
import { serviceHref } from "@/lib/routes";
import type { Faq } from "@/types";

export function HowItWorks({ id = "how-it-works", title = "Sparkling in three simple steps" }: { id?: string; title?: string }) {
  const steps = [
    { icon: Search, color: "bg-sun", title: "Tell us about your home", text: "Enter your postcode, choose a service and tell us how many rooms. We'll recommend the right duration." },
    { icon: CalendarCheck, color: "bg-sky", title: "Pick a time that suits you", text: "Choose any day from tomorrow, 7 days a week, from 8am to 7pm. Instant confirmation, no phone calls." },
    { icon: Sparkles, color: "bg-blush", title: "Relax, we'll handle the rest", text: "A vetted, insured pro arrives on time. Rate your clean afterwards and rebook in one tap." },
  ];
  return (
    <section id={id} className="scroll-mt-28 py-20 lg:py-28">
      <div className="container-site">
        <SectionHeading eyebrow="How it works" title={title} align="center" intro="Booking a cleaner should take less time than making a cup of tea." />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="absolute top-12 right-[16%] left-[16%] hidden h-0.5 border-t-2 border-dashed border-line md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
              <div className={`relative mx-auto grid size-24 place-items-center rounded-[32px] ${s.color} rotate-[-4deg] shadow-soft`}>
                <s.icon className="size-10 rotate-[4deg] text-ink" strokeWidth={1.8} />
                <span className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[15px] text-ink-soft">{s.text}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <LinkButton href="/booking" size="lg" iconRight={<ArrowRight className="size-5" />}>
            Book my cleaning
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  const items = [
    { icon: Clock4, title: "We're efficient", text: "Forget agencies and cash-in-hand arrangements. Book online in two minutes and get a confirmed pro instantly." },
    { icon: CalendarClock, title: "We're flexible", text: "Something come up? Change, skip or cancel free of charge up to 24 hours before your clean." },
    { icon: CircleDollarSign, title: "We're fair", text: "Transparent prices with no hidden fees. Pros keep 80% of every booking and are paid weekly." },
    { icon: Leaf, title: "We're greener", text: "Eco-friendly supplies kit on request and a carbon-light approach: local pros, short journeys." },
  ];
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="container-site">
        <SectionHeading eyebrow="Why Ginnara" title="You're going to love us" intro="Thousands of households trust Ginnara to look after their home. Here's why they stay." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.08}>
              <div className="h-full rounded-3xl bg-white p-7 shadow-soft">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <it.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold">{it.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{it.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const points = [
    { icon: UserCheck, title: "Every pro is vetted", text: "ID, right-to-work, DBS background and reference checks, plus an in-person skills interview. Only 1 in 8 applicants is accepted." },
    { icon: ShieldCheck, title: "Insured up to £5m", text: "Public liability and accidental damage cover on every single booking, at no extra cost." },
    { icon: ThumbsUp, title: "Satisfaction guarantee", text: "Not happy? Tell us within 48 hours and we'll send a pro back to put it right, free of charge." },
    { icon: HeartHandshake, title: "Real humans on support", text: "Our UK-based team is on hand 7 days a week by chat, phone or email." },
  ];
  return (
    <section className="py-20 lg:py-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] bg-sky sm:aspect-[5/5]">
            <Photo src={IMG.gloveHeart} alt="Cleaning gloves forming a heart" fill sizes="(max-width: 1024px) 100vw, 600px" />
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="absolute -bottom-6 left-4 rounded-3xl bg-white p-5 shadow-lift sm:left-8">
            <p className="font-display text-4xl font-extrabold">98%</p>
            <p className="text-sm text-ink-soft">of cleans rated 4★ or more</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.45 }} className="absolute top-6 -right-2 hidden rounded-3xl bg-ink p-5 text-white shadow-lift sm:block">
            <ShieldCheck className="size-7 text-sun" />
            <p className="mt-2 text-sm font-semibold">DBS checked
              <br />& fully insured</p>
          </motion.div>
        </Reveal>
        <div>
          <SectionHeading eyebrow="Trust & quality" title="Your home is in safe hands" className="!mb-8" />
          <div className="grid gap-6">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06} className="flex gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream">
                  <p.icon className="size-6 text-brand" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">{p.title}</h3>
                  <p className="mt-1 text-[15px] text-ink-soft">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ faqs: faqsProp, title = "Questions? We've got answers" }: { faqs?: Faq[]; title?: string }) {
  const stored = useStore("faqs");
  const faqs = faqsProp ?? stored.slice(0, 6);
  return (
    <section className="py-20 lg:py-28">
      <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow="FAQ" title={title} className="!mb-6" />
          <p className="text-ink-soft">Can&apos;t find what you&apos;re looking for? Our support team replies within the hour.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/faq" variant="outline">
              All FAQs
            </LinkButton>
            <LinkButton href="/contact" variant="ghost">
              Contact us
            </LinkButton>
          </div>
        </div>
        <Accordion items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
      </div>
    </section>
  );
}

export function LocationsSection({ title = "Ginnara cleaners in our top cities" }: { title?: string }) {
  const services = useActiveServices();
  return (
    <section className="py-20 lg:py-28">
      <div className="container-site">
        <SectionHeading eyebrow="Locations" title={title} intro="Local pros who know your neighbourhood. Choose your city to see prices and availability." />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CITIES.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) * 0.05}>
              <Link href={`/cleaning/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-[4/3]">
                <Photo src={c.image} alt={`Home in ${c.name}`} fill sizes="(max-width: 768px) 50vw, 300px" className="transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="flex items-center gap-1 text-xs text-white/80">
                    <MapPin className="size-3.5" /> {c.pros.toLocaleString()} pros
                  </p>
                  <p className="font-display text-xl font-extrabold">{c.name}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-2 rounded-3xl bg-cream-2 p-6 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
          {CITIES.slice(0, 4).flatMap((c) =>
            services.slice(0, 3).map((s) => (
              <Link key={c.slug + s.id} href={`/cleaning/${c.slug}?service=${s.slug}`} className="truncate text-ink-soft hover:text-brand">
                {s.name} in {c.name}
              </Link>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ title = "Ready for a cleaner home?", text = "Book in two minutes. Pros available from tomorrow, 7 days a week.", href = "/booking" }: { title?: string; text?: string; href?: string }) {
  return (
    <section className="pb-20 lg:pb-28">
      <div className="container-site">
        <div className="bg-brand-gradient relative overflow-hidden rounded-[40px] px-6 py-14 text-white sm:px-14 lg:py-20">
          <div className="absolute -top-20 -right-16 size-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-sun/30" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl">{title}</h2>
              <p className="mt-4 text-lg text-white/90">{text}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href={href} variant="light" size="lg" iconRight={<ArrowRight className="size-5" />}>
                Book my cleaning
              </LinkButton>
              <LinkButton href="/how-it-works" variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand">
                How it works
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RelatedServices({ excludeSlug, title = "Looking for something different?" }: { excludeSlug?: string; title?: string }) {
  const services = useActiveServices().filter((s) => s.slug !== excludeSlug);
  return (
    <section className="py-16 lg:py-20">
      <div className="container-site">
        <SectionHeading title={title} className="!mb-8" />
        <div className="flex flex-wrap gap-3">
          {services.map((s) => (
            <Link key={s.id} href={serviceHref(s.slug)} className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pr-5 pl-2 shadow-soft ring-1 ring-line/70 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="relative size-10 overflow-hidden rounded-full">
                <Photo src={s.image} alt="" fill sizes="40px" />
              </span>
              <span className="font-semibold group-hover:text-brand">{s.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
