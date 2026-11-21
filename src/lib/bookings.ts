import type { Booking, BookingOptions, BookingStatus } from "@/types";
import { insert, patch, read } from "./storage";
import { calculatePrice } from "./pricing";
import { bookingRef } from "./utils";
import { notify } from "./admin";

export interface BookingDraft {
  serviceSlug: string;
  fullAddress: string;
  address: { postcode: string; street: string; city: string; unit: string };
  options: BookingOptions | null;
  date: string;
  time: string;
  altTimes: string[];
  forWhom: "me" | "loved";
  customer: { name: string; email: string; phone: string };
  recipient: { name: string; phone: string };
  notes: string;
  accessNotes: string;
  parking: boolean;
  payment: "" | "card" | "paypal";
  couponCode: string;
  /** "I'll provide a vacuum cleaner and mop" — required for cleaning bookings */
  equipmentConfirmed: boolean;
}

export const emptyDraft = (): BookingDraft => ({
  serviceSlug: "",
  fullAddress: "",
  address: { postcode: "", street: "", city: "", unit: "" },
  options: null,
  date: "",
  time: "",
  altTimes: [],
  forWhom: "me",
  customer: { name: "", email: "", phone: "" },
  recipient: { name: "", phone: "" },
  notes: "",
  accessNotes: "",
  parking: false,
  payment: "",
  couponCode: "",
  equipmentConfirmed: false,
});

/* ---------- In-progress draft (sessionStorage, survives a sign-in round trip) ---------- */
const DRAFT_KEY = "ginnara:v4:booking-draft";

export function saveDraft(draft: BookingDraft, step: string) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step }));
  } catch {
    /* storage unavailable — draft simply isn't restored */
  }
}

export function loadDraft(): { draft: BookingDraft; step: string } | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.draft || typeof parsed.step !== "string") return null;
    return { draft: { ...emptyDraft(), ...parsed.draft }, step: parsed.step };
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function createBooking(draft: BookingDraft): Booking {
  const service = read("services").find((s) => s.slug === draft.serviceSlug);
  if (!service || !draft.options) throw new Error("Booking is incomplete");
  const settings = read("settings");
  const coupons = read("coupons");
  const session = read("session");
  const existing = new Set(read("bookings").map((b) => b.ref));
  let ref = bookingRef();
  while (existing.has(ref)) ref = bookingRef();

  const pricing = calculatePrice(service, draft.options, settings, { code: draft.couponCode, coupons });
  const booking: Booking = {
    ref,
    serviceId: service.id,
    serviceName: service.name,
    options: draft.options,
    address: { ...draft.address },
    date: draft.date,
    time: draft.time,
    altTimes: draft.altTimes,
    customer: { ...draft.customer },
    forWhom: draft.forWhom,
    recipient: draft.forWhom === "loved" ? { ...draft.recipient } : undefined,
    notes: draft.notes,
    accessNotes: draft.accessNotes,
    parking: draft.parking,
    paymentMethod: draft.payment || undefined,
    equipmentConfirmed: draft.equipmentConfirmed || undefined,
    pricing,
    status: "pending",
    customerId: session.customerId,
    createdAt: new Date().toISOString(),
  };
  insert("bookings", booking);
  notify({ type: "booking", title: "New booking", body: `${booking.customer.name} booked ${booking.serviceName} for ${booking.date} at ${booking.time} (${booking.ref}).`, section: "bookings" });
  if (pricing.couponCode) patch("coupons", (c) => c.code === pricing.couponCode, { uses: (coupons.find((c) => c.code === pricing.couponCode)?.uses ?? 0) + 1 });
  return booking;
}

export function setBookingStatus(ref: string, status: BookingStatus) {
  patch("bookings", (b) => b.ref === ref, status === "cancelled" ? { status, cancelledAt: new Date().toISOString() } : { status });
  if (status === "cancelled") notify({ type: "booking", title: "Booking cancelled by customer", body: `Booking ${ref} was cancelled from the customer account.`, section: "bookings" });
}

export function findBooking(ref: string, email: string) {
  return read("bookings").find((b) => b.ref.toUpperCase() === ref.trim().toUpperCase() && b.customer.email.toLowerCase() === email.trim().toLowerCase());
}

