"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronUp, Info, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/useStore";
import { dateAvailability } from "@/lib/availability";
import { cn, fromISODate, toISODate } from "@/lib/utils";

/* ---------- Headings ---------- */
export function StepTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-[1.75rem] leading-[1.12] font-extrabold tracking-tight sm:text-[2rem]">{children}</h1>
      {sub && <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  );
}

/* ---------- Selectable tile ---------- */
export function OptionTile({ selected, onClick, children, className, ariaLabel }: { selected: boolean; onClick: () => void; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "rounded-2xl border-2 px-6 py-5 text-left text-[17px] transition",
        selected ? "border-brand bg-white" : "border-transparent bg-[#f4f4f6] hover:bg-[#ececf0]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PopularTag() {
  return <span className="rounded-md bg-[#fdeba0] px-2 py-1 text-sm font-bold text-ink">Popular</span>;
}

/* ---------- Info box & tooltip ---------- */
export function InfoBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl bg-[#cfcdf7] px-5 py-4 text-[16px] leading-snug text-ink", className)}>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-white">
        <Info className="size-3.5" strokeWidth={3} />
      </span>
      <p>{children}</p>
    </div>
  );
}

export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" aria-label={`More about ${label}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)} className="grid size-6 place-items-center rounded-full bg-ink text-white">
        <Info className="size-3.5" strokeWidth={3} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span role="tooltip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-8 right-0 z-30 w-64 rounded-2xl bg-ink p-3 text-sm leading-snug text-white shadow-lift sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ---------- Bottom bar ---------- */
export function BottomBar({ priceLabel, onNext, onBasket, basketOpen, nextLabel = "Next", disabled }: { priceLabel: string; onNext: () => void; onBasket: () => void; basketOpen: boolean; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] bg-white shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.25)]">
      <div className="relative mx-auto flex h-24 max-w-2xl items-center justify-between px-5 sm:px-8">
        <p className="text-[19px] font-bold">{priceLabel}</p>
        <button type="button" onClick={onBasket} aria-label={basketOpen ? "Hide my basket" : "Show my basket"} aria-expanded={basketOpen} className="absolute top-2 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full hover:bg-cream">
          <ChevronUp className={cn("size-7 transition", basketOpen && "rotate-180")} />
        </button>
        <button type="button" onClick={onNext} disabled={disabled} className="h-14 rounded-full bg-ink px-9 text-[19px] font-bold text-white transition hover:bg-black disabled:bg-muted">
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------- Bottom sheet ---------- */
export function Sheet({ open, onClose, children, className, closeButton = true }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; closeButton?: boolean }) {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!hydrated) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={cn("absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-2xl overflow-y-auto rounded-t-[32px] bg-white px-6 pt-6 pb-8 sm:px-8", className)}
          >
            {closeButton && (
              <button type="button" aria-label="Close" onClick={onClose} className="absolute top-5 right-5 grid size-11 place-items-center rounded-full border-2 border-ink">
                <X className="size-5" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- Calendar ---------- */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BookingCalendar({ value, onChange, highlights = [], sameDay = false }: { value: string; onChange: (iso: string) => void; highlights?: string[]; sameDay?: boolean }) {
  const start = value ? fromISODate(value) : new Date();
  const [cursor, setCursor] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const today = toISODate(new Date());
  const minMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const maxMonth = new Date(minMonth.getFullYear(), minMonth.getMonth() + 2, 1);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      return { iso: toISODate(d), inMonth: d.getMonth() === cursor.getMonth() };
    });
  }, [cursor]);

  const lastHighlight = highlights[highlights.length - 1];

  return (
    <div className="rounded-3xl bg-[#f4f4f6] px-3 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between px-2">
        <button type="button" aria-label="Previous month" disabled={cursor <= minMonth} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="grid size-11 place-items-center rounded-full border-2 border-ink disabled:opacity-25">
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-[19px] font-bold">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        <button type="button" aria-label="Next month" disabled={cursor >= maxMonth} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="grid size-11 place-items-center rounded-full border-2 border-ink disabled:opacity-25">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[15px] font-bold sm:text-base">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-3">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {cells.map(({ iso, inMonth }) => {
          const state = dateAvailability(iso, sameDay);
          const selectable = inMonth && state === "available";
          const isSelected = iso === value;
          const isHighlight = !isSelected && highlights.includes(iso);
          const faded = isHighlight && iso === lastHighlight;
          return (
            <div key={iso} className="flex justify-center">
              <button
                type="button"
                disabled={!selectable}
                onClick={() => onChange(iso)}
                aria-pressed={isSelected}
                aria-label={fromISODate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + (state === "full" ? ", fully booked" : "")}
                className={cn(
                  "grid size-11 place-items-center rounded-full text-[17px] transition sm:size-12",
                  isSelected && "bg-brand text-white",
                  isHighlight && !faded && "bg-brand text-white",
                  faded && "bg-brand/40 text-white",
                  !isSelected && !isHighlight && selectable && "text-ink hover:bg-white",
                  !isSelected && !isHighlight && !selectable && "cursor-default text-muted/40",
                  state === "full" && inMonth && !isHighlight && "line-through",
                  iso === today && !isSelected && !isHighlight && "font-semibold text-brand",
                )}
              >
                {Number(iso.slice(8))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Time slots ---------- */
export const TIME_SLOTS = Array.from({ length: 31 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${mins % 60 ? "30" : "00"}`;
});

export function slotAvailable(date: string, time: string) {
  if (date !== toISODate(new Date())) return true;
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  return h * 60 + m >= now.getHours() * 60 + now.getMinutes() + 180;
}

export function TimeGrid({ date, primary, alts, onPick }: { date: string; primary: string; alts: string[]; onPick: (t: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {TIME_SLOTS.map((t) => {
        const isPrimary = t === primary;
        const isAlt = alts.includes(t);
        const available = slotAvailable(date, t);
        return (
          <button
            type="button"
            key={t}
            disabled={!available}
            onClick={() => onPick(t)}
            aria-pressed={isPrimary || isAlt}
            className={cn(
              "h-[60px] rounded-xl border-2 text-[17px] transition sm:h-16",
              isPrimary ? "border-brand bg-brand text-white" : isAlt ? "border-brand bg-white" : "border-transparent bg-[#f4f4f6] hover:bg-[#ececf0]",
              !available && "cursor-not-allowed text-muted/40 line-through",
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
