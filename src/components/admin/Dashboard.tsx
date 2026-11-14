"use client";

import { ArrowRight, CalendarDays, CalendarPlus, Inbox, PoundSterling, UserCog, Users } from "lucide-react";
import Link from "next/link";
import type { AdminRole } from "@/types";
import { Button } from "@/components/common/Button";
import { EmptyState, StatusBadge } from "@/components/common/ui";
import { BarChart, DonutChart } from "@/components/dashboard/Charts";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { canAccess, type AdminSection } from "@/lib/admin";
import { formatDate, formatDateTime, gbp, gbp2, toISODate } from "@/lib/utils";

export const STATUS_COLORS = { pending: "#e8a700", confirmed: "#3a8fd0", completed: "#1f9d61", cancelled: "#d93a3a" } as const;

export function Dashboard({ onTab, role }: { onTab: (t: AdminSection) => void; role: AdminRole }) {
  const bookings = useStore("bookings");
  const customers = useStore("customers");
  const pros = useStore("pros");
  const contacts = useStore("contacts");
  const today = toISODate(new Date());

  const live = bookings.filter((b) => b.status !== "cancelled");
  const revenue = live.reduce((s, b) => s + b.pricing.total, 0);
  const thisMonth = toISODate(new Date()).slice(0, 7);
  const monthRevenue = live.filter((b) => b.date.startsWith(thisMonth)).reduce((s, b) => s + b.pricing.total, 0);
  const todays = bookings.filter((b) => b.date === today && b.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = bookings.filter((b) => b.date > today && (b.status === "pending" || b.status === "confirmed")).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const newEnquiries = contacts.filter((c) => c.status === "new" && c.type !== "newsletter");
  const statusCounts = (["pending", "confirmed", "completed", "cancelled"] as const).map((s) => ({ label: s, value: bookings.filter((b) => b.status === s).length, color: STATUS_COLORS[s] }));

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    return d;
  });
  const revenueData = months.map((d) => {
    const key = toISODate(d).slice(0, 7);
    return { label: d.toLocaleDateString("en-GB", { month: "short" }), value: Math.round(live.filter((b) => b.date.startsWith(key)).reduce((s, b) => s + b.pricing.total, 0)) };
  });

  const quick: { label: string; section: AdminSection; icon: typeof Users }[] = [
    { label: "Manage bookings", section: "bookings", icon: CalendarDays },
    { label: "Review cleaners", section: "pros", icon: UserCog },
    { label: "Answer enquiries", section: "enquiries", icon: Inbox },
    { label: "View reports", section: "reports", icon: PoundSterling },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings" value={bookings.length} icon={CalendarDays} hint={`${bookings.filter((b) => b.status === "pending").length} awaiting confirmation`} />
        <StatCard label="Revenue (all time)" value={gbp(Math.round(revenue))} icon={PoundSterling} tone="mint" hint={`${gbp(Math.round(monthRevenue))} this month · demo data`} />
        <StatCard label="Customers" value={customers.length} icon={Users} tone="sky" hint={`${customers.filter((c) => c.status === "active").length} active accounts`} />
        <StatCard label="Professionals" value={pros.length} icon={UserCog} tone="sun" hint={`${pros.filter((p) => p.status === "pending").length} waiting for approval`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={`Today's cleans (${todays.length})`} action={<Button size="sm" variant="soft" onClick={() => onTab("bookings")}>Open calendar</Button>}>
          {todays.length === 0 ? (
            <div>
              <p className="mb-4 text-sm text-ink-soft">No cleans scheduled for today. Next up:</p>
              <ul className="divide-y divide-line">
                {upcoming.slice(0, 4).map((b) => (
                  <li key={b.ref} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{b.serviceName}</span>
                      <span className="text-muted">
                        {formatDate(b.date, { weekday: "short", day: "numeric", month: "short" })} · {b.time} · {b.customer.name}
                      </span>
                    </span>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
                {upcoming.length === 0 && <li className="py-3 text-sm text-muted">Nothing scheduled.</li>}
              </ul>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {todays.map((b) => (
                <li key={b.ref} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-display text-lg font-extrabold">{b.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{b.serviceName}</span>
                    <span className="text-muted">
                      {b.customer.name} · {b.address.postcode}
                    </span>
                  </span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Booking status">
          <DonutChart centerLabel="bookings" data={statusCounts} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Revenue — last 6 months" action={canAccess(role, "reports") && <Button size="sm" variant="soft" onClick={() => onTab("reports")}>Full report</Button>}>
          <BarChart data={revenueData} format={(n) => `£${n.toLocaleString()}`} height={230} color="#2e5ea8" />
          <p className="mt-2 text-xs text-muted">Based on bookings stored in this demo (excludes cancelled).</p>
        </Panel>
        <Panel title={`Enquiries to answer (${newEnquiries.length})`} action={<Button size="sm" variant="soft" onClick={() => onTab("enquiries")}>Inbox</Button>}>
          {newEnquiries.length === 0 ? (
            <EmptyState icon={<Inbox className="size-6" />} title="All caught up" description="New contact messages and quote requests appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {newEnquiries.slice(0, 5).map((c) => (
                <li key={c.id} className="py-3 text-sm">
                  <p className="font-semibold">
                    {c.name} <span className="font-normal text-muted">· {c.topic}</span>
                  </p>
                  <p className="truncate text-ink-soft">{c.message}</p>
                  <p className="text-xs text-muted">{formatDateTime(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Latest bookings" action={<Button size="sm" variant="soft" onClick={() => onTab("bookings")}>All bookings</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <tbody className="divide-y divide-line">
                {[...bookings]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 6)
                  .map((b) => (
                    <tr key={b.ref}>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{b.customer.name}</p>
                        <p className="text-xs text-muted">{b.ref}</p>
                      </td>
                      <td className="py-3 pr-3 text-ink-soft">{b.serviceName}</td>
                      <td className="py-3 pr-3 text-ink-soft">{formatDate(b.date, { day: "numeric", month: "short" })}</td>
                      <td className="py-3 pr-3 font-semibold">{gbp2(b.pricing.total)}</td>
                      <td className="py-3 text-right">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Quick actions">
          <div className="grid gap-2">
            {quick
              .filter((q) => canAccess(role, q.section))
              .map((q) => (
                <button key={q.label} onClick={() => onTab(q.section)} className="flex items-center justify-between rounded-2xl bg-cream-2 px-4 py-3 text-left text-sm font-semibold hover:bg-cream">
                  <span className="flex items-center gap-3">
                    <q.icon className="size-5 text-brand" /> {q.label}
                  </span>
                  <ArrowRight className="size-4 text-muted" />
                </button>
              ))}
            <Link href="/booking" target="_blank" className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-black">
              <span className="flex items-center gap-3">
                <CalendarPlus className="size-5 text-sun" /> Create a booking for a customer
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
