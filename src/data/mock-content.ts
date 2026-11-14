import type { BlogPost, Faq, SiteContent } from "@/types";
import { IMG } from "./images";

export const SEED_CONTENT: SiteContent = {
  announcement: "Book your cleaning online at www.ginnaracleaning.com — use code WELCOME10 for 10% off.",
  announcementOn: true,
  heroTitle: "Leave the dirty work to us",
  heroSubtitle: "Enjoy a spotless home or office today. Trusted, insured cleaners across London — book your cleaning online in two minutes.",
};

export const FAQS: Faq[] = [
  { category: "Booking", q: "How do I book a clean?", a: "Choose your service, enter your postcode, tell us about your home and pick a date and time. You'll get an instant confirmation and booking reference. The whole flow takes about two minutes." },
  { category: "Booking", q: "How far in advance can I book?", a: "Most services can be booked from tomorrow and up to 60 days ahead. Same-day cleaning is available when you book before 2pm, subject to local availability." },
  { category: "Booking", q: "Can I reschedule or cancel?", a: "Yes. You can cancel free of charge up to 24 hours before your appointment from your account. Cancellations within 24 hours may incur a 50% fee." },
  { category: "Booking", q: "Do I need to be home during the clean?", a: "Not at all. Many customers leave keys with a neighbour, use a key safe or a concierge. Just let us know how your pro will get in when you book." },
  { category: "Pricing", q: "How much does a cleaner cost?", a: "General home and office cleaning costs £16.50 per hour. Deep cleaning and move-in/move-out cleaning cost £18 per hour because they include full bathroom and kitchen cleans. You'll always see the full price before you book, with no hidden fees." },
  { category: "Pricing", q: "Do recurring bookings get a discount?", a: "Yes — weekly bookings save 10% and fortnightly bookings save 5% on the hourly cost." },
  { category: "Pricing", q: "How do discount codes work?", a: "Enter your code on the summary step of the booking form. Codes can have a minimum spend and only one code can be used per booking." },
  { category: "Pricing", q: "When am I charged?", a: "In this demo no payment is taken. In the live service, your card would be authorised at booking and charged 24 hours after the clean is completed." },
  { category: "Cleaners", q: "Are your cleaners vetted?", a: "Every Ginnara pro passes an identity check, right-to-work check, DBS background check, a skills interview and reference checks before taking their first booking." },
  { category: "Cleaners", q: "Do cleaners bring their own products?", a: "Pros normally use your products and equipment. You can add our supplies kit for £6 and your pro will bring eco-friendly products with them." },
  { category: "Cleaners", q: "Will I get the same cleaner each time?", a: "For regular cleaning, yes — we match you with a dedicated pro. If they're on holiday, we'll offer a replacement or let you skip that visit." },
  { category: "Cleaners", q: "Are pros insured?", a: "Every booking includes public liability cover up to £5 million and accidental damage cover, so you're protected if anything goes wrong." },
  { category: "Account", q: "How do I see my upcoming bookings?", a: "Log in and open your account dashboard. You'll see upcoming and past bookings, can view details, cancel bookings and manage saved addresses." },
  { category: "Account", q: "I forgot my password", a: "Use the 'Forgot password' link on the login page. In this demo we simulate sending a reset email and let you set a new password straight away." },
];

