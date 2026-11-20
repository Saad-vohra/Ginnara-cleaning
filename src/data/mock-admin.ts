import type { ActivityEntry, AdminUser, AppNotification, ContactMessage, Location, MessageTemplate, ServiceCategory, ServicePackage } from "@/types";
import { CITIES } from "./mock-cities";

const ago = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

/** Demo admin accounts — one per role. Not secure; for demonstration only. */
export const ADMIN_CREDENTIALS = {
  owner: { email: "admin@ginnaracleaning.com", password: "Admin123!" },
  manager: { email: "manager@ginnaracleaning.com", password: "Manager123!" },
  staff: { email: "staff@ginnaracleaning.com", password: "Staff1234!" },
};

export const SEED_ADMINS: AdminUser[] = [
  { id: "adm-owner", name: "Saad Vohra", email: ADMIN_CREDENTIALS.owner.email, password: ADMIN_CREDENTIALS.owner.password, role: "owner", active: true, createdAt: ago(60 * 24 * 400) },
  { id: "adm-manager", name: "Nadia Khan", email: ADMIN_CREDENTIALS.manager.email, password: ADMIN_CREDENTIALS.manager.password, role: "manager", active: true, createdAt: ago(60 * 24 * 200) },
  { id: "adm-staff", name: "Leo Fischer", email: ADMIN_CREDENTIALS.staff.email, password: ADMIN_CREDENTIALS.staff.password, role: "staff", active: true, createdAt: ago(60 * 24 * 45) },
];

export const SEED_CATEGORIES: ServiceCategory[] = [
  { id: "cat-home", name: "Home cleaning", description: "Houses and flats — general, deep and move-in/move-out cleans", color: "#2e5ea8" },
  { id: "cat-business", name: "Business cleaning", description: "Offices, studios and commercial spaces", color: "#1f3f78" },
  { id: "cat-events", name: "Events", description: "Before and after parties, celebrations and gatherings", color: "#2e8b3c" },
  { id: "cat-airbnb", name: "Airbnb & short lets", description: "Fixed-price turnovers between guests", color: "#ff5a5f" },
  { id: "cat-other", name: "Other home services", description: "Plumbing and house moving — quotes on WhatsApp", color: "#25d366" },
];

export const SEED_LOCATIONS: Location[] = CITIES.map((c) => ({ id: `loc-${c.slug}`, slug: c.slug, name: c.name, region: c.region, postcodes: [...c.postcodes], active: true }));

export const SEED_PACKAGES: ServicePackage[] = [
  { id: "pkg-weekly-4", name: "4-week home refresh", serviceId: "svc-residential", sessions: 4, hoursPerSession: 3, discountPct: 10, description: "Four weekly 3-hour cleans with the same cleaner, paid as a bundle.", active: true },
  { id: "pkg-office-month", name: "Office month", serviceId: "svc-office", sessions: 8, hoursPerSession: 2, discountPct: 12, description: "Twice-weekly office cleans for a month — before or after hours.", active: true },
  { id: "pkg-move", name: "Moving day bundle", serviceId: "svc-moveout", sessions: 2, hoursPerSession: 5, discountPct: 8, description: "Move-out clean at your old home and move-in clean at your new one.", active: true },
  { id: "pkg-party", name: "Party pair", serviceId: "svc-event", sessions: 2, hoursPerSession: 3, discountPct: 5, description: "A pre-event tidy and a post-event clean-up.", active: false },
];

