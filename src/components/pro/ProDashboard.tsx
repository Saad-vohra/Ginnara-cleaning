"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, CalendarCheck, CalendarDays, CheckCircle2, Clock, Hourglass, Inbox, LayoutDashboard, MapPin, PoundSterling, Star, User, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Booking } from "@/types";
import { Button, LinkButton } from "@/components/common/Button";
import { FieldWrap, Input, Select, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, DemoNote, EmptyState, Photo, PillTabs, Spinner, Stars, StatusBadge } from "@/components/common/ui";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { Calendar } from "@/components/booking/Calendar";
import { BarChart, ProgressBar } from "@/components/dashboard/Charts";
import { DashboardShell, GuardScreen, Panel, StatCard, type NavItem } from "@/components/dashboard/DashboardShell";
import { AvatarUpload, ChipMulti, EXPERIENCE, WEEKDAYS } from "./ProForms";
import { useActiveServices, useCurrentPro, useHydrated, useStore } from "@/hooks/useStore";
import { logoutPro } from "@/lib/auth";
import { acceptRequest, completeJob, PRO_SHARE, rejectRequest, seedRequestsForPro } from "@/lib/pros";
import { hoursUntil } from "@/lib/bookings";
import { patch } from "@/lib/storage";
import { addDays, cn, formatDate, gbp, gbp2, hash, sleep, toISODate } from "@/lib/utils";
import { nameField, phoneField, postcodeField } from "@/lib/validation";

type Tab = "overview" | "requests" | "schedule" | "availability" | "earnings" | "reviews" | "profile";

export function ProDashboard() {
  const hydrated = useHydrated();
  const pro = useCurrentPro();
  const router = useRouter();
  const bookings = useStore("bookings");
  const [tab, setTab] = useState<Tab>("overview");
  const { info } = useToast();

  if (!hydrated) return <Spinner label="Loading dashboard" />;
  if (!pro) return <GuardScreen title="Pro sign in required" text="Sign in to your pro account to see requests, your schedule and earnings." href="/pro/login" cta="Go to pro sign in" />;

  const mine = bookings.filter((b) => b.proId === pro.id);
  const requests = mine.filter((b) => b.status === "pending");

  const nav: NavItem<Tab>[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "requests", label: "Booking requests", icon: Inbox, badge: requests.length },
    { key: "schedule", label: "My schedule", icon: CalendarDays },
    { key: "availability", label: "Availability", icon: CalendarCheck },
    { key: "earnings", label: "Earnings", icon: Wallet },
    { key: "reviews", label: "Reviews", icon: Star },
    { key: "profile", label: "Profile settings", icon: User },
  ];

  return (
    <DashboardShell
      nav={nav}
      active={tab}
      onChange={setTab}
      title="Pro workspace"
      subtitle={`Welcome back, ${pro.name.split(" ")[0]}`}
      user={{
        name: pro.name,
        email: pro.email,
        avatar: (
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
            <Photo src={pro.avatar} alt="" fill sizes="40px" />
          </span>
        ),
      }}
      onLogout={() => {
        logoutPro();
        info("Signed out");
        router.push("/pro/login");
      }}
      topRight={<StatusBadge status={pro.status} />}
    >
      {pro.status === "pending" && (
        <div className="mb-6 flex flex-col gap-3 rounded-3xl bg-sun/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-sm">
            <Hourglass className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong>Your application is under review.</strong> You can explore the dashboard and try the demo requests below. An admin can approve you from the <a href="/admin" className="font-semibold underline">admin dashboard</a>.
            </span>
          </p>
        </div>
      )}
      {tab === "overview" && <Overview mine={mine} onTab={setTab} />}
      {tab === "requests" && <Requests requests={requests} />}
      {tab === "schedule" && <Schedule mine={mine} />}
      {tab === "availability" && <Availability />}
      {tab === "earnings" && <Earnings mine={mine} />}
      {tab === "reviews" && <Reviews />}
      {tab === "profile" && <ProfileSettings />}
    </DashboardShell>
  );
}

