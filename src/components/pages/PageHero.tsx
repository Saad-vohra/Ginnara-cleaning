import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/services/ServicePage";
import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, intro, crumb, children, tone = "cream" }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; crumb: string; children?: ReactNode; tone?: "cream" | "ink" | "sun" }) {
  const bg = { cream: "bg-cream", ink: "bg-ink text-white", sun: "bg-sun" }[tone];
  return (
    <section className={cn("relative overflow-hidden", bg)}>
      <div className="absolute -top-24 -right-24 size-80 rounded-full bg-white/25" />
      <div className="container-site relative py-12 lg:py-20">
        <Breadcrumbs items={[{ label: crumb }]} light={tone === "ink"} />
        {eyebrow && <p className={cn("mt-6 text-[13px] font-bold tracking-[0.14em] uppercase", tone === "ink" ? "text-sun" : "text-brand")}>{eyebrow}</p>}
        <h1 className={cn("max-w-3xl text-[2.6rem] leading-[1] font-extrabold text-balance sm:text-6xl", eyebrow ? "mt-3" : "mt-6")}>{title}</h1>
        {intro && <p className={cn("mt-5 max-w-2xl text-lg", tone === "ink" ? "text-white/85" : "text-ink-soft")}>{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-5 text-[17px] leading-relaxed text-ink-soft [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>;
}
