import type { Service } from "@/types";

/** WhatsApp/phone-quote services can't be booked online */
export const isQuoteOnly = (s: Service) => s.bookingMode === "quote";

/** Lowest price a customer can pay, for "from £x" labels (null for quote-only services) */
export function startingPrice(s: Service) {
  if (isQuoteOnly(s)) return null;
  if (s.packages?.length) return Math.min(...s.packages.map((p) => p.price));
  return Math.min(s.hourlyRate, s.oneOffRate ?? s.hourlyRate);
}

/** Short price label: "£17/hr", "from £39" or "Quote on WhatsApp" */
export function priceLabel(s: Service, opts: { from?: boolean } = {}) {
  if (isQuoteOnly(s)) return "Quote on WhatsApp";
  if (s.packages?.length) return `from £${startingPrice(s)}`;
  const rate = startingPrice(s)!;
  return `${opts.from ? "from " : ""}£${Number.isInteger(rate) ? rate : rate.toFixed(2)}/hr`;
}

/** Digits-only international number for wa.me links (07… → 447…) */
export function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `44${d.slice(1)}` : d;
}

export function whatsappHref(phone: string, text?: string) {
  return `https://wa.me/${waDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Pre-filled WhatsApp message for a quote request */
export const quoteMessage = (s?: Service) => (s ? `Hi Ginnara, I'd like a quote for ${s.name.toLowerCase()}.` : "Hi Ginnara, I'd like a quote please.");