function JobRow({ b, actions }: { b: Booking; actions?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="grid w-14 shrink-0 place-items-center rounded-2xl bg-cream py-2 text-center">
          <span className="text-xs font-semibold text-muted uppercase">{formatDate(b.date, { month: "short" })}</span>
          <span className="font-display text-2xl leading-none font-extrabold">{b.date.slice(8)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-extrabold">{b.serviceName}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {b.time} · {b.options.hours}h
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {b.address.city} {b.address.postcode.split(" ")[0]}
            </span>
          </p>
          <p className="text-sm">
            You earn <strong>{gbp2(b.pricing.total * PRO_SHARE)}</strong>
            {b.options.extras.length > 0 && <span className="text-muted"> · {b.options.extras.length} extra(s)</span>}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </li>
  );
}

function Overview({ mine, onTab }: { mine: Booking[]; onTab: (t: Tab) => void }) {
  const pro = useCurrentPro()!;
  const upcoming = mine.filter((b) => b.status === "confirmed" && hoursUntil(b) > -4).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const requests = mine.filter((b) => b.status === "pending");
  const month = toISODate(new Date()).slice(0, 7);
  const monthEarn = mine.filter((b) => (b.status === "completed" || b.status === "confirmed") && b.date.startsWith(month)).reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0);
  const target = 1600;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New requests" value={requests.length} icon={Inbox} hint="Respond within 24h" />
        <StatCard label="Upcoming jobs" value={upcoming.length} icon={CalendarDays} tone="sky" />
        <StatCard label="Earnings this month" value={gbp(Math.round(monthEarn))} icon={PoundSterling} tone="mint" hint="Confirmed + completed (demo)" />
        <StatCard label="Rating" value={pro.rating ? pro.rating.toFixed(2) : "New"} icon={Star} tone="sun" hint={`${pro.jobs} cleans completed`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Next job" action={<Button size="sm" variant="soft" onClick={() => onTab("schedule")}>Full schedule</Button>}>
          {upcoming[0] ? (
            <ul>
              <JobRow b={upcoming[0]} actions={<StatusBadge status="confirmed" />} />
            </ul>
          ) : (
            <EmptyState title="No confirmed jobs" description="Accept a booking request to fill your schedule." action={<Button onClick={() => onTab("requests")}>See requests</Button>} />
          )}
        </Panel>
        <Panel title="Monthly goal">
          <p className="font-display text-3xl font-extrabold">
            {gbp(Math.round(monthEarn))} <span className="text-base font-semibold text-muted">/ {gbp(target)}</span>
          </p>
          <ProgressBar value={(monthEarn / target) * 100} className="mt-4" />
          <p className="mt-3 text-sm text-ink-soft">Accept {Math.max(0, Math.ceil((target - monthEarn) / 60))} more average jobs to hit your goal.</p>
        </Panel>
      </div>
      <Panel title={`Booking requests (${requests.length})`} action={requests.length > 0 && <Button size="sm" onClick={() => onTab("requests")}>Respond</Button>}>
        {requests.length ? (
          <ul className="space-y-3">
            {requests.slice(0, 3).map((b) => (
              <JobRow key={b.ref} b={b} actions={<Badge tone="warning">Awaiting reply</Badge>} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">You&apos;re all caught up.</p>
        )}
      </Panel>
    </div>
  );
}

function Requests({ requests }: { requests: Booking[] }) {
  const pro = useCurrentPro()!;
  const { success, info } = useToast();
  const [view, setView] = useState<Booking | null>(null);
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <Panel title="Booking requests" action={<Button size="sm" variant="soft" onClick={() => { seedRequestsForPro(pro, 2); info("2 new demo requests added"); }}>Simulate new requests</Button>}>
      <DemoNote className="mb-5">These are demo booking requests. Accepting or rejecting updates the booking in this browser and in the admin dashboard.</DemoNote>
      {requests.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" />} title="No pending requests" description="New requests appear here. Use “Simulate new requests” to try the flow again." />
      ) : (
        <ul className="space-y-3">
          {requests.map((b) => (
            <JobRow
              key={b.ref}
              b={b}
              actions={
                <>
                  <Button size="sm" variant="ghost" onClick={() => setView(b)}>
                    Details
                  </Button>
                  <Button size="sm" variant="outline" icon={<X className="size-4" />} onClick={() => setRejecting(b)}>
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    loading={busy === b.ref}
                    icon={<CheckCircle2 className="size-4" />}
                    onClick={async () => {
                      setBusy(b.ref);
                      await sleep(600);
                      acceptRequest(b.ref, pro.id);
                      setBusy(null);
                      success("Booking accepted", `${b.serviceName} on ${formatDate(b.date)} is in your schedule.`);
                    }}
                  >
                    Accept
                  </Button>
                </>
              }
            />
          ))}
        </ul>
      )}
      <Modal open={!!view} onClose={() => setView(null)} title="Request details" size="lg">
        {view && <BookingDetails booking={view} compact />}
      </Modal>
      <ConfirmDialog
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject this request?"
        description="We'll offer it to another pro nearby. Rejecting often can lower your visibility."
        confirmLabel="Reject request"
        onConfirm={() => {
          if (rejecting) rejectRequest(rejecting.ref, pro.id);
          info("Request rejected", "It's been passed to another pro.");
        }}
      />
    </Panel>
  );
}

function Schedule({ mine }: { mine: Booking[] }) {
  const pro = useCurrentPro()!;
  const { success } = useToast();
  const [filter, setFilter] = useState<"upcoming" | "completed">("upcoming");
  const [view, setView] = useState<Booking | null>(null);
  const upcoming = mine.filter((b) => b.status === "confirmed").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const done = mine.filter((b) => b.status === "completed").sort((a, b) => b.date.localeCompare(a.date));
  const list = filter === "upcoming" ? upcoming : done;
  return (
    <Panel>
      <PillTabs className="mb-5" value={filter} onChange={setFilter} tabs={[{ value: "upcoming", label: "Upcoming", count: upcoming.length }, { value: "completed", label: "Completed", count: done.length }]} />
      {list.length === 0 ? (
        <EmptyState title={filter === "upcoming" ? "No upcoming jobs" : "No completed jobs yet"} />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => (
            <JobRow
              key={b.ref}
              b={b}
              actions={
                <>
                  <Button size="sm" variant="ghost" onClick={() => setView(b)}>
                    Details
                  </Button>
                  {b.status === "confirmed" ? (
                    <Button
                      size="sm"
                      variant="dark"
                      onClick={() => {
                        completeJob(b.ref, pro.id);
                        success("Job marked as completed", "Payment will be included in Friday's payout (demo).");
                      }}
                    >
                      Mark completed
                    </Button>
                  ) : (
                    <StatusBadge status="completed" />
                  )}
                </>
              }
            />
          ))}
        </ul>
      )}
      <Modal open={!!view} onClose={() => setView(null)} title="Job details" size="lg">
        {view && <BookingDetails booking={view} />}
      </Modal>
    </Panel>
  );
}