const lorem = {
  intro: "A tidy home is one of those small luxuries that changes how a whole week feels. Here's how our pros approach it, and what you can borrow from their routine.",
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "deep-clean-kitchen-checklist",
    title: "The 20-minute kitchen reset our pros swear by",
    excerpt: "A fast, top-to-bottom routine that tackles grease, crumbs and smells without the overwhelm.",
    category: "Cleaning tips",
    image: IMG.kitchen,
    author: "Zara Malik",
    date: "2026-11-04",
    readMins: 5,
    body: [
      { text: lorem.intro },
      { heading: "Start high, finish low", text: "Gravity is your friend. Wipe extractor fans and cabinet tops before the worktops, then finish with the floor so falling crumbs never undo your work." },
      { heading: "The five-step routine", text: "Our pros follow the same order every time:", list: ["Clear and declutter worktops", "Spray the hob and let the product work", "Wipe cupboard fronts and handles", "Degrease and buff the hob", "Sweep and mop from the back door out"] },
      { heading: "Let products do the work", text: "Most grease lifts with time, not elbow grease. Spray, wait three minutes, then wipe — you'll use half the effort." },
    ],
  },
  {
    slug: "end-of-tenancy-deposit-guide",
    title: "How to get your full deposit back: an end-of-tenancy guide",
    excerpt: "What letting agents actually check on inspection day, and how to stay ahead of them.",
    category: "Moving home",
    image: IMG.apartment,
    author: "Kwame Asante",
    date: "2026-10-28",
    readMins: 7,
    body: [
      { text: "Deposit disputes are overwhelmingly about cleanliness. The good news: inspectors follow predictable checklists." },
      { heading: "The inspector's hot spots", text: "These are the areas we see flagged most often:", list: ["Inside the oven and extractor filter", "Limescale on taps and shower screens", "Skirting boards and door frames", "Inside kitchen cupboards", "Marks on walls around light switches"] },
      { heading: "Photograph everything", text: "Take dated photos of every room after the clean. If there's a dispute, evidence wins." },
      { heading: "Book early", text: "End-of-tenancy slots fill up fast at the end of each month. Book at least a week ahead to get your preferred day." },
    ],
  },
  {
    slug: "eco-friendly-cleaning-swaps",
    title: "7 eco-friendly cleaning swaps that actually work",
    excerpt: "Vinegar, bicarb and a few clever habits that reduce plastic and harsh chemicals.",
    category: "Sustainability",
    image: IMG.sprayTeal,
    author: "Hannah Clarke",
    date: "2026-10-19",
    readMins: 4,
    body: [
      { text: "Greener cleaning doesn't mean compromising on results. These are the swaps our Bristol team uses daily." },
      { heading: "Our favourite swaps", text: "Start with these:", list: ["Microfibre cloths instead of paper towels", "White vinegar for glass and limescale", "Bicarbonate of soda for ovens", "Refillable concentrate sprays", "Castile soap for floors", "Lemon for chopping boards", "Wool dryer balls instead of softener"] },
      { heading: "Never mix", text: "Never combine vinegar with bleach — it releases chlorine gas. Keep things simple and ventilate well." },
    ],
  },
  {
    slug: "how-often-should-you-clean",
    title: "How often should you really clean each room?",
    excerpt: "A realistic schedule for busy households, from daily wipe-downs to yearly deep cleans.",
    category: "Home life",
    image: IMG.livingBright,
    author: "Elena Popescu",
    date: "2026-10-10",
    readMins: 6,
    body: [
      { text: "Perfection isn't the goal. Consistency is. Here's the cadence we recommend to clients juggling work and family." },
      { heading: "Daily", text: "Five minutes, tops:", list: ["Wipe kitchen worktops", "Load the dishwasher", "Quick bathroom sink wipe"] },
      { heading: "Weekly", text: "This is where a regular cleaner shines: floors, bathrooms, dusting and changing bed linen." },
      { heading: "Seasonally", text: "Book a deep or spring clean every three to six months to reset the hard-to-reach areas." },
    ],
  },
  {
    slug: "ironing-like-a-pro",
    title: "Iron a shirt in under three minutes",
    excerpt: "The order, temperature and tricks our ironing pros use for a crisp finish.",
    category: "Cleaning tips",
    image: IMG.iron,
    author: "Elena Popescu",
    date: "2026-09-30",
    readMins: 3,
    body: [
      { text: "A great ironed shirt is about order, not effort." },
      { heading: "The pro order", text: "Always in this sequence:", list: ["Collar (underside first)", "Cuffs", "Sleeves", "Back yoke", "Back panel", "Front panels"] },
      { heading: "Damp is your friend", text: "Iron while the shirt is slightly damp, or use a spray bottle. Creases release instantly." },
    ],
  },
  {
    slug: "airbnb-turnover-checklist",
    title: "The Airbnb turnover checklist for five-star reviews",
    excerpt: "Small touches guests notice, and the cleaning steps hosts most often miss.",
    category: "Hosting",
    image: IMG.hotelRoom,
    author: "Hannah Clarke",
    date: "2026-09-22",
    readMins: 5,
    body: [
      { text: "Cleanliness is the review category hosts lose most stars on. A consistent checklist fixes that." },
      { heading: "Often missed", text: "Guests notice these immediately:", list: ["Hair in the shower drain", "Crumbs in the toaster", "Dust on headboards", "Fingerprints on mirrors", "Smells in the fridge"] },
      { heading: "The finishing touch", text: "Fold the first sheet of toilet roll, leave a handwritten welcome and open the curtains. First impressions count." },
    ],
  },
];

export const BLOG_CATEGORIES = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));
