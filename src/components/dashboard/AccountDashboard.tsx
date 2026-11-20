"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CalendarDays, CalendarX, CheckCircle2, Home, LayoutDashboard, LogOut, MapPin, Pencil, Plus, Settings, Sparkles, Star, Trash2, User, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Address, Booking } from "@/types";
import { Button, LinkButton } from "@/components/common/Button";
import { Input, Textarea, Toggle } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, EmptyState, PillTabs, Spinner, StatusBadge } from "@/components/common/ui";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { BookingCalendar, TimeGrid } from "@/components/booking/flow/ui";
import { StatCard, Panel } from "./DashboardShell";
import { useCurrentCustomer, useHydrated, useStore } from "@/hooks/useStore";
import { logoutCustomer } from "@/lib/auth";
import { notify } from "@/lib/admin";
import { cancelBooking, cancellationTerms, canReschedule, isUpcoming, POLICY, POLICY_LINES, rescheduleBooking } from "@/lib/bookings";
import { insert, patch, removeWhere, update } from "@/lib/storage";
import { addressSchema, emailField, nameField, passwordField, phoneField, type AddressValues } from "@/lib/validation";
import { cn, formatDate, gbp2, initials, sleep, uid } from "@/lib/utils";
import { bookingHref } from "@/lib/routes";

type Tab = "overview" | "bookings" | "addresses" | "profile" | "settings";
/** Set when the user deliberately signs out / deletes, so the auth guard doesn't bounce them to /login */
const leaving = { current: false };
const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "bookings", label: "My bookings", icon: CalendarDays },
  { key: "addresses", label: "Saved addresses", icon: MapPin },
  { key: "profile", label: "Personal info", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
];

