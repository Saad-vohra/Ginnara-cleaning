"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Download, Eye, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Booking, BookingStatus } from "@/types";
import { Button, LinkButton } from "@/components/common/Button";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, PillTabs } from "@/components/common/ui";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { downloadCsv, logActivity, PAYMENT_LABEL, paymentStatusOf } from "@/lib/admin";
import { patch } from "@/lib/storage";
import { cn, formatDate, gbp2, toISODate } from "@/lib/utils";
import { STATUS_COLORS } from "./Dashboard";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export function setStatus(b: Booking, status: BookingStatus) {
  patch("bookings", (x) => x.ref === b.ref, status === "cancelled" ? { status, cancelledAt: new Date().toISOString() } : { status });
  logActivity("Bookings", `Changed status to ${status}`, b.ref);
}

function ProSelect({ b }: { b: Booking }) {
  const pros = useStore("pros");
  const { success } = useToast();
  return (
    <select
      aria-label={`Assign cleaner for ${b.ref}`}
      value={b.proId ?? ""}
      onChange={(e) => {
        const pro = pros.find((p) => p.id === e.target.value);
        patch("bookings", (x) => x.ref === b.ref, { proId: e.target.value || undefined });
        logActivity("Bookings", pro ? `Assigned ${pro.name}` : "Unassigned cleaner", b.ref);
        success(pro ? `${pro.name} assigned` : "Cleaner unassigned", b.ref);
      }}
      className="h-9 max-w-40 rounded-full border border-line bg-white px-3 text-xs font-semibold"
    >
      <option value="">Unassigned</option>
      {pros
        .filter((p) => p.status === "approved" || p.id === b.proId)
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.status !== "approved" ? ` (${p.status})` : ""}
          </option>
        ))}
    </select>
  );
}

