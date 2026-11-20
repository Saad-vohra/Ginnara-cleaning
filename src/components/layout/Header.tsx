"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, ChevronDown, CircleHelp, LogOut, Mail, Menu, Phone, Sparkles, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { LinkButton } from "@/components/common/Button";
import { Photo } from "@/components/common/ui";
import { useActiveServices, useCurrentCustomer, useHydrated, useStore } from "@/hooks/useStore";
import { logoutCustomer } from "@/lib/auth";
import { CITIES } from "@/data/mock-cities";
import { priceLabel } from "@/lib/services";
import { cn, initials } from "@/lib/utils";
import { serviceHref } from "@/lib/routes";
import { useToast } from "@/components/common/Toast";

/** Top bar: phone & email always visible, plus the admin-editable announcement */
export function AnnouncementBar() {
  const content = useStore("content");
  const settings = useStore("settings");
  const hydrated = useHydrated();
  const tel = `tel:${settings.supportPhone.replace(/\s/g, "")}`;
  return (
    <div className="bg-[#1f3f78] text-white">
      <div className="container-site flex h-10 items-center justify-between gap-3 text-[13px] font-medium">
        <div className="flex min-w-0 items-center gap-4">
          <a href={tel} className="flex shrink-0 items-center gap-1.5 hover:text-sun" aria-label={`Call us on ${settings.supportPhone}`}>
            <Phone className="size-4 text-sun" />
            <span className={cn(hydrated ? "opacity-100" : "opacity-0")}>{settings.supportPhone}</span>
          </a>
          <a href={`mailto:${settings.supportEmail}`} className="hidden min-w-0 items-center gap-1.5 hover:text-sun sm:flex" aria-label={`Email ${settings.supportEmail}`}>
            <Mail className="size-4 shrink-0 text-sun" />
            <span className={cn("truncate", hydrated ? "opacity-100" : "opacity-0")}>{settings.supportEmail}</span>
          </a>
          <a href={`mailto:${settings.supportEmail}`} className="sm:hidden" aria-label={`Email ${settings.supportEmail}`}>
            <Mail className="size-4 text-sun" />
          </a>
        </div>
        {content.announcementOn && (
          <p className={cn("hidden min-w-0 items-center gap-2 truncate lg:flex", hydrated ? "opacity-100" : "opacity-0")}>
            <Sparkles className="size-4 shrink-0 text-sun" />
            <span className="truncate">{content.announcement}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ServicesMenu({ onNavigate }: { onNavigate: () => void }) {
  const services = useActiveServices();
  const cleaning = services.filter((s) => s.kind !== "trade");
  const other = services.filter((s) => s.kind === "trade");
  return (
    <div className="grid w-[min(920px,calc(100vw-2rem))] grid-cols-[1fr_260px] gap-0 overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
      <div className="p-6">
        <p className="mb-3 text-xs font-bold tracking-[0.14em] text-muted uppercase">Cleaning services</p>
        <div className="grid grid-cols-2 gap-1">
          {cleaning.map((s) => (
            <Link key={s.id} href={serviceHref(s.slug)} onClick={onNavigate} className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-cream">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                <Photo src={s.image} alt="" fill sizes="48px" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-ink group-hover:text-brand">{s.name}</span>
                <span className="block truncate text-[13px] text-muted">{priceLabel(s, { from: true })}</span>
              </span>
            </Link>
          ))}
        </div>
        {other.length > 0 && (
          <>
            <p className="mt-5 mb-3 text-xs font-bold tracking-[0.14em] text-muted uppercase">Other home services · quote on WhatsApp</p>
            <div className="grid grid-cols-2 gap-1">
              {other.map((s) => (
                <Link key={s.id} href={serviceHref(s.slug)} onClick={onNavigate} className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-cream">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                    <Photo src={s.image} alt="" fill sizes="48px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-ink group-hover:text-brand">{s.name}</span>
                    <span className="block truncate text-[13px] text-[#128c4a]">Quote on WhatsApp</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col justify-between bg-cream p-6">
        <div>
          <p className="mb-3 text-xs font-bold tracking-[0.14em] text-muted uppercase">Top cities</p>
          <ul className="space-y-1.5">
            {CITIES.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/cleaning/${c.slug}`} onClick={onNavigate} className="text-[15px] font-medium text-ink hover:text-brand">
                  Cleaners in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 space-y-2">
          <LinkButton href="/domestic-cleaning" variant="dark" size="sm" className="w-full" onClick={onNavigate}>
            All cleaning services
          </LinkButton>
          <LinkButton href="/booking" size="sm" className="w-full" onClick={onNavigate}>
            Book a clean
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

function AccountButton() {
  const hydrated = useHydrated();
  const customer = useCurrentCustomer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { info } = useToast();

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!hydrated || !customer) {
    return (
      <Link href="/login" className="flex flex-col items-center gap-1 px-2 text-[13px] font-medium whitespace-nowrap text-ink hover:text-brand">
        <User className="size-5" />
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2 rounded-full bg-cream py-1 pr-3 pl-1 text-sm font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-white">{initials(customer.name)}</span>
        <span className="max-w-24 truncate">{customer.name.split(" ")[0]}</span>
        <ChevronDown className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute top-12 right-0 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-lift">
            {[
              { href: "/account", label: "Dashboard" },
              { href: "/account?tab=bookings", label: "My bookings" },
              { href: "/account?tab=addresses", label: "Saved addresses" },
              { href: "/account?tab=settings", label: "Settings" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-cream">
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => {
                logoutCustomer();
                setOpen(false);
                info("Signed out", "See you soon!");
                router.push("/");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/5"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close menus on navigation (render-phase reset keyed on pathname)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 140);
  };

  const navLink = "whitespace-nowrap text-[16px] font-medium text-ink transition hover:text-brand";

  return (
    <>
      <header className={cn("sticky top-0 z-50 bg-white/95 backdrop-blur transition-shadow", scrolled && "shadow-[0_1px_0_#ece4da,0_10px_30px_-20px_rgb(0_0_0/0.3)]")}>
        <div className="container-site flex h-[72px] items-center justify-between gap-6 lg:h-[88px]">
          <div className="flex items-center gap-6 xl:gap-10">
            <Logo />
            <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Main">
              <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
                <button aria-expanded={menuOpen} aria-haspopup="true" onClick={() => setMenuOpen((o) => !o)} className={cn(navLink, "flex items-center gap-1")}>
                  Cleaning services <ChevronDown className={cn("size-4 transition", menuOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }} className="absolute top-full -left-6 pt-5">
                      <ServicesMenu onNavigate={() => setMenuOpen(false)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link href="/how-it-works" className={navLink}>
                How it works
              </Link>
              <Link href="/reviews" className={navLink}>
                Reviews
              </Link>
              <Link href="/blog" className={cn(navLink, "hidden xl:inline")}>
                The mag
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/become-a-pro" className="hidden flex-col items-center gap-1 px-2 text-[13px] font-medium whitespace-nowrap text-ink hover:text-brand md:flex">
              <Briefcase className="size-5" />
              Become a pro
            </Link>
            <Link href="/help" className="hidden flex-col items-center gap-1 px-2 text-[13px] font-medium whitespace-nowrap text-ink hover:text-brand md:flex">
              <CircleHelp className="size-5" />
              Help
            </Link>
            <div className="hidden sm:block">
              <AccountButton />
            </div>
            <span className="hidden sm:inline-flex">
              <LinkButton href="/booking" size="md">
                Book a clean
              </LinkButton>
            </span>
            <span className="inline-flex sm:hidden">
              <LinkButton href="/booking" size="sm" className="px-4">
                Book
              </LinkButton>
            </span>
            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="grid size-11 place-items-center rounded-full bg-cream lg:hidden">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const services = useActiveServices();
  const customer = useCurrentCustomer();
  const hydrated = useHydrated();
  const settings = useStore("settings");
  const [servicesOpen, setServicesOpen] = useState(true);

  const item = "flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold hover:bg-cream";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white"
            aria-label="Mobile menu"
          >
            <div className="flex h-[72px] items-center justify-between border-b border-line px-4">
              <Logo imgClassName="h-12 lg:h-12" />
              <button aria-label="Close menu" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-cream">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <button className={cn(item, "w-full")} onClick={() => setServicesOpen((o) => !o)} aria-expanded={servicesOpen}>
                Cleaning services <ChevronDown className={cn("size-5 transition", servicesOpen && "rotate-180")} />
              </button>
              {servicesOpen && (
                <div className="mb-2 grid gap-0.5 pl-3">
                  <Link href="/domestic-cleaning" onClick={onClose} className="rounded-xl px-4 py-2.5 font-semibold text-brand hover:bg-cream">
                    All cleaning services
                  </Link>
                  {services.map((s) => (
                    <Link key={s.id} href={serviceHref(s.slug)} onClick={onClose} className="rounded-xl px-4 py-2.5 text-[15px] text-ink-soft hover:bg-cream">
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
              {[
                { href: "/how-it-works", label: "How it works" },
                { href: "/reviews", label: "Reviews" },
                { href: "/blog", label: "The mag" },
                { href: "/become-a-pro", label: "Become a pro" },
                { href: "/help", label: "Help centre" },
                { href: "/contact", label: "Contact us" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={onClose} className={item}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="space-y-2 border-t border-line p-4">
              <div className="mb-2 flex flex-col gap-1.5 rounded-2xl bg-cream px-4 py-3 text-sm">
                <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 font-semibold">
                  <Phone className="size-4 text-brand" /> {settings.supportPhone}
                </a>
                <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 break-all">
                  <Mail className="size-4 shrink-0 text-brand" /> {settings.supportEmail}
                </a>
              </div>
              <LinkButton href="/booking" onClick={onClose} size="lg" className="w-full">
                Book a clean
              </LinkButton>
              <LinkButton href={hydrated && customer ? "/account" : "/login"} onClick={onClose} variant="soft" size="lg" className="w-full" icon={<User className="size-5" />}>
                {hydrated && customer ? `My account (${customer.name.split(" ")[0]})` : "Sign in"}
              </LinkButton>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