export const SEED_ACTIVITY: ActivityEntry[] = [
  { id: "act-1", at: ago(35), actorId: "adm-manager", actorName: "Nadia Khan", category: "Bookings", action: "Assigned Zara Malik to booking", target: "GN-W2JX4H" },
  { id: "act-2", at: ago(120), actorId: "adm-owner", actorName: "Saad Vohra", category: "Pricing", action: "Changed Deep Cleaning rate to £22.00/h", target: "Deep Cleaning" },
  { id: "act-3", at: ago(300), actorId: "adm-staff", actorName: "Leo Fischer", category: "Enquiries", action: "Replied to enquiry", target: "Office cleaning quote" },
  { id: "act-4", at: ago(60 * 26), actorId: "adm-owner", actorName: "Saad Vohra", category: "Professionals", action: "Approved professional", target: "Hannah Clarke" },
  { id: "act-5", at: ago(60 * 50), actorId: "adm-manager", actorName: "Nadia Khan", category: "Coupons", action: "Created coupon", target: "FRESH20" },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: "ntf-1", type: "booking", title: "New booking", body: "Priya Shah booked Special Event Cleaning for tomorrow at 11:00.", createdAt: ago(25), read: false, section: "bookings" },
  { id: "ntf-2", type: "pro", title: "New cleaner application", body: "Grace Thompson applied to join as a cleaner in Croydon.", createdAt: ago(90), read: false, section: "pros" },
  { id: "ntf-3", type: "enquiry", title: "New quote request", body: "An office in Shoreditch asked for a weekly cleaning quote.", createdAt: ago(240), read: false, section: "enquiries" },
  { id: "ntf-4", type: "review", title: "Review awaiting approval", body: "A 3★ review for Residential Cleaning needs moderation.", createdAt: ago(60 * 20), read: true, section: "reviews" },
  { id: "ntf-5", type: "payment", title: "Payment received", body: "£80.53 received for booking GN-C4FU7L.", createdAt: ago(60 * 30), read: true, section: "payments" },
];

export const SEED_TEMPLATES: MessageTemplate[] = [
  { id: "tpl-confirm", name: "Booking confirmation", channel: "email", trigger: "Booking created", subject: "Your Ginnara cleaning is booked — {{ref}}", body: "Hi {{name}},\n\nThanks for booking {{service}} on {{date}} at {{time}}. Your reference is {{ref}}.\n\nNeed help? Call +44 7346 739006 or reply to this email.\n\nGinnara Cleaning Service", active: true },
  { id: "tpl-reminder", name: "Day-before reminder", channel: "sms", trigger: "24h before booking", subject: "", body: "Ginnara: reminder — your {{service}} is tomorrow at {{time}}. Reply HELP or call +44 7346 739006.", active: true },
  { id: "tpl-assigned", name: "Cleaner assigned", channel: "email", trigger: "Professional assigned", subject: "Meet your cleaner for {{ref}}", body: "Hi {{name}},\n\n{{pro}} will be cleaning for you on {{date}}. They're fully vetted and insured.\n\nGinnara Cleaning Service", active: true },
  { id: "tpl-cancel", name: "Booking cancelled", channel: "email", trigger: "Booking cancelled", subject: "Your booking {{ref}} has been cancelled", body: "Hi {{name}},\n\nYour booking {{ref}} has been cancelled. If this was a mistake, rebook any time at www.ginnaracleaning.com.", active: true },
  { id: "tpl-review", name: "Review request", channel: "email", trigger: "Booking completed", subject: "How was your clean?", body: "Hi {{name}},\n\nWe'd love to hear how {{pro}} did. Leave a quick review in your account.", active: false },
];

export const SEED_ENQUIRIES: ContactMessage[] = [
  { id: "msg-1", name: "Tom Richards", email: "tom@shoreditchstudio.example", phone: "07700 900612", topic: "Pricing & quotes", type: "quote", message: "Hi, we're a 25-person design studio in Shoreditch. Could you quote for office cleaning three evenings a week (Mon, Wed, Fri)? We have a kitchen and two washrooms.", createdAt: ago(240), status: "new" },
  { id: "msg-2", name: "Fatima Ali", email: "fatima.ali@example.com", topic: "An existing booking", type: "contact", message: "Can I move my deep clean on Saturday to Sunday morning instead? Booking reference GN-4MBP9C. Thanks!", createdAt: ago(60 * 7), status: "read" },
  { id: "msg-3", name: "George Evans", email: "george.evans@example.com", topic: "Pricing & quotes", type: "quote", message: "Moving out of a 3-bed house in Croydon at the end of the month. How much would a move-out clean cost including the oven and inside windows?", createdAt: ago(60 * 26), status: "replied", notes: [{ at: ago(60 * 25), by: "Nadia Khan", text: "Quoted 6h move-out + oven + windows ≈ £158. Customer will book online." }] },
  { id: "msg-4", name: "Newsletter subscriber", email: "chloe.m@example.com", topic: "Newsletter", type: "newsletter", message: "Subscribed to monthly cleaning tips from the footer form.", createdAt: ago(60 * 30), status: "read" },
  { id: "msg-5", name: "Sam Patel", email: "sam.patel@example.com", topic: "Feedback", type: "contact", message: "Just wanted to say Zara did an amazing job on our flat — please pass on our thanks!", createdAt: ago(60 * 50), status: "closed" },
];
