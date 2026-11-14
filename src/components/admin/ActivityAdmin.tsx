"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge } from "@/components/common/ui";
import { DataTable } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useSession, useStore } from "@/hooks/useStore";
import { downloadCsv, logActivity } from "@/lib/admin";
import { write } from "@/lib/storage";
import { formatDateTime, initials, toISODate } from "@/lib/utils";

export function ActivityAdmin() {
  const activity = useStore("activity");
  const admins = useStore("admins");
  const session = useSession();
  const { success } = useToast();
  const [category, setCategory] = useState("all");
  const [actor, setActor] = useState("all");
  const [clearing, setClearing] = useState(false);
  const me = admins.find((a) => a.id === session.adminId);
  const categories = Array.from(new Set(activity.map((a) => a.category))).sort();
  const actors = Array.from(new Map(activity.map((a) => [a.actorId, a.actorName])).entries());
  const rows = activity.filter((a) => (category === "all" || a.category === category) && (actor === "all" || a.actorId === actor)).sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Panel>
      <DataTable
        rows={rows}
        rowKey={(a) => a.id}
        pageSize={15}
        searchText={(a) => `${a.actorName} ${a.category} ${a.action} ${a.target ?? ""}`}
        searchPlaceholder="Search activity"
        emptyTitle="No activity recorded yet"
        toolbar={
          <>
            <select aria-label="Filter by area" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-full border border-line bg-white px-3 text-sm font-semibold">
              <option value="all">All areas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select aria-label="Filter by user" value={actor} onChange={(e) => setActor(e.target.value)} className="h-9 rounded-full border border-line bg-white px-3 text-sm font-semibold">
              <option value="all">All users</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="soft"
              icon={<Download className="size-4" />}
              onClick={() => {
                downloadCsv(`ginnara-activity-${toISODate(new Date())}.csv`, [["When", "User", "Area", "Action", "Target"], ...rows.map((a) => [a.at, a.actorName, a.category, a.action, a.target ?? ""])]);
              }}
            >
              Export CSV
            </Button>
            {me?.role === "owner" && (
              <Button size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => setClearing(true)}>
                Clear log
              </Button>
            )}
          </>
        }
        columns={[
          { key: "at", header: "When", sortValue: (a) => a.at, render: (a) => <span className="text-xs whitespace-nowrap">{formatDateTime(a.at)}</span> },
          {
            key: "who",
            header: "User",
            sortValue: (a) => a.actorName,
            render: (a) => (
              <span className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-[10px] font-bold">{initials(a.actorName)}</span>
                {a.actorName}
              </span>
            ),
          },
          { key: "cat", header: "Area", sortValue: (a) => a.category, render: (a) => <Badge>{a.category}</Badge> },
          { key: "action", header: "Action", render: (a) => a.action },
          { key: "target", header: "Target", render: (a) => <span className="text-ink-soft">{a.target ?? "—"}</span> },
        ]}
      />
      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        title="Clear the activity log?"
        description="All recorded admin actions will be deleted. This can't be undone."
        confirmLabel="Clear log"
        onConfirm={() => {
          write("activity", []);
          logActivity("Settings", "Cleared the activity log");
          success("Activity log cleared");
        }}
      />
    </Panel>
  );
}
