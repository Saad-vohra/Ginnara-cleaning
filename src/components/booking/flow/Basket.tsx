"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Clock3, Gift, MapPin, ShoppingCart, Tag, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { PriceBreakdown, Service } from "@/types";
import { PriceLines } from "@/components/booking/PriceSummary";
import { useStore } from "@/hooks/useStore";
import { applyCoupon, calculatePrice } from "@/lib/pricing";
import { formatHours, type BookingDraft } from "@/lib/bookings";
import { cn, fromISODate, gbp2 } from "@/lib/utils";

export function appointmentLabel(draft: BookingDraft) {
  if (!draft.date) return "";
  const d = fromISODate(draft.date);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const at = draft.time ? ` at ${draft.time}` : "";
  const f = draft.options?.frequency ?? "once";
  if (f === "weekly") return `First appointment on ${day}${at}, then every ${weekday}`;
  if (f === "fortnightly") return `First appointment on ${day}${at}, then every other ${weekday}`;
  if (f === "monthly") return `First appointment on ${day}${at}, then once a month`;
  return `Appointment on ${day}${at}`;
}

function Row({ icon, children, expand, right, footer }: { icon: ReactNode; children: ReactNode; expand?: ReactNode; right?: ReactNode; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line py-6 last:border-b-0">
      <div className="flex items-start gap-5">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">{children}</div>
        {right}
        {expand && (
          <button type="button" aria-label={open ? "Collapse details" : "Expand details"} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-cream">
            <ChevronDown className={cn("size-6 transition", open && "rotate-180")} />
          </button>
        )}
      </div>
      {footer}
      <AnimatePresence initial={false}>
        {open && expand && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-4 pl-11">{expand}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  draft: BookingDraft;
  service?: Service;
  price: PriceBreakdown | null;
  /** review page shows parking controls and the discount code link */
  mode: "sheet" | "review";
  onChange?: (d: Partial<BookingDraft>) => void;
  onEdit?: (step: string) => void;
}

export function BasketRows({ draft, service, price, mode, onChange, onEdit }: Props) {
  const coupons = useStore("coupons");
  const settings = useStore("settings");
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const recurring = !!draft.options && draft.options.frequency !== "once";
  const editLink = (step: string, label = "Edit") =>
    onEdit && (
      <button type="button" onClick={() => onEdit(step)} className="mt-3 text-sm font-semibold text-brand underline underline-offset-2">
        {label}
      </button>
    );

  const applyCode = () => {
    if (!service || !draft.options) return;
    if (!code.trim()) return setCodeError("Enter a code");
    const subtotal = calculatePrice(service, draft.options, settings).total;
    const res = applyCoupon(code, subtotal, coupons);
    if (!res.ok) return setCodeError(res.error);
    onChange?.({ couponCode: res.coupon.code });
    setCode("");
    setCodeError("");
    setCodeOpen(false);
  };

  return (
    <div>
      <Row icon={<MapPin className="size-6 fill-ink text-white" strokeWidth={2.2} />} expand={mode === "sheet" ? <>{draft.address.unit && <p className="text-sm text-ink-soft">{draft.address.unit}</p>}{editLink("address", "Change address")}</> : undefined}>
        <p className="text-[17px] leading-snug font-bold">{draft.fullAddress || "Address not entered yet"}</p>
        {mode === "review" && (
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-center gap-4">
              <span className="relative inline-flex">
                <input type="checkbox" checked={draft.parking} onChange={(e) => onChange?.({ parking: e.target.checked })} className="peer size-12 cursor-pointer appearance-none rounded-xl border-2 border-ink bg-white transition checked:border-brand checked:bg-brand" />
                <Check className="pointer-events-none absolute inset-0 m-auto size-7 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
              </span>
              <span className="text-[17px]">Free parking nearby</span>
            </label>
            <label className="block">
              <span className="sr-only">Access instructions</span>
              <textarea
                value={draft.accessNotes}
                onChange={(e) => onChange?.({ accessNotes: e.target.value.slice(0, 300) })}
                placeholder="Where to park? Lift? Entry code?"
                rows={2}
                className="w-full rounded-2xl border-2 border-ink px-5 py-4 text-[16px] placeholder:text-muted focus:border-brand focus:outline-none"
              />
            </label>
          </div>
        )}
      </Row>

      <Row
        icon={<ShoppingCart className="size-6 fill-ink" />}
        right={<span className="pt-0.5 text-[17px] whitespace-nowrap">{price ? `${gbp2(price.total)}/${recurring ? "session" : "total"}` : "—"}</span>}
        expand={
          price && service && draft.options ? (
            <div>
              <p className="mb-3 text-sm text-ink-soft">
                {service.name} · {price.packageLabel ?? formatHours(draft.options.hours)}
                {draft.options.extras.length ? ` · ${draft.options.extras.length} extra${draft.options.extras.length > 1 ? "s" : ""}` : ""}
                {draft.options.supplies ? " · cleaning products" : ""}
                {draft.options.pets ? " · pets at home" : ""}
              </p>
              <PriceLines price={price} />
              {editLink("session", "Change service")}
            </div>
          ) : undefined
        }
        footer={
          mode === "review" ? (
          <div className="mt-3 text-right">
            {draft.couponCode ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">
                <Tag className="size-4" /> {draft.couponCode} applied (−{gbp2(price?.couponDiscount ?? 0)})
                <button type="button" aria-label="Remove discount code" onClick={() => onChange?.({ couponCode: "" })} className="rounded-full p-0.5 hover:bg-white">
                  <X className="size-3.5" />
                </button>
              </span>
            ) : codeOpen ? (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCode();
                }}
              >
                <input autoFocus value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(""); }} placeholder="e.g. WELCOME10" aria-label="Discount code" className="h-12 min-w-0 flex-1 rounded-xl border-2 border-ink px-4 font-semibold uppercase placeholder:font-normal placeholder:normal-case focus:outline-none" />
                <button type="submit" className="h-12 rounded-full bg-ink px-5 font-bold text-white">
                  Apply
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => setCodeOpen(true)} className="text-[17px] underline underline-offset-4">
                Add a discount code
              </button>
            )}
            {codeError && <p className="mt-2 text-left text-sm font-medium text-danger">{codeError}</p>}
            {codeOpen && !draft.couponCode && <p className="mt-2 text-left text-xs text-muted">Demo codes: WELCOME10 · SPARKLE15 · FRESH20 · GINNARA5</p>}
          </div>
          ) : undefined
        }
      >
        <p className="text-[17px] font-bold">{service?.kind === "ironing" ? "Ironing" : "Cleaning"}</p>
      </Row>

      <Row
        icon={<Clock3 className="size-6 fill-ink text-white" strokeWidth={2.4} />}
        expand={
          draft.date ? (
            <div className="text-[15px] text-ink-soft">
              <p>Main slot: {draft.time || "not chosen"}{draft.options ? ` (${formatHours(draft.options.hours)})` : ""}</p>
              {draft.altTimes.length > 0 && <p>Also available: {[...draft.altTimes].sort().join(", ")}</p>}
              {editLink("date", "Change date or time")}
            </div>
          ) : undefined
        }
      >
        <p className="text-[17px] leading-snug font-bold">{appointmentLabel(draft) || "Date not chosen yet"}</p>
        {draft.altTimes.length > 0 && (
          <p className="mt-1 text-[15px] text-ink-soft">
            {draft.altTimes.length} other availabilit{draft.altTimes.length === 1 ? "y" : "ies"}
          </p>
        )}
      </Row>

      {recurring && (
        <div className="mt-2 rounded-2xl bg-[#fde0ef] px-5 py-4 text-[16px] leading-snug">
          <p>
            <Gift className="mr-1 inline size-5 -translate-y-0.5 text-brand" /> <strong>Surprise: Ginnara Club access is on us!</strong>
          </p>
          <p>By booking a recurring clean, your membership is free: priority support and the same pro every visit.</p>
        </div>
      )}
    </div>
  );
}
