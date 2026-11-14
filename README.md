# Ginnara Cleaning Service London — frontend demo

**Contact:** +44 7346 739006 · info@ginnaracleaning.com · www.ginnaracleaning.com

A complete, interactive **cleaning-only** home-services marketplace prototype (inspired by the layout and UX of wecasa.co.uk, with original branding, copy and licensed imagery).

> **Frontend only.** There is no backend, database or API. All data is mock data persisted in the browser's `localStorage`. Sign-in is simulated and **not secure** — never use real passwords.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all 48 routes compile)
```

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · React Hook Form + Zod.

## Demo accounts

| Role | Where | Email | Password |
| --- | --- | --- | --- |
| Customer | `/login` | demo@ginnaracleaning.com | Demo1234 |
| Professional | `/pro/login` | pro@ginnaracleaning.com | Pro12345 |
| Admin — Owner (all sections) | `/admin` | admin@ginnaracleaning.com | Admin123! |
| Admin — Manager (no Admin users / Settings) | `/admin` | manager@ginnaracleaning.com | Manager123! |
| Admin — Staff (bookings, customers, pros, reviews, enquiries, notifications) | `/admin` | staff@ginnaracleaning.com | Staff1234! |

Each login page has a **Fill demo credentials** button.

**Coupon codes:** `WELCOME10` (10%), `SPARKLE15` (15%, min £60), `FRESH20` (£20 off, min £100), `GINNARA5` (£5 off). `SUMMER25` is deliberately expired.

**Covered demo postcodes:** London (E, N, SW, SE, W…), Manchester (M), Birmingham (B), Bristol (BS), Leeds (LS), Liverpool (L), Croydon (CR), Milton Keynes (MK). Try `SW4 7AA` or `M20 2RN`.

**Find a booking** (Help centre): `GN-7K2QXA` + `demo@ginnaracleaning.com`.

## Routes

| Area | Routes |
| --- | --- |
| Marketing | `/` · `/domestic-cleaning` (all services) · `/how-it-works` · `/reviews` · `/about` · `/contact` · `/faq` · `/help` · `/blog` · `/blog/[slug]` · `/terms` · `/privacy` |
| Services (flyer) | `/cleaning/residential-cleaning` (£16.50/h) · `office-cleaning` (£16.50/h) · `deep-cleaning` (£18/h) · `move-in-move-out-cleaning` (£18/h) · `special-event-cleaning` (£18/h) (+ any service created in admin) |
| Locations | `/cleaning/london` · `manchester` · `birmingham` · `bristol` · `leeds` · `liverpool` · `croydon` · `milton-keynes` (add `?service=deep-cleaning` to focus a service) |
| Booking | `/booking` (Wecasa-style step flow: address → session → frequency → duration → needs → pets → date → time slots → who → review & payment choice; accepts `?service=` & `?postcode=`) · `/booking/confirmation/[ref]` |
| Customer | `/login` · `/register` · `/forgot-password` · `/account` (overview, bookings, addresses, profile, settings) |
| Professional | `/pro/login` · `/pro/dashboard` (`/pro/register` exists but is not linked from the site) |
| Admin | `/admin` — sections are hash routes, e.g. `/admin#bookings` (see **Admin panel** below) |

`/cleaning/[slug]` serves both service and city pages from one dynamic route.

## Project structure

```
src/
  app/(site)/…         public pages with header/footer
  app/(dash)/…         full-screen dashboards (pro, admin)
  components/
    common/            Button, Field, Modal/ConfirmDialog, Toast, ui (Badge, Accordion, Stars, Photo…)
    layout/            Header (mega menu + mobile drawer), Footer, Logo
    homepage/          Hero, category tiles, carousels, testimonials, app promo
    sections/          shared sections (How it works, Trust, FAQ, Locations, CTA)
    services/          service page template, city template, postcode search, cards
    booking/           wizard, steps, calendar/time slots, price summary, confirmation
    dashboard/         shell, stat cards, SVG charts, data table, customer account
    pro/ admin/ pages/ forms/
  data/                mock services, users, bookings, reviews, cities, content, images
  hooks/useStore.ts    useSyncExternalStore hooks over the storage layer
  lib/
    storage.ts         the only module that touches localStorage (seed, validate, persist, reset)
    auth.ts            demo sessions for customer / pro / admin
    pricing.ts         hours recommendation, extras, recurring discounts, coupons
    availability.ts    deterministic demo calendar & time slots
    bookings.ts pros.ts validation.ts routes.ts utils.ts
  types/
```

## Branding & consent

- Logo: `public/ginnara-logo.webp` (used in header, footer, booking flow, dashboards, cookie banner and as the site icon).
- A cookie consent dialog (Consent / Details / About, Refuse all · Customize · Accept) appears on first visit; the choice is stored locally and can be changed via **Cookie settings** in the footer.
- Sign-up collects title, first/last name, phone with country code, email, address, password and a marketing opt-in. Google buttons are shown but explain that Google sign-in needs a backend.

## Admin panel

"Home Services Admin · Marketplace Management · Demo" at `/admin`, with 18 sections in four groups:

- **Main menu:** Dashboard (`#dashboard`) · Bookings (`#bookings`, list + calendar, confirm/complete/cancel/refund, CSV) · Customers · Professionals (approval, schedule, payouts) · Services & Categories · Locations (postcode coverage used by the website's postcode check and booking form)
- **Business management:** Pricing & Packages (rates, extras, fees, packages) · Coupons & Discounts · Payments & Transactions (simulated capture/refund, payouts) · Reviews & Ratings · Reports & Analytics (date ranges, charts, CSV)
- **Website management:** Pages & Content (homepage, FAQs, contact details) · Blog Management · Enquiries & Support · Notifications (inbox + message templates)
- **System:** Admin Users & Roles (permissions matrix) · Settings (password, cookie consent, JSON export, **Reset demo data**) · Activity Logs

Website events (bookings, cancellations, sign-ups, contact form, newsletter, reviews) create admin notifications, and every admin action is written to the activity log. Payments, emails and SMS are simulated; nothing leaves the browser.

## Notes

- Photography is loaded from the Unsplash CDN (Unsplash License) via `next/image`; every image has a graceful fallback.
- Availability, coverage, earnings history and revenue baselines are generated demo data and are labelled as such in the UI.
- Admin edits (services, prices, coupons, homepage hero text, announcement bar) apply live across the site.
