"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bell, CalendarDays, Check, Smartphone, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { Button, LinkButton } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Photo, Reveal, Stars } from "@/components/common/ui";
import { IMG, AVATARS } from "@/data/images";
import { useStore } from "@/hooks/useStore";
import { ReviewCarousel } from "@/components/common/ReviewCarousel";
import { useToast } from "@/components/common/Toast";
import { Input } from "@/components/common/Field";
import { phoneField } from "@/lib/validation";

export function Testimonials() {
  const reviews = useStore("reviews").filter((r) => r.published);
  const [count, setCount] = useState(6);
  return (
    <section className="py-20 lg:py-28">
      <div className="container-site">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl lg:text-6xl">Over 250,000 sparkling homes</h2>
            <p className="mt-5 flex flex-wrap items-baseline gap-3 text-lg text-ink-soft">
              Our average rating is <span className="font-display text-5xl font-extrabold text-ink">4.9/5</span>
            </p>
            <p className="mt-1 text-lg text-ink-soft">What about you?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {AVATARS.slice(0, 5).map((a, i) => (
                <span key={a} className="relative size-12 overflow-hidden rounded-full ring-4 ring-white" style={{ zIndex: 5 - i }}>
                  <Photo src={a} alt="" fill sizes="48px" />
                </span>
              ))}
            </div>
            <p className="text-sm text-ink-soft">
              <span className="block font-semibold text-ink">3,100+ vetted pros</span>across the UK
            </p>
          </div>
        </div>
        <ReviewCarousel reviews={reviews.slice(0, count)} />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {count < reviews.length && (
            <Button variant="outline" className="hidden md:inline-flex" onClick={() => setCount((c) => c + 3)}>
              Show more reviews
            </Button>
          )}
          <LinkButton href="/reviews" variant="ghost" iconRight={<ArrowRight className="size-4" />}>
            Read all reviews
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

export function AboutStrip() {
  return (
    <section className="bg-cream">
      <div className="container-site grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <Reveal className="relative aspect-[3/2] overflow-hidden rounded-3xl">
          <Photo src={IMG.coupleKitchen} alt="Couple cooking together in a tidy kitchen" fill sizes="(max-width: 1024px) 100vw, 600px" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-4xl font-extrabold sm:text-5xl">We are Ginnara</h2>
          <ul className="mt-6 space-y-3 text-lg text-ink-soft">
            <li>
              <strong className="text-ink">Giving</strong> everyone more time for what matters.
            </li>
            <li>
              <strong className="text-ink">Championing</strong> the work of home-care professionals.
            </li>
            <li>
              <strong className="text-ink">Building</strong> a fair, sustainable cleaning service.
            </li>
          </ul>
          <p className="mt-6 text-lg text-ink-soft">That&apos;s what gets us up every morning.</p>
          <LinkButton href="/about" variant="outline" className="mt-8">
            Find out more
          </LinkButton>
        </Reveal>
      </div>
    </section>
  );
}

export function AppPromo() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const { success } = useToast();
  return (
    <section className="py-20 lg:py-28">
      <div className="container-site">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[40px] bg-ink px-6 pt-12 text-white sm:px-12 lg:grid-cols-2 lg:px-16 lg:pt-0">
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative py-4 lg:py-20">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
              <Smartphone className="size-4 text-sun" /> The Ginnara app
            </p>
            <h2 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl">Your home, managed from your pocket</h2>
            <ul className="mt-6 space-y-3 text-white/85">
              {["Book and reschedule in two taps", "Message your pro directly", "Live arrival notifications", "Rate and rebook favourites"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <Check className="size-5 text-sun" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="light" onClick={() => setOpen(true)}>
                Text me the app link
              </Button>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Stars value={5} size={14} /> 4.8 on app stores
              </div>
            </div>
          </div>
          <div className="relative flex justify-center lg:self-end">
            <motion.div initial={{ y: 60 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ type: "spring", damping: 20 }} className="w-[280px] rounded-t-[44px] border-[10px] border-b-0 border-[#111] bg-cream-2 px-4 pt-8 pb-6 shadow-2xl">
              <div className="mx-auto mb-5 h-5 w-24 rounded-full bg-[#111]" />
              <p className="text-xs font-semibold text-muted">Good morning, Amelia</p>
              <p className="font-display text-xl font-extrabold text-ink">Your next clean</p>
              <div className="mt-3 rounded-2xl bg-white p-3 text-ink shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="relative size-11 overflow-hidden rounded-full">
                    <Photo src={AVATARS[4]} alt="" fill sizes="44px" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Zara M.</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Star className="size-3 fill-sun text-sun" /> 4.97 · 412 cleans
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-cream px-3 py-2 text-xs font-semibold">
                  <CalendarDays className="size-4 text-brand" /> Thu 10:00 · Regular · 3h
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-ink p-3 text-xs text-white">
                <Bell className="size-4 text-sun" /> Zara is on her way — 12 min
              </div>
              <div className="bg-brand-gradient mt-3 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white">
                <Sparkles className="size-4" /> Book again
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Get the app"
        description="We'll text you a download link. (Demo: no SMS is actually sent.)"
        size="sm"
        footer={
          <Button
            onClick={() => {
              const r = phoneField.safeParse(phone);
              if (!r.success) return setError(r.error.issues[0].message);
              setOpen(false);
              setPhone("");
              setError("");
              success("Link sent!", `Demo: we'd text ${r.data} a download link.`);
            }}
          >
            Send link
          </Button>
        }
      >
        <Input label="Mobile number" name="app-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900123" error={error} inputMode="tel" />
      </Modal>
    </section>
  );
}
