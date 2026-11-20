"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Ban, ChevronLeft, ClipboardCheck, CreditCard, Loader2, MapPin, PawPrint, Shirt, SprayCan, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { Service } from "@/types";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Photo } from "@/components/common/ui";
import { LogoMark } from "@/components/layout/Logo";
import { GoogleButton } from "@/components/forms/CustomerAuth";
import { BasketRows } from "./Basket";
import { BookingCalendar, BottomBar, InfoBox, InfoTip, OptionTile, PopularTag, Sheet, StepTitle, TimeGrid } from "./ui";
import { useBookableServices, useCurrentCustomer, useStore } from "@/hooks/useStore";
import { calculatePrice, defaultOptions, frequencyDiscountPct, rateFor, recommendedHours } from "@/lib/pricing";
import { priceLabel as servicePriceLabel } from "@/lib/services";
import { clearDraft, createBooking, emptyDraft, formatHours, loadDraft, saveDraft, type BookingDraft } from "@/lib/bookings";
import { DEMO_ADDRESSES, formatFull, parseAddress } from "@/lib/address";
import { extraById } from "@/lib/extras";
import { IMG } from "@/data/images";
import { emailField, nameField, phoneField } from "@/lib/validation";
import { addDays, cn, fromISODate, gbp, gbp2, sleep, toISODate } from "@/lib/utils";

type Step = "address" | "session" | "frequency" | "duration" | "needs" | "pets" | "date" | "time" | "account" | "who" | "review";

const TILE_BG = ["bg-[#cfcdf7]", "bg-[#fbd3e3]", "bg-[#fde7a6]", "bg-[#cde9dc]", "bg-[#cfe5f2]", "bg-[#fbd8c8]"];

/** Rough description of what a duration covers, scaled by the service's intensity */
function durationHint(service: Service, hours: number) {
  if (service.kind === "ironing") return `Roughly ${Math.round(hours * 15)} items of clothing — shirts, trousers, bedding and more.`;
  const h = hours / service.hoursMultiplier;
  if (service.slug.includes("office")) {
    const desks = Math.round(h * 6);
    return `Recommended for an office of up to about ${desks} desks with a kitchen area and washrooms (allow extra time for meeting rooms or windows).`;
  }
  if (service.slug.includes("event")) return `Recommended for tidying a home or small venue after a gathering of up to about ${Math.round(h * 12)} guests.`;
  const home =
    h <= 2 ? "a studio or one-bedroom flat with 1 bathroom" : h <= 2.5 ? "a one-bedroom flat with 1 bathroom" : h <= 3 ? "a two-bedroom flat/house with 1 bathroom" : h <= 4 ? "a three-bedroom home with 1–2 bathrooms" : h <= 5 ? "a three or four-bedroom home with 2 bathrooms" : "a large family home with 3+ bathrooms";
  return `Recommended for ${service.name.toLowerCase()} of ${home} (if you would like to include windows, please allow additional time).`;
}

const contactSchema = z.object({ name: nameField, email: emailField, phone: phoneField });
const recipientSchema = z.object({ name: nameField, phone: phoneField });

