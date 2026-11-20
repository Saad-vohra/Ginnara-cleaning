"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, CalendarSearch, CheckCircle2, Clock, CreditCard, Heart, HelpCircle, Leaf, LifeBuoy, Mail, MapPin, MessageCircle, Phone, Search, ShieldCheck, Star, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, LinkButton } from "@/components/common/Button";
import { Input, Select, Textarea } from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import { Accordion, EmptyState, Photo, PillTabs, Reveal, SectionHeading, Stars } from "@/components/common/ui";
import { ReviewCard } from "@/components/services/Cards";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { CtaBand, HowItWorks, TrustSection, WhyUs } from "@/components/sections/InfoSections";
import { PageHero } from "./PageHero";
import { IMG, AVATARS } from "@/data/images";
import { useStore } from "@/hooks/useStore";
import { findBooking } from "@/lib/bookings";
import { insert } from "@/lib/storage";
import { contactSchema, type ContactValues } from "@/lib/validation";
import { formatDate, sleep, uid } from "@/lib/utils";
import type { Booking } from "@/types";
import { notify } from "@/lib/admin";

/* ---------------- About ---------------- */
export function AboutPage() {
  const values = [
    { icon: Heart, title: "Care first", text: "We treat every home like our own and every pro like a partner." },
    { icon: ShieldCheck, title: "Trust by design", text: "Vetting, insurance and transparent pricing are non-negotiable." },
    { icon: Leaf, title: "Lighter footprint", text: "Local pros, short journeys and eco-friendly products on request." },
    { icon: Users, title: "Fair work", text: "Pros keep 80% of every booking, set their own hours and get paid weekly." },
  ];
  const stats = [
    ["250k+", "homes cleaned"],
    ["3,100+", "vetted pros"],
    ["4.9/5", "average rating"],
    ["8", "UK cities"],
  ];
  return (
    <>
      <PageHero crumb="About us" eyebrow="Our story" title="Giving people back the time to live" intro="Ginnara started with a simple idea: booking a great cleaner should be as easy as ordering a taxi, and the people doing the work deserve to be treated brilliantly." />
      <section className="py-16 lg:py-24">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="relative aspect-[4/3] overflow-hidden rounded-[40px]">
            <Photo src={IMG.familySunset} alt="Family enjoying time together" fill sizes="(max-width: 1024px) 100vw, 600px" />
          </Reveal>
          <Reveal delay={0.1} className="space-y-5 text-lg text-ink-soft">
            <h2 className="text-4xl font-extrabold text-ink">Less scrubbing, more living</h2>
            <p>Founded in London, Ginnara now connects busy households with thousands of independent cleaning professionals across the UK.</p>
            <p>We handle the bits nobody enjoys — vetting, insurance, scheduling and payments — so customers get reliable, high-quality cleaning and pros get flexible, fairly paid work.</p>
            <p className="text-sm text-muted">This website is a frontend prototype; company details are illustrative.</p>
          </Reveal>
        </div>
      </section>
      <section className="bg-ink py-16 text-white">
        <div className="container-site grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-5xl font-extrabold text-sun">{n}</p>
              <p className="mt-1 text-white/70">{l}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container-site">
          <SectionHeading eyebrow="Our values" title="What drives us every day" align="center" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06}>
                <div className="h-full rounded-3xl bg-cream-2 p-7">
                  <v.icon className="size-8 text-brand" />
                  <h3 className="mt-4 text-xl font-extrabold">{v.title}</h3>
                  <p className="mt-2 text-ink-soft">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-cream py-16 lg:py-24">
        <div className="container-site">
          <SectionHeading title="The team behind Ginnara" intro="A small, cleaning-obsessed team in London (demo profiles)." />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[["Maya Collins", "Co-founder & CEO"], ["Theo Grant", "Co-founder & CTO"], ["Ama Boateng", "Head of Pro Success"], ["Leo Fischer", "Customer Experience"]].map(([n, r], i) => (
              <div key={n} className="overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="relative aspect-square">
                  <Photo src={AVATARS[[5, 6, 2, 1][i]]} alt="" fill sizes="300px" />
                </div>
                <div className="p-4">
                  <p className="font-extrabold">{n}</p>
                  <p className="text-sm text-muted">{r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title="Join 250,000 happier homes" />
    </>
  );
}

/* ---------------- How it works ---------------- */
export function HowItWorksPage() {
  return (
    <>
      <PageHero crumb="How it works" eyebrow="Simple by design" title="From booking to sparkling in three steps" intro="No phone calls, no agencies, no contracts. Here's exactly what happens when you book with Ginnara." />
      <HowItWorks title="Book in under two minutes" />
      <section className="bg-cream-2 py-16 lg:py-24">
        <div className="container-site grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarSearch, t: "Before your clean", d: "Get a confirmation instantly. Your pro is matched and you'll get a reminder the day before." },
            { icon: Clock, t: "On the day", d: "Your pro arrives on time with a checklist tailored to your booking and your notes." },
            { icon: Star, t: "Afterwards", d: "Rate your clean, tip if you wish and rebook your favourite pro in one tap." },
            { icon: CreditCard, t: "Payment", d: "Card authorised at booking, charged after the clean. (No payment is taken in this demo.)" },
          ].map((s) => (
            <div key={s.t} className="rounded-3xl bg-white p-6 shadow-soft">
              <s.icon className="size-7 text-brand" />
              <h3 className="mt-4 text-lg font-extrabold">{s.t}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      <WhyUs />
      <TrustSection />
      <CtaBand />
    </>
  );
}

/* ---------------- FAQ ---------------- */
export function FaqPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const FAQS = useStore("faqs");
  const cats = ["All", ...Array.from(new Set(FAQS.map((f) => f.category)))];
  const list = FAQS.filter((f) => (cat === "All" || f.category === cat) && (!q.trim() || `${f.q} ${f.a}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      <PageHero crumb="FAQ" title="Frequently asked questions" intro="Everything you need to know about booking, pricing, our pros and your account.">
        <label className="relative mt-8 block max-w-xl">
          <span className="sr-only">Search FAQs</span>
          <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. “cancel”, “insured”, “price”" className="h-14 w-full rounded-full bg-white pr-5 pl-13 text-[15px] shadow-lift focus:outline-none" style={{ paddingLeft: 52 }} />
        </label>
      </PageHero>
      <section className="py-12 lg:py-16">
        <div className="container-site max-w-4xl">
          <PillTabs className="mb-8" value={cat} onChange={setCat} tabs={cats.map((c) => ({ value: c, label: c, count: c === "All" ? FAQS.length : FAQS.filter((f) => f.category === c).length }))} />
          {list.length ? (
            <Accordion key={cat + q} items={list.map((f) => ({ q: f.q, a: f.a }))} defaultOpen={q ? 0 : null} />
          ) : (
            <EmptyState icon={<HelpCircle className="size-6" />} title="No matching questions" description="Try another word, or ask our team directly." action={<LinkButton href="/contact">Contact us</LinkButton>} />
          )}
        </div>
      </section>
      <CtaBand title="Still have questions?" text="Our UK-based team replies within the hour, 7 days a week." href="/contact" />
    </>
  );
}

/* ---------------- Reviews ---------------- */
export function ReviewsPage() {
  const reviews = useStore("reviews").filter((r) => r.published);
  const [rating, setRating] = useState<"all" | "5" | "4" | "3">("all");
  const [service, setService] = useState("All services");
  const [sort, setSort] = useState("recent");
  const [count, setCount] = useState(9);
  const services = ["All services", ...Array.from(new Set(reviews.map((r) => r.service)))];
  const list = useMemo(() => {
    const out = reviews.filter((r) => (rating === "all" || r.rating === Number(rating)) && (service === "All services" || r.service === service));
    return out.sort((a, b) => (sort === "recent" ? b.date.localeCompare(a.date) : sort === "highest" ? b.rating - a.rating : a.rating - b.rating));
  }, [reviews, rating, service, sort]);
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  return (
    <>
      <PageHero crumb="Reviews" title="Loved by homes across the UK" intro="Real feedback from verified Ginnara customers (demo reviews).">
        <div className="mt-8 flex flex-wrap items-center gap-8">
          <div>
            <p className="font-display text-6xl font-extrabold">{avg.toFixed(1)}</p>
            <Stars value={avg} size={22} />
            <p className="mt-1 text-sm text-ink-soft">12,480 reviews overall · {reviews.length} shown</p>
          </div>
          <div className="w-full max-w-xs space-y-1.5">
            {dist.map((d) => (
              <button key={d.n} onClick={() => setRating(d.n >= 3 ? (String(d.n) as "5") : "all")} className="flex w-full items-center gap-3 text-sm">
                <span className="w-6">{d.n}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full bg-sun" style={{ width: `${(d.c / (reviews.length || 1)) * 100}%` }} />
                </span>
                <span className="w-6 text-right text-muted">{d.c}</span>
              </button>
            ))}
          </div>
        </div>
      </PageHero>
      <section className="py-12 lg:py-16">
        <div className="container-site">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PillTabs value={rating} onChange={setRating} tabs={[{ value: "all", label: "All ratings" }, { value: "5", label: "5 stars" }, { value: "4", label: "4 stars" }, { value: "3", label: "3 stars" }]} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <select aria-label="Filter by service" value={service} onChange={(e) => setService(e.target.value)} className="h-11 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-semibold">
                {services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select aria-label="Sort reviews" value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-semibold">
                <option value="recent">Most recent</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
          </div>
          {list.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, count).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews match these filters" action={<Button variant="outline" onClick={() => { setRating("all"); setService("All services"); }}>Clear filters</Button>} />
          )}
          {count < list.length && (
            <div className="mt-10 text-center">
              <Button variant="outline" onClick={() => setCount((c) => c + 6)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

/* ---------------- Blog ---------------- */
export function BlogIndex() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const allPosts = useStore("posts")
    .filter((p) => p.published !== false)
    .sort((a, b) => b.date.localeCompare(a.date));
  const BLOG_CATEGORIES = Array.from(new Set(allPosts.map((p) => p.category)));
  const posts = allPosts.filter((p) => (cat === "All" || p.category === cat) && (!q.trim() || `${p.title} ${p.excerpt}`.toLowerCase().includes(q.trim().toLowerCase())));
  const [featured, ...rest] = posts;
  return (
    <>
      <PageHero crumb="The mag" eyebrow="The Ginnara mag" title="Tips, guides & home inspiration" intro="Advice from our pros on cleaning smarter, moving home and making the most of your space." />
      <section className="py-12 lg:py-16">
        <div className="container-site">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <PillTabs value={cat} onChange={setCat} tabs={["All", ...BLOG_CATEGORIES].map((c) => ({ value: c, label: c }))} />
            <label className="relative">
              <span className="sr-only">Search articles</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles" className="h-11 w-full rounded-full border-[1.5px] border-line pr-4 pl-10 text-sm focus:border-ink focus:outline-none md:w-64" />
            </label>
          </div>
          {!featured ? (
            <EmptyState icon={<BookOpen className="size-6" />} title="No articles found" action={<Button variant="outline" onClick={() => { setCat("All"); setQ(""); }}>Reset filters</Button>} />
          ) : (
            <>
              <Link href={`/blog/${featured.slug}`} className="group mb-10 grid overflow-hidden rounded-[36px] bg-cream lg:grid-cols-2">
                <div className="relative aspect-[16/10] lg:aspect-auto">
                  <Photo src={featured.image} alt={featured.title} fill sizes="(max-width: 1024px) 100vw, 620px" className="transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <p className="text-sm font-bold text-brand">{featured.category}</p>
                  <h2 className="mt-3 text-3xl leading-tight font-extrabold group-hover:underline sm:text-4xl">{featured.title}</h2>
                  <p className="mt-3 text-ink-soft">{featured.excerpt}</p>
                  <p className="mt-5 text-sm text-muted">
                    {featured.author} · {formatDate(featured.date, { day: "numeric", month: "long" })} · {featured.readMins} min read
                  </p>
                </div>
              </Link>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/60 transition hover:-translate-y-1 hover:shadow-lift">
                    <div className="relative aspect-[3/2]">
                      <Photo src={p.image} alt={p.title} fill sizes="(max-width: 768px) 100vw, 400px" />
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-bold text-brand uppercase">{p.category}</p>
                      <h3 className="mt-2 text-xl leading-snug font-extrabold group-hover:underline">{p.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{p.excerpt}</p>
                      <p className="mt-4 text-xs text-muted">
                        {formatDate(p.date, { day: "numeric", month: "short" })} · {p.readMins} min read
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

/* ---------------- Contact ---------------- */
export function ContactPage() {
  const settings = useStore("settings");
  const { success } = useToast();
  const [sent, setSent] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), mode: "onTouched", defaultValues: { topic: "" } });
  return (
    <>
      <PageHero crumb="Contact" title="We're here to help" intro="Questions about a booking, a quote or partnering with us? Send us a message and we'll reply within the hour (demo)." />
      <section className="py-12 lg:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {[
              { icon: Phone, t: "Call us", d: settings.supportPhone, s: "Mon–Sat, 8am–8pm", href: `tel:${settings.supportPhone.replace(/\s/g, "")}` },
              { icon: Mail, t: "Email", d: settings.supportEmail, s: "Replies within the hour", href: `mailto:${settings.supportEmail}` },
              { icon: MessageCircle, t: "Help centre", d: "Answers & booking lookup", s: "Available 24/7", href: "/help" },
              { icon: MapPin, t: "Website", d: "www.ginnaracleaning.com", s: "Book your cleaning online", href: "/booking" },
            ].map((c) => (
              <a key={c.t} href={c.href} className="flex items-center gap-4 rounded-3xl bg-cream-2 p-5 transition hover:bg-cream">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-brand shadow-soft">
                  <c.icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm text-muted">{c.t}</span>
                  <span className="block font-bold">{c.d}</span>
                  <span className="block text-xs text-muted">{c.s}</span>
                </span>
              </a>
            ))}
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-lift ring-1 ring-line/60 sm:p-10">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
                  <span className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="size-8" />
                  </span>
                  <h2 className="mt-5 text-3xl font-extrabold">Message sent!</h2>
                  <p className="mt-2 text-ink-soft">Thanks {sent}. Our team will be in touch shortly. (Saved locally — visible to the demo admin.)</p>
                  <Button variant="outline" className="mt-6" onClick={() => setSent(null)}>
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  noValidate
                  className="grid gap-5 sm:grid-cols-2"
                  onSubmit={handleSubmit(async (v) => {
                    await sleep(800);
                    insert("contacts", { ...v, id: uid("msg"), createdAt: new Date().toISOString(), status: "new", type: v.topic === "Pricing & quotes" ? "quote" : "contact" });
                    notify({ type: "enquiry", title: v.topic === "Pricing & quotes" ? "New quote request" : "New contact message", body: `${v.name}: ${v.topic}`, section: "enquiries" });
                    success("Message sent");
                    setSent(v.name.split(" ")[0]);
                    reset({ name: "", email: "", topic: "", message: "" });
                  })}
                >
                  <h2 className="text-2xl font-extrabold sm:col-span-2">Send us a message</h2>
                  <Input label="Your name" autoComplete="name" error={formState.errors.name?.message} {...register("name")} />
                  <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
                  <Select
                    label="Topic"
                    wrapClassName="sm:col-span-2"
                    placeholder="Choose a topic…"
                    options={["An existing booking", "Pricing & quotes", "Business & partnerships", "Feedback", "Something else"].map((t) => ({ value: t, label: t }))}
                    error={formState.errors.topic?.message}
                    {...register("topic")}
                  />
                  <Textarea label="Message" wrapClassName="sm:col-span-2" rows={6} error={formState.errors.message?.message} {...register("message")} />
                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" loading={formState.isSubmitting} iconRight={<ArrowRight className="size-5" />}>
                      Send message
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------- Help ---------------- */
function FindBooking() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Booking | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div id="find-booking" className="scroll-mt-28 rounded-[32px] bg-white p-6 shadow-lift ring-1 ring-line/60 sm:p-8">
      <h2 className="flex items-center gap-2 text-2xl font-extrabold">
        <CalendarSearch className="size-6 text-brand" /> Find my booking
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Enter your booking reference and the email used to book. Try GN-7K2QXA with demo@ginnaracleaning.com.</p>
      <form
        noValidate
        className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^GN-[A-Z0-9]{6}$/i.test(ref.trim())) return setErr("References look like GN-ABC123.");
          if (!email.includes("@")) return setErr("Enter the email you booked with.");
          setErr("");
          setLoading(true);
          await sleep(600);
          setResult(findBooking(ref, email) ?? null);
          setLoading(false);
        }}
      >
        <Input label="Reference" name="ref" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="GN-ABC123" />
        <Input label="Email" name="lookup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Button type="submit" className="h-12" loading={loading}>
          Find booking
        </Button>
      </form>
      {err && <p className="mt-3 text-sm font-medium text-danger">{err}</p>}
      {result === null && <p className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">No booking matches those details on this device.</p>}
      {result && (
        <div className="mt-6">
          <BookingDetails booking={result} compact />
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href={`/booking/confirmation/${result.ref}`} variant="dark" size="sm">
              Open booking page
            </LinkButton>
            <LinkButton href="/login?next=/account?tab=bookings" variant="soft" size="sm">
              Sign in to manage
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpPage() {
  const [q, setQ] = useState("");
  const topics = [
    { icon: CalendarSearch, t: "Bookings", d: "Book, reschedule, cancel", href: "/faq" },
    { icon: CreditCard, t: "Payments & pricing", d: "Prices, codes, refunds", href: "/faq" },
    { icon: ShieldCheck, t: "Trust & safety", d: "Vetting and insurance", href: "/how-it-works" },
    { icon: UserCog, t: "For pros", d: "Applying, payouts, app", href: "/become-a-pro" },
    { icon: Users, t: "Your account", d: "Login, addresses, settings", href: "/account" },
    { icon: LifeBuoy, t: "Contact support", d: "Talk to a human", href: "/contact" },
  ];
  const FAQS = useStore("faqs");
  const results = q.trim() ? FAQS.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q.trim().toLowerCase())) : [];
  return (
    <>
      <PageHero crumb="Help centre" tone="sun" title="How can we help?" intro="Search our help articles, look up a booking or get in touch.">
        <label className="relative mt-8 block max-w-xl">
          <span className="sr-only">Search help</span>
          <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" className="h-14 w-full rounded-full bg-white pr-5 text-[15px] shadow-lift focus:outline-none" style={{ paddingLeft: 52 }} />
        </label>
      </PageHero>
      <section className="py-12 lg:py-16">
        <div className="container-site space-y-12">
          {q.trim() && (
            <div>
              <h2 className="mb-4 text-xl font-extrabold">
                {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
              </h2>
              {results.length ? <Accordion items={results.map((f) => ({ q: f.q, a: f.a }))} /> : <EmptyState title="No articles found" description="Try another search or contact us." action={<LinkButton href="/contact">Contact support</LinkButton>} />}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <Link key={t.t} href={t.href} className="group flex items-center gap-4 rounded-3xl bg-cream-2 p-6 transition hover:bg-cream">
                <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand shadow-soft">
                  <t.icon className="size-6" />
                </span>
                <span className="flex-1">
                  <span className="block font-extrabold group-hover:underline">{t.t}</span>
                  <span className="text-sm text-ink-soft">{t.d}</span>
                </span>
                <ArrowRight className="size-5 text-muted transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
          <FindBooking />
          <div>
            <SectionHeading title="Popular questions" className="!mb-6" />
            <Accordion items={FAQS.slice(0, 6).map((f) => ({ q: f.q, a: f.a }))} defaultOpen={null} />
          </div>
        </div>
      </section>
    </>
  );
}

export function LegalNav({ active }: { active: "terms" | "privacy" }) {
  return (
    <div className="mb-8 flex gap-2">
      <LinkButton href="/terms" size="sm" variant={active === "terms" ? "dark" : "soft"}>
        Terms
      </LinkButton>
      <LinkButton href="/privacy" size="sm" variant={active === "privacy" ? "dark" : "soft"}>
        Privacy
      </LinkButton>
    </div>
  );
}
