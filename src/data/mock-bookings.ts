import type { Booking, BookingStatus, Coupon } from "@/types";
import { SEED_SERVICES } from "./mock-services";
import { SEED_CUSTOMERS } from "./mock-users";
import { calculatePrice, defaultOptions } from "@/lib/pricing";
import { addDays, toISODate } from "@/lib/utils";

export const SEED_COUPONS: Coupon[] = [
  { id: "cpn-1", code: "WELCOME10", type: "percent", value: 10, description: "10% off your first clean", minSpend: 0, active: true, uses: 214 },
  { id: "cpn-2", code: "SPARKLE15", type: "percent", value: 15, description: "15% off bookings over £60", minSpend: 60, active: true, uses: 87 },
  { id: "cpn-3", code: "FRESH20", type: "fixed", value: 20, description: "£20 off deep or move-out cleans over £100", minSpend: 100, active: true, uses: 41 },
  { id: "cpn-4", code: "GINNARA5", type: "fixed", value: 5, description: "£5 off any booking", minSpend: 0, active: true, uses: 530 },
  { id: "cpn-5", code: "SUMMER25", type: "percent", value: 25, description: "Expired summer promotion", minSpend: 0, active: false, uses: 902 },
];

type SeedRow = {
  ref: string;
  svc: string;
  cus: number;
  day: number;
  time: string;
  status: BookingStatus;
  pro?: string;
  hours?: number;
  extras?: string[];
};

const rows: SeedRow[] = [
  { ref: "GN-7K2QXA", svc: "svc-residential", cus: 0, day: 3, time: "10:00", status: "confirmed", pro: "pro-demo", hours: 3 },
  { ref: "GN-4MBP9C", svc: "svc-deep", cus: 0, day: 17, time: "09:00", status: "confirmed", pro: "pro-demo", hours: 5, extras: ["windows"] },
  { ref: "GN-H8ZR2D", svc: "svc-residential", cus: 0, day: -21, time: "14:00", status: "completed", pro: "pro-demo", hours: 3, extras: ["oven"] },
  { ref: "GN-P3WT6E", svc: "svc-office", cus: 0, day: -48, time: "11:00", status: "completed", pro: "pro-3", hours: 2 },
  { ref: "GN-Q9NV5F", svc: "svc-residential", cus: 0, day: -10, time: "10:00", status: "cancelled", hours: 3 },
  { ref: "GN-T5RC8G", svc: "svc-moveout", cus: 1, day: 5, time: "08:00", status: "pending", hours: 6, extras: ["walls"] },
  { ref: "GN-W2JX4H", svc: "svc-residential", cus: 2, day: 2, time: "13:00", status: "pending", pro: "pro-demo", hours: 2.5 },
  { ref: "GN-Y7DL3J", svc: "svc-office", cus: 2, day: 8, time: "09:00", status: "confirmed", pro: "pro-3", hours: 4 },
  { ref: "GN-B6GS9K", svc: "svc-event", cus: 3, day: 1, time: "11:00", status: "pending", pro: "pro-demo", hours: 2.5, extras: ["linen", "laundry"] },
  { ref: "GN-C4FU7L", svc: "svc-deep", cus: 3, day: -6, time: "09:00", status: "completed", pro: "pro-4", hours: 5 },
  { ref: "GN-D8HE2M", svc: "svc-office", cus: 4, day: 11, time: "15:00", status: "confirmed", pro: "pro-2", hours: 2 },
  { ref: "GN-E3KA6N", svc: "svc-residential", cus: 5, day: 4, time: "16:00", status: "pending", hours: 3, extras: ["fridge"] },
  { ref: "GN-F9MW4P", svc: "svc-deep", cus: 1, day: -30, time: "10:00", status: "completed", pro: "pro-4", hours: 5 },
  { ref: "GN-G2PZ8Q", svc: "svc-residential", cus: 4, day: -14, time: "12:00", status: "completed", pro: "pro-2", hours: 3 },
  { ref: "GN-J7RB3R", svc: "svc-office", cus: 5, day: -2, time: "17:00", status: "completed", pro: "pro-3", hours: 2 },
  { ref: "GN-K5TY9S", svc: "svc-residential", cus: 3, day: -3, time: "15:00", status: "completed", pro: "pro-5", hours: 2 },
  { ref: "GN-L8VC2T", svc: "svc-moveout", cus: 2, day: -40, time: "08:00", status: "completed", pro: "pro-4", hours: 6 },
  { ref: "GN-M3XE7U", svc: "svc-deep", cus: 1, day: 9, time: "10:00", status: "pending", pro: "pro-demo", hours: 4 },
];

