"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { useHydrated, useStore } from "@/hooks/useStore";
import { write } from "@/lib/storage";
import { cn, formatDateTime } from "@/lib/utils";

const OPEN_EVENT = "ginnara:open-cookie-settings";

/** Re-open the consent panel (footer “Cookie settings” link) */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Tab = "consent" | "details" | "about";
type Choice = { preferences: boolean; statistics: boolean; marketing: boolean };

const CATEGORIES: { key: keyof Choice | "necessary"; title: string; text: string }[] = [
  { key: "necessary", title: "Necessary", text: "Required for the site to work: your session, booking basket and security. These can't be switched off." },
  { key: "preferences", title: "Preferences", text: "Remember choices such as your postcode, language and recently viewed services." },
  { key: "statistics", title: "Statistics", text: "Help us understand how visitors use the site so we can improve it, using anonymised data." },
  { key: "marketing", title: "Marketing", text: "Used by our partners (social media and advertising) to show you relevant offers on other sites." },
];

export function CookieConsent() {
  const hydrated = useHydrated();
  const consent = useStore("consent");
  const [reopened, setReopened] = useState(false);
  const [tab, setTab] = useState<Tab>("consent");
  const [choice, setChoice] = useState<Choice>({ preferences: consent.preferences, statistics: consent.statistics, marketing: consent.marketing });

  useEffect(() => {
    const open = () => {
      setChoice({ preferences: consent.preferences, statistics: consent.statistics, marketing: consent.marketing });
      setTab("details");
      setReopened(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [consent]);

  const pathname = usePathname();
  // Consent is for website visitors — not shown inside the admin panel
  const open = hydrated && !pathname.startsWith("/admin") && (!consent.decided || reopened);

  const save = (c: Choice) => {
    write("consent", { decided: true, ...c, decidedAt: new Date().toISOString() });
    setReopened(false);
    setTab("consent");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "consent", label: "Consent" },
    { key: "details", label: "Details" },
    { key: "about", label: "About" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:p-4">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-t-2xl bg-[#f6ecdc] text-ink shadow-lift sm:rounded-2xl"
          >
            <div className="flex items-center border-b border-black/10 px-6 py-3">
              <LogoMark className="h-12 w-auto" />
            </div>
            <div className="grid grid-cols-3 border-b border-black/10" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn("border-b-[3px] py-4 text-[15px] font-semibold transition", tab === t.key ? "border-brand text-brand" : "border-transparent text-ink hover:text-brand")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto px-6 py-6">
              {tab === "consent" && (
                <>
                  <h2 id="cookie-title" className="text-[15px] font-bold">
                    Of course, like you, we prefer real cookies
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                    Those cookies allow us to personalise content and to analyse our traffic. We also share information about your use of our site with our partners (social media, ad personalisation and analytics).{" "}
                    <Link href="/privacy#cookies" className="font-semibold text-brand hover:underline">
                      Cookie management policy
                    </Link>
                    .
                  </p>
                </>
              )}
              {tab === "details" && (
                <div className="divide-y divide-black/10">
                  {CATEGORIES.map((c) => {
                    const locked = c.key === "necessary";
                    const on = locked ? true : choice[c.key as keyof Choice];
                    return (
                      <div key={c.key} className="flex items-start justify-between gap-6 py-4 first:pt-0">
                        <div>
                          <p className="text-[15px] font-bold">{c.title}</p>
                          <p className="mt-1 text-sm text-ink-soft">{c.text}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-label={`${c.title} cookies`}
                          disabled={locked}
                          onClick={() => setChoice((x) => ({ ...x, [c.key]: !x[c.key as keyof Choice] }))}
                          className={cn("relative mt-1 h-7 w-12 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-black/20", locked && "opacity-60")}
                        >
                          <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", on ? "left-6" : "left-1")} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {tab === "about" && (
                <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
                  <p>Cookies are small text files that websites store on your device. Ginnara Cleaning Service uses them to keep you signed in, remember your booking in progress and, with your permission, measure and improve our service.</p>
                  <p>You can change your choice at any time using “Cookie settings” at the bottom of every page.</p>
                  {consent.decidedAt && <p className="text-sm">Your current choice was saved on {formatDateTime(consent.decidedAt)}.</p>}
                  <p className="text-sm">
                    Demo note: this prototype stores your choice in your browser only and loads no third-party trackers.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 px-6 py-4">
              <button type="button" onClick={() => save({ preferences: false, statistics: false, marketing: false })} className="px-3 py-2 text-[15px] font-bold hover:underline">
                Refuse all
              </button>
              {tab === "details" ? (
                <button type="button" onClick={() => save(choice)} className="rounded-full border border-ink px-5 py-2 text-[15px] font-bold hover:bg-white">
                  Allow selection
                </button>
              ) : (
                <button type="button" onClick={() => setTab("details")} className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2 text-[15px] font-bold hover:bg-white">
                  Customize <ChevronRight className="size-4" />
                </button>
              )}
              <button type="button" onClick={() => save({ preferences: true, statistics: true, marketing: true })} className="bg-warm-gradient rounded-full px-6 py-2 text-[15px] font-bold text-white hover:brightness-105">
                Accept
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
