/**
 * Central localStorage layer for the demo.
 * Every read/write of persisted state goes through here — components use the hooks in
 * `@/hooks/useStore` instead of touching localStorage directly.
 */
import type { Booking, ConsentState, ContactMessage, Coupon, Customer, Pro, Review, Service, Session, SiteContent, SiteSettings, ActivityEntry, AdminUser, AppNotification, BlogPost, Faq, Location, MessageTemplate, ServiceCategory, ServiceExtra, ServicePackage } from "@/types";
import { SEED_SERVICES } from "@/data/mock-services";
import { SEED_CUSTOMERS, SEED_PROS } from "@/data/mock-users";
import { buildSeedBookings, SEED_COUPONS } from "@/data/mock-bookings";
import { SEED_REVIEWS } from "@/data/mock-reviews";
import { SEED_CONTENT } from "@/data/mock-content";
import { DEFAULT_SETTINGS } from "@/data/mock-settings";
import { EXTRAS } from "@/data/mock-services";
import { BLOG_POSTS, FAQS } from "@/data/mock-content";
import { SEED_ACTIVITY, SEED_ADMINS, SEED_CATEGORIES, SEED_ENQUIRIES, SEED_LOCATIONS, SEED_NOTIFICATIONS, SEED_PACKAGES, SEED_TEMPLATES } from "@/data/mock-admin";

export interface Store {
  services: Service[];
  customers: Customer[];
  pros: Pro[];
  bookings: Booking[];
  reviews: Review[];
  coupons: Coupon[];
  contacts: ContactMessage[];
  content: SiteContent;
  settings: SiteSettings;
  session: Session;
  consent: ConsentState;
  categories: ServiceCategory[];
  locations: Location[];
  packages: ServicePackage[];
  extras: ServiceExtra[];
  admins: AdminUser[];
  activity: ActivityEntry[];
  notifications: AppNotification[];
  templates: MessageTemplate[];
  posts: BlogPost[];
  faqs: Faq[];
}
export type StoreKey = keyof Store;

const PREFIX = "ginnara:v3:";
const EVENT = "ginnara-store";

const seeds: { [K in StoreKey]: () => Store[K] } = {
  services: () => structuredClone(SEED_SERVICES),
  customers: () => structuredClone(SEED_CUSTOMERS),
  pros: () => structuredClone(SEED_PROS),
  bookings: () => buildSeedBookings(),
  reviews: () => structuredClone(SEED_REVIEWS),
  coupons: () => structuredClone(SEED_COUPONS),
  contacts: () => structuredClone(SEED_ENQUIRIES),
  content: () => ({ ...SEED_CONTENT }),
  settings: () => ({ ...DEFAULT_SETTINGS }),
  session: () => ({}),
  consent: () => ({ decided: false, preferences: false, statistics: false, marketing: false }),
  categories: () => structuredClone(SEED_CATEGORIES),
  locations: () => structuredClone(SEED_LOCATIONS),
  packages: () => structuredClone(SEED_PACKAGES),
  extras: () => structuredClone(EXTRAS),
  admins: () => structuredClone(SEED_ADMINS),
  activity: () => structuredClone(SEED_ACTIVITY),
  notifications: () => structuredClone(SEED_NOTIFICATIONS),
  templates: () => structuredClone(SEED_TEMPLATES),
  posts: () => BLOG_POSTS.map((p) => ({ ...structuredClone(p), published: true })),
  faqs: () => FAQS.map((f, i) => ({ ...f, id: `faq-${i + 1}` })),
};

const isArrayKey = (k: StoreKey) => !["content", "settings", "session", "consent"].includes(k);

const cache = new Map<StoreKey, unknown>();
const serverCache = new Map<StoreKey, unknown>();
const listeners = new Set<() => void>();

const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

function isValid(key: StoreKey, value: unknown) {
  if (isArrayKey(key)) return Array.isArray(value);
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readServer<K extends StoreKey>(key: K): Store[K] {
  if (!serverCache.has(key)) serverCache.set(key, seeds[key]());
  return serverCache.get(key) as Store[K];
}

export function read<K extends StoreKey>(key: K): Store[K] {
  if (!canUseStorage()) return readServer(key);
  if (cache.has(key)) return cache.get(key) as Store[K];
  let value: Store[K] | undefined;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValid(key, parsed)) value = isArrayKey(key) ? parsed : { ...seeds[key](), ...parsed };
    }
  } catch {
    value = undefined; // corrupted JSON — fall back to seed
  }
  if (value === undefined) {
    value = seeds[key]();
    persist(key, value);
  }
  cache.set(key, value);
  return value;
}

function persist(key: StoreKey, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or blocked — keep in-memory copy only
  }
}

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function write<K extends StoreKey>(key: K, value: Store[K]) {
  cache.set(key, value);
  if (canUseStorage()) persist(key, value);
  emit();
}

export function update<K extends StoreKey>(key: K, fn: (prev: Store[K]) => Store[K]) {
  write(key, fn(read(key)));
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith(PREFIX)) return;
    cache.delete(e.key.slice(PREFIX.length) as StoreKey);
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Wipe every demo key and re-seed. Keeps the admin signed in so they land back on the dashboard. */
export function resetDemoData(keepSession = true) {
  const session = read("session");
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  cache.clear();
  if (keepSession) write("session", { adminId: session.adminId });
  emit();
}

/* ------------------------------------------------------------------ */
/* Generic collection helpers                                          */
/* ------------------------------------------------------------------ */
type ArrayKey = { [K in StoreKey]: Store[K] extends unknown[] ? K : never }[StoreKey];
type Item<K extends ArrayKey> = Store[K] extends (infer T)[] ? T : never;

export function insert<K extends ArrayKey>(key: K, item: Item<K>, atStart = true) {
  update(key, (prev) => (atStart ? [item, ...(prev as Item<K>[])] : [...(prev as Item<K>[]), item]) as Store[K]);
}

export function patch<K extends ArrayKey>(key: K, match: (item: Item<K>) => boolean, changes: Partial<Item<K>>) {
  update(key, (prev) => (prev as Item<K>[]).map((it) => (match(it) ? ({ ...(it as object), ...(changes as object) } as Item<K>) : it)) as Store[K]);
}

export function removeWhere<K extends ArrayKey>(key: K, match: (item: Item<K>) => boolean) {
  update(key, (prev) => (prev as Item<K>[]).filter((it) => !match(it)) as Store[K]);
}
