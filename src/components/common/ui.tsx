"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Inbox, Loader2, Star } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------- Section heading ---------- */
export function SectionHeading({ eyebrow, title, intro, align = "left", className, action }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; align?: "left" | "center"; className?: string; action?: ReactNode }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 md:mb-12", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between", className)}>
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && <p className="mb-3 text-[13px] font-bold tracking-[0.14em] text-brand uppercase">{eyebrow}</p>}
        <h2 className="text-[2rem] leading-[1.05] font-extrabold text-balance sm:text-[2.6rem] lg:text-5xl">{title}</h2>
        {intro && <p className="mt-4 max-w-2xl text-base text-ink-soft sm:text-lg">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */
const badgeTones = {
  neutral: "bg-cream text-ink",
  brand: "bg-brand/10 text-brand-dark",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-sun/30 text-[#8a6100]",
  info: "bg-sky/40 text-[#22617a]",
  dark: "bg-ink text-white",
};
export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: keyof typeof badgeTones; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", badgeTones[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, keyof typeof badgeTones> = {
    pending: "warning",
    confirmed: "info",
    completed: "success",
    cancelled: "danger",
    approved: "success",
    rejected: "danger",
    active: "success",
    suspended: "danger",
    inactive: "neutral",
    new: "brand",
    read: "neutral",
    replied: "success",
    closed: "neutral",
  };
  return (
    <Badge tone={map[status] ?? "neutral"} className="capitalize">
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

/* ---------- Card ---------- */
export function Card({ children, className, as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <As className={cn("rounded-3xl border border-line/70 bg-white p-6 shadow-soft", className)}>{children}</As>;
}

/* ---------- Stars ---------- */
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-sun text-sun" : "fill-line text-line"} />
      ))}
    </span>
  );
}

export function TrustStars({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label="5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="grid place-items-center bg-[#00b67a]" style={{ width: size, height: size }}>
          <Star className="fill-white text-white" style={{ width: size * 0.7, height: size * 0.7 }} />
        </span>
      ))}
    </span>
  );
}

/* ---------- Accordion ---------- */
export function Accordion({ items, defaultOpen = 0, className }: { items: { q: string; a: ReactNode }[]; defaultOpen?: number | null; className?: string }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className={cn("divide-y divide-line rounded-3xl border border-line bg-white", className)}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q}>
            <button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7">
              <span className="text-base font-bold text-ink sm:text-lg">{it.q}</span>
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition", isOpen ? "rotate-180 bg-ink text-white" : "bg-cream text-ink")}>
                <ChevronDown className="size-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-5 pb-6 text-[15px] leading-relaxed text-ink-soft sm:px-7">{it.a}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Empty / loading ---------- */
export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center", className)}>
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-cream text-ink">{icon ?? <Inbox className="size-6" />}</span>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink-soft" role="status">
      <Loader2 className="size-5 animate-spin text-brand" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-cream", className)} />;
}

/* ---------- Reveal on scroll ---------- */
export function Reveal({ children, delay = 0, className, y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ---------- Photo with graceful fallback ---------- */
export function Photo({ className, alt, ...props }: ImageProps & { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={cn("bg-gradient-to-br from-cream to-blush/60", className)} role="img" aria-label={alt} />;
  return <Image alt={alt} className={cn("object-cover", className)} onError={() => setFailed(true)} quality={75} {...props} />;
}

/* ---------- Demo notice ---------- */
export function DemoNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-start gap-2 rounded-2xl bg-sky/30 px-3 py-2 text-[13px] text-[#22617a]", className)}>
      <span className="mt-0.5 rounded-full bg-[#22617a] px-1.5 text-[10px] font-bold text-white uppercase">Demo</span>
      <span>{children}</span>
    </p>
  );
}

/* ---------- Tabs (pill) ---------- */
export function PillTabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition", value === t.value ? "bg-ink text-white" : "bg-cream text-ink hover:bg-[#f2e2cf]")}
        >
          {t.label}
          {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-xs", value === t.value ? "bg-white/20" : "bg-white")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
