import { addDays, hash, toISODate } from "./utils";

/**
 * DEMO AVAILABILITY — generated deterministically from the date so it is stable
 * between visits. It does not reflect any real professional's calendar.
 */
export const ALL_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
export const BOOKING_WINDOW_DAYS = 60;

export function isFullyBooked(iso: string) {
  return hash(`full-${iso}`) % 9 === 0;
}

export function dateAvailability(iso: string, sameDay = false): "past" | "unavailable" | "full" | "available" {
  const today = toISODate(new Date());
  const limit = toISODate(addDays(new Date(), BOOKING_WINDOW_DAYS));
  if (iso < today) return "past";
  if (iso === today && !sameDay) return "unavailable";
  if (iso > limit) return "unavailable";
  if (isFullyBooked(iso)) return "full";
  return "available";
}

export function slotsFor(iso: string, sameDay = false) {
  const today = toISODate(new Date());
  const nowHour = new Date().getHours();
  return ALL_SLOTS.map((t) => {
    const hour = Number(t.slice(0, 2));
    let available = hash(`${iso}-${t}`) % 4 !== 0;
    if (iso === today) {
      // same-day: only slots at least 3 hours from now
      available = sameDay && hour >= nowHour + 3 && available;
    }
    return { time: t, available };
  });
}

export function nextAvailableDate(sameDay = false) {
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const iso = toISODate(addDays(new Date(), i));
    if (dateAvailability(iso, sameDay) === "available" && slotsFor(iso, sameDay).some((s) => s.available)) return iso;
  }
  return toISODate(addDays(new Date(), 1));
}
