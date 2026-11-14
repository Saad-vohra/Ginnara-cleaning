"use client";

import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { dateAvailability, slotsFor } from "@/lib/availability";
import { cn, formatDate, fromISODate, toISODate } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  value: string;
  onChange: (iso: string) => void;
  sameDay?: boolean;
  /** extra dates to grey out (e.g. pro's blocked dates) */
  blocked?: string[];
  /** render custom state per day (used by pro availability editor) */
  mode?: "booking" | "availability";
}

export function Calendar({ value, onChange, sameDay = false, blocked = [], mode = "booking" }: Props) {
  const initial = value ? fromISODate(value) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const today = toISODate(new Date());
  const minMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const maxMonth = new Date(minMonth.getFullYear(), minMonth.getMonth() + 2, 1);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= count; d++) cells.push(toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    return cells;
  }, [cursor]);

  const canPrev = cursor > minMonth;
  const canNext = cursor < maxMonth;

  return (
    <div className="rounded-3xl border border-line bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="grid size-10 place-items-center rounded-full hover:bg-cream disabled:opacity-30">
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-display text-lg font-extrabold">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="grid size-10 place-items-center rounded-full hover:bg-cream disabled:opacity-30">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />;
          const state = mode === "availability" ? (iso < today ? "past" : "available") : dateAvailability(iso, sameDay);
          const isBlocked = blocked.includes(iso);
          const disabled = mode === "booking" ? state !== "available" || isBlocked : state === "past";
          const selected = value === iso;
          return (
            <button
              type="button"
              key={iso}
              disabled={disabled}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={`${formatDate(iso, { weekday: "long", day: "numeric", month: "long" })}${state === "full" ? ", fully booked" : ""}${isBlocked ? ", unavailable" : ""}`}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-semibold transition sm:text-[15px]",
                selected && "bg-ink text-white shadow-soft",
                !selected && !disabled && "hover:bg-cream",
                !selected && mode === "availability" && isBlocked && "bg-danger/10 text-danger line-through",
                disabled && "cursor-not-allowed text-muted/50",
                state === "full" && "line-through",
                iso === today && !selected && "ring-1 ring-brand",
              )}
            >
              {Number(iso.slice(8))}
              {mode === "booking" && state === "available" && !isBlocked && !selected && <span className="absolute bottom-1.5 size-1 rounded-full bg-success" />}
            </button>
          );
        })}
      </div>
      {mode === "booking" && (
        <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted/60 line-through">12</span> Fully booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded ring-1 ring-brand" /> Today
          </span>
        </div>
      )}
    </div>
  );
}

export function TimeSlots({ date, value, onChange, sameDay }: { date: string; value: string; onChange: (t: string) => void; sameDay?: boolean }) {
  const slots = slotsFor(date, sameDay);
  const open = slots.filter((s) => s.available).length;
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Clock className="size-4 text-brand" /> {formatDate(date, { weekday: "long", day: "numeric", month: "long" })} · {open} slots available
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((s) => (
          <button
            type="button"
            key={s.time}
            disabled={!s.available}
            onClick={() => onChange(s.time)}
            aria-pressed={value === s.time}
            className={cn(
              "h-12 rounded-2xl border-[1.5px] text-[15px] font-semibold transition",
              value === s.time ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink",
              !s.available && "cursor-not-allowed border-dashed bg-cream-2 text-muted/50 line-through hover:border-line",
            )}
          >
            {s.time}
          </button>
        ))}
      </div>
    </div>
  );
}