export function buildSeedBookings(): Booking[] {
  const now = new Date();
  const recent = rows.map((r, i) => {
    const service = SEED_SERVICES.find((s) => s.id === r.svc)!;
    const cus = SEED_CUSTOMERS[r.cus];
    const adr = cus.addresses[0];
    const options = { ...defaultOptions(service), hours: r.hours ?? 3, extras: r.extras ?? [] };
    const date = toISODate(addDays(now, r.day));
    return {
      ref: r.ref,
      serviceId: service.id,
      serviceName: service.name,
      options,
      address: { postcode: adr.postcode, street: adr.street, city: adr.city, unit: adr.unit },
      date,
      time: r.time,
      customer: { name: cus.name, email: cus.email, phone: cus.phone },
      notes: i % 3 === 0 ? "Please use the side gate. Our cat Biscuit is friendly!" : "",
      pricing: calculatePrice(service, options),
      status: r.status,
      customerId: cus.id,
      proId: r.pro,
      createdAt: addDays(now, Math.min(r.day, 0) - 7).toISOString(),
    } satisfies Booking;
  });
  return [...recent, ...buildHistory(now)];
}

/* ---------- ~12 months of past jobs from guest customers so reports look realistic (demo data) ---------- */
const HISTORY_CUSTOMERS = [
  { name: "Rachel Green", email: "rachel.g@example.com", phone: "07700 900801", postcode: "SW11 1AA", street: "4 Battersea Rise", city: "London" },
  { name: "Mohammed Iqbal", email: "m.iqbal@example.com", phone: "07700 900802", postcode: "E14 5AB", street: "12 Westferry Road", city: "London" },
  { name: "Hollis & Co Studio", email: "office@hollisco.example", phone: "07700 900803", postcode: "EC2A 4BX", street: "30 Rivington Street", city: "London" },
  { name: "Chloe Martin", email: "chloe.m@example.com", phone: "07700 900804", postcode: "M14 6PL", street: "9 Wilmslow Road", city: "Manchester" },
  { name: "David Wright", email: "d.wright@example.com", phone: "07700 900805", postcode: "B13 9AA", street: "77 Alcester Road", city: "Birmingham" },
  { name: "Northside Dental", email: "admin@northsidedental.example", phone: "07700 900806", postcode: "N4 2LP", street: "5 Stroud Green Road", city: "London" },
  { name: "Ella Robinson", email: "ella.r@example.com", phone: "07700 900807", postcode: "BS6 5QA", street: "21 Gloucester Road", city: "Bristol" },
  { name: "Harvey Lewis", email: "harvey.l@example.com", phone: "07700 900808", postcode: "LS6 2AA", street: "40 Otley Road", city: "Leeds" },
];
const HISTORY_PROS = ["pro-demo", "pro-2", "pro-3", "pro-4", "pro-5"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "16:00"];

function buildHistory(now: Date): Booking[] {
  const out: Booking[] = [];
  let n = 0;
  for (let m = 11; m >= 1; m--) {
    const perMonth = 5 + Math.round((11 - m) * 0.9); // steady growth over the year
    for (let k = 0; k < perMonth; k++) {
      n++;
      const service = SEED_SERVICES[(n * 7 + k) % SEED_SERVICES.length];
      const cus = HISTORY_CUSTOMERS[(n * 5 + m) % HISTORY_CUSTOMERS.length];
      const day = -(m * 30) + ((n * 11) % 27);
      const options = { ...defaultOptions(service), hours: service.minHours + ((n % 3) * 0.5), extras: n % 4 === 0 ? service.extras.slice(0, 1) : [] };
      const cancelled = n % 13 === 0;
      out.push({
        ref: `GN-H${String(n).padStart(5, "0")}`,
        serviceId: service.id,
        serviceName: service.name,
        options,
        address: { postcode: cus.postcode, street: cus.street, city: cus.city, unit: "" },
        date: toISODate(addDays(now, day)),
        time: TIMES[n % TIMES.length],
        customer: { name: cus.name, email: cus.email, phone: cus.phone },
        notes: "",
        pricing: calculatePrice(service, options),
        status: cancelled ? "cancelled" : "completed",
        proId: cancelled ? undefined : HISTORY_PROS[n % HISTORY_PROS.length],
        paymentMethod: n % 4 === 0 ? "paypal" : "card",
        createdAt: addDays(now, day - 5).toISOString(),
      });
    }
  }
  return out;
}
