"use client";

import { motion } from "framer-motion";
import { CalendarPlus, CheckCircle2, Copy, Printer, Search } from "lucide-react";
import { Button, LinkButton } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { EmptyState, Spinner } from "@/components/common/ui";
import { BookingDetails } from "./BookingDetails";
import { useCurrentCustomer, useHydrated, useStore } from "@/hooks/useStore";

export function Confirmation({ bookingRef }: { bookingRef: string }) {
  const hydrated = useHydrated();
  const bookings = useStore("bookings");
  const customer = useCurrentCustomer();
  const { success, info } = useToast();
  const booking = bookings.find((b) => b.ref === bookingRef);

  if (!hydrated) return <Spinner label="Loading your booking" />;
  if (!booking) {
    return (
      <div className="container-site py-20">
        <EmptyState icon={<Search className="size-6" />} title="Booking not found" description={`We couldn't find booking ${bookingRef} on this device. Bookings in this demo are stored in your browser.`} action={<LinkButton href="/help#find-booking">Find a booking</LinkButton>} />
      </div>
    );
  }

  const icsHref = () => {
    const [y, m, d] = booking.date.split("-");
    const [hh, mm] = booking.time.split(":");
    const start = `${y}${m}${d}T${hh}${mm}00`;
    const endH = String(Number(hh) + Math.ceil(booking.options.hours)).padStart(2, "0");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ginnara Demo//EN", "BEGIN:VEVENT", `UID:${booking.ref}@ginnara.demo`, `DTSTART:${start}`, `DTEND:${y}${m}${d}T${endH}${mm}00`, `SUMMARY:Ginnara ${booking.serviceName}`, `LOCATION:${booking.address.street}, ${booking.address.city} ${booking.address.postcode}`, `DESCRIPTION:Booking ref ${booking.ref}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  };

  return (
    <div className="bg-cream-2 py-10 lg:py-16">
      <div className="container-site">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-gradient relative mb-8 overflow-hidden rounded-[36px] px-6 py-10 text-center text-white sm:px-10">
          <div className="absolute -top-16 -left-10 size-56 rounded-full bg-white/10" />
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="relative mx-auto grid size-20 place-items-center rounded-full bg-white text-success">
            <CheckCircle2 className="size-11" />
          </motion.span>
          <h1 className="relative mt-5 text-4xl font-extrabold sm:text-5xl">{booking.status === "cancelled" ? "Booking cancelled" : "You're all booked!"}</h1>
          <p className="relative mx-auto mt-3 max-w-xl text-lg text-white/90">
            {booking.status === "cancelled" ? "This booking has been cancelled." : `We've sent a confirmation to ${booking.customer.email} (simulated). Keep your reference handy:`}
          </p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(booking.ref).then(
                () => success("Reference copied"),
                () => info("Your reference", booking.ref),
              );
            }}
            className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-display text-2xl font-extrabold tracking-wider text-ink"
          >
            {booking.ref} <Copy className="size-5 text-muted" />
          </button>
        </motion.div>

        <BookingDetails booking={booking} />

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={icsHref()} download={`ginnara-${booking.ref}.ics`} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold shadow-soft hover:shadow-lift">
            <CalendarPlus className="size-4" /> Add to calendar
          </a>
          <Button variant="light" icon={<Printer className="size-4" />} onClick={() => window.print()}>
            Print
          </Button>
          {customer ? (
            <LinkButton href={`/account?tab=bookings&booking=${booking.ref}`} variant="dark">
              View in my account
            </LinkButton>
          ) : (
            <LinkButton href="/register" variant="dark">
              Create an account to manage bookings
            </LinkButton>
          )}
          <LinkButton href="/" variant="ghost">
            Back to home
          </LinkButton>
        </div>
        {!customer && <p className="mt-4 text-sm text-ink-soft">Tip: you can look this booking up any time from the Help centre using your reference and email — or register with {booking.customer.email} to see it in your account.</p>}
      </div>
    </div>
  );
}
