"use client";

import { CalendarDays, Clock, MapPin, Repeat, ShieldCheck, Tag } from "lucide-react";
import type { BookingOptions, PriceBreakdown, Service } from "@/types";
import { Photo } from "@/components/common/ui";
import { priceLabel } from "@/lib/services";
import { cn, formatDate, gbp2 } from "@/lib/utils";

const freqLabel: Record<BookingOptions["frequency"], string> = { once: "One-off", weekly: "Every week", fortnightly: "Every 2 weeks", monthly: "Every month" };

export function PriceLines({ price, className }: { price: PriceBreakdown; className?: string }) {
  const row = "flex items-center justify-between gap-4 text-[15px]";
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className={row}>
        <span className="text-ink-soft">{price.packageLabel ? price.packageLabel : `${price.hours}h × ${gbp2(price.rate)}`}</span>
        <span className="font-semibold">{gbp2(price.base)}</span>
      </div>
      {price.extrasLines.filter((e) => e.price > 0).map((e) => (
        <div key={e.label} className={row}>
          <span className="text-ink-soft">{e.label}</span>
          <span className="font-semibold">{gbp2(e.price)}</span>
        </div>
      ))}
      {price.suppliesFee > 0 && (
        <div className={row}>
          <span className="text-ink-soft">Cleaning products</span>
          <span className="font-semibold">{gbp2(price.suppliesFee)}</span>
        </div>
      )}
      {price.frequencyDiscount > 0 && (
        <div className={cn(row, "text-success")}>
          <span>Recurring discount</span>
          <span className="font-semibold">−{gbp2(price.frequencyDiscount)}</span>
        </div>
      )}
      <div className={row}>
        <span className="text-ink-soft">Service & insurance fee</span>
        <span className="font-semibold">{gbp2(price.serviceFee)}</span>
      </div>
      {price.couponDiscount > 0 && (
        <div className={cn(row, "text-success")}>
          <span className="flex items-center gap-1.5">
            <Tag className="size-4" /> {price.couponCode}
          </span>
          <span className="font-semibold">−{gbp2(price.couponDiscount)}</span>
        </div>
      )}
      <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
        <span className="font-bold">Total</span>
        <span className="font-display text-3xl font-extrabold">{gbp2(price.total)}</span>
      </div>
    </div>
  );
}

export function PriceSummary({ service, options, price, address, date, time }: { service?: Service; options: BookingOptions | null; price: PriceBreakdown | null; address?: string; date?: string; time?: string }) {
  if (!service) {
    return (
      <div className="rounded-3xl border border-line bg-white p-6 text-center">
        <p className="font-display text-lg font-extrabold">Your booking</p>
        <p className="mt-2 text-sm text-ink-soft">Choose a service to see your live price.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
          <Photo src={service.image} alt="" fill sizes="56px" />
        </span>
        <div>
          <p className="font-extrabold">{service.name}</p>
          <p className="text-sm text-muted">{priceLabel(service)}</p>
        </div>
      </div>
      <div className="space-y-2.5 border-b border-line p-5 text-sm">
        {address && (
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand" /> {address}
          </p>
        )}
        {options && (
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand" /> {options.hours} hours{service.kind === "cleaning" ? ` · ${options.bedrooms} bed, ${options.bathrooms} bath` : ""}
          </p>
        )}
        {options && service.allowsFrequency && (
          <p className="flex items-center gap-2">
            <Repeat className="size-4 shrink-0 text-brand" /> {freqLabel[options.frequency]}
          </p>
        )}
        {date && (
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-brand" /> {formatDate(date)}
            {time ? ` at ${time}` : ""}
          </p>
        )}
      </div>
      <div className="p-5">{price ? <PriceLines price={price} /> : <p className="text-sm text-ink-soft">Complete your home details to see the price.</p>}</div>
      <p className="flex items-center gap-2 bg-cream-2 px-5 py-3 text-xs text-ink-soft">
        <ShieldCheck className="size-4 text-success" /> Free cancellation up to 24h before · No payment taken (demo)
      </p>
    </div>
  );
}

export { freqLabel };
