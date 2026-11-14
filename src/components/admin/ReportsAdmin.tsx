"use client";

import { CalendarCheck, Download, PoundSterling, Receipt, Repeat, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { DemoNote, PillTabs, Photo } from "@/components/common/ui";
import { BarChart, ProgressBar } from "@/components/dashboard/Charts";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { downloadCsv, logActivity } from "@/lib/admin";
import { PRO_SHARE } from "@/lib/pros";
import { addDays, fromISODate, gbp, gbp2, toISODate } from "@/lib/utils";

type Range = "30" | "90" | "365" | "all";

export function ReportsAdmin() {
  const bookings = useStore("bookings");
  const pros = useStore("pros");
  const services = useStore("services");
  const [range, setRange] = useState<Range>("365");

  const from = range === "all" ? "0000-00-00" : toISODate(addDays(new Date(), -Number(range)));
  const inRange = useMemo(() => bookings.filter((b) => b.date >= from), [bookings, from]);
  const live = inRange.filter((b) => b.status !== "cancelled");
  const revenue = live.reduce((s, b) => s + b.pricing.total, 0);
  const aov = live.length ? revenue / live.length : 0;
  const completionRate = inRange.length ? (inRange.filter((b) => b.status === "completed").length / inRange.length) * 100 : 0;
  const cancelRate = inRange.length ? (inRange.filter((b) => b.status === "cancelled").length / inRange.length) * 100 : 0;
  const byCustomer = new Map<string, number>();
  inRange.forEach((b) => byCustomer.set(b.customer.email.toLowerCase(), (byCustomer.get(b.customer.email.toLowerCase()) ?? 0) + 1));
  const repeat = [...byCustomer.values()].filter((n) => n > 1).length;

  const monthsBack = range === "30" ? 2 : range === "90" ? 4 : 12;
  const monthly = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (monthsBack - 1 - i), 1);
    const key = toISODate(d).slice(0, 7);
    return { label: d.toLocaleDateString("en-GB", { month: "short" }), value: Math.round(bookings.filter((b) => b.status !== "cancelled" && b.date.startsWith(key)).reduce((s, b) => s + b.pricing.total, 0)) };
  });

  const byService = services.map((s) => ({ name: s.name, value: live.filter((b) => b.serviceId === s.id).reduce((t, b) => t + b.pricing.total, 0), count: live.filter((b) => b.serviceId === s.id).length })).sort((a, b) => b.value - a.value);
  const cities = new Map<string, number>();
  live.forEach((b) => cities.set(b.address.city || "Other", (cities.get(b.address.city || "Other") ?? 0) + b.pricing.total));
  const byCity = [...cities.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({ label, value: live.filter((b) => (fromISODate(b.date).getDay() + 6) % 7 === i).length }));
  const topPros = pros
    .map((p) => {
      const done = inRange.filter((b) => b.proId === p.id && b.status === "completed");
      return { p, jobs: done.length, earned: done.reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0) };
    })
    .filter((x) => x.jobs > 0)
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 5);
  const maxService = Math.max(1, ...byService.map((s) => s.value));
  const maxCity = Math.max(1, ...byCity.map((c) => c.value));

  const exportCsv = () => {
    downloadCsv(`ginnara-report-${range}d-${toISODate(new Date())}.csv`, [
      ["Metric", "Value"],
      ["Period", range === "all" ? "All time" : `Last ${range} days`],
      ["Bookings", inRange.length],
      ["Revenue (£, excl. cancelled)", revenue.toFixed(2)],
      ["Average booking value (£)", aov.toFixed(2)],
      ["Completion rate (%)", completionRate.toFixed(1)],
      ["Cancellation rate (%)", cancelRate.toFixed(1)],
      ["Repeat customers", repeat],
      [],
      ["Service", "Bookings", "Revenue (£)"],
      ...byService.map((s) => [s.name, s.count, s.value.toFixed(2)]),
      [],
      ["City", "Revenue (£)"],
      ...byCity.map((c) => [c.name, c.value.toFixed(2)]),
    ]);
    logActivity("Reports", `Exported report (${range === "all" ? "all time" : `${range} days`})`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PillTabs value={range} onChange={setRange} tabs={[{ value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }, { value: "365", label: "Last 12 months" }, { value: "all", label: "All time" }]} />
        <Button size="sm" variant="soft" icon={<Download className="size-4" />} onClick={exportCsv}>
          Export report
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Revenue" value={gbp(Math.round(revenue))} icon={PoundSterling} tone="mint" />
        <StatCard label="Bookings" value={inRange.length} icon={CalendarCheck} />
        <StatCard label="Avg booking value" value={gbp2(aov)} icon={Receipt} tone="sky" />
        <StatCard label="Completion rate" value={`${completionRate.toFixed(0)}%`} icon={Repeat} tone="sun" hint={`${repeat} repeat customers`} />
        <StatCard label="Cancellation rate" value={`${cancelRate.toFixed(0)}%`} icon={XCircle} tone="blush" />
      </div>
      <Panel title="Revenue by month">
        <BarChart data={monthly} format={(n) => `£${n.toLocaleString()}`} height={240} color="#2e5ea8" />
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue by service">
          <ul className="space-y-3">
            {byService.map((s) => (
              <li key={s.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{s.name}</span>
                  <span>
                    {gbp2(s.value)} <span className="text-muted">· {s.count}</span>
                  </span>
                </div>
                <ProgressBar value={(s.value / maxService) * 100} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Revenue by city">
          <ul className="space-y-3">
            {byCity.map((c) => (
              <li key={c.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{c.name}</span>
                  <span>{gbp2(c.value)}</span>
                </div>
                <ProgressBar value={(c.value / maxCity) * 100} />
              </li>
            ))}
            {byCity.length === 0 && <li className="text-sm text-muted">No bookings in this period.</li>}
          </ul>
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Busiest days of the week">
          <BarChart data={weekday} format={(n) => String(n)} height={200} color="#2e8b3c" />
        </Panel>
        <Panel title="Top cleaners">
          {topPros.length ? (
            <ul className="divide-y divide-line">
              {topPros.map(({ p, jobs, earned }, i) => (
                <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-5 font-display text-lg font-extrabold text-muted">{i + 1}</span>
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
                    <Photo src={p.avatar} alt="" fill sizes="36px" />
                  </span>
                  <span className="flex-1 font-semibold">{p.name}</span>
                  <span className="text-ink-soft">
                    {jobs} jobs · {gbp2(earned)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No completed jobs in this period.</p>
          )}
        </Panel>
      </div>
      <DemoNote>Figures are calculated from the demo bookings stored in this browser.</DemoNote>
    </div>
  );
}