export function BookingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const services = useBookableServices();
  const customer = useCurrentCustomer();
  const settings = useStore("settings");
  const coupons = useStore("coupons");
  const bookings = useStore("bookings");
  const { success, error: toastError } = useToast();

  // Initial state: URL params start a fresh booking; otherwise resume a saved draft (e.g. after signing in)
  const [init] = useState(() => {
    const svcParam = params.get("service") ?? "";
    const pcParam = params.get("postcode") ?? "";
    const saved = !svcParam && !pcParam ? loadDraft() : null;
    if (saved) {
      const ok = saved.draft.address.postcode && saved.draft.serviceSlug && saved.draft.options;
      return { draft: saved.draft, step: (ok ? saved.step : "address") as Step };
    }
    const d = emptyDraft();
    const svc = services.find((s) => s.slug === svcParam);
    if (svc) {
      d.serviceSlug = svc.slug;
      d.options = defaultOptions(svc);
    }
    if (pcParam) d.fullAddress = pcParam.toUpperCase();
    return { draft: d, step: "address" as Step };
  });
  const [draft, setDraft] = useState<BookingDraft>(init.draft);
  const [savedStep, setStep] = useState<Step>(init.step);
  // Back from sign-in / registration: the account step is skipped automatically
  const step: Step = savedStep === "account" && customer ? "who" : savedStep;
  const [dir, setDir] = useState(1);
  const [basketOpen, setBasketOpen] = useState(false);
  const [askMore, setAskMore] = useState(false);
  const [multiSlot, setMultiSlot] = useState(draft.altTimes.length > 0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<"" | "cleaner">("");

  const service = services.find((s) => s.slug === draft.serviceSlug);
  const update = (patch: Partial<BookingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setOptions = (patch: Partial<NonNullable<BookingDraft["options"]>>) => setDraft((d) => (d.options ? { ...d, options: { ...d.options, ...patch } } : d));

  const steps = useMemo<Step[]>(() => ["address", "session", ...(service?.allowsFrequency ? (["frequency"] as Step[]) : []), "duration", "needs", "pets", "date", "time", ...(customer ? [] : (["account"] as Step[])), "who", "review"], [service?.allowsFrequency, customer]);
  const index = Math.max(0, steps.indexOf(step));

  useEffect(() => {
    saveDraft(draft, step);
  }, [draft, step]);

  const price = useMemo(() => (service && draft.options ? calculatePrice(service, draft.options, settings, { code: draft.couponCode, coupons }) : null), [service, draft.options, draft.couponCode, settings, coupons]);
  const perHour = service && draft.options ? rateFor(service, draft.options.frequency) * (1 - (service.allowsFrequency && !service.oneOffRate ? frequencyDiscountPct(draft.options.frequency, settings) : 0) / 100) + (draft.options.supplies ? settings.suppliesPerHour : 0) : service?.hourlyRate;
  // Fixed-price services (Airbnb) show the package total instead of an hourly rate
  const priceLabel = service?.packages?.length ? (price ? gbp2(price.total) : "—") : perHour ? `${gbp2(perHour)}/h` : "—";

  const go = (target: Step) => {
    setDir(steps.indexOf(target) >= index ? 1 : -1);
    setStep(target);
    setError("");
    setFieldErrors({});
    setBasketOpen(false);
    window.scrollTo({ top: 0 });
  };
  const goNext = () => go(steps[Math.min(index + 1, steps.length - 1)]);
  const back = () => (index === 0 ? router.push("/") : go(steps[index - 1]));

  /* ---------- Step validation ---------- */
  const next = () => {
    setError("");
    if (step === "address") {
      const r = parseAddress(draft.fullAddress);
      if (!r.ok) return setError(r.error);
      update({ fullAddress: r.address.full, address: { street: r.address.street, city: r.address.city, postcode: r.address.postcode, unit: r.address.unit } });
      return goNext();
    }
    if (step === "session" && !service) return setError("Choose a cleaning session to continue.");
    if (step !== "session" && !draft.address.postcode) return go("address");
    if (step === "date" && !draft.date) return setError(draft.options?.frequency === "once" ? "Choose the date of your cleaning." : "Choose the date of your first appointment.");
    if (step === "time" && !draft.time) return setError("Choose at least one start time.");
    if (step === "who") {
      const errs: Record<string, string> = {};
      const contact = customer ? { name: customer.name, email: customer.email, phone: customer.phone } : draft.customer;
      if (!customer) {
        const r = contactSchema.safeParse(contact);
        if (!r.success) r.error.issues.forEach((i) => (errs[`c.${String(i.path[0])}`] = i.message));
      }
      if (draft.forWhom === "loved") {
        const r = recipientSchema.safeParse(draft.recipient);
        if (!r.success) r.error.issues.forEach((i) => (errs[`r.${String(i.path[0])}`] = i.message));
      }
      setFieldErrors(errs);
      if (Object.keys(errs).length) return setError("Please complete the highlighted details.");
      update({ customer: contact });
    }
    goNext();
  };

  const book = async () => {
    if (!draft.payment) return setError("Choose a payment method.");
    if (!draft.address.postcode) {
      go("address");
      return setError("Please enter the address for your cleaning.");
    }
    if (!service || !draft.options || !draft.date || !draft.time || !draft.customer.email) {
      toastError("Some details are missing", "Please go back and check each step.");
      return;
    }
    setSubmitting(true);
    await sleep(1300);
    try {
      const booking = createBooking(draft);
      clearDraft();
      success("Booking confirmed!", `Reference ${booking.ref}`);
      router.push(`/booking/confirmation/${booking.ref}`);
    } catch {
      setSubmitting(false);
      toastError("We couldn't save your booking", "Please try again.");
    }
  };

  /* ---------- Previous addresses ---------- */
  const previous = useMemo(() => {
    if (!customer) return [];
    const fromProfile = customer.addresses.map((a) => formatFull(a));
    const fromBookings = bookings.filter((b) => b.customerId === customer.id).map((b) => formatFull(b.address));
    return Array.from(new Set([...fromProfile, ...fromBookings])).slice(0, 4);
  }, [customer, bookings]);

  /* ---------- Recurring dates for the calendar ---------- */
  const highlights = useMemo(() => {
    if (!draft.date || !draft.options || draft.options.frequency === "once") return [];
    const gap = draft.options.frequency === "weekly" ? 7 : draft.options.frequency === "fortnightly" ? 14 : 28;
    return [1, 2, 3].map((n) => toISODate(addDays(fromISODate(draft.date), gap * n)));
  }, [draft.date, draft.options]);

  const pickTime = (t: string) => {
    setError("");
    if (!draft.time) {
      update({ time: t });
      if (!multiSlot) setAskMore(true);
      return;
    }
    if (t === draft.time) {
      const [first, ...rest] = [...draft.altTimes].sort();
      return update({ time: first ?? "", altTimes: rest });
    }
    if (!multiSlot) return update({ time: t });
    update({ altTimes: draft.altTimes.includes(t) ? draft.altTimes.filter((x) => x !== t) : [...draft.altTimes, t] });
  };

  const freq = draft.options?.frequency ?? "once";
  const firstName = customer?.name.split(" ")[0];

  /* ---------- Render ---------- */
  return (
    <div className="min-h-dvh bg-white pb-32">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur">
        <div className="mx-auto grid h-20 max-w-2xl grid-cols-3 items-center px-5 sm:px-8">
          <button type="button" onClick={back} className="flex items-center gap-2 justify-self-start text-[17px] font-bold" disabled={submitting}>
            <ChevronLeft className="size-6" /> Back
          </button>
          <Link href="/" aria-label="Ginnara home" className="justify-self-center">
            <LogoMark className="h-14 w-auto" priority />
          </Link>
          {customer ? (
            <p className="justify-self-end text-[17px] whitespace-nowrap">Hello {firstName}!</p>
          ) : (
            <Link href="/login?next=/booking" className="justify-self-end text-[17px] font-semibold underline underline-offset-4">
              Sign in
            </Link>
          )}
        </div>
        <div className="h-1 bg-[#f4f4f6]">
          <motion.div className="h-full bg-brand" animate={{ width: `${(index / (steps.length - 1)) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-8 sm:px-8 sm:pt-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.2 }}>
            {/* ---------------- ADDRESS ---------------- */}
            {step === "address" && (
              <AddressStep
                value={draft.fullAddress}
                onChange={(v) => {
                  update({ fullAddress: v });
                  setError("");
                }}
                previous={previous}
                error={error}
                onSubmit={next}
                onPickPrevious={(v) => {
                  const r = parseAddress(v);
                  if (!r.ok) return setError(r.error);
                  update({ fullAddress: r.address.full, address: { street: r.address.street, city: r.address.city, postcode: r.address.postcode, unit: r.address.unit } });
                  go("session");
                }}
              />
            )}

            {/* ---------------- SESSION ---------------- */}
            {step === "session" && (
              <>
                <StepTitle>Choose your cleaning session ✨</StepTitle>
                <div className="space-y-5">
                  {services.map((s, i) => {
                    const selected = s.slug === draft.serviceSlug;
                    const promo = s.slug === "residential-cleaning" && settings.weeklyDiscount > 0 && !s.oneOffRate;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        aria-pressed={selected}
                        onClick={() => {
                          if (!selected) update({ serviceSlug: s.slug, options: defaultOptions(s), couponCode: "" });
                          setError("");
                        }}
                        className={cn("relative block w-full rounded-2xl border-2 p-6 text-left transition sm:p-8", selected ? "border-brand bg-white" : "border-transparent bg-[#f4f4f6] hover:bg-[#ececf0]")}
                      >
                        {s.popular && selected && <span className="absolute top-3 right-3"><PopularTag /></span>}
                        <div className="flex items-center gap-6">
                          <span className={cn("relative size-24 shrink-0 overflow-hidden rounded-2xl sm:size-28", TILE_BG[i % TILE_BG.length])}>
                            <Photo src={s.image} alt="" fill sizes="112px" className="mix-blend-multiply" />
                          </span>
                          <span>
                            <span className="block text-[19px] leading-tight font-extrabold sm:text-[21px]">{s.name}</span>
                            {promo ? (
                              <span className="mt-1 block text-[17px]">
                                <span className="font-bold text-brand">{gbp2(s.hourlyRate * (1 - settings.weeklyDiscount / 100))}/h</span> <span className="text-muted line-through">{gbp2(s.hourlyRate)}/h</span>
                              </span>
                            ) : s.oneOffRate ? (
                              <span className="mt-1 block text-[17px]">
                                Regular {gbp2(s.hourlyRate)}/h · One-off {gbp2(s.oneOffRate)}/h
                              </span>
                            ) : (
                              <span className="mt-1 block text-[17px]">{s.packages?.length ? `${servicePriceLabel(s)} · fixed price` : `${gbp2(s.hourlyRate)}/h`}</span>
                            )}
                          </span>
                        </div>
                        <AnimatePresence initial={false}>
                          {selected && (
                            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="space-y-2 pt-6 pl-5 text-[17px] leading-snug">
                                {["Background-checked and insured pros", "Pause or cancel your sessions free of charge"].map((b) => (
                                  <li key={b} className="list-disc">{b}</li>
                                ))}
                                {s.features.map((f) => (
                                  <li key={f} className="list-disc">⭐ {f}</li>
                                ))}
                              </div>
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ---------------- FREQUENCY ---------------- */}
            {step === "frequency" && service && draft.options && (
              <>
                <StepTitle>How often do you want your sessions to happen?</StepTitle>
                <div className="flex flex-col items-start gap-5">
                  {(["once", "weekly", "fortnightly"] as const).map((f) => (
                    <OptionTile key={f} selected={freq === f} onClick={() => setOptions({ frequency: f })} className="flex items-center gap-4 py-6">
                      <span>{{ once: "Just once", weekly: "Once a week", fortnightly: "Once a fortnight" }[f]}</span>
                      {f === "weekly" && <PopularTag />}
                      {service.oneOffRate ? (
                        <span className={cn("text-sm font-semibold", f === "once" ? "text-ink-soft" : "text-success")}>{gbp2(rateFor(service, f))}/h</span>
                      ) : (
                        f !== "once" && frequencyDiscountPct(f, settings) > 0 && <span className="text-sm text-success">−{frequencyDiscountPct(f, settings)}%</span>
                      )}
                    </OptionTile>
                  ))}
                </div>
              </>
            )}

            {/* ---------------- DURATION ---------------- */}
            {step === "duration" && service && draft.options && service.packages?.length ? (
              <>
                <StepTitle sub="Fixed price for a full turnover clean.">What size is your property?</StepTitle>
                <div className="flex flex-col gap-4">
                  {service.packages.map((p) => (
                    <OptionTile key={p.id} selected={(draft.options!.packageId ?? service.packages![0].id) === p.id} onClick={() => setOptions({ packageId: p.id, hours: p.hours })} className="flex w-full items-center justify-between gap-4 py-6">
                      <span>{p.label}</span>
                      <span className="font-display text-xl font-extrabold">{gbp(p.price)}</span>
                    </OptionTile>
                  ))}
                </div>
                <InfoBox className="mt-7">Includes all rooms, bathroom and kitchen, dusting, vacuuming and mopping, beds made with fresh linen (if provided) and bins emptied. {service.priceNote}</InfoBox>
              </>
            ) : step === "duration" && service && draft.options && (
              <>
                <StepTitle>How long?</StepTitle>
                <div className="grid grid-cols-3 gap-4">
                  {(service.kind === "ironing" ? [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6] : [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8])
                    .filter((h) => h >= service.minHours)
                    .map((h) => (
                      <OptionTile key={h} selected={draft.options!.hours === h} onClick={() => setOptions({ hours: h })} className="py-6 text-center">
                        {formatHours(h)}
                      </OptionTile>
                    ))}
                </div>
                <InfoBox className="mt-7">{durationHint(service, draft.options.hours)}</InfoBox>
                {draft.options.hours === recommendedHours(service, 2, 1) && <p className="mt-3 text-sm text-ink-soft">This is our most booked duration for {service.name.toLowerCase()}.</p>}
              </>
            )}

            {/* ---------------- OTHER NEEDS ---------------- */}
            {step === "needs" && service && draft.options && (
              <>
                <StepTitle>Do you have any other needs?</StepTitle>
                <div className="flex flex-col items-start gap-5">
                  {service.extras.includes("ironing") && (
                    <NeedTile icon={<Shirt className="size-7" />} label="Ironing" info="Your pro irons during your session. We recommend adding 30–60 minutes to your booking." selected={draft.options.extras.includes("ironing")} onToggle={() => setOptions({ extras: draft.options!.extras.includes("ironing") ? draft.options!.extras.filter((e) => e !== "ironing") : [...draft.options!.extras, "ironing"] })} />
                  )}
                  {service.kind === "cleaning" && (
                    <NeedTile icon={<SprayCan className="size-7" />} label="Cleaning products" price={`+${gbp(settings.suppliesPerHour)}/h`} info="Your pro brings eco-friendly products and microfibre cloths. Without this option, they'll use your products and equipment." selected={draft.options.supplies} onToggle={() => setOptions({ supplies: !draft.options!.supplies })} />
                  )}
                  {service.extras
                    .filter((id) => id !== "ironing")
                    .map((id) => {
                      const e = extraById(id);
                      if (!e) return null;
                      const on = draft.options!.extras.includes(id);
                      return <NeedTile key={id} icon={<Sparkles className="size-7" />} label={e.label} price={`+${gbp(e.price)}`} info={e.description ?? ""} selected={on} onToggle={() => setOptions({ extras: on ? draft.options!.extras.filter((x) => x !== id) : [...draft.options!.extras, id] })} />;
                    })}
                </div>
              </>
            )}

            {/* ---------------- PETS ---------------- */}
            {step === "pets" && draft.options && (
              <>
                <StepTitle>Do you have any pets?</StepTitle>
                <div className="flex flex-col items-start gap-5">
                  <OptionTile selected={draft.options.pets} onClick={() => setOptions({ pets: true })} className="flex items-center gap-4 py-6">
                    <PawPrint className="size-7 fill-ink" /> Yes I love them!
                  </OptionTile>
                  <OptionTile selected={!draft.options.pets} onClick={() => setOptions({ pets: false })} className="flex items-center gap-4 py-6">
                    <span className="relative grid size-7 place-items-center rounded-full bg-ink text-white">
                      <PawPrint className="size-4" />
                      <Ban className="absolute size-7 text-ink" strokeWidth={2.5} />
                    </span>
                    Nope
                  </OptionTile>
                </div>
                <InfoBox className="mt-7">We request this information as some cleaners can be allergic to pets.</InfoBox>
              </>
            )}

            {/* ---------------- DATE ---------------- */}
            {step === "date" && service && (
              <>
                <StepTitle>{freq === "once" ? "Date of your cleaning" : "Date of first appointment"}</StepTitle>
                <BookingCalendar value={draft.date} highlights={highlights} sameDay={service.sameDay} onChange={(iso) => { update({ date: iso }); setError(""); }} />
                {draft.date && (
                  <p className="mt-7 text-center text-[17px] leading-relaxed">
                    {freq === "once" ? (
                      <>
                        Your cleaning is on <strong>{fromISODate(draft.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</strong>.
                      </>
                    ) : (
                      <>
                        First appointment on <strong>{fromISODate(draft.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</strong>,<br />
                        then every {freq === "fortnightly" ? "other " : ""}
                        <strong>{fromISODate(draft.date).toLocaleDateString("en-GB", { weekday: "long" })}</strong>.
                      </>
                    )}
                    <br />
                    Appointment dates can be edited later.
                  </p>
                )}
                <p className="mt-4 text-center text-xs text-muted">Demo availability — struck-through days are fully booked.</p>
              </>
            )}

            {/* ---------------- TIME ---------------- */}
            {step === "time" && (
              <>
                <StepTitle sub={<>Are you flexible? Select <strong className="text-ink">several slots</strong>.</>}>{freq === "once" ? "When do you want your cleaning to be?" : "When do you want your sessions to be?"}</StepTitle>
                <TimeGrid date={draft.date} primary={draft.time} alts={draft.altTimes} onPick={pickTime} />
                {draft.time && (
                  <p className="mt-6 text-center text-[15px] text-ink-soft">
                    Main slot <strong className="text-ink">{draft.time}</strong>
                    {draft.altTimes.length > 0 && <> · also available at {[...draft.altTimes].sort().join(", ")}</>}
                  </p>
                )}
              </>
            )}

            {/* ---------------- ACCOUNT (signed-out customers only) ---------------- */}
            {step === "account" && (
              <>
                <StepTitle>New to Ginnara? Register to continue</StepTitle>
                <Link href="/register?next=/booking" className="flex h-14 w-full items-center justify-center rounded-full bg-ink text-[18px] font-bold text-white transition hover:bg-black">
                  Sign up with an email
                </Link>
                <div className="my-6 flex items-center gap-4 text-[15px] text-ink-soft">
                  <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                </div>
                <GoogleButton label="Sign up with Google" />
                <p className="mt-5 text-center text-[17px]">
                  Already registered?{" "}
                  <Link href="/login?next=/booking" className="font-semibold underline underline-offset-4 hover:text-brand">
                    Log in
                  </Link>
                </p>
                <p className="mt-8 text-center text-sm text-muted">Your booking so far is saved — you&apos;ll come straight back here.</p>
              </>
            )}

            {/* ---------------- WHO ---------------- */}
            {step === "who" && (
              <>
                <StepTitle>Who is going to enjoy this?</StepTitle>
                <div className="space-y-5">
                  <WhoCard selected={draft.forWhom === "me"} onSelect={() => update({ forWhom: "me" })} title="It's for me">
                    {customer ? (
                      <p className="mt-3 text-[17px] leading-relaxed">
                        {customer.name}
                        <br />
                        {customer.phone}
                      </p>
                    ) : null}
                  </WhoCard>
                  <WhoCard selected={draft.forWhom === "loved"} onSelect={() => update({ forWhom: "loved" })} title="It's for a loved one">
                    {draft.forWhom === "loved" && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                        <FlowInput label="Their name" value={draft.recipient.name} error={fieldErrors["r.name"]} onChange={(v) => update({ recipient: { ...draft.recipient, name: v } })} autoComplete="off" />
                        <FlowInput label="Their phone" value={draft.recipient.phone} error={fieldErrors["r.phone"]} onChange={(v) => update({ recipient: { ...draft.recipient, phone: v } })} type="tel" autoComplete="off" />
                      </div>
                    )}
                  </WhoCard>
                </div>
                {!customer && (
                  <div className="mt-8">
                    <p className="text-[19px] font-extrabold">Your contact details</p>
                    <p className="mt-1 mb-4 text-[15px] text-ink-soft">
                      Already a customer?{" "}
                      <Link href="/login?next=/booking" className="font-semibold text-brand underline">
                        Sign in
                      </Link>{" "}
                      — your booking so far is saved.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FlowInput label="Full name" value={draft.customer.name} error={fieldErrors["c.name"]} onChange={(v) => update({ customer: { ...draft.customer, name: v } })} autoComplete="name" className="sm:col-span-2" />
                      <FlowInput label="Email" value={draft.customer.email} error={fieldErrors["c.email"]} onChange={(v) => update({ customer: { ...draft.customer, email: v } })} type="email" autoComplete="email" />
                      <FlowInput label="Phone" value={draft.customer.phone} error={fieldErrors["c.phone"]} onChange={(v) => update({ customer: { ...draft.customer, phone: v } })} type="tel" autoComplete="tel" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------------- REVIEW ---------------- */}
            {step === "review" && (
              <>
                <div className="flex items-center gap-6 border-b border-line pb-6">
                  <span className="relative size-28 shrink-0 overflow-hidden rounded-2xl bg-[#cfcdf7]">
                    <Photo src={IMG.sprayTeal} alt="" fill sizes="112px" />
                  </span>
                  <h1 className="font-display text-[1.75rem] leading-[1.12] font-extrabold sm:text-[2rem]">All good? Book your {service?.kind === "ironing" ? "ironing" : "cleaning"}</h1>
                </div>
                <BasketRows draft={draft} service={service} price={price} mode="review" onChange={update} onEdit={(s) => go(s as Step)} />

                <div className="-mx-5 my-8 h-3 bg-[#f4f4f6] sm:-mx-8" />
                <label className="block">
                  <span className="sr-only">Specific requirements</span>
                  <textarea value={draft.notes} onChange={(e) => update({ notes: e.target.value.slice(0, 500) })} rows={3} placeholder="Any specific requirements? If you would feel more comfortable with a female pro, please let us know here." className="w-full rounded-2xl border-2 border-ink px-5 py-4 text-[17px] leading-relaxed placeholder:text-muted focus:border-brand focus:outline-none" />
                </label>
                <p className="mt-2 text-[15px] text-muted">Be careful not to disclose medical information.</p>

                <div className="-mx-5 my-8 h-3 bg-[#f4f4f6] sm:-mx-8" />
                <div className="relative overflow-hidden rounded-3xl bg-[#cfcdf7] p-7">
                  <div className="absolute top-0 -right-6 h-full w-1/2">
                    <Photo src={IMG.gloveHeart} alt="" fill sizes="300px" className="mix-blend-multiply" />
                  </div>
                  <p className="relative max-w-[60%] font-display text-[2rem] leading-[1.05] font-extrabold">
                    Who will my <em className="font-serif font-normal">cleaner</em> be?
                  </p>
                  <button type="button" onClick={() => setModal("cleaner")} className="relative mt-5 rounded-full border-2 border-ink px-7 py-2.5 font-bold hover:bg-ink hover:text-white">
                    Learn more
                  </button>
                </div>

                <div className="-mx-5 my-8 h-3 bg-[#f4f4f6] sm:-mx-8" />
                <h2 className="font-display text-[1.75rem] font-extrabold">Your payment method</h2>
                <div className="mt-6 space-y-4">
                  <PaymentOption selected={draft.payment === "card"} onSelect={() => { update({ payment: "card" }); setError(""); }} icon={<CreditCard className="size-7 fill-ink text-white" />} label="Card" brands>
                    <p className="text-[16px]">Card selected.</p>
                    <p className="mt-3 border-t border-line pt-3 text-[15px] text-ink-soft">Demo mode: no card details are collected. In the live service you would enter your card securely with our payment provider after tapping “Book my cleaning”.</p>
                  </PaymentOption>
                  <PaymentOption selected={draft.payment === "paypal"} onSelect={() => { update({ payment: "paypal" }); setError(""); }} icon={<span className="text-2xl font-black text-[#003087] italic">P</span>} label="PayPal">
                    <p className="text-[16px]">PayPal selected.</p>
                    <p className="mt-3 flex gap-4 border-t border-line pt-3 text-[16px] leading-relaxed">
                      <ArrowRight className="mt-1 size-6 shrink-0" /> After submission, you would be redirected to securely complete next steps. (Demo: no redirect happens.)
                    </p>
                    <p className="mt-3 text-[15px] text-ink-soft">By confirming your payment with PayPal, you allow Ginnara to charge your PayPal account for future payments in accordance with their terms.</p>
                  </PaymentOption>
                </div>

                <div className="-mx-5 my-8 h-3 bg-[#f4f4f6] sm:-mx-8" />
                <ul className="divide-y divide-line">
                  {[
                    { icon: <span className="rounded-md border-2 border-ink px-1.5 font-display text-lg font-black">24h</span>, t: "Free cancellation & rescheduling", d: "Full refund or free reschedule up to 24h before. 50% refund from 24h to 4h before; no refund after that." },
                    { icon: <ClipboardCheck className="size-9 text-brand" />, t: "Cleaning experts", d: "Only home cleaning professionals." },
                    { icon: <Star className="size-9 fill-sun text-sun" />, t: "4.9/5 - Excellent", d: "Average score out of 12,480 cleaning sessions." },
                  ].map((r) => (
                    <li key={r.t} className="flex items-center gap-6 py-6">
                      <span className="grid w-16 shrink-0 place-items-center">{r.icon}</span>
                      <span>
                        <span className="block text-[18px] font-bold">{r.t}</span>
                        <span className="text-[16px] text-ink-soft">{r.d}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="-mx-5 my-6 h-3 bg-[#f4f4f6] sm:-mx-8" />
                <p className="text-[16px] leading-relaxed">
                  By tapping the button below and booking, you accept our{" "}
                  <Link href="/terms" target="_blank" className="underline underline-offset-2">
                    Terms of service
                  </Link>
                </p>
                {error && <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
                <button type="button" onClick={book} disabled={!draft.payment || submitting} className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-ink text-[20px] font-bold text-white transition hover:bg-black disabled:bg-[#8f8f8f]">
                  {submitting && <Loader2 className="size-5 animate-spin" />}
                  {submitting ? "Booking…" : `Book my ${service?.kind === "ironing" ? "ironing" : "cleaning"}`}
                </button>
                <p className="mt-3 text-center text-xs text-muted">Demo booking — no payment is taken.</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && step !== "address" && step !== "review" && (
          <p role="alert" className="mt-6 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </main>

      {step !== "address" && step !== "review" && step !== "account" && <BottomBar priceLabel={priceLabel} onNext={next} onBasket={() => setBasketOpen((o) => !o)} basketOpen={basketOpen} />}

      {/* Basket sheet */}
      <Sheet open={basketOpen} onClose={() => setBasketOpen(false)} closeButton={false} className="pb-32">
        <button type="button" aria-label="Close basket" onClick={() => setBasketOpen(false)} className="mx-auto mb-4 grid size-10 place-items-center rounded-full hover:bg-cream">
          <ChevronLeft className="size-7 -rotate-90" />
        </button>
        <h2 className="mb-2 font-display text-[1.75rem] font-extrabold">My basket</h2>
        <BasketRows draft={draft} service={service} price={price} mode="sheet" onEdit={(s) => go(s as Step)} />
      </Sheet>

      {/* "Available at other times?" sheet */}
      <Sheet open={askMore} onClose={() => setAskMore(false)}>
        <h2 className="mx-auto max-w-md px-10 pt-2 text-center font-display text-[1.4rem] leading-tight font-extrabold sm:text-[1.6rem]">Available at other times on the same day?</h2>
        <p className="mt-5 text-center text-[17px] leading-relaxed text-ink-soft">The more slots you add, the easier it will be for us to find the ideal pro for you.</p>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setAskMore(false);
              goNext();
            }}
            className="h-16 rounded-full border-2 border-ink text-[18px] font-bold"
          >
            No, keep going
          </button>
          <button
            type="button"
            onClick={() => {
              setAskMore(false);
              setMultiSlot(true);
            }}
            className="h-16 rounded-full bg-ink px-4 text-[18px] leading-tight font-bold text-white"
          >
            Yes, add new ones
          </button>
        </div>
      </Sheet>

      <Modal open={modal === "cleaner"} onClose={() => setModal("")} title="Who will my cleaner be?">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
          <p>Once you book, we offer your session to vetted pros near {draft.address.city || "you"} who match your date, time slots and preferences. The first suitable pro to accept is assigned, and you&apos;ll see their profile, rating and reviews in your account.</p>
          <p>
            <strong className="text-ink">Every pro</strong> passes ID, right-to-work, DBS and reference checks plus a skills interview. For recurring bookings you keep the same pro every visit — or switch any time.
          </p>
          <p className="text-xs text-muted">Demo: pro matching is simulated.</p>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */
function AddressStep({ value, onChange, previous, error, onSubmit, onPickPrevious }: { value: string; onChange: (v: string) => void; previous: string[]; error: string; onSubmit: () => void; onPickPrevious: (v: string) => void }) {
  const areas = useStore("locations").filter((l) => l.active).map((l) => l.name);
  const [focused, setFocused] = useState(false);
  const q = value.trim().toLowerCase();
  const suggestions = q.length >= 2 ? DEMO_ADDRESSES.filter((a) => q.split(/[\s,]+/).filter(Boolean).every((tok) => a.toLowerCase().includes(tok))).slice(0, 5) : [];
  return (
    <>
      <StepTitle
        sub={
          <>
            🕵️ To easily find your address, enter it in this order: <strong className="text-ink">number</strong>, street, city, postcode
          </>
        }
      >
        Where will your cleaning take place?
      </StepTitle>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="relative">
          <label className={cn("block rounded-2xl border-2 px-5 pt-3 pb-3 transition focus-within:border-brand", error ? "border-danger" : "border-ink")}>
            <span className="block text-sm font-semibold text-muted">Your full address</span>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="221b, Baker Street, London, NW1 6XE"
              autoComplete="street-address"
              className="w-full bg-transparent text-[19px] placeholder:text-muted/60 focus:outline-none"
            />
          </label>
          {focused && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(`${s}, United Kingdom`); setFocused(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-cream">
                    <MapPin className="size-4 shrink-0 text-brand" /> <span className="text-[15px]">{s}</span>
                  </button>
                </li>
              ))}
              <li className="px-3 py-1.5 text-[11px] text-muted">Demo address suggestions</li>
            </ul>
          )}
        </div>
        {error && <p role="alert" className="mt-3 text-[15px] font-medium text-danger">{error}</p>}
        {previous.length > 0 && (
          <div className="mt-12">
            <h2 className="text-[19px] font-extrabold">Previous addresses</h2>
            <ul className="mt-4">
              {previous.map((p) => (
                <li key={p}>
                  <button type="button" onClick={() => onPickPrevious(p)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[17px] leading-snug hover:text-brand">
                    {p}
                    <ArrowRight className="size-6 shrink-0 text-brand" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <button type="submit" className="h-16 rounded-full bg-ink px-10 text-[20px] font-bold text-white transition hover:bg-black">
            See prices
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-muted">We currently cover: {areas.join(", ")}.</p>
        <p className="mt-3 text-center text-sm text-ink-soft">
          Prefer to book by phone? Call <a href="tel:+447346739006" className="font-semibold text-ink underline">+44 7346 739006</a> or email{" "}
          <a href="mailto:info@ginnaracleaning.com" className="font-semibold text-ink underline">info@ginnaracleaning.com</a>
        </p>
      </form>
    </>
  );
}

function NeedTile({ icon, label, price, info, selected, onToggle }: { icon: React.ReactNode; label: string; price?: string; info: string; selected: boolean; onToggle: () => void }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl border-2 pr-5 transition", selected ? "border-brand bg-white" : "border-transparent bg-[#f4f4f6]")}>
      <button type="button" aria-pressed={selected} onClick={onToggle} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-5 pl-6 text-left text-[17px]">
        {icon}
        <span>{label}</span>
        {price && <span className="font-bold whitespace-nowrap text-muted">{price}</span>}
      </button>
      {info && <InfoTip text={info} label={label} />}
    </div>
  );
}

function WhoCard({ selected, onSelect, title, children }: { selected: boolean; onSelect: () => void; title: string; children?: React.ReactNode }) {
  return (
    <div role="radio" aria-checked={selected} tabIndex={0} onClick={onSelect} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()} className={cn("cursor-pointer rounded-2xl border-2 bg-[#f4f4f6] p-6 transition", selected ? "border-brand" : "border-transparent")}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[19px] font-extrabold">{title}</p>
        <span className={cn("grid size-11 place-items-center rounded-full border-2", selected ? "border-brand bg-brand" : "border-ink")}>{selected && <span className="size-3.5 rounded-full bg-white" />}</span>
      </div>
      {children}
    </div>
  );
}

function FlowInput({ label, value, onChange, error, type = "text", autoComplete, className }: { label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={cn("block rounded-2xl border-2 bg-white px-4 pt-2 pb-2 focus-within:border-brand", error ? "border-danger" : "border-ink/70")}>
        <span className="block text-xs font-semibold text-muted">{label}</span>
        <input type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-[16px] focus:outline-none" />
      </span>
      {error && <span className="mt-1 block text-[13px] font-medium text-danger">{error}</span>}
    </label>
  );
}

function PaymentOption({ selected, onSelect, icon, label, brands, children }: { selected: boolean; onSelect: () => void; icon: React.ReactNode; label: string; brands?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border-2 transition", selected ? "border-brand" : "border-line")}>
      <button type="button" aria-pressed={selected} onClick={onSelect} className="flex w-full items-center gap-6 px-6 py-6 text-left">
        <span className="grid w-10 place-items-center">{icon}</span>
        <span className="flex-1 text-[19px] font-semibold">{label}</span>
        {brands && (
          <span className="hidden gap-1.5 sm:flex">
            {[
              ["VISA", "bg-[#1a1f71] text-white"],
              ["MC", "bg-ink text-[#f79e1b]"],
              ["AMEX", "bg-[#2e77bc] text-white"],
              ["JCB", "bg-[#0b7a3e] text-white"],
            ].map(([b, c]) => (
              <span key={b} className={cn("rounded-md px-2 py-1.5 text-[11px] font-black italic", c)}>
                {b}
              </span>
            ))}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-6 mb-6 rounded-2xl border border-line p-5 shadow-soft">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