export function AccountDashboard() {
  const hydrated = useHydrated();
  const customer = useCurrentCustomer();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "overview") as Tab;
  const { info } = useToast();

  useEffect(() => {
    if (customer) leaving.current = false;
    if (hydrated && !customer && !leaving.current) router.replace(`/login?next=${encodeURIComponent("/account")}`);
  }, [hydrated, customer, router]);

  if (!hydrated || !customer) return <Spinner label="Checking your session" />;

  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  return (
    <div className="bg-cream-2">
      <div className="container-site py-8 lg:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-ink font-display text-xl font-extrabold text-white">{initials(customer.name)}</span>
            <div>
              <p className="text-sm text-muted">My account</p>
              <h1 className="text-3xl font-extrabold">Hi, {customer.name.split(" ")[0]} 👋</h1>
            </div>
          </div>
          <LinkButton href="/booking" icon={<Plus className="size-4" />}>
            New booking
          </LinkButton>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="min-w-0">
            <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:bg-white lg:p-3 lg:shadow-soft">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-current={tab === t.key ? "page" : undefined}
                  className={cn("flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition lg:rounded-2xl lg:py-3", tab === t.key ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-cream lg:bg-transparent")}
                >
                  <t.icon className="size-4" /> {t.label}
                </button>
              ))}
              <button
                onClick={() => {
                  leaving.current = true;
                  logoutCustomer();
                  info("Signed out");
                  router.push("/");
                }}
                className="flex shrink-0 items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5 lg:rounded-2xl lg:bg-transparent lg:py-3"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </nav>
          </aside>
          <div className="min-w-0">
            {tab === "overview" && <Overview onTab={setTab} />}
            {tab === "bookings" && <Bookings initialRef={params.get("booking")} />}
            {tab === "addresses" && <Addresses />}
            {tab === "profile" && <Profile />}
            {tab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function useMyBookings() {
  const customer = useCurrentCustomer();
  const bookings = useStore("bookings");
  if (!customer) return [];
  return bookings.filter((b) => b.customerId === customer.id || b.customer.email.toLowerCase() === customer.email.toLowerCase());
}

function Overview({ onTab }: { onTab: (t: Tab) => void }) {
  const mine = useMyBookings();
  const customer = useCurrentCustomer()!;
  const upcoming = mine.filter(isUpcoming).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const completed = mine.filter((b) => b.status === "completed");
  const spent = completed.reduce((s, b) => s + b.pricing.total, 0);
  const next = upcoming[0];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming cleans" value={upcoming.length} icon={CalendarDays} />
        <StatCard label="Completed cleans" value={completed.length} icon={CheckCircle2} tone="mint" />
        <StatCard label="Total spent" value={gbp2(spent)} icon={Wallet} tone="sun" hint="Completed bookings only" />
      </div>
      <Panel title="Your next clean" action={<Button variant="soft" size="sm" onClick={() => onTab("bookings")}>All bookings</Button>}>
        {next ? (
          <div className="flex flex-col gap-4 rounded-2xl bg-cream-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-extrabold">{next.serviceName}</p>
              <p className="mt-1 text-ink-soft">
                {formatDate(next.date, { weekday: "long", day: "numeric", month: "long" })} at {next.time} · {next.options.hours}h
              </p>
              <p className="text-sm text-muted">
                {next.address.street}, {next.address.postcode}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={next.status} />
              <LinkButton href={`/account?tab=bookings&booking=${next.ref}`} size="sm" variant="dark">
                View details
              </LinkButton>
            </div>
          </div>
        ) : (
          <EmptyState icon={<CalendarDays className="size-6" />} title="No upcoming cleans" description="Book your next clean in under two minutes." action={<LinkButton href="/booking">Book a clean</LinkButton>} />
        )}
      </Panel>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Quick actions">
          <div className="grid gap-2">
            <LinkButton href={bookingHref({ service: "residential-cleaning", postcode: customer.addresses[0]?.postcode })} variant="soft" className="justify-start">
              <Sparkles className="size-4 text-brand" /> Book a residential clean
            </LinkButton>
            <LinkButton href={bookingHref({ service: "deep-cleaning", postcode: customer.addresses[0]?.postcode })} variant="soft" className="justify-start">
              <Sparkles className="size-4 text-brand" /> Book a deep clean
            </LinkButton>
            <Button variant="soft" className="justify-start" onClick={() => onTab("addresses")}>
              <MapPin className="size-4 text-brand" /> Manage addresses
            </Button>
          </div>
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3">
            {[...mine]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 4)
              .map((b) => (
                <li key={b.ref} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{b.serviceName}</span>
                    <span className="text-muted">{formatDate(b.date)}</span>
                  </span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            {mine.length === 0 && <li className="text-sm text-muted">Nothing yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Bookings({ initialRef }: { initialRef: string | null }) {
  const mine = useMyBookings();
  const customer = useCurrentCustomer()!;
  const { success } = useToast();
  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [viewRef, setViewRef] = useState<string | null>(initialRef);
  const [cancelRef, setCancelRef] = useState<string | null>(null);
  const [rescheduleRef, setRescheduleRef] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<Booking | null>(null);
  const reviews = useStore("reviews");
  const services = useStore("services");

  const lists = {
    upcoming: mine.filter(isUpcoming).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    past: mine.filter((b) => b.status === "completed" || (b.status !== "cancelled" && !isUpcoming(b))).sort((a, b) => b.date.localeCompare(a.date)),
    cancelled: mine.filter((b) => b.status === "cancelled").sort((a, b) => b.date.localeCompare(a.date)),
  };
  const list = lists[filter];
  const viewing = mine.find((b) => b.ref === viewRef);
  const cancelling = mine.find((b) => b.ref === cancelRef);
  const rescheduling = mine.find((b) => b.ref === rescheduleRef);
  const terms = cancelling ? cancellationTerms(cancelling) : null;

  return (
    <Panel>
      <PillTabs
        className="mb-6"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: "upcoming", label: "Upcoming", count: lists.upcoming.length },
          { value: "past", label: "Previous", count: lists.past.length },
          { value: "cancelled", label: "Cancelled", count: lists.cancelled.length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={<CalendarX className="size-6" />} title={`No ${filter} bookings`} description={filter === "upcoming" ? "Your next sparkle is just a few taps away." : "Nothing to show here yet."} action={filter === "upcoming" ? <LinkButton href="/booking">Book a clean</LinkButton> : undefined} />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => {
            const reviewed = reviews.some((r) => r.id === `rev-${b.ref}`);
            return (
              <li key={b.ref} className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid w-14 shrink-0 place-items-center rounded-2xl bg-cream py-2 text-center">
                    <span className="text-xs font-semibold text-muted uppercase">{formatDate(b.date, { month: "short" })}</span>
                    <span className="font-display text-2xl leading-none font-extrabold">{b.date.slice(8)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold">{b.serviceName}</p>
                    <p className="text-sm text-ink-soft">
                      {b.time} · {b.options.hours}h · {gbp2(b.pricing.total)}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {b.ref} · {b.address.postcode}
                    </p>
                    {b.status === "cancelled" && b.refundPct !== undefined && (
                      <p className="mt-1 text-xs font-semibold text-ink-soft">
                        {b.refundPct === 100 ? `Full refund · ${gbp2(b.refundAmount ?? 0)}` : b.refundPct > 0 ? `${b.refundPct}% refund · ${gbp2(b.refundAmount ?? 0)} back, ${gbp2(b.cancellationFee ?? 0)} fee` : `No refund · ${gbp2(b.cancellationFee ?? 0)} charged`}
                      </p>
                    )}
                    {b.rescheduledFrom && b.status !== "cancelled" && <p className="mt-1 text-xs text-ink-soft">Rescheduled from {formatDate(b.rescheduledFrom.date, { day: "numeric", month: "short" })} at {b.rescheduledFrom.time}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={b.status} />
                  <Button size="sm" variant="soft" onClick={() => setViewRef(b.ref)}>
                    Details
                  </Button>
                  {isUpcoming(b) && (
                    <Button size="sm" variant="ghost" icon={<CalendarClock className="size-4" />} onClick={() => setRescheduleRef(b.ref)}>
                      Reschedule
                    </Button>
                  )}
                  {isUpcoming(b) && (
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => setCancelRef(b.ref)}>
                      Cancel
                    </Button>
                  )}
                  {b.status === "completed" && !reviewed && (
                    <Button size="sm" variant="ghost" icon={<Star className="size-4" />} onClick={() => setReviewFor(b)}>
                      Review
                    </Button>
                  )}
                  {b.status === "completed" && reviewed && <Badge tone="success">Reviewed</Badge>}
                  {!isUpcoming(b) && (
                    <LinkButton size="sm" variant="dark" href={bookingHref({ service: services.find((s) => s.id === b.serviceId)?.slug, postcode: b.address.postcode })}>
                      Book again
                    </LinkButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!viewing} onClose={() => setViewRef(null)} title="Booking details" size="lg" footer={viewing && isUpcoming(viewing) ? <><Button variant="outline" onClick={() => { setRescheduleRef(viewing.ref); setViewRef(null); }}>Reschedule</Button><Button variant="danger" onClick={() => { setCancelRef(viewing.ref); setViewRef(null); }}>Cancel booking</Button></> : undefined}>
        {viewing && <BookingDetails booking={viewing} compact />}
      </Modal>

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelRef(null)}
        title="Cancel this booking?"
        description={
          cancelling && terms
            ? `${cancelling.serviceName} on ${formatDate(cancelling.date)} at ${cancelling.time} (${gbp2(cancelling.pricing.total)}). ${
                terms.pct === 100
                  ? `It's more than ${POLICY.fullRefundHours} hours away, so you'll get a full refund of ${gbp2(terms.refund)}.`
                  : terms.pct > 0
                    ? `It's less than ${POLICY.fullRefundHours} hours away, so you'll get a ${terms.pct}% refund of ${gbp2(terms.refund)} and ${gbp2(terms.fee)} will be kept as a late-cancellation fee.`
                    : `It's less than ${POLICY.noRefundHours} hours away, so no refund is due and the full ${gbp2(terms.fee)} will be charged.`
              } (Demo: no money moves.)`
            : ""
        }
        confirmLabel="Yes, cancel it"
        onConfirm={async () => {
          await sleep(500);
          if (!cancelling) return;
          const t = cancelBooking(cancelling.ref);
          success("Booking cancelled", t ? (t.pct === 100 ? `Full refund of ${gbp2(t.refund)} (demo).` : t.pct > 0 ? `${t.pct}% refund of ${gbp2(t.refund)} (demo).` : "No refund is due (demo).") : undefined);
        }}
      />

      {rescheduling && <RescheduleModal booking={rescheduling} onClose={() => setRescheduleRef(null)} onCancelInstead={() => { setRescheduleRef(null); setCancelRef(rescheduling.ref); }} />}

      <ReviewModal booking={reviewFor} customerName={customer.name} onClose={() => setReviewFor(null)} />
    </Panel>
  );
}

function RescheduleModal({ booking, onClose, onCancelInstead }: { booking: Booking; onClose: () => void; onCancelInstead: () => void }) {
  const { success } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const allowed = canReschedule(booking);

  if (!allowed) {
    return (
      <Modal open onClose={onClose} title="Rescheduling is closed" size="sm" footer={<><Button variant="ghost" onClick={onClose}>Keep booking</Button><Button variant="danger" onClick={onCancelInstead}>Cancel instead</Button></>}>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Bookings can only be rescheduled more than <strong className="text-ink">{POLICY.rescheduleHours} hours</strong> before the start time. Your {booking.serviceName.toLowerCase()} on {formatDate(booking.date)} at {booking.time} is less than {POLICY.rescheduleHours} hours away.
        </p>
        <PolicyList className="mt-4" />
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Reschedule booking"
      description={`Currently ${formatDate(booking.date)} at ${booking.time} · ${booking.ref}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep current time
          </Button>
          <Button
            loading={saving}
            disabled={!date || !time}
            onClick={async () => {
              setSaving(true);
              await sleep(400);
              const r = rescheduleBooking(booking.ref, date, time);
              setSaving(false);
              if (!r.ok) return setError(r.error);
              success("Booking rescheduled", `${formatDate(date)} at ${time}`);
              onClose();
            }}
          >
            Confirm new time
          </Button>
        </>
      }
    >
      <p className="mb-5 rounded-2xl bg-cream-2 px-4 py-3 text-sm text-ink-soft">Free to reschedule — available until {POLICY.rescheduleHours} hours before your current start time. Your price stays the same.</p>
      <p className="mb-3 font-extrabold">1. Choose a new date</p>
      <BookingCalendar value={date} onChange={(d) => { setDate(d); setTime(""); setError(""); }} />
      {date && (
        <>
          <p className="mt-6 mb-3 font-extrabold">2. Choose a start time</p>
          <TimeGrid date={date} primary={time} alts={[]} onPick={(t) => { setTime(t === time ? "" : t); setError(""); }} />
        </>
      )}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
    </Modal>
  );
}

export function PolicyList({ className }: { className?: string }) {
  return (
    <ul className={cn("space-y-1.5 text-sm text-ink-soft", className)}>
      {POLICY_LINES.map((l) => (
        <li key={l} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" /> {l}
        </li>
      ))}
    </ul>
  );
}

function ReviewModal({ booking, customerName, onClose }: { booking: Booking | null; customerName: string; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const pros = useStore("pros");
  const { success } = useToast();
  if (!booking) return null;
  const pro = pros.find((p) => p.id === booking.proId);
  return (
    <Modal
      open
      onClose={onClose}
      title="Rate your clean"
      description={`${booking.serviceName} · ${formatDate(booking.date)}`}
      footer={
        <Button
          onClick={() => {
            if (title.trim().length < 3 || text.trim().length < 10) return setError("Add a short title and at least 10 characters of feedback.");
            insert("reviews", { id: `rev-${booking.ref}`, name: `${customerName.split(" ")[0]} ${customerName.split(" ")[1]?.[0] ?? ""}.`, rating, title: title.trim(), text: text.trim(), service: booking.serviceName, city: booking.address.city, date: new Date().toISOString().slice(0, 10), proName: pro ? `${pro.name.split(" ")[0]} ${pro.name.split(" ")[1]?.[0]}.` : "Ginnara pro", proId: booking.proId, published: false });
            notify({ type: "review", title: "Review awaiting approval", body: `${rating}★ review for ${booking.serviceName} from ${customerName}.`, section: "reviews" });
            success("Thanks for your review!", "It'll appear once approved by our team.");
            setTitle("");
            setText("");
            setError("");
            onClose();
          }}
        >
          Submit review
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
              <Star className={cn("size-9 transition", n <= rating ? "fill-sun text-sun" : "fill-line text-line")} />
            </button>
          ))}
        </div>
        <Input label="Title" name="review-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spotless kitchen!" />
        <Textarea label="Your review" name="review-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="What did your pro do well?" error={error} />
      </div>
    </Modal>
  );
}

function Addresses() {
  const customer = useCurrentCustomer()!;
  const { success } = useToast();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const save = (list: Address[]) => patch("customers", (c) => c.id === customer.id, { addresses: list });

  return (
    <Panel title="Saved addresses" action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add address</Button>}>
      {customer.addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="size-6" />} title="No saved addresses" description="Save your home to book even faster." action={<Button onClick={() => setEditing("new")}>Add address</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {customer.addresses.map((a, i) => (
            <div key={a.id} className="rounded-2xl border border-line p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-2 font-extrabold">
                  <Home className="size-4 text-brand" /> {a.label}
                </p>
                {i === 0 ? <Badge tone="brand">Default</Badge> : (
                  <button className="text-xs font-semibold text-brand hover:underline" onClick={() => { save([a, ...customer.addresses.filter((x) => x.id !== a.id)]); success("Default address updated"); }}>
                    Make default
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {a.unit && <>{a.unit}, </>}
                {a.street}
                <br />
                {a.city} {a.postcode}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="soft" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(a)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-3.5" />} onClick={() => setDeleting(a)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <AddressModal
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            if (editing === "new") save([...customer.addresses, { ...v, unit: v.unit ?? "", id: uid("adr") }]);
            else save(customer.addresses.map((a) => (a.id === editing.id ? { ...a, ...v, unit: v.unit ?? "" } : a)));
            success(editing === "new" ? "Address added" : "Address updated");
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this address?"
        description={deleting ? `${deleting.label}: ${deleting.street}, ${deleting.postcode}` : ""}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) save(customer.addresses.filter((a) => a.id !== deleting.id));
          success("Address deleted");
        }}
      />
    </Panel>
  );
}

function AddressModal({ initial, onClose, onSave }: { initial?: Address; onClose: () => void; onSave: (v: AddressValues) => void }) {
  const { register, handleSubmit, formState } = useForm<AddressValues>({ resolver: zodResolver(addressSchema), defaultValues: initial ?? { label: "Home", postcode: "", street: "", city: "", unit: "" } });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit address" : "Add an address"} footer={<Button onClick={handleSubmit(onSave)}>Save address</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSave)} noValidate>
        <Input label="Label" placeholder="Home, Office…" wrapClassName="sm:col-span-2" error={formState.errors.label?.message} {...register("label")} />
        <Input label="Postcode" className="uppercase" error={formState.errors.postcode?.message} {...register("postcode")} />
        <Input label="Town or city" error={formState.errors.city?.message} {...register("city")} />
        <Input label="Street address" wrapClassName="sm:col-span-2" error={formState.errors.street?.message} {...register("street")} />
        <Input label="Flat / unit" optional wrapClassName="sm:col-span-2" {...register("unit")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

const profileSchema = z.object({ name: nameField, email: emailField, phone: phoneField });

function Profile() {
  const customer = useCurrentCustomer()!;
  const customers = useStore("customers");
  const { success } = useToast();
  const { register, handleSubmit, formState, setError, reset } = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { name: customer.name, email: customer.email, phone: customer.phone } });
  return (
    <Panel title="Personal information">
      <form
        noValidate
        className="grid max-w-2xl gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(async (v) => {
          if (customers.some((c) => c.id !== customer.id && c.email.toLowerCase() === v.email.toLowerCase())) return setError("email", { message: "Another account already uses this email" });
          await sleep(500);
          patch("customers", (c) => c.id === customer.id, v);
          reset(v);
          success("Profile saved");
        })}
      >
        <Input label="Full name" wrapClassName="sm:col-span-2" error={formState.errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={formState.errors.email?.message} {...register("email")} />
        <Input label="Phone" type="tel" error={formState.errors.phone?.message} {...register("phone")} />
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" loading={formState.isSubmitting} disabled={!formState.isDirty}>
            Save changes
          </Button>
          {!formState.isDirty && <span className="text-sm text-muted">No unsaved changes</span>}
        </div>
      </form>
      <p className="mt-6 text-xs text-muted">Member since {formatDate(customer.createdAt.slice(0, 10), { month: "long", year: "numeric" })}</p>
    </Panel>
  );
}

const pwSchema = z.object({ current: z.string().min(1, "Enter your current password"), password: passwordField, confirm: z.string() }).refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

function SettingsTab() {
  const customer = useCurrentCustomer()!;
  const router = useRouter();
  const { success } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const pw = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema) });
  return (
    <div className="space-y-6">
      <Panel title="Notifications">
        <div className="divide-y divide-line">
          <div className="py-2">
            <Toggle checked={customer.smsReminders} onChange={(v) => { patch("customers", (c) => c.id === customer.id, { smsReminders: v }); success("Preference saved"); }} label="SMS reminders" description="A text the day before each clean" />
          </div>
          <div className="py-2">
            <Toggle checked={customer.marketing} onChange={(v) => { patch("customers", (c) => c.id === customer.id, { marketing: v }); success("Preference saved"); }} label="Offers & cleaning tips" description="Monthly email, unsubscribe any time" />
          </div>
        </div>
      </Panel>
      <Panel title="Change password">
        <form
          noValidate
          className="grid max-w-2xl gap-5 sm:grid-cols-3"
          onSubmit={pw.handleSubmit(async (v) => {
            if (v.current !== customer.password) return pw.setError("current", { message: "Current password is incorrect" });
            await sleep(500);
            patch("customers", (c) => c.id === customer.id, { password: v.password });
            pw.reset({ current: "", password: "", confirm: "" });
            success("Password updated");
          })}
        >
          <Input label="Current" type="password" autoComplete="current-password" error={pw.formState.errors.current?.message} {...pw.register("current")} />
          <Input label="New" type="password" autoComplete="new-password" error={pw.formState.errors.password?.message} {...pw.register("password")} />
          <Input label="Confirm" type="password" autoComplete="new-password" error={pw.formState.errors.confirm?.message} {...pw.register("confirm")} />
          <div className="sm:col-span-3">
            <Button type="submit" variant="dark" loading={pw.formState.isSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Danger zone">
        <p className="text-sm text-ink-soft">Deleting your account removes your profile and saved addresses from this browser. Booking records are kept for the demo admin.</p>
        <Button variant="danger" className="mt-4" icon={<Trash2 className="size-4" />} onClick={() => setDeleteOpen(true)}>
          Delete account
        </Button>
      </Panel>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        description="This can't be undone. You'll be signed out immediately."
        confirmLabel="Delete my account"
        onConfirm={async () => {
          await sleep(500);
          leaving.current = true;
          logoutCustomer();
          removeWhere("customers", (c) => c.id === customer.id);
          update("bookings", (bs) => bs.map((b) => (b.customerId === customer.id ? { ...b, customerId: undefined } : b)));
          success("Account deleted");
          router.push("/");
        }}
      />
    </div>
  );
}
