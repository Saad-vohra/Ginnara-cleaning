"use client";

import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Service } from "@/types";
import { useHydrated, useStore } from "@/hooks/useStore";
import { quoteMessage, telHref, whatsappHref } from "@/lib/services";
import { cn } from "@/lib/utils";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.04 3C8.86 3 3.04 8.82 3.04 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0 0 16.04 29C23.22 29 29 23.18 29 16S23.22 3 16.04 3Zm0 23.62c-2.03 0-4.02-.55-5.75-1.58l-.41-.25-3.96 1.04 1.06-3.86-.27-.4a10.6 10.6 0 0 1-1.63-5.57c0-5.86 4.77-10.63 10.96-10.63 5.86 0 10.6 4.77 10.6 10.63 0 5.86-4.74 10.62-10.6 10.62Zm5.82-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.58-1.6-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.15-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

/** WhatsApp + call buttons used instead of online booking for quote-only services */
export function QuoteActions({ service, className, size = "md", light }: { service?: Service; className?: string; size?: "md" | "lg"; light?: boolean }) {
  const settings = useStore("settings");
  const number = settings.whatsappNumber || settings.supportPhone;
  const h = size === "lg" ? "h-14 px-7 text-[17px]" : "h-12 px-6 text-[15px]";
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <a href={whatsappHref(number, quoteMessage(service))} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] font-bold text-white shadow-[0_8px_20px_-8px_rgb(37_211_102/0.8)] transition hover:brightness-95", h)}>
        <WhatsAppIcon className="size-5" /> WhatsApp us for a quote
      </a>
      <a href={telHref(settings.supportPhone)} className={cn("inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold transition", light ? "border-white text-white hover:bg-white hover:text-ink" : "border-ink text-ink hover:bg-ink hover:text-white", h)}>
        <Phone className="size-4" /> Call {settings.supportPhone}
      </a>
    </div>
  );
}

/** Floating WhatsApp chat button on the public website */
export function WhatsAppFloat() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const settings = useStore("settings");
  if (!hydrated || pathname.startsWith("/admin") || pathname.startsWith("/booking") || pathname.startsWith("/pro/dashboard")) return null;
  return (
    <a
      href={whatsappHref(settings.whatsappNumber || settings.supportPhone, quoteMessage())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-4 z-[90] grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lift transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}
