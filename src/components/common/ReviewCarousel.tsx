"use client";

import { useEffect, useRef, useState } from "react";
import type { Review } from "@/types";
import { ReviewCard } from "@/components/services/Cards";
import { cn } from "@/lib/utils";

const MOBILE = "(max-width: 767px)";
const INTERVAL = 4000;

function scrollToCard(el: HTMLElement | null, i: number) {
  const card = el?.children[i] as HTMLElement | undefined;
  if (!el || !card) return;
  el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
}

/**
 * Reviews as a grid on tablet/desktop, and a horizontal, auto-scrolling
 * swipe row on mobile. Auto-scroll pauses while the visitor interacts.
 */
export function ReviewCarousel({ reviews, gridClassName = "md:grid-cols-2 lg:grid-cols-3" }: { reviews: Review[]; gridClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);

  // Track which card is in view (for the dots)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid)) best = i;
      });
      setActive(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [reviews.length]);

  // Auto-advance on mobile only
  useEffect(() => {
    if (reviews.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      const el = ref.current;
      if (!el || !window.matchMedia(MOBILE).matches || Date.now() < pausedUntil.current || document.hidden) return;
      const cards = Array.from(el.children) as HTMLElement[];
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      const next = atEnd ? 0 : Math.min(active + 1, cards.length - 1);
      scrollToCard(el, next);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [active, reviews.length]);

  const pause = () => {
    pausedUntil.current = Date.now() + 8000;
  };

  return (
    <div>
      <div
        ref={ref}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
        className={cn("no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6", "md:mx-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:pb-0", gridClassName)}
        aria-roledescription="carousel"
        aria-label="Customer reviews"
      >
        {reviews.map((r) => (
          <div key={r.id} className="w-[85%] max-w-[360px] shrink-0 snap-center md:w-auto md:max-w-none">
            <ReviewCard review={r} />
          </div>
        ))}
      </div>
      {reviews.length > 1 && (
        <div className="mt-5 flex justify-center gap-2 md:hidden">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              type="button"
              aria-label={`Show review ${i + 1}`}
              aria-current={i === active}
              onClick={() => {
                pause();
                scrollToCard(ref.current, i);
              }}
              className={cn("h-2 rounded-full transition-all", i === active ? "w-6 bg-ink" : "w-2 bg-ink/20")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