function Availability() {
  const pro = useCurrentPro()!;
  const { success } = useToast();
  const [picked, setPicked] = useState("");
  const blocked = pro.blockedDates;
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Panel title="Weekly availability">
        <p className="mb-4 text-sm text-ink-soft">Customers can only be matched with you on these days.</p>
        <ChipMulti
          options={WEEKDAYS.map((d) => ({ value: d, label: d }))}
          value={pro.availability}
          onChange={(v) => {
            patch("pros", (p) => p.id === pro.id, { availability: WEEKDAYS.filter((d) => v.includes(d)) });
            success("Availability updated");
          }}
        />
        <h3 className="mt-8 mb-3 font-extrabold">Blocked dates</h3>
        {blocked.length === 0 ? (
          <p className="text-sm text-muted">No blocked dates. Pick a date on the calendar to block it (holidays, appointments…).</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...blocked].sort().map((d) => (
              <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 py-1.5 pr-1.5 pl-3 text-sm font-semibold text-danger">
                {formatDate(d, { weekday: "short", day: "numeric", month: "short" })}
                <button
                  aria-label={`Unblock ${d}`}
                  className="grid size-6 place-items-center rounded-full hover:bg-danger/10"
                  onClick={() => {
                    patch("pros", (p) => p.id === pro.id, { blockedDates: blocked.filter((x) => x !== d) });
                    success("Date unblocked");
                  }}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Availability calendar">
        <Calendar mode="availability" value={picked} blocked={blocked} onChange={setPicked} />
        {picked && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream-2 p-4">
            <p className="text-sm font-semibold">{formatDate(picked, { weekday: "long", day: "numeric", month: "long" })}</p>
            {blocked.includes(picked) ? (
              <Button size="sm" variant="soft" onClick={() => { patch("pros", (p) => p.id === pro.id, { blockedDates: blocked.filter((x) => x !== picked) }); success("Date unblocked"); }}>
                Mark available
              </Button>
            ) : (
              <Button size="sm" variant="danger" onClick={() => { patch("pros", (p) => p.id === pro.id, { blockedDates: [...blocked, picked] }); success("Date blocked"); }}>
                Block this date
              </Button>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Earnings({ mine }: { mine: Booking[] }) {
  const pro = useCurrentPro()!;
  const { success } = useToast();
  // Six-month view: real (localStorage) bookings + a deterministic demo baseline
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    return d;
  });
  const data = months.map((d) => {
    const key = toISODate(d).slice(0, 7);
    const real = mine.filter((b) => b.status === "completed" && b.date.startsWith(key)).reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0);
    const baseline = pro.jobs > 0 ? 700 + (hash(pro.id + key) % 900) : 0;
    return { label: d.toLocaleDateString("en-GB", { month: "short" }), value: Math.round(real + baseline) };
  });
  const total = data.reduce((s, d) => s + d.value, 0);
  const pending = mine.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0);
  const payouts = [0, 1, 2, 3].map((i) => {
    const d = addDays(new Date(), -((new Date().getDay() + 2) % 7) - i * 7);
    return { date: toISODate(d), amount: Math.round(data[5].value / 4 + (hash(String(i) + pro.id) % 60)) };
  });
  return (
    <div className="space-y-6">
      <DemoNote>Earnings combine your demo bookings with illustrative historic data. No real payments are made.</DemoNote>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Last 6 months" value={gbp(total)} icon={Wallet} tone="mint" />
        <StatCard label="Pending (confirmed jobs)" value={gbp2(pending)} icon={Hourglass} tone="sun" />
        <StatCard label="Your share" value={`${PRO_SHARE * 100}%`} icon={BadgeCheck} tone="sky" hint="of every booking" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Monthly earnings">
          <BarChart data={data} format={(n) => `£${n.toLocaleString()}`} />
        </Panel>
        <Panel title="Recent payouts" action={<Button size="sm" variant="soft" onClick={() => success("Statement downloaded", "Demo: no file is generated.")}>Statement</Button>}>
          <ul className="divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.date} className="flex items-center justify-between py-3 text-sm">
                <span>
                  <span className="block font-semibold">Weekly payout</span>
                  <span className="text-muted">{formatDate(p.date)}</span>
                </span>
                <span className="font-bold text-success">+{gbp(p.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Reviews() {
  const pro = useCurrentPro()!;
  const reviews = useStore("reviews").filter((r) => r.proId === pro.id && r.published);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg ? avg.toFixed(2) : "—"} icon={Star} tone="sun" />
        <StatCard label="Reviews" value={reviews.length} icon={CheckCircle2} />
        <StatCard label="5-star share" value={reviews.length ? `${Math.round((reviews.filter((r) => r.rating === 5).length / reviews.length) * 100)}%` : "—"} icon={BadgeCheck} tone="mint" />
      </div>
      <Panel title="Customer reviews">
        {reviews.length === 0 ? (
          <EmptyState icon={<Star className="size-6" />} title="No reviews yet" description="Complete jobs and customers will be invited to review you." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-5">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">{formatDate(r.date)}</span>
                </div>
                <p className="mt-3 font-extrabold">{r.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{r.text}</p>
                <p className="mt-3 text-xs text-muted">
                  {r.name} · {r.service} · {r.city}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

const proProfileSchema = z.object({ name: nameField, phone: phoneField, postcode: postcodeField, experience: z.string().min(1), bio: z.string().trim().min(20, "Write at least 20 characters").max(300) });

function ProfileSettings() {
  const pro = useCurrentPro()!;
  const services = useActiveServices();
  const { success } = useToast();
  const [avatar, setAvatar] = useState(pro.avatar);
  const [svc, setSvc] = useState(pro.services);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof proProfileSchema>>({ resolver: zodResolver(proProfileSchema), defaultValues: { name: pro.name, phone: pro.phone, postcode: pro.postcode, experience: pro.experience, bio: pro.bio } });
  return (
    <Panel title="Profile settings">
      <form
        noValidate
        className="grid max-w-3xl gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(async (v) => {
          await sleep(500);
          patch("pros", (p) => p.id === pro.id, { ...v, avatar, services: svc.length ? svc : pro.services });
          success("Profile updated");
        })}
      >
        <div className="sm:col-span-2">
          <AvatarUpload value={avatar} onChange={setAvatar} />
        </div>
        <Input label="Full name" error={formState.errors.name?.message} {...register("name")} />
        <Input label="Phone" error={formState.errors.phone?.message} {...register("phone")} />
        <Input label="Postcode" className="uppercase" error={formState.errors.postcode?.message} {...register("postcode")} />
        <Select label="Experience" options={EXPERIENCE.map((e) => ({ value: e, label: e }))} {...register("experience")} />
        <FieldWrap label="Services offered" className="sm:col-span-2" error={svc.length ? undefined : "Choose at least one service"}>
          <ChipMulti options={services.map((s) => ({ value: s.id, label: s.name }))} value={svc} onChange={setSvc} />
        </FieldWrap>
        <Textarea label="Bio" wrapClassName="sm:col-span-2" error={formState.errors.bio?.message} {...register("bio")} />
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" loading={formState.isSubmitting} disabled={!svc.length}>
            Save profile
          </Button>
          <LinkButton href="/help" variant="ghost">
            Pro help
          </LinkButton>
        </div>
      </form>
      <p className={cn("mt-6 text-xs text-muted")}>Pro since {formatDate(pro.createdAt.slice(0, 10), { month: "long", year: "numeric" })}</p>
    </Panel>
  );
}
