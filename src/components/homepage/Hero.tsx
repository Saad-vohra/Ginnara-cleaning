"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Photo, TrustStars } from "@/components/common/ui";
import { IMG } from "@/data/images";
import { useHydrated, useStore } from "@/hooks/useStore";
import { SEED_CONTENT } from "@/data/mock-content";
import { formatDate } from "@/lib/utils";

export function Hero() {
  const content = useStore("content");
  const hydrated = useHydrated();
  const title = hydrated ? content.heroTitle : SEED_CONTENT.heroTitle;

  return (
    <section className="relative isolate overflow-hidden">
      {/* Phones & tablets: the room's own wall colour continues above the photo, so the text sits on a clean wall
          (like a shelf/wall area) and the people start below the button — no blur. */}
      <div className="absolute inset-0 -z-10 bg-[#ece8e3] lg:hidden">
        <div className="absolute inset-x-0 top-[140px] bottom-0 sm:top-[190px] [mask-image:linear-gradient(to_bottom,transparent,black_14%)]">
          <Photo src={IMG.familyHome} alt="Family relaxing together in a bright, freshly cleaned home" fill priority sizes="100vw" className="object-[58%_0%]" />
        </div>
        <div className="absolute inset-x-0 top-0 h-[340px] bg-gradient-to-b from-ink/45 via-ink/20 to-transparent sm:h-[420px]" />
      </div>
      {/* Laptop & desktop: full-bleed photo with shading on the left behind the text */}
      <div className="absolute inset-0 -z-10 hidden lg:block">
        <Photo src={IMG.familyHome} alt="Family relaxing together in a bright, freshly cleaned home" fill priority sizes="100vw" className="object-[50%_25%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
      </div>
      <div className="container-site flex min-h-[580px] flex-col items-center pt-10 pb-10 text-center sm:min-h-[680px] sm:pt-14 lg:min-h-[640px] lg:items-start lg:justify-center lg:py-24 lg:text-left">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[14ch] font-display text-[2.6rem] leading-[1] font-extrabold tracking-tight text-balance text-white [text-shadow:0_2px_18px_rgb(0_0_0/0.35)] sm:text-6xl lg:max-w-[12ch] lg:text-[5rem]"
        >
          {title}
        </motion.h1>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 lg:mt-10">
          <Link
            href="/booking"
            className="bg-warm-gradient inline-flex h-14 items-center rounded-full px-8 text-[18px] font-semibold text-white shadow-[0_10px_28px_-10px_rgb(236_106_60/0.8)] transition hover:brightness-105 sm:h-[60px] sm:px-10 sm:text-[20px]"
          >
            Book my cleaning
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function ReviewStrip() {
  const reviews = useStore("reviews").filter((r) => r.published && r.rating >= 4);
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  return (
    <section className="border-b border-line py-10">
      <div className="container-site flex flex-col items-stretch gap-8 lg:flex-row lg:items-center">
        <Link href="/reviews" className="flex shrink-0 flex-col items-center gap-2 text-center lg:w-56">
          <span className="font-display text-3xl font-extrabold">Excellent</span>
          <TrustStars size={30} />
          <span className="text-sm text-ink-soft">
            Based on <span className="font-semibold text-ink underline">12,480 reviews</span>
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button aria-label="Previous reviews" onClick={() => scroll(-1)} className="hidden size-10 shrink-0 place-items-center rounded-full border border-line hover:bg-cream sm:grid">
            <ChevronLeft className="size-5" />
          </button>
          <div ref={scroller} className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth">
            {reviews.map((r) => (
              <article key={r.id} className="w-[290px] shrink-0 snap-start">
                <TrustStars size={20} />
                <p className="mt-2 text-[13px] text-muted">
                  <span className="font-semibold text-ink-soft">{r.name}</span>, {formatDate(r.date, { day: "numeric", month: "short" })}
                </p>
                <p className="mt-1 truncate font-bold">{r.title}</p>
                <p className="line-clamp-2 text-sm text-ink-soft">{r.text}</p>
              </article>
            ))}
          </div>
          <button aria-label="Next reviews" onClick={() => scroll(1)} className="hidden size-10 shrink-0 place-items-center rounded-full border border-line hover:bg-cream sm:grid">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
