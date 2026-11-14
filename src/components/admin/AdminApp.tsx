"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Newspaper,
  PoundSterling,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import { DemoNote, Spinner } from "@/components/common/ui";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { LogoMark } from "@/components/layout/Logo";
import { ADMIN_CREDENTIALS } from "@/data/mock-admin";
import { useHydrated, useSession, useStore } from "@/hooks/useStore";
import { canAccess, logActivity, ROLE_LABEL, type AdminSection } from "@/lib/admin";
import { loginAdmin, logoutAdmin } from "@/lib/auth";
import { update } from "@/lib/storage";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { cn, formatDateTime, initials, sleep } from "@/lib/utils";
import { Dashboard } from "./Dashboard";
import { BookingsAdmin } from "./BookingsAdmin";
import { CustomersAdmin } from "./CustomersAdmin";
import { ProsAdmin } from "./ProsAdmin";
import { ServicesAdmin } from "./ServicesAdmin";
import { LocationsAdmin } from "./LocationsAdmin";
import { PricingAdmin } from "./PricingAdmin";
import { CouponsAdmin } from "./CouponsAdmin";
import { PaymentsAdmin } from "./PaymentsAdmin";
import { ReviewsAdmin } from "./ReviewsAdmin";
import { ReportsAdmin } from "./ReportsAdmin";
import { ContentAdmin } from "./ContentAdmin";
import { BlogAdmin } from "./BlogAdmin";
import { EnquiriesAdmin } from "./EnquiriesAdmin";
import { NotificationsAdmin } from "./NotificationsAdmin";
import { AdminUsersAdmin } from "./AdminUsersAdmin";
import { SettingsAdmin } from "./SettingsAdmin";
import { ActivityAdmin } from "./ActivityAdmin";

export type AdminTab = AdminSection;

const SECTION_DESCRIPTIONS: Record<AdminSection, string> = {
  dashboard: "Today at a glance",
  bookings: "All cleans, calendar and assignments",
  customers: "Customer accounts and history",
  pros: "Cleaners, approvals and payouts",
  services: "Services and categories shown on the website",
  locations: "Cities and postcode areas you cover",
  pricing: "Rates, extras, discounts and packages",
  coupons: "Discount codes",
  payments: "Simulated payments, refunds and payouts",
  reviews: "Moderate reviews and ratings",
  reports: "Revenue and performance",
  content: "Homepage text, FAQs and contact details",
  blog: "Articles on The mag",
  enquiries: "Contact messages, quotes and sign-ups",
  notifications: "Alerts and message templates",
  admins: "Who can access this panel",
  settings: "Business and system settings",
  activity: "Audit trail of admin actions",
};

