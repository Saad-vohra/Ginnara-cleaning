"use client";

import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import Link from "next/link";
import type { Review, Service } from "@/types";
import { Photo, Stars } from "@/components/common/ui";
import { serviceHref } from "@/lib/routes";
import { priceLabel } from "@/lib/services";
import { cn, formatDate } from "@/lib/utils";

export function ServiceCard({ service, className, priority }: { service: Service; className?: string; priority?: boolean }) {
  return (
    <Link href={serviceHref(service.slug)} className={cn("group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/60 transition duration-300 hover:-translate-y-1 hover:shadow-lift", className)}>
      <div className="relative aspect-[3/2] overflow-hidden">
        <Photo src={service.image} alt={service.name} fill sizes="(max-width: 768px) 85vw, 400px" priority={priority} className="transition duration-700 group-hover:scale-105" />
        {service.popular && <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow">Popular</span>}
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 p-5">
        <div>
          <h3 className="text-lg font-extrabold">{service.name}</h3>
          <p className="mt-1 text-sm text-ink-soft">{service.short}</p>
          <p className="mt-3 text-sm font-bold text-ink">{priceLabel(service, { from: true })}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream text-ink transition group-hover:bg-brand group-hover:text-white">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
    </Link>
  );
}

export function ReviewCard({ review, className }: { review: Review; className?: string }) {
  return (
    <article className={cn("flex h-full flex-col rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/60 sm:p-7", className)}>
      <div className="flex items-center justify-between gap-2">
        <Stars value={review.rating} size={20} />
        <span className="text-xs text-muted">{formatDate(review.date, { day: "numeric", month: "short" })}</span>
      </div>
      <h3 className="mt-4 text-lg leading-snug font-extrabold">{review.title}</h3>
      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-soft">“{review.text}”</p>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-[13px]">
        <span>
          <span className="flex items-center gap-1 font-semibold text-ink">
            {review.name} <BadgeCheck className="size-4 text-success" />
          </span>
          <span className="text-muted">{review.service}</span>
        </span>
        <span className="flex items-center gap-1 text-muted">
          <MapPin className="size-3.5" />
          {review.city}
        </span>
      </div>
    </article>
  );
}
