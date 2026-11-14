import type { BookingOptions, Coupon, PriceBreakdown, Service, SiteSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/data/mock-settings";
import { extraById } from "./extras";
import { round2 } from "./utils";

export { DEFAULT_SETTINGS };

/** Suggest a duration based on property size and how intensive the service is */
export function recommendedHours(service: Service, bedrooms: number, bathrooms: number) {
  if (service.kind === "ironing") return Math.max(service.minHours, 2);
  const raw = (1.5 + bedrooms * 0.5 + bathrooms * 0.5) * service.hoursMultiplier;
  const rounded = Math.round(raw * 2) / 2;
  return Math.min(10, Math.max(service.minHours, rounded));
}

export function frequencyDiscountPct(freq: BookingOptions["frequency"], settings: SiteSettings) {
  switch (freq) {
    case "weekly":
      return settings.weeklyDiscount;
    case "fortnightly":
      return settings.fortnightlyDiscount;
    case "monthly":
      return settings.monthlyDiscount;
    default:
      return 0;
  }
}

export type CouponResult = { ok: true; coupon: Coupon; discount: number } | { ok: false; error: string };

export function applyCoupon(code: string, subtotal: number, coupons: Coupon[]): CouponResult {
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false, error: "That code isn't recognised." };
  if (!c.active) return { ok: false, error: "This code has expired." };
  if (subtotal < c.minSpend) return { ok: false, error: `Minimum spend of £${c.minSpend} required.` };
  const discount = c.type === "percent" ? (subtotal * c.value) / 100 : Math.min(c.value, subtotal);
  return { ok: true, coupon: c, discount: round2(discount) };
}

export function calculatePrice(
  service: Service,
  options: BookingOptions,
  settings: SiteSettings = DEFAULT_SETTINGS,
  coupon?: { code: string; coupons: Coupon[] },
): PriceBreakdown {
  const rate = service.hourlyRate;
  const base = round2(options.hours * rate);
  const extrasLines = options.extras
    .map((id) => extraById(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((e) => ({ label: e.label, price: e.price }));
  const extrasTotal = extrasLines.reduce((s, e) => s + e.price, 0);
  const suppliesFee = options.supplies ? round2((settings.suppliesPerHour ?? DEFAULT_SETTINGS.suppliesPerHour) * options.hours) : 0;
  const pct = service.allowsFrequency ? frequencyDiscountPct(options.frequency, settings) : 0;
  const frequencyDiscount = round2((base * pct) / 100);
  const serviceFee = settings.serviceFee;
  const subtotal = round2(base + extrasTotal + suppliesFee - frequencyDiscount + serviceFee);

  let couponDiscount = 0;
  let couponCode: string | undefined;
  if (coupon?.code) {
    const res = applyCoupon(coupon.code, subtotal, coupon.coupons);
    if (res.ok) {
      couponDiscount = res.discount;
      couponCode = res.coupon.code;
    }
  }

  return {
    hours: options.hours,
    rate,
    base,
    extrasTotal,
    extrasLines,
    suppliesFee,
    frequencyDiscount,
    serviceFee,
    couponCode,
    couponDiscount,
    total: round2(Math.max(0, subtotal - couponDiscount)),
  };
}

export const defaultOptions = (service: Service): BookingOptions => ({
  bedrooms: 2,
  bathrooms: 1,
  propertyType: "flat",
  hours: recommendedHours(service, 2, 1),
  extras: [],
  frequency: service.allowsFrequency && service.slug === "residential-cleaning" ? "weekly" : "once",
  supplies: false,
  pets: false,
  access: "home",
});
