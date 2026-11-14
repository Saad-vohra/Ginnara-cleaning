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
});

/* ---------- In-progress draft (sessionStorage, survives a sign-in round trip) ---------- */
const DRAFT_KEY = "ginnara:v3:booking-draft";

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

export const formatHours = (h: number) => `${Math.floor(h)}h${h % 1 ? "30" : ""}`;
