"use client";

import { Bell, CalendarDays, CheckCheck, CreditCard, Inbox, Mail, MessageSquare, Pencil, Send, Star, Trash2, UserCog, Users } from "lucide-react";
import { useState } from "react";
import type { AppNotification, MessageTemplate } from "@/types";
import { Button } from "@/components/common/Button";
import { Input, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, DemoNote, EmptyState, PillTabs } from "@/components/common/ui";
import { IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { currentAdmin, logActivity, type AdminSection } from "@/lib/admin";
import { patch, removeWhere, update, write } from "@/lib/storage";
import { cn, formatDateTime } from "@/lib/utils";
import { Switch } from "./ServicesAdmin";

const ICONS: Record<AppNotification["type"], typeof Bell> = { booking: CalendarDays, enquiry: Inbox, pro: UserCog, review: Star, customer: Users, payment: CreditCard, system: Bell };

export function NotificationsAdmin({ onOpen }: { onOpen: (s: AdminSection) => void }) {
  const [tab, setTab] = useState<"inbox" | "templates">("inbox");
  const notifications = useStore("notifications");
  const templates = useStore("templates");
  return (
    <div className="space-y-5">
      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "inbox", label: "Notifications", count: notifications.filter((n) => !n.read).length },
          { value: "templates", label: "Email & SMS templates", count: templates.length },
        ]}
      />
      {tab === "inbox" ? <InboxList onOpen={onOpen} /> : <Templates />}
    </div>
  );
}

function InboxList({ onOpen }: { onOpen: (s: AdminSection) => void }) {
  const notifications = useStore("notifications");
  const { success } = useToast();
  const [type, setType] = useState<"all" | "unread" | AppNotification["type"]>("all");
  const [clearing, setClearing] = useState(false);
  const rows = notifications.filter((n) => (type === "all" ? true : type === "unread" ? !n.read : n.type === type));
  return (
    <Panel
      title="Notifications"
      action={
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter notifications" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-9 rounded-full border border-line bg-white px-3 text-sm font-semibold">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="booking">Bookings</option>
            <option value="enquiry">Enquiries</option>
            <option value="pro">Professionals</option>
            <option value="customer">Customers</option>
            <option value="review">Reviews</option>
            <option value="payment">Payments</option>
          </select>
          <Button size="sm" variant="soft" icon={<CheckCheck className="size-4" />} onClick={() => { update("notifications", (xs) => xs.map((n) => ({ ...n, read: true }))); success("All marked as read"); }}>
            Mark all read
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" disabled={!notifications.length} onClick={() => setClearing(true)}>
            Clear all
          </Button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title="No notifications" description="New bookings, enquiries, sign-ups and reviews from the website appear here automatically." />
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {rows.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <li key={n.id} className={cn("flex items-start gap-4 px-4 py-4", !n.read && "bg-brand/5")}>
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", n.read ? "bg-cream text-muted" : "bg-brand/10 text-brand")}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", n.read ? "font-semibold" : "font-bold")}>{n.title}</p>
                  <p className="text-sm text-ink-soft">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {n.section && (
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={() => {
                        patch("notifications", (x) => x.id === n.id, { read: true });
                        onOpen(n.section as AdminSection);
                      }}
                    >
                      Open
                    </Button>
                  )}
                  <IconButton label={n.read ? "Mark unread" : "Mark read"} onClick={() => patch("notifications", (x) => x.id === n.id, { read: !n.read })}>
                    <CheckCheck className={cn("size-4", n.read && "text-success")} />
                  </IconButton>
                  <IconButton label="Delete notification" tone="danger" onClick={() => removeWhere("notifications", (x) => x.id === n.id)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        title="Clear all notifications?"
        description="This removes every notification from the list."
        confirmLabel="Clear all"
        onConfirm={() => {
          write("notifications", []);
          logActivity("Notifications", "Cleared all notifications");
          success("Notifications cleared");
        }}
      />
    </Panel>
  );
}

const SAMPLE: Record<string, string> = { name: "Amelia", ref: "GN-7K2QXA", service: "Residential Cleaning", date: "Thu 20 Nov", time: "10:00", pro: "Zara M." };
const fill = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => SAMPLE[k] ?? `{{${k}}}`);

function Templates() {
  const templates = useStore("templates");
  const { success } = useToast();
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  return (
    <Panel title="Email & SMS templates">
      <DemoNote className="mb-5">Messages are simulated in this demo — nothing is actually emailed or texted.</DemoNote>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <div key={t.id} className="flex flex-col rounded-2xl border border-line p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-extrabold">
                  {t.channel === "email" ? <Mail className="size-4 text-brand" /> : <MessageSquare className="size-4 text-brand" />} {t.name}
                </p>
                <p className="text-xs text-muted">Sent when: {t.trigger}</p>
              </div>
              <Switch
                on={t.active}
                label={`Toggle ${t.name}`}
                onChange={() => {
                  patch("templates", (x) => x.id === t.id, { active: !t.active });
                  logActivity("Notifications", t.active ? "Disabled template" : "Enabled template", t.name);
                  success(t.active ? "Template disabled" : "Template enabled");
                }}
              />
            </div>
            {t.subject && <p className="mt-3 text-sm font-semibold">{fill(t.subject)}</p>}
            <p className="mt-1 line-clamp-3 flex-1 text-sm whitespace-pre-line text-ink-soft">{fill(t.body)}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="soft" icon={<Pencil className="size-4" />} onClick={() => setEditing(t)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<Send className="size-4" />}
                onClick={() => {
                  const me = currentAdmin();
                  logActivity("Notifications", "Sent test message", t.name);
                  success("Test sent (simulated)", `${t.channel === "email" ? "Email" : "SMS"} to ${me?.email ?? "you"}`);
                }}
              >
                Send test
              </Button>
              <Badge className="ml-auto self-center capitalize">{t.channel}</Badge>
            </div>
          </div>
        ))}
      </div>
      {editing && <TemplateModal t={editing} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function TemplateModal({ t, onClose }: { t: MessageTemplate; onClose: () => void }) {
  const { success } = useToast();
  const [subject, setSubject] = useState(t.subject);
  const [body, setBody] = useState(t.body);
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit: ${t.name}`}
      description={`${t.channel === "email" ? "Email" : "SMS"} · sent when ${t.trigger.toLowerCase()}`}
      size="lg"
      footer={
        <Button
          disabled={body.trim().length < 5}
          onClick={() => {
            patch("templates", (x) => x.id === t.id, { subject, body });
            logActivity("Notifications", "Edited template", t.name);
            success("Template saved");
            onClose();
          }}
        >
          Save template
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {t.channel === "email" && <Input label="Subject" name="tpl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />}
          <Textarea label="Message" name="tpl-body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} hint={t.channel === "sms" ? `${body.length} characters (SMS ≈ 160 per message)` : undefined} />
          <p className="text-xs text-muted">Placeholders: {"{{name}} {{ref}} {{service}} {{date}} {{time}} {{pro}}"}</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Preview</p>
          <div className="rounded-2xl border border-line bg-cream-2 p-4 text-sm">
            {t.channel === "email" && <p className="mb-2 border-b border-line pb-2 font-semibold">{fill(subject)}</p>}
            <p className="whitespace-pre-line">{fill(body)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
