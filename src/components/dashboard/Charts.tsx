"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Lightweight SVG bar chart — no chart library needed */
export function BarChart({ data, format = (n) => String(n), height = 220, color = "#f2602b" }: { data: { label: string; value: number }[]; format?: (n: number) => string; height?: number; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => max * t);
  return (
    <div className="relative" style={{ height }}>
      <div className="absolute inset-0 bottom-7 left-12 flex flex-col-reverse justify-between">
        {ticks.map((t) => (
          <div key={t} className="relative border-t border-dashed border-line">
            <span className="absolute -top-2.5 -left-12 w-10 text-right text-[11px] text-muted">{format(Math.round(t))}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bottom-0 left-12 flex items-end gap-2 pb-7 sm:gap-3">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 28);
          return (
            <div key={d.label} className="relative flex h-full flex-1 flex-col items-center justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {hover === i && (
                <div className="absolute z-10 -translate-y-2 rounded-lg bg-ink px-2 py-1 text-xs font-semibold whitespace-nowrap text-white" style={{ bottom: h + 4 }}>
                  {format(d.value)}
                </div>
              )}
              <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.6, delay: i * 0.04 }} className="w-full max-w-10 rounded-t-xl" style={{ background: hover === i ? "#2a2725" : color }} />
              <span className="absolute -bottom-6 text-[11px] font-medium text-muted">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Donut chart for status splits */
export function DonutChart({ data, size = 180, centerLabel }: { data: { label: string; value: number; color: string }[]; size?: number; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  const segments = data.map((d, i) => ({
    ...d,
    len: (d.value / total) * c,
    offset: data.slice(0, i).reduce((s, x) => s + (x.value / total) * c, 0),
  }));
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 180 180" className="-rotate-90">
          <circle cx="90" cy="90" r={r} fill="none" stroke="#f8eee2" strokeWidth="22" />
          {segments.map((d) => (
            <motion.circle
              key={d.label}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="22"
              strokeDasharray={`${d.len} ${c - d.len}`}
              strokeDashoffset={-d.offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl font-extrabold">{data.reduce((s, d) => s + d.value, 0)}</p>
            <p className="text-xs text-muted">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 capitalize">
              <span className="size-3 rounded-full" style={{ background: d.color }} /> {d.label}
            </span>
            <span className="font-semibold">
              {d.value} <span className="text-muted">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-cream", className)}>
      <motion.div className="bg-brand-gradient h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.8 }} />
    </div>
  );
}