/* ---------------- Login ---------------- */
function AdminLogin() {
  const { success } = useToast();
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState, setValue } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const fill = (role: keyof typeof ADMIN_CREDENTIALS) => {
    setValue("email", ADMIN_CREDENTIALS[role].email, { shouldValidate: true });
    setValue("password", ADMIN_CREDENTIALS[role].password, { shouldValidate: true });
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-[#0f1f3d] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-lift sm:p-9">
        <div className="flex items-center gap-3">
          <LogoMark className="h-16 w-auto" />
          <div>
            <p className="font-display text-xl leading-tight font-extrabold">Ginnara Admin</p>
            <p className="text-sm text-muted">Marketplace Management</p>
          </div>
        </div>
        <h1 className="mt-7 flex items-center gap-2 text-2xl font-extrabold">
          <ShieldCheck className="size-6 text-brand" /> Sign in to the admin panel
        </h1>
        <div className="mt-5 rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4 text-sm">
          <p className="font-bold">Demo accounts — one per role</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(ADMIN_CREDENTIALS) as (keyof typeof ADMIN_CREDENTIALS)[]).map((r) => (
              <button key={r} type="button" onClick={() => fill(r)} className="rounded-xl bg-white px-2 py-2 text-xs font-semibold ring-1 ring-line hover:ring-ink">
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Owner sees everything · Manager can&apos;t manage admins or settings · Staff handles day-to-day work.</p>
        </div>
        <form
          noValidate
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(async (v) => {
            setErr("");
            await sleep(500);
            const res = loginAdmin(v.email, v.password);
            if (!res.ok) return setErr(res.error);
            logActivity("Auth", "Signed in to the admin panel");
            success(`Welcome, ${res.name.split(" ")[0]}`);
          })}
        >
          <Input label="Email" type="email" leading={<Mail className="size-4" />} error={formState.errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" leading={<Lock className="size-4" />} error={formState.errors.password?.message} {...register("password")} />
          {err && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{err}</p>}
          <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
            Sign in
          </Button>
        </form>
        <DemoNote className="mt-6">Frontend-only admin for demonstration. Data is stored in this browser and is not secure.</DemoNote>
        <Link href="/" className="mt-4 block text-center text-sm font-semibold text-ink-soft hover:text-ink">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Notifications bell ---------------- */
function Bell_({ onOpen }: { onOpen: (s: AdminSection) => void }) {
  const notifications = useStore("notifications");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button aria-label={`Notifications (${unread} unread)`} onClick={() => setOpen((o) => !o)} className="relative grid size-11 place-items-center rounded-full bg-cream hover:bg-[#f2e2cf]">
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute top-13 right-0 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-extrabold">Notifications</p>
              <button className="text-xs font-semibold text-brand hover:underline" onClick={() => update("notifications", (xs) => xs.map((n) => ({ ...n, read: true })))}>
                Mark all read
              </button>
            </div>
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {notifications.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      update("notifications", (xs) => xs.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                      if (n.section) onOpen(n.section as AdminSection);
                      setOpen(false);
                    }}
                    className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-cream-2", !n.read && "bg-brand/5")}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{n.title}</span>
                      <span className="block text-xs text-ink-soft">{n.body}</span>
                      <span className="block text-[11px] text-muted">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
              {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No notifications</li>}
            </ul>
            <button
              onClick={() => {
                onOpen("notifications");
                setOpen(false);
              }}
              className="w-full border-t border-line py-3 text-sm font-semibold hover:bg-cream-2"
            >
              View all notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- App ---------------- */
export function AdminApp() {
  const hydrated = useHydrated();
  const session = useSession();
  const admins = useStore("admins");
  const pros = useStore("pros");
  const bookings = useStore("bookings");
  const reviews = useStore("reviews");
  const contacts = useStore("contacts");
  const notifications = useStore("notifications");
  const [tab, setTabState] = useState<AdminSection>("dashboard");
  const { info } = useToast();
  const me = admins.find((a) => a.id === session.adminId && a.active);

  // Keep the open section in the URL hash so refreshes stay put
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1) as AdminSection;
      if (h && h in SECTION_DESCRIPTIONS) setTabState(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const setTab = (t: AdminSection) => {
    setTabState(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  };

  if (!hydrated) return <Spinner label="Loading admin" />;
  if (!me) return <AdminLogin />;

  const all: (NavItem<AdminSection> & { group: string })[] = [
    { group: "Main menu", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { group: "Main menu", key: "bookings", label: "Bookings", icon: CalendarDays, badge: bookings.filter((b) => b.status === "pending").length },
    { group: "Main menu", key: "customers", label: "Customers", icon: Users },
    { group: "Main menu", key: "pros", label: "Professionals", icon: UserCog, badge: pros.filter((p) => p.status === "pending").length },
    { group: "Main menu", key: "services", label: "Services & Categories", icon: Sparkles },
    { group: "Main menu", key: "locations", label: "Locations", icon: MapPin },
    { group: "Business management", key: "pricing", label: "Pricing & Packages", icon: PoundSterling },
    { group: "Business management", key: "coupons", label: "Coupons & Discounts", icon: Tag },
    { group: "Business management", key: "payments", label: "Payments & Transactions", icon: CreditCard },
    { group: "Business management", key: "reviews", label: "Reviews & Ratings", icon: Star, badge: reviews.filter((r) => !r.published).length },
    { group: "Business management", key: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { group: "Website management", key: "content", label: "Pages & Content", icon: FileText },
    { group: "Website management", key: "blog", label: "Blog Management", icon: Newspaper },
    { group: "Website management", key: "enquiries", label: "Enquiries & Support", icon: Inbox, badge: contacts.filter((c) => c.status === "new").length },
    { group: "Website management", key: "notifications", label: "Notifications", icon: Bell, badge: notifications.filter((n) => !n.read).length },
    { group: "System", key: "admins", label: "Admin Users & Roles", icon: UsersRound },
    { group: "System", key: "settings", label: "Settings", icon: Settings },
    { group: "System", key: "activity", label: "Activity Logs", icon: Activity },
  ];
  const nav = all.filter((n) => canAccess(me.role, n.key));
  const active = canAccess(me.role, tab) ? tab : "dashboard";

  return (
    <DashboardShell
      nav={nav}
      active={active}
      onChange={setTab}
      title=""
      subtitle={SECTION_DESCRIPTIONS[active]}
      brand={
        <Link href="/admin#dashboard" onClick={() => setTab("dashboard")} className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white p-1">
            <LogoMark className="h-11 w-auto" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[17px] leading-tight font-extrabold text-white">Ginnara Admin</span>
            <span className="block text-xs text-white/60">Marketplace Management</span>
            <span className="mt-1 inline-block rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink uppercase">Demo</span>
          </span>
        </Link>
      }
      user={{
        name: me.name,
        email: `${ROLE_LABEL[me.role]} · ${me.email}`,
        avatar: <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{initials(me.name)}</span>,
      }}
      onLogout={() => {
        logActivity("Auth", "Signed out of the admin panel");
        logoutAdmin();
        info("Signed out of admin");
      }}
      topRight={
        <>
          <span className="hidden rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white md:inline">{ROLE_LABEL[me.role]}</span>
          <Bell_ onOpen={setTab} />
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-full bg-cream px-4 py-2.5 text-sm font-semibold hover:bg-[#f2e2cf] sm:inline-flex">
            View site <ExternalLink className="size-4" />
          </Link>
        </>
      }
    >
      {active === "dashboard" && <Dashboard onTab={setTab} role={me.role} />}
      {active === "bookings" && <BookingsAdmin />}
      {active === "customers" && <CustomersAdmin />}
      {active === "pros" && <ProsAdmin />}
      {active === "services" && <ServicesAdmin />}
      {active === "locations" && <LocationsAdmin />}
      {active === "pricing" && <PricingAdmin />}
      {active === "coupons" && <CouponsAdmin />}
      {active === "payments" && <PaymentsAdmin />}
      {active === "reviews" && <ReviewsAdmin />}
      {active === "reports" && <ReportsAdmin />}
      {active === "content" && <ContentAdmin />}
      {active === "blog" && <BlogAdmin />}
      {active === "enquiries" && <EnquiriesAdmin />}
      {active === "notifications" && <NotificationsAdmin onOpen={setTab} />}
      {active === "admins" && <AdminUsersAdmin />}
      {active === "settings" && <SettingsAdmin />}
      {active === "activity" && <ActivityAdmin />}
    </DashboardShell>
  );
}