function StatusSelect({ b }: { b: Booking }) {
  const { success } = useToast();
  return (
    <select
      aria-label={`Status for ${b.ref}`}
      value={b.status}
      onChange={(e) => {
        setStatus(b, e.target.value as BookingStatus);
        success("Booking updated", `${b.ref} → ${e.target.value}`);
      }}
      className="h-9 rounded-full border border-line bg-white px-3 text-xs font-semibold capitalize"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

/* ---------------- Month calendar ---------------- */
function BookingCalendar({ bookings, onOpen }: { bookings: Booking[]; onOpen: (b: Booking) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = toISODate(new Date());
  const cells = useMemo(() => {
    const offset = (cursor.getDay() + 6) % 7;
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - offset);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { iso: toISODate(d), inMonth: d.getMonth() === cursor.getMonth() };
    });
  }, [cursor]);
  const byDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach((b) => m.set(b.date, [...(m.get(b.date) ?? []), b].sort((x, y) => x.time.localeCompare(y.time))));
    return m;
  }, [bookings]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="grid size-10 place-items-center rounded-full hover:bg-cream">
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="font-display text-xl font-extrabold">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          <button className="text-xs font-semibold text-brand hover:underline" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Today
          </button>
        </div>
        <button aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="grid size-10 place-items-center rounded-full hover:bg-cream">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-7 overflow-hidden rounded-2xl border border-line">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="border-b border-line bg-cream-2 py-2 text-center text-xs font-bold text-muted uppercase">
              {d}
            </div>
          ))}
          {cells.map(({ iso, inMonth }) => {
            const items = byDay.get(iso) ?? [];
            return (
              <div key={iso} className={cn("min-h-28 border-r border-b border-line p-1.5 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-cream-2/60")}>
                <p className={cn("mb-1 text-right text-xs font-semibold", iso === today ? "text-brand" : inMonth ? "text-ink" : "text-muted/60")}>{Number(iso.slice(8))}</p>
                <div className="space-y-1">
                  {items.slice(0, 3).map((b) => (
                    <button
                      key={b.ref}
                      onClick={() => onOpen(b)}
                      className="block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold text-white hover:brightness-110"
                      style={{ background: STATUS_COLORS[b.status] }}
                      title={`${b.time} ${b.serviceName} — ${b.customer.name}`}
                    >
                      {b.time} {b.serviceName.replace(" Cleaning", "")}
                    </button>
                  ))}
                  {items.length > 3 && <p className="px-1 text-[11px] font-semibold text-muted">+{items.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className="size-3 rounded" style={{ background: STATUS_COLORS[s] }} /> {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Section ---------------- */
export function BookingsAdmin() {
  const bookings = useStore("bookings");
  const services = useStore("services");
  const { success } = useToast();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [service, setService] = useState("all");
  const [viewingRef, setViewingRef] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ b: Booking; action: "cancel" | "refund" } | null>(null);

  const rows = bookings
    .filter((b) => (filter === "all" || b.status === filter) && (service === "all" || b.serviceId === service))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const viewing = bookings.find((b) => b.ref === viewingRef) ?? null;

  const exportCsv = () => {
    downloadCsv(`ginnara-bookings-${toISODate(new Date())}.csv`, [
      ["Reference", "Service", "Date", "Time", "Hours", "Customer", "Email", "Phone", "Postcode", "Status", "Payment", "Total (£)"],
      ...rows.map((b) => [b.ref, b.serviceName, b.date, b.time, b.options.hours, b.customer.name, b.customer.email, b.customer.phone, b.address.postcode, b.status, PAYMENT_LABEL[paymentStatusOf(b)], b.pricing.total.toFixed(2)]),
    ]);
    logActivity("Bookings", `Exported ${rows.length} bookings to CSV`);
    success("CSV downloaded", `${rows.length} bookings`);
  };

  return (
    <Panel>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          value={filter}
          onChange={setFilter}
          tabs={(["all", ...STATUSES] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length }))}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter by service" value={service} onChange={(e) => setService(e.target.value)} className="h-10 rounded-full border border-line bg-white px-3 text-sm font-semibold">
            <option value="all">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-full bg-cream p-1">
            <button aria-pressed={view === "list"} onClick={() => setView("list")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", view === "list" && "bg-white shadow-soft")}>
              <List className="size-4" /> List
            </button>
            <button aria-pressed={view === "calendar"} onClick={() => setView("calendar")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", view === "calendar" && "bg-white shadow-soft")}>
              <CalendarDays className="size-4" /> Calendar
            </button>
          </div>
        </div>
      </div>

      {view === "calendar" ? (
        <BookingCalendar bookings={rows} onOpen={(b) => setViewingRef(b.ref)} />
      ) : (
        <DataTable
          rows={rows}
          rowKey={(b) => b.ref}
          pageSize={10}
          searchText={(b) => `${b.ref} ${b.customer.name} ${b.customer.email} ${b.serviceName} ${b.address.postcode}`}
          searchPlaceholder="Search ref, customer, postcode"
          toolbar={
            <>
              <Button size="sm" variant="soft" icon={<Download className="size-4" />} onClick={exportCsv}>
                Export CSV
              </Button>
              <LinkButton size="sm" href="/booking" target="_blank" icon={<Plus className="size-4" />}>
                New booking
              </LinkButton>
            </>
          }
          columns={[
            { key: "ref", header: "Booking", sortValue: (b) => b.createdAt, render: (b) => <span><span className="block font-semibold">{b.ref}</span><span className="text-xs text-muted">{b.serviceName}</span></span> },
            { key: "customer", header: "Customer", sortValue: (b) => b.customer.name, render: (b) => <span>{b.customer.name}<br /><span className="text-xs text-muted">{b.address.postcode}</span></span> },
            { key: "date", header: "Date", sortValue: (b) => b.date + b.time, render: (b) => <span>{formatDate(b.date, { day: "numeric", month: "short" })}<br /><span className="text-xs text-muted">{b.time} · {b.options.hours}h</span></span> },
            { key: "total", header: "Total", sortValue: (b) => b.pricing.total, render: (b) => <span><span className="font-semibold">{gbp2(b.pricing.total)}</span><br /><span className="text-xs text-muted">{PAYMENT_LABEL[paymentStatusOf(b)]}</span></span> },
            { key: "pro", header: "Cleaner", render: (b) => <ProSelect b={b} /> },
            { key: "status", header: "Status", render: (b) => <StatusSelect b={b} /> },
            { key: "view", header: "", className: "text-right", render: (b) => <IconButton label="View booking" onClick={() => setViewingRef(b.ref)}><Eye className="size-4" /></IconButton> },
          ]}
        />
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewingRef(null)}
        title={viewing ? `Booking ${viewing.ref}` : ""}
        size="lg"
        footer={
          viewing && (
            <>
              {viewing.status !== "cancelled" && (
                <Button variant="ghost" className="text-danger" onClick={() => setConfirm({ b: viewing, action: "cancel" })}>
                  Cancel booking
                </Button>
              )}
              {paymentStatusOf(viewing) === "paid" && (
                <Button variant="outline" onClick={() => setConfirm({ b: viewing, action: "refund" })}>
                  Refund {gbp2(viewing.pricing.total)}
                </Button>
              )}
              {viewing.status === "pending" && (
                <Button
                  onClick={() => {
                    setStatus(viewing, "confirmed");
                    success("Booking confirmed");
                  }}
                >
                  Confirm booking
                </Button>
              )}
              {viewing.status === "confirmed" && (
                <Button
                  onClick={() => {
                    setStatus(viewing, "completed");
                    success("Marked as completed");
                  }}
                >
                  Mark completed
                </Button>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream-2 p-4 text-sm">
              <span className="font-semibold">Status</span> <StatusSelect b={viewing} />
              <span className="ml-2 font-semibold">Cleaner</span> <ProSelect b={viewing} />
              <Badge tone={paymentStatusOf(viewing) === "refunded" ? "danger" : paymentStatusOf(viewing) === "paid" ? "success" : "neutral"}>Payment: {PAYMENT_LABEL[paymentStatusOf(viewing)]}</Badge>
            </div>
            <BookingDetails booking={viewing} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "refund" ? "Refund this booking?" : "Cancel this booking?"}
        description={
          confirm
            ? confirm.action === "refund"
              ? `${gbp2(confirm.b.pricing.total)} will be marked as refunded to ${confirm.b.customer.name} (simulated — no money moves).`
              : `${confirm.b.serviceName} for ${confirm.b.customer.name} on ${formatDate(confirm.b.date)} will be cancelled.`
            : ""
        }
        confirmLabel={confirm?.action === "refund" ? "Refund" : "Cancel booking"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.action === "refund") {
            patch("bookings", (x) => x.ref === confirm.b.ref, { paymentStatus: "refunded", refundedAt: new Date().toISOString() });
            logActivity("Payments", `Refunded ${gbp2(confirm.b.pricing.total)}`, confirm.b.ref);
            success("Refund recorded", confirm.b.ref);
          } else {
            setStatus(confirm.b, "cancelled");
            success("Booking cancelled", confirm.b.ref);
          }
        }}
      />
    </Panel>
  );
}
