import type { Booking, Pro } from "@/types";
import { insert, patch, read, update } from "./storage";
import { calculatePrice, defaultOptions } from "./pricing";
import { addDays, bookingRef, toISODate, uid } from "./utils";
import { AVATARS } from "@/data/images";
import { notify } from "./admin";

/** Generate a few demo booking requests so a brand-new pro has something to accept */
export function seedRequestsForPro(pro: Pro, count = 3) {
  const services = read("services").filter((s) => pro.services.includes(s.id));
  const customers = read("customers");
  if (!services.length || !customers.length) return;
  const times = ["09:00", "11:00", "14:00", "16:00"];
  const out: Booking[] = [];
  for (let i = 0; i < count; i++) {
    const svc = services[i % services.length];
    const cus = customers[(i + 1) % customers.length];
    const adr = cus.addresses[0] ?? { postcode: pro.postcode, street: "10 Demo Street", city: "London", unit: "" };
    const options = { ...defaultOptions(svc), hours: Math.max(svc.minHours, 2 + i), extras: i === 1 ? svc.extras.slice(0, 1) : [] };
    out.push({
      ref: bookingRef(),
      serviceId: svc.id,
      serviceName: svc.name,
      options,
      address: { postcode: adr.postcode, street: adr.street, city: adr.city, unit: adr.unit },
      date: toISODate(addDays(new Date(), 2 + i * 2)),
      time: times[i % times.length],
      customer: { name: cus.name, email: cus.email, phone: cus.phone },
      notes: i === 0 ? "Demo request — accept or reject to try the flow." : "",
      pricing: calculatePrice(svc, options),
      status: "pending",
      customerId: cus.id,
      proId: pro.id,
      createdAt: new Date().toISOString(),
    });
  }
  update("bookings", (bs) => [...out, ...bs]);
}

export function registerPro(data: Omit<Pro, "id" | "rating" | "jobs" | "status" | "createdAt" | "blockedDates" | "avatar"> & { avatar?: string }) {
  if (read("pros").some((p) => p.email.toLowerCase() === data.email.trim().toLowerCase())) {
    return { ok: false as const, error: "A pro account with this email already exists." };
  }
  const pro: Pro = {
    ...data,
    id: uid("pro"),
    email: data.email.trim(),
    avatar: data.avatar || randomAvatar(),
    blockedDates: [],
    rating: 0,
    jobs: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  insert("pros", pro);
  notify({ type: "pro", title: "New cleaner application", body: `${pro.name} applied to join (postcode ${pro.postcode}).`, section: "pros" });
  seedRequestsForPro(pro);
  update("session", (s) => ({ ...s, proId: pro.id }));
  return { ok: true as const, pro };
}

export function acceptRequest(ref: string, proId: string) {
  patch("bookings", (b) => b.ref === ref, { status: "confirmed", proId });
}

export function rejectRequest(ref: string, proId: string) {
  const b = read("bookings").find((x) => x.ref === ref);
  patch("bookings", (x) => x.ref === ref, { proId: undefined, declinedBy: [...(b?.declinedBy ?? []), proId] });
}

export function completeJob(ref: string, proId: string) {
  patch("bookings", (b) => b.ref === ref, { status: "completed" });
  const pro = read("pros").find((p) => p.id === proId);
  if (pro) patch("pros", (p) => p.id === proId, { jobs: pro.jobs + 1 });
}

export const PRO_SHARE = 0.8;

export const randomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];
