export type ServiceKind = "cleaning" | "ironing";

export interface ServiceExtra {
  id: string;
  label: string;
  price: number;
  description?: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  kind: ServiceKind;
  tagline: string;
  short: string;
  description: string;
  image: string;
  accent: string;
  hourlyRate: number;
  minHours: number;
  hoursMultiplier: number;
  popular: boolean;
  active: boolean;
  features: string[];
  includes: string[];
  extras: string[];
  allowsFrequency: boolean;
  sameDay?: boolean;
  /** ServiceCategory id */
  category?: string;
}

export interface Address {
  id: string;
  label: string;
  postcode: string;
  street: string;
  city: string;
  unit: string;
}

export type Frequency = "once" | "weekly" | "fortnightly" | "monthly";
export type PropertyType = "flat" | "house" | "studio" | "maisonette";

export interface BookingOptions {
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  hours: number;
  extras: string[];
  frequency: Frequency;
  supplies: boolean;
  pets: boolean;
  access: "home" | "keys" | "concierge";
}

export interface PriceBreakdown {
  hours: number;
  rate: number;
  base: number;
  extrasTotal: number;
  extrasLines: { label: string; price: number }[];
  suppliesFee: number;
  frequencyDiscount: number;
  serviceFee: number;
  couponCode?: string;
  couponDiscount: number;
  total: number;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  ref: string;
  serviceId: string;
  serviceName: string;
  options: BookingOptions;
  address: Omit<Address, "id" | "label">;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customer: { name: string; email: string; phone: string };
  notes: string;
  pricing: PriceBreakdown;
  status: BookingStatus;
  customerId?: string;
  proId?: string;
  declinedBy?: string[];
  /** Extra start times the customer is also available for on the same day */
  altTimes?: string[];
  forWhom?: "me" | "loved";
  recipient?: { name: string; phone: string };
  parking?: boolean;
  accessNotes?: string;
  paymentMethod?: "card" | "paypal";
  paymentStatus?: PaymentStatus;
  refundedAt?: string;
  createdAt: string;
  cancelledAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  title?: "Ms/Mrs" | "Mr";
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone: string;
  addresses: Address[];
  createdAt: string;
  marketing: boolean;
  smsReminders: boolean;
  status: "active" | "suspended";
  /** Private admin notes */
  notes?: string;
}

export type ProStatus = "pending" | "approved" | "rejected";

export interface Pro {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  postcode: string;
  services: string[];
  experience: string;
  qualifications: string;
  availability: string[]; // weekdays
  blockedDates: string[];
  avatar: string;
  bio: string;
  rating: number;
  jobs: number;
  status: ProStatus;
  createdAt: string;
  /** Last simulated payout (Admin → Professionals) */
  lastPayoutAt?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  title: string;
  text: string;
  service: string;
  city: string;
  date: string;
  proName: string;
  proId?: string;
  published: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  minSpend: number;
  active: boolean;
  uses: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "replied" | "closed";
  type?: "contact" | "quote" | "newsletter";
  phone?: string;
  notes?: { at: string; by: string; text: string }[];
}

export interface SiteContent {
  announcement: string;
  announcementOn: boolean;
  heroTitle: string;
  heroSubtitle: string;
}

export interface SiteSettings {
  serviceFee: number;
  weeklyDiscount: number;
  fortnightlyDiscount: number;
  monthlyDiscount: number;
  /** Cleaning products brought by the pro, charged per hour */
  suppliesPerHour: number;
  supportEmail: string;
  supportPhone: string;
  businessName?: string;
  website?: string;
  address?: string;
  openingHours?: string;
}

export interface Session {
  customerId?: string;
  proId?: string;
  /** Signed-in admin user id (demo) */
  adminId?: string;
}

export interface City {
  slug: string;
  name: string;
  region: string;
  image: string;
  pros: number;
  avgRating: number;
  hourlyFrom: number;
  postcodes: string[];
  areas: string[];
  intro: string;
  highlight: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readMins: number;
  body: { heading?: string; text: string; list?: string[] }[];
  published?: boolean;
}

export interface Faq {
  id?: string;
  q: string;
  a: string;
  category: string;
}

export interface ConsentState {
  decided: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
  decidedAt?: string;
}

export type PaymentStatus = "authorised" | "paid" | "refunded" | "voided";

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Location {
  id: string;
  slug: string;
  name: string;
  region: string;
  postcodes: string[];
  active: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  serviceId: string;
  sessions: number;
  hoursPerSession: number;
  discountPct: number;
  description: string;
  active: boolean;
}

export type AdminRole = "owner" | "manager" | "staff";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  category: string;
  action: string;
  target?: string;
}

export interface AppNotification {
  id: string;
  type: "booking" | "enquiry" | "pro" | "review" | "customer" | "payment" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** admin section to open */
  section?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "email" | "sms";
  trigger: string;
  subject: string;
  body: string;
  active: boolean;
}