/** Bookings within 24h of start can't be cancelled free — the demo still allows it but warns */
export function hoursUntil(b: Booking) {
  const [y, m, d] = b.date.split("-").map(Number);
  const [hh, mm] = b.time.split(":").map(Number);
  return (new Date(y, m - 1, d, hh, mm).getTime() - Date.now()) / 3600000;
}

export const isUpcoming = (b: Booking) => (b.status === "pending" || b.status === "confirmed") && hoursUntil(b) > 0;

/* ---------- Cancellation & reschedule policy ---------- */

export const POLICY = {
  /** Cancel at least this many hours before the start: full refund */
  fullRefundHours: 24,
  /** Cancel between this and fullRefundHours: 50% refund; later than this: no refund */
  noRefundHours: 4,
  partialRefundPct: 50,
  /** Reschedule only allowed at least this many hours before the start */
  rescheduleHours: 24,
};

export const POLICY_LINES = [
  `More than ${POLICY.fullRefundHours} hours before: free cancellation, full refund.`,
  `Between ${POLICY.fullRefundHours} and ${POLICY.noRefundHours} hours before: ${POLICY.partialRefundPct}% refund.`,
  `Less than ${POLICY.noRefundHours} hours before: no refund.`,
  `Rescheduling is free up to ${POLICY.rescheduleHours} hours before the start time.`,
];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What the customer gets back if they cancel right now */
export function cancellationTerms(b: Booking) {
  const hours = hoursUntil(b);
  const pct = hours >= POLICY.fullRefundHours ? 100 : hours >= POLICY.noRefundHours ? POLICY.partialRefundPct : 0;
  const refund = round2((b.pricing.total * pct) / 100);
  return { hours, pct, refund, fee: round2(b.pricing.total - refund) };
}

export const canReschedule = (b: Booking) => isUpcoming(b) && hoursUntil(b) >= POLICY.rescheduleHours;

/** Customer cancellation: applies the refund policy and records it on the booking */
export function cancelBooking(ref: string) {
  const b = read("bookings").find((x) => x.ref === ref);
  if (!b || !isUpcoming(b)) return null;
  const t = cancellationTerms(b);
  const now = new Date().toISOString();
  patch("bookings", (x) => x.ref === ref, {
    status: "cancelled",
    cancelledAt: now,
    refundPct: t.pct,
    refundAmount: t.refund,
    cancellationFee: t.fee,
    paymentStatus: t.pct === 100 ? "refunded" : t.pct > 0 ? "partially_refunded" : "paid",
    refundedAt: t.pct > 0 ? now : undefined,
  });
  const outcome = t.pct === 100 ? "full refund" : t.pct > 0 ? `${t.pct}% refund (£${t.refund.toFixed(2)}), fee £${t.fee.toFixed(2)}` : `no refund, £${t.fee.toFixed(2)} charged`;
  notify({ type: "booking", title: "Booking cancelled by customer", body: `${b.customer.name} cancelled ${ref} (${Math.max(0, Math.floor(t.hours))}h before start): ${outcome}.`, section: "bookings" });
  return t;
}

/** Customer reschedule: only allowed up to POLICY.rescheduleHours before the current start */
export function rescheduleBooking(ref: string, date: string, time: string) {
  const b = read("bookings").find((x) => x.ref === ref);
  if (!b) return { ok: false as const, error: "Booking not found." };
  if (!canReschedule(b)) return { ok: false as const, error: `Bookings can only be rescheduled more than ${POLICY.rescheduleHours} hours before the start time.` };
  if (hoursUntil({ ...b, date, time }) <= 0) return { ok: false as const, error: "Choose a time in the future." };
  if (date === b.date && time === b.time) return { ok: false as const, error: "Choose a different date or time." };
  patch("bookings", (x) => x.ref === ref, { date, time, altTimes: [], rescheduledAt: new Date().toISOString(), rescheduledFrom: { date: b.date, time: b.time } });
  notify({ type: "booking", title: "Booking rescheduled", body: `${b.customer.name} moved ${ref} from ${b.date} ${b.time} to ${date} ${time}.`, section: "bookings" });
  return { ok: true as const };
}

export const formatHours = (h: number) => `${Math.floor(h)}h${h % 1 ? "30" : ""}`;
