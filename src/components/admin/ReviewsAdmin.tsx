"use client";

import { CheckCircle2, Eye, EyeOff, Hourglass, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Review } from "@/types";
import { ConfirmDialog } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, PillTabs, Stars } from "@/components/common/ui";
import { ProgressBar } from "@/components/dashboard/Charts";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { patch, removeWhere } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export function ReviewsAdmin() {
  const reviews = useStore("reviews");
  const services = useStore("services");
  const { success } = useToast();
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");
  const [deleting, setDeleting] = useState<Review | null>(null);
  const rows = (filter === "all" ? reviews : reviews.filter((r) => (filter === "published" ? r.published : !r.published))).slice().sort((a, b) => b.date.localeCompare(a.date));
  const published = reviews.filter((r) => r.published);
  const avg = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: published.filter((r) => r.rating === n).length }));
  const byService = services
    .map((s) => {
      const rs = published.filter((r) => r.service === s.name);
      return { name: s.name, count: rs.length, avg: rs.length ? rs.reduce((x, r) => x + r.rating, 0) / rs.length : 0 };
    })
    .filter((x) => x.count > 0);

  const toggle = (r: Review) => {
    patch("reviews", (x) => x.id === r.id, { published: !r.published });
    logActivity("Reviews", r.published ? "Hid review" : "Published review", `${r.name} — ${r.title}`);
    success(r.published ? "Review hidden from the website" : "Review published");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg ? `${avg.toFixed(2)} ★` : "—"} icon={Star} tone="sun" hint={`${published.length} published reviews`} />
        <StatCard label="Awaiting moderation" value={reviews.filter((r) => !r.published).length} icon={Hourglass} tone="blush" />
        <StatCard label="5-star share" value={published.length ? `${Math.round((dist[0].c / published.length) * 100)}%` : "—"} icon={CheckCircle2} tone="mint" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Rating breakdown">
          <ul className="space-y-2">
            {dist.map((d) => (
              <li key={d.n} className="flex items-center gap-3 text-sm">
                <span className="w-8 font-semibold">{d.n}★</span>
                <ProgressBar value={published.length ? (d.c / published.length) * 100 : 0} className="flex-1" />
                <span className="w-6 text-right text-muted">{d.c}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="By service">
          <ul className="divide-y divide-line">
            {byService.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold">{s.name}</span>
                <span className="flex items-center gap-2">
                  <Stars value={s.avg} size={13} /> {s.avg.toFixed(1)} <span className="text-muted">({s.count})</span>
                </span>
              </li>
            ))}
            {byService.length === 0 && <li className="py-2 text-sm text-muted">No published reviews yet.</li>}
          </ul>
        </Panel>
      </div>
      <Panel>
        <PillTabs className="mb-5" value={filter} onChange={setFilter} tabs={[{ value: "all", label: "All", count: reviews.length }, { value: "published", label: "Published", count: published.length }, { value: "pending", label: "Awaiting moderation", count: reviews.length - published.length }]} />
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          searchText={(r) => `${r.name} ${r.title} ${r.text} ${r.service} ${r.city} ${r.proName}`}
          searchPlaceholder="Search reviews"
          columns={[
            { key: "rating", header: "Rating", sortValue: (r) => r.rating, render: (r) => <Stars value={r.rating} size={14} /> },
            { key: "review", header: "Review", render: (r) => <div className="max-w-sm"><p className="font-semibold">{r.title}</p><p className="line-clamp-2 text-xs text-ink-soft">{r.text}</p></div> },
            { key: "who", header: "Customer", render: (r) => <span>{r.name}<br /><span className="text-xs text-muted">{r.city}</span></span> },
            { key: "service", header: "Service / Cleaner", render: (r) => <span className="text-xs">{r.service}<br />{r.proName}</span> },
            { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDate(r.date, { day: "numeric", month: "short" }) },
            { key: "status", header: "Status", render: (r) => (r.published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Pending</Badge>) },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-1">
                  <IconButton label={r.published ? "Unpublish" : "Publish"} tone={r.published ? "default" : "success"} onClick={() => toggle(r)}>
                    {r.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setDeleting(r)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      </Panel>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete review?"
        description={`"${deleting?.title}" by ${deleting?.name} will be permanently removed.`}
        confirmLabel="Delete review"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("reviews", (x) => x.id === deleting.id);
          logActivity("Reviews", "Deleted review", `${deleting.name} — ${deleting.title}`);
          success("Review deleted");
        }}
      />
    </div>
  );
}
