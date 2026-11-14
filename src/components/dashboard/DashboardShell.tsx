"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

export interface NavItem<K extends string> {
  key: K;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  /** Optional sidebar group heading (e.g. "Main menu") */
  group?: string;
}

interface Props<K extends string> {
  nav: NavItem<K>[];
  active: K;
  onChange: (k: K) => void;
  title: string;
  subtitle?: string;
  user: { name: string; email: string; avatar?: ReactNode };
  onLogout: () => void;
  children: ReactNode;
  tone?: "light" | "dark";
  topRight?: ReactNode;
  /** Replaces the default logo block at the top of the sidebar */
  brand?: ReactNode;
}

/** Full-screen app shell with fixed sidebar (pro & admin dashboards) */
export function DashboardShell<K extends string>({ nav, active, onChange, title, subtitle, user, onLogout, children, tone = "dark", topRight, brand }: Props<K>) {
  const [open, setOpen] = useState(false);
  const dark = tone === "dark";

  const sidebar = (
    <div className={cn("flex h-full flex-col", dark ? "bg-ink text-white" : "bg-white")}>
      <div className={cn("flex items-center justify-between px-6", brand ? "py-4" : "h-20")}>
        {brand ?? <Logo light={dark} href="/" imgClassName="h-14 lg:h-14" />}
        <button className="grid size-10 place-items-center rounded-full bg-white/10 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
          <X className="size-5" />
        </button>
      </div>
      {title && <p className={cn("px-6 pb-3 text-[11px] font-bold tracking-[0.16em] uppercase", dark ? "text-white/40" : "text-muted")}>{title}</p>}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2">
        {nav.map((n, i) => {
          const on = n.key === active;
          const heading = n.group && n.group !== nav[i - 1]?.group ? n.group : null;
          return (
            <div key={n.key}>
            {heading && <p className={cn("px-4 pt-5 pb-2 text-[11px] font-bold tracking-[0.16em] uppercase", dark ? "text-white/40" : "text-muted")}>{heading}</p>}
            <button
              key={n.key}
              onClick={() => {
                onChange(n.key);
                setOpen(false);
              }}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-[15px] font-semibold transition",
                on ? (dark ? "bg-white text-ink" : "bg-ink text-white") : dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-ink-soft hover:bg-cream",
              )}
            >
              <n.icon className="size-5" />
              <span className="flex-1">{n.label}</span>
              {!!n.badge && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{n.badge}</span>}
            </button>
            </div>
          );
        })}
      </nav>
      <div className={cn("m-3 rounded-2xl p-3", dark ? "bg-white/5" : "bg-cream")}>
        <div className="flex items-center gap-3">
          {user.avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className={cn("truncate text-xs", dark ? "text-white/50" : "text-muted")}>{user.email}</p>
          </div>
          <button onClick={onLogout} aria-label="Sign out" className={cn("grid size-9 place-items-center rounded-full", dark ? "hover:bg-white/10" : "hover:bg-white")}>
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const current = nav.find((n) => n.key === active);

  return (
    <div className="min-h-dvh bg-cream-2">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{sidebar}</aside>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="grid size-11 shrink-0 place-items-center rounded-full bg-cream lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold sm:text-2xl">{current?.label}</h1>
              {subtitle && <p className="hidden truncate text-sm text-muted sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">{topRight}</div>
        </header>
        <main className="min-w-0 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "brand" }: { label: string; value: ReactNode; hint?: ReactNode; icon: ComponentType<{ className?: string }>; tone?: "brand" | "sun" | "sky" | "mint" | "blush" }) {
  const tones = { brand: "bg-brand/10 text-brand", sun: "bg-sun/30 text-[#8a6100]", sky: "bg-sky/40 text-[#22617a]", mint: "bg-mint/60 text-success", blush: "bg-blush/50 text-[#a33b36]" };
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-line/60">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <span className={cn("grid size-10 place-items-center rounded-2xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-line/60 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-lg font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function GuardScreen({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-20 text-center">
      <div className="max-w-sm">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-ink-soft">{text}</p>
        <Link href={href} className="bg-brand-gradient mt-6 inline-flex h-12 items-center rounded-full px-7 font-semibold text-white">
          {cta}
        </Link>
      </div>
    </div>
  );
}
