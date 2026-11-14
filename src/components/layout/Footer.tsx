"use client";

import { ArrowRight, Mail, Globe, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { openCookieSettings } from "@/components/common/CookieConsent";
import { useActiveServices, useStore } from "@/hooks/useStore";
import { CITIES } from "@/data/mock-cities";
import { serviceHref } from "@/lib/routes";
import { insert } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useToast } from "@/components/common/Toast";
import { emailField } from "@/lib/validation";
import { notify } from "@/lib/admin";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { success } = useToast();
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const r = emailField.safeParse(email);
        if (!r.success) return setError(r.error.issues[0].message);
        insert("contacts", { id: uid("msg"), name: "Newsletter subscriber", email, topic: "Newsletter", message: "Subscribed to monthly cleaning tips from the footer form.", createdAt: new Date().toISOString(), status: "new", type: "newsletter" });
        notify({ type: "enquiry", title: "Newsletter sign-up", body: `${email} subscribed to the newsletter.`, section: "enquiries" });
        setEmail("");
        setError("");
        success("You're subscribed!", "Monthly cleaning tips are on their way (demo).");
      }}
      className="w-full"
    >
      <label htmlFor="newsletter" className="mb-2 block text-sm font-semibold text-white">
        Cleaning tips & offers, monthly
      </label>
      <div className="flex gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/15 focus-within:ring-white/40">
        <input id="newsletter" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/50 focus:outline-none" />
        <button type="submit" aria-label="Subscribe" className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-brand-dark">
          <ArrowRight className="size-4" />
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-blush">{error}</p>}
    </form>
  );
}

export function Footer() {
  const services = useActiveServices();
  const settings = useStore("settings");
  const col = "space-y-2.5 text-[15px] text-white/70";
  const head = "mb-4 text-sm font-bold tracking-wide text-white uppercase";
  const link = "transition hover:text-white";

  return (
    <footer className="bg-ink text-white">
      <div className="container-site py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm space-y-6">
            <Logo light imgClassName="h-24 lg:h-28" />
            <p className="text-[15px] leading-relaxed text-white/70">Ginnara Cleaning Service London — leave the dirty work to us and enjoy a spotless home or office today. Residential, office, deep, move-in/move-out and special event cleaning.</p>
            <Newsletter />
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div>
              <p className={head}>Services</p>
              <ul className={col}>
                <li>
                  <Link className={link} href="/domestic-cleaning">
                    All cleaning services
                  </Link>
                </li>
                {services.slice(0, 7).map((s) => (
                  <li key={s.id}>
                    <Link className={link} href={serviceHref(s.slug)}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={head}>Cities</p>
              <ul className={col}>
                {CITIES.map((c) => (
                  <li key={c.slug}>
                    <Link className={link} href={`/cleaning/${c.slug}`}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={head}>Company</p>
              <ul className={col}>
                {[
                  ["/about", "About us"],
                  ["/how-it-works", "How it works"],
                  ["/reviews", "Reviews"],
                  ["/blog", "The mag"],
                  ["/pro/login", "Pro sign in"],
                  ["/admin", "Admin (demo)"],
                ].map(([h, l]) => (
                  <li key={h}>
                    <Link className={link} href={h}>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={head}>Support</p>
              <ul className={col}>
                {[
                  ["/help", "Help centre"],
                  ["/faq", "FAQs"],
                  ["/contact", "Contact us"],
                  ["/account", "My account"],
                  ["/terms", "Terms"],
                  ["/privacy", "Privacy"],
                ].map(([h, l]) => (
                  <li key={h}>
                    <Link className={link} href={h}>
                      {l}
                    </Link>
                  </li>
                ))}
                <li>
                  <button type="button" className={link} onClick={openCookieSettings}>
                    Cookie settings
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 border-t border-white/10 pt-8 text-sm text-white/70 sm:grid-cols-3">
          <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 hover:text-white">
            <Mail className="size-4" /> {settings.supportEmail}
          </a>
          <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white">
            <Phone className="size-4" /> {settings.supportPhone} (Mon–Sat, 8am–8pm)
          </a>
          <span className="flex items-center gap-2">
            <Globe className="size-4" /> www.ginnaracleaning.com · London
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ginnara Cleaning Service, London. Frontend demo — no real bookings or payments are processed.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" /> Every booking insured up to £5m (demo)
          </p>
        </div>
      </div>
    </footer>
  );
}
