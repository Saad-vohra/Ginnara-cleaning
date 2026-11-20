"use client";

import { ArrowRight, BadgeCheck, CalendarClock, Check, ClipboardCheck, PiggyBank, ShieldCheck, Smartphone, UserPlus, Video } from "lucide-react";
import { useState } from "react";
import { LinkButton } from "@/components/common/Button";
import { Accordion, Photo, Reveal, SectionHeading, Stars } from "@/components/common/ui";
import { IMG, AVATARS } from "@/data/images";
import { FAQS } from "@/data/mock-content";
import { useStore } from "@/hooks/useStore";
import { gbp } from "@/lib/utils";

function EarningsCalculator() {
  const [hours, setHours] = useState(20);
  const [rate, setRate] = useState(21);
  const weekly = hours * rate * 0.8;
  return (
    <div className="rounded-[32px] bg-white p-6 shadow-lift sm:p-8">
      <p className="text-sm font-bold tracking-wider text-brand uppercase">Earnings calculator</p>
      <label className="mt-6 block">
        <span className="flex justify-between text-sm font-semibold">
          Hours per week <span className="text-brand">{hours}h</span>
        </span>
        <input type="range" min={5} max={45} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-3 w-full accent-[#f2602b]" />
      </label>
      <label className="mt-6 block">
        <span className="flex justify-between text-sm font-semibold">
          Average customer rate <span className="text-brand">£{rate}/hr</span>
        </span>
        <input type="range" min={18} max={26} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-3 w-full accent-[#f2602b]" />
      </label>
      <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-cream p-5">
        <div>
          <p className="text-xs text-muted">Per week</p>
          <p className="font-display text-3xl font-extrabold">{gbp(Math.round(weekly))}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Per month</p>
          <p className="font-display text-3xl font-extrabold">{gbp(Math.round(weekly * 4.33))}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Estimate based on keeping 80% of the booking value. Illustrative only.</p>
    </div>
  );
}

export function BecomeAPro() {
  // FAQs are editable in the admin panel; fall back to the seed "Becoming a pro" answers if they aren't in the store yet
  const stored = useStore("faqs");
  const proFaqs = [...stored.filter((f) => f.category === "Becoming a pro" || f.category === "Cleaners"), ...FAQS.filter((f) => f.category === "Becoming a pro" && !stored.some((s) => s.q === f.q))];
  const perks = [
    { icon: CalendarClock, title: "Choose your hours", text: "Set your availability by the day. Accept the jobs you want, near where you live." },
    { icon: PiggyBank, title: "Keep 80%, paid weekly", text: "Transparent earnings, no joining fees and payouts every Friday." },
    { icon: ShieldCheck, title: "Insured on every job", text: "Public liability and damage cover included at no cost to you." },
    { icon: Smartphone, title: "Everything in one app", text: "Requests, schedule, directions, messaging and earnings in your pocket." },
  ];
  const steps = [
    { icon: UserPlus, title: "Apply online", text: "5 minutes: your details, experience and availability." },
    { icon: Video, title: "Quick video chat", text: "A friendly 15-minute call with our pro team." },
    { icon: ClipboardCheck, title: "Checks & onboarding", text: "ID, right-to-work and DBS check — we guide you through." },
    { icon: BadgeCheck, title: "Start earning", text: "Accept your first booking, usually within a week." },
  ];
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 opacity-40">
          <Photo src={IMG.proWindow} alt="" fill priority sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="container-site relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              <BadgeCheck className="size-4 text-sun" /> 3,100+ pros already earning with Ginnara
            </p>
            <h1 className="text-[2.7rem] leading-[1] font-extrabold sm:text-6xl">Clean on your terms. Earn what you deserve.</h1>
            <p className="mt-5 max-w-lg text-lg text-white/85">Join the UK&apos;s friendliest cleaning platform as a self-employed pro. Flexible hours, fair pay and a team that has your back.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/pro/register" size="lg" iconRight={<ArrowRight className="size-5" />}>
                Apply now
              </LinkButton>
              <LinkButton href="/pro/login" size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-ink">
                Pro sign in
              </LinkButton>
            </div>
          </div>
          <EarningsCalculator />
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-site">
          <SectionHeading eyebrow="Why Ginnara" title="Built around the people who do the work" align="center" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="h-full rounded-3xl bg-cream-2 p-7 ring-1 ring-line/60">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand shadow-soft">
                    <p.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold">{p.title}</h3>
                  <p className="mt-2 text-[15px] text-ink-soft">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="How to join" title="From application to first job in about a week" className="!mb-8" />
            <ol className="space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-white">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-lg font-extrabold">
                      {i + 1}. {s.title}
                    </p>
                    <p className="text-ink-soft">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <LinkButton href="/pro/register" size="lg" className="mt-8">
              Start my application
            </LinkButton>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[40px]">
              <Photo src={IMG.gloveWipe} alt="Pro cleaning a surface" fill sizes="(max-width: 1024px) 100vw, 560px" />
            </div>
            <div className="absolute -bottom-6 -left-2 max-w-xs rounded-3xl bg-white p-5 shadow-lift sm:-left-8">
              <div className="flex items-center gap-3">
                <span className="relative size-12 overflow-hidden rounded-full">
                  <Photo src={AVATARS[4]} alt="" fill sizes="48px" />
                </span>
                <div>
                  <p className="font-bold">Zara, London</p>
                  <Stars value={5} size={14} />
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-soft">“I set my own hours around school runs and earn more than I did at an agency.”</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionHeading title="Requirements" className="!mb-6" />
            <ul className="space-y-3">
              {["Right to work in the UK", "Aged 18 or over", "At least 1 year of cleaning experience (home or professional)", "A smartphone", "Pass a basic DBS check", "Friendly, reliable and detail-oriented"].map((r) => (
                <li key={r} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={3} /> {r}
                </li>
              ))}
            </ul>
          </div>
          <Accordion items={proFaqs.map((f) => ({ q: f.q, a: f.a }))} />
        </div>
      </section>
    </>
  );
}
