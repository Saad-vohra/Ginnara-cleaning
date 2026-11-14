"use client";

import { CalendarDays, Clock, Home, KeyRound, Mail, MapPin, Phone, Repeat, Sparkles, StickyNote, User } from "lucide-react";
import type { Booking } from "@/types";
import { Photo, StatusBadge } from "@/components/common/ui";
import { PriceLines, freqLabel } from "./PriceSummary";
import { extraById } from "@/lib/extras";
import { useStore } from "@/hooks/useStore";
import { formatDate, formatDateTime } from "@/lib/utils";

export function BookingDetails({ booking, compact }: { booking: Booking; compact?: boolean }) {
  const services = useStore("services");
  const pros = useStore("pros");
  const service = services.find((s) => s.id === booking.serviceId);
  const pro = pros.find((p) => p.id === booking.proId);
  const o = booking.options;
  const row = "flex items-start gap-3 text-[15px]";
  const icon = "mt-0.5 size-4.5 shrink-0 text-brand";
  const endHour = Number(booking.time.slice(0, 2)) + Math.floor(o.hours);
  const end = `${String(endHour).padStart(2, "0")}:${o.hours % 1 ? "30" : booking.time.slice(3)}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
          {service && (
            <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
              <Photo src={service.image} alt="" fill sizes="64px" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">Ref {booking.ref}</p>
            <p className="text-xl font-extrabold">{booking.serviceName}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid gap-3 rounded-3xl bg-white p-5 ring-1 ring-line sm:grid-cols-2">
          <p className={row}>
            <CalendarDays className={icon} />
            {formatDate(booking.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className={row}>
            <Clock className={icon} />
            {booking.time} – {end} ({o.hours}h)
          </p>
          <p className={`${row} sm:col-span-2`}>
            <MapPin className={icon} />
            {booking.address.unit ? `${booking.address.unit}, ` : ""}
            {booking.address.street}, {booking.address.city} {booking.address.postcode}
          </p>
          {booking.altTimes && booking.altTimes.length > 0 && (
            <p className={`${row} sm:col-span-2`}>
              <Clock className={icon} />
              Also available at {[...booking.altTimes].sort().join(", ")}
            </p>
          )}
          <p className={row}>
            <Repeat className={icon} />
            {freqLabel[o.frequency]}
          </p>
          <p className={row}>
            <Home className={icon} />
            {o.pets ? "Pets at home" : "No pets"}
          </p>
          <p className={row}>
            <Sparkles className={icon} />
            {o.supplies ? "Pro brings cleaning products" : "Customer's cleaning products"}
          </p>
          {(booking.parking || booking.accessNotes) && (
            <p className={`${row} sm:col-span-2`}>
              <KeyRound className={icon} />
              {[booking.parking ? "Free parking nearby" : "", booking.accessNotes ? `“${booking.accessNotes}”` : ""].filter(Boolean).join(" · ")}
            </p>
          )}
          {o.extras.length > 0 && (
            <p className={`${row} sm:col-span-2`}>
              <Sparkles className={icon} />
              Extras: {o.extras.map((e) => extraById(e)?.label).join(", ")}
            </p>
          )}
        </div>

        {!compact && (
          <div className="grid gap-3 rounded-3xl bg-white p-5 ring-1 ring-line sm:grid-cols-2">
            <p className={row}>
              <User className={icon} />
              {booking.customer.name}
            </p>
            <p className={row}>
              <Phone className={icon} />
              {booking.customer.phone}
            </p>
            <p className={`${row} sm:col-span-2 break-all`}>
              <Mail className={icon} />
              {booking.customer.email}
            </p>
            {booking.forWhom === "loved" && booking.recipient && (
              <p className={`${row} sm:col-span-2`}>
                <User className={icon} />
                For a loved one: {booking.recipient.name} · {booking.recipient.phone}
              </p>
            )}
            {booking.notes && (
              <p className={`${row} sm:col-span-2`}>
                <StickyNote className={icon} />“{booking.notes}”
              </p>
            )}
            {booking.paymentMethod && (
              <p className={`${row} sm:col-span-2`}>
                <Sparkles className={icon} />
                Payment: {booking.paymentMethod === "card" ? "Card" : "PayPal"} (demo — not charged)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="mb-4 font-extrabold">Price breakdown</p>
          <PriceLines price={booking.pricing} />
        </div>
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="mb-3 font-extrabold">Your pro</p>
          {pro ? (
            <div className="flex items-center gap-3">
              <span className="relative size-12 overflow-hidden rounded-full">
                <Photo src={pro.avatar} alt={pro.name} fill sizes="48px" />
              </span>
              <div>
                <p className="font-semibold">{pro.name}</p>
                <p className="text-sm text-muted">
                  ★ {pro.rating.toFixed(2)} · {pro.jobs} cleans
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">{booking.status === "cancelled" ? "No pro assigned." : "We're matching you with the best available pro nearby. You'll be notified once they accept (demo)."}</p>
          )}
        </div>
        <p className="px-1 text-xs text-muted">
          Booked {formatDateTime(booking.createdAt)}
          {booking.cancelledAt ? ` · Cancelled ${formatDateTime(booking.cancelledAt)}` : ""}
        </p>
      </div>
    </div>
  );
}
