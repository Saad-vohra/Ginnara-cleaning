import type { Customer, Pro } from "@/types";
import { AVATARS } from "./images";

/** Demo credentials — shown on the login pages. Not real authentication. */
export const DEMO_CREDENTIALS = {
  customer: { email: "demo@ginnaracleaning.com", password: "Demo1234" },
  pro: { email: "pro@ginnaracleaning.com", password: "Pro12345" },
  admin: { email: "admin@ginnaracleaning.com", password: "Admin123!" },
  manager: { email: "manager@ginnaracleaning.com", password: "Manager123!" },
  staff: { email: "staff@ginnaracleaning.com", password: "Staff1234!" },
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cus-demo",
    name: "Amelia Hart",
    email: DEMO_CREDENTIALS.customer.email,
    password: DEMO_CREDENTIALS.customer.password,
    phone: "07700 900123",
    addresses: [
      { id: "adr-1", label: "Home", postcode: "SW4 7AA", street: "14 Elmhurst Road", city: "London", unit: "Flat 2" },
      { id: "adr-2", label: "Mum's house", postcode: "BS8 1QU", street: "3 Royal York Crescent", city: "Bristol", unit: "" },
    ],
    createdAt: daysAgo(210),
    marketing: true,
    smsReminders: true,
    status: "active",
  },
  { id: "cus-2", name: "Oliver Bennett", email: "oliver.b@example.com", password: "Password1", phone: "07700 900456", addresses: [{ id: "adr-3", label: "Home", postcode: "M20 2RN", street: "22 Lapwing Lane", city: "Manchester", unit: "" }], createdAt: daysAgo(120), marketing: false, smsReminders: true, status: "active" },
  { id: "cus-3", name: "Priya Shah", email: "priya.shah@example.com", password: "Password1", phone: "07700 900789", addresses: [{ id: "adr-4", label: "Home", postcode: "N1 9GU", street: "8 Copenhagen Street", city: "London", unit: "Apt 31" }], createdAt: daysAgo(64), marketing: true, smsReminders: false, status: "active" },
  { id: "cus-4", name: "James O'Connor", email: "james.oc@example.com", password: "Password1", phone: "07700 900321", addresses: [{ id: "adr-5", label: "Home", postcode: "B15 2TT", street: "41 Harborne Road", city: "Birmingham", unit: "" }], createdAt: daysAgo(40), marketing: false, smsReminders: true, status: "active" },
  { id: "cus-5", name: "Sophie Laurent", email: "sophie.l@example.com", password: "Password1", phone: "07700 900654", addresses: [{ id: "adr-6", label: "Home", postcode: "LS6 3HN", street: "17 Cardigan Road", city: "Leeds", unit: "" }], createdAt: daysAgo(12), marketing: true, smsReminders: true, status: "active" },
  { id: "cus-6", name: "Daniel Okafor", email: "daniel.ok@example.com", password: "Password1", phone: "07700 900987", addresses: [{ id: "adr-7", label: "Home", postcode: "E8 3DL", street: "5 Mare Street", city: "London", unit: "Flat 9" }], createdAt: daysAgo(4), marketing: false, smsReminders: false, status: "active" },
];

export const SEED_PROS: Pro[] = [
  {
    id: "pro-demo",
    name: "Zara Malik",
    email: DEMO_CREDENTIALS.pro.email,
    password: DEMO_CREDENTIALS.pro.password,
    phone: "07700 900111",
    postcode: "SW9 8HQ",
    services: ["svc-residential", "svc-deep", "svc-moveout"],
    experience: "6+ years",
    qualifications: "BICSc Level 2 Certificate in Cleaning, DBS checked",
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    blockedDates: [],
    avatar: AVATARS[4],
    bio: "Detail-obsessed and always on time. I specialise in deep cleans and leaving kitchens gleaming.",
    rating: 4.97,
    jobs: 412,
    status: "approved",
    createdAt: daysAgo(400),
    lastPayoutAt: daysAgo(5),
  },
  { id: "pro-2", name: "Marcus Reid", email: "marcus.r@example.com", password: "Password1", phone: "07700 900222", postcode: "M14 5AB", services: ["svc-residential", "svc-office"], experience: "3-5 years", qualifications: "DBS checked, first aid trained", availability: ["Mon", "Wed", "Fri", "Sat"], blockedDates: [], avatar: AVATARS[1], bio: "Friendly, efficient and great with pets.", rating: 4.92, jobs: 238, status: "approved", createdAt: daysAgo(300), lastPayoutAt: daysAgo(5) },
  { id: "pro-3", name: "Elena Popescu", email: "elena.p@example.com", password: "Password1", phone: "07700 900333", postcode: "N7 6PA", services: ["svc-office", "svc-residential"], experience: "6+ years", qualifications: "Former hotel housekeeper, DBS checked", availability: ["Tue", "Wed", "Thu", "Fri"], blockedDates: [], avatar: AVATARS[2], bio: "Hotel-standard cleaning for homes and offices in North London.", rating: 4.99, jobs: 506, status: "approved", createdAt: daysAgo(520), lastPayoutAt: daysAgo(5) },
  { id: "pro-4", name: "Kwame Asante", email: "kwame.a@example.com", password: "Password1", phone: "07700 900444", postcode: "B12 9QR", services: ["svc-moveout", "svc-deep"], experience: "3-5 years", qualifications: "End-of-tenancy specialist, DBS checked", availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], blockedDates: [], avatar: AVATARS[3], bio: "Deposits back, every time.", rating: 4.88, jobs: 187, status: "approved", createdAt: daysAgo(260), lastPayoutAt: daysAgo(5) },
  { id: "pro-5", name: "Hannah Clarke", email: "hannah.c@example.com", password: "Password1", phone: "07700 900555", postcode: "BS3 4LP", services: ["svc-event", "svc-residential"], experience: "1-2 years", qualifications: "DBS checked", availability: ["Thu", "Fri", "Sat", "Sun"], blockedDates: [], avatar: AVATARS[0], bio: "Party and event clean-ups are my speciality.", rating: 4.9, jobs: 96, status: "approved", createdAt: daysAgo(150), lastPayoutAt: daysAgo(5) },
  { id: "pro-6", name: "Tomasz Nowak", email: "tomasz.n@example.com", password: "Password1", phone: "07700 900666", postcode: "LS4 2BB", services: ["svc-office", "svc-deep"], experience: "3-5 years", qualifications: "Working at height certificate", availability: ["Mon", "Tue", "Wed"], blockedDates: [], avatar: AVATARS[6], bio: "Offices and deep cleans, done properly.", rating: 4.85, jobs: 141, status: "pending", createdAt: daysAgo(3) },
  { id: "pro-7", name: "Grace Thompson", email: "grace.t@example.com", password: "Password1", phone: "07700 900777", postcode: "CR0 2AA", services: ["svc-residential", "svc-office"], experience: "Less than 1 year", qualifications: "DBS check in progress", availability: ["Sat", "Sun"], blockedDates: [], avatar: AVATARS[7], bio: "Weekend home and office cleaning in Croydon.", rating: 0, jobs: 0, status: "pending", createdAt: daysAgo(1) },
];
