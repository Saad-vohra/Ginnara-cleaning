"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, MapPin, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { DEMO_POSTCODES, CITIES } from "@/data/mock-cities";
import { useActiveServices } from "@/hooks/useStore";
import { bookingHref } from "@/lib/routes";
import { coveredAreaNames, isCovered, normalisePostcode, UK_POSTCODE } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface Props {
  defaultService?: string;
  hideService?: boolean;
  className?: string;
  compact?: boolean;
  ctaLabel?: string;
}

export function PostcodeSearch({ defaultService = "", hideService = false, className, compact, ctaLabel = "See prices" }: Props) {
  const router = useRouter();
  const services = useActiveServices();
  const [service, setService] = useState(defaultService);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pcs = DEMO_POSTCODES.map((p) => ({ value: p.postcode, label: p.postcode, sub: p.area }));
    const cities = CITIES.map((c) => ({ value: DEMO_POSTCODES.find((d) => d.area.includes(c.name))?.postcode ?? "", label: c.name, sub: `${c.pros.toLocaleString()} pros nearby` }));
    if (!q) return pcs.slice(0, 5);
    return [...pcs, ...cities].filter((s) => s.value && (s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q))).slice(0, 6);
  }, [query]);

  const validNow = UK_POSTCODE.test(query.trim());

  const go = (value: string) => {
    const pc = normalisePostcode(value);
    if (!UK_POSTCODE.test(pc)) {
      setError("Enter a full UK postcode, e.g. SW4 7AA");
      inputRef.current?.focus();
      return;
    }
    if (!isCovered(pc)) {
      setError(`We don't cover ${pc.split(" ")[0]} yet. Areas we cover: ${coveredAreaNames().join(", ")}.`);
      return;
    }
    setError("");
    setSubmitting(true);
    router.push(bookingHref({ service: service || undefined, postcode: pc }));
  };

  const showList = focused && suggestions.length > 0 && !validNow;

  return (
    <div className={cn("w-full", className)}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (showList && suggestions[active] && !validNow && query.trim()) go(suggestions[active].value);
          else go(query);
        }}
        className={cn("relative flex flex-col gap-2 rounded-[28px] bg-white p-2 shadow-lift sm:flex-row sm:items-center sm:rounded-full", compact && "shadow-soft ring-1 ring-line")}
      >
        {!hideService && (
          <label className="relative flex items-center sm:w-56 sm:shrink-0 sm:border-r sm:border-line">
            <Sparkles className="pointer-events-none absolute left-4 size-5 text-brand" />
            <span className="sr-only">Service</span>
            <select value={service} onChange={(e) => setService(e.target.value)} className="h-12 w-full appearance-none rounded-full bg-transparent pr-4 pl-12 text-[15px] font-semibold text-ink focus:outline-none">
              <option value="">Any cleaning</option>
              {services.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.toUpperCase());
              setActive(0);
              setError("");
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (!showList) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Escape") setFocused(false);
            }}
            placeholder="Enter your postcode"
            aria-label="Postcode"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showList}
            role="combobox"
            autoComplete="postal-code"
            className="h-12 w-full rounded-full bg-transparent pr-10 pl-12 text-[15px] font-medium text-ink uppercase placeholder:text-muted placeholder:normal-case focus:outline-none"
          />
          {validNow && <Check className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-success" />}
          <AnimatePresence>
            {showList && (
              <motion.ul
                id={listId}
                role="listbox"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[calc(100%+12px)] right-0 left-0 z-30 overflow-hidden rounded-2xl border border-line bg-white p-1.5 text-left shadow-lift sm:-left-2"
              >
                <li className="px-3 pt-1.5 pb-1 text-[11px] font-bold tracking-wider text-muted uppercase">{query ? "Suggestions" : "Popular demo postcodes"}</li>
                {suggestions.map((s, i) => (
                  <li key={s.label + s.value} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQuery(s.value);
                        setFocused(false);
                        go(s.value);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === active && "bg-cream")}
                    >
                      <span className="grid size-8 place-items-center rounded-full bg-cream-2 text-brand">
                        <MapPin className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink">{s.label}</span>
                        <span className="block text-xs text-muted">{s.sub}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <button type="submit" disabled={submitting} className="bg-brand-gradient inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 font-semibold text-white shadow-[0_8px_20px_-8px_rgb(242_96_43/0.7)] transition hover:brightness-105 disabled:opacity-70">
          {submitting ? "Checking…" : ctaLabel}
          {submitting ? <Search className="size-4 animate-pulse" /> : <ArrowRight className="size-4" />}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 rounded-2xl bg-white/95 px-4 py-2 text-sm font-medium text-danger shadow-soft">
          {error}
        </p>
      )}
    </div>
  );
}
