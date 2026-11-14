"use client";

import { CheckCircle2, Download, Inbox, Mail, MessageSquareQuote, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ContactMessage } from "@/types";
import { Button, LinkButton } from "@/components/common/Button";
import { Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, PillTabs, StatusBadge } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { currentAdmin, downloadCsv, logActivity } from "@/lib/admin";
import { patch, removeWhere } from "@/lib/storage";
import { cn, formatDateTime, toISODate } from "@/lib/utils";

type Kind = "all" | "contact" | "quote" | "newsletter";
const kindOf = (c: ContactMessage): Exclude<Kind, "all"> => c.type ?? (c.topic === "Newsletter" ? "newsletter" : c.topic === "Pricing & quotes" ? "quote" : "contact");
const KIND_LABEL = { contact: "Message", quote: "Quote request", newsletter: "Newsletter" } as const;

export function EnquiriesAdmin() {
  const contacts = useStore("contacts");
  const { success } = useToast();
  const [kind, setKind] = useState<Kind>("all");
  const [status, setStatus] = useState<"all" | ContactMessage["status"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const rows = contacts.filter((c) => (kind === "all" || kindOf(c) === kind) && (status === "all" || c.status === status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = contacts.find((c) => c.id === openId) ?? null;

  const openMessage = (c: ContactMessage) => {
    setOpenId(c.id);
    if (c.status === "new") patch("contacts", (x) => x.id === c.id, { status: "read" });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New" value={contacts.filter((c) => c.status === "new").length} icon={Inbox} />
        <StatCard label="Open quote requests" value={contacts.filter((c) => kindOf(c) === "quote" && c.status !== "closed" && c.status !== "replied").length} icon={MessageSquareQuote} tone="sun" />
        <StatCard label="Replied" value={contacts.filter((c) => c.status === "replied").length} icon={CheckCircle2} tone="mint" />
        <StatCard label="Newsletter subscribers" value={contacts.filter((c) => kindOf(c) === "newsletter").length} icon={Mail} tone="sky" />
      </div>
      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <PillTabs value={kind} onChange={setKind} tabs={(["all", "quote", "contact", "newsletter"] as const).map((k) => ({ value: k, label: k === "all" ? "All" : KIND_LABEL[k], count: k === "all" ? contacts.length : contacts.filter((c) => kindOf(c) === k).length }))} />
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-full border border-line bg-white px-3 text-sm font-semibold">
            <option value="all">Any status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <DataTable
          rows={rows}
          rowKey={(c) => c.id}
          searchText={(c) => `${c.name} ${c.email} ${c.topic} ${c.message}`}
          searchPlaceholder="Search enquiries"
          emptyTitle="No enquiries"
          toolbar={
            <Button
              size="sm"
              variant="soft"
              icon={<Download className="size-4" />}
              onClick={() => {
                downloadCsv(`ginnara-enquiries-${toISODate(new Date())}.csv`, [["Date", "Type", "Name", "Email", "Phone", "Topic", "Status", "Message"], ...rows.map((c) => [c.createdAt.slice(0, 16).replace("T", " "), KIND_LABEL[kindOf(c)], c.name, c.email, c.phone ?? "", c.topic, c.status, c.message])]);
                logActivity("Enquiries", `Exported ${rows.length} enquiries to CSV`);
              }}
            >
              Export CSV
            </Button>
          }
          columns={[
            {
              key: "from",
              header: "From",
              sortValue: (c) => c.name,
              render: (c) => (
                <button onClick={() => openMessage(c)} className="text-left">
                  <span className={cn("block hover:underline", c.status === "new" ? "font-bold" : "font-semibold")}>{c.name}</span>
                  <span className="text-xs text-muted">{c.email}</span>
                </button>
              ),
            },
            { key: "type", header: "Type", render: (c) => <Badge tone={kindOf(c) === "quote" ? "warning" : kindOf(c) === "newsletter" ? "info" : "neutral"}>{KIND_LABEL[kindOf(c)]}</Badge> },
            { key: "msg", header: "Message", render: (c) => <span className="line-clamp-2 max-w-sm text-xs text-ink-soft">{c.message}</span> },
            { key: "date", header: "Received", sortValue: (c) => c.createdAt, render: (c) => <span className="text-xs">{formatDateTime(c.createdAt)}</span> },
            { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (c) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="soft" onClick={() => openMessage(c)}>
                    Open
                  </Button>
                  <IconButton label="Delete" tone="danger" onClick={() => setDeleting(c)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      </Panel>
      {open && <EnquiryModal msg={open} onClose={() => setOpenId(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete enquiry?"
        description={`The message from ${deleting?.name} will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("contacts", (x) => x.id === deleting.id);
          logActivity("Enquiries", "Deleted enquiry", deleting.name);
          success("Enquiry deleted");
        }}
      />
    </div>
  );
}

function EnquiryModal({ msg, onClose }: { msg: ContactMessage; onClose: () => void }) {
  const { success } = useToast();
  const [note, setNote] = useState("");
  const setStatus = (status: ContactMessage["status"], label: string) => {
    patch("contacts", (c) => c.id === msg.id, { status });
    logActivity("Enquiries", label, msg.name);
    success(label);
  };
  const subject = encodeURIComponent(`Re: ${msg.topic} — Ginnara Cleaning`);
  return (
    <Modal
      open
      onClose={onClose}
      title={msg.topic}
      description={`${msg.name} · ${formatDateTime(msg.createdAt)}`}
      size="lg"
      footer={
        <>
          {msg.status !== "closed" ? (
            <Button variant="ghost" onClick={() => setStatus("closed", "Closed enquiry")}>
              Close
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setStatus("read", "Reopened enquiry")}>
              Reopen
            </Button>
          )}
          {msg.status !== "replied" && (
            <Button variant="outline" onClick={() => setStatus("replied", "Marked enquiry as replied")}>
              Mark as replied
            </Button>
          )}
          <LinkButton href={`mailto:${msg.email}?subject=${subject}`} icon={<Mail className="size-4" />} onClick={() => msg.status !== "replied" && setStatus("replied", "Replied to enquiry by email")}>
            Reply by email
          </LinkButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone={kindOf(msg) === "quote" ? "warning" : "neutral"}>{KIND_LABEL[kindOf(msg)]}</Badge>
          <StatusBadge status={msg.status} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href={`mailto:${msg.email}`} className="flex items-center gap-1.5 font-semibold text-brand hover:underline">
            <Mail className="size-4" /> {msg.email}
          </a>
          {msg.phone && (
            <a href={`tel:${msg.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 font-semibold text-brand hover:underline">
              <Phone className="size-4" /> {msg.phone}
            </a>
          )}
        </div>
        <p className="rounded-2xl bg-cream-2 p-4 text-[15px] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        <div>
          <p className="mb-2 font-extrabold">Internal notes</p>
          {msg.notes?.length ? (
            <ul className="mb-3 space-y-2">
              {msg.notes.map((n, i) => (
                <li key={i} className="rounded-xl border border-line p-3 text-sm">
                  <p>{n.text}</p>
                  <p className="mt-1 text-xs text-muted">
                    {n.by} · {formatDateTime(n.at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-muted">No notes yet. Notes are only visible to your team.</p>
          )}
          <Textarea name="enquiry-note" label="Add a note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called back, quoted £120 for 6 hours…" />
          <Button
            size="sm"
            className="mt-2"
            disabled={note.trim().length < 2}
            onClick={() => {
              const by = currentAdmin()?.name ?? "Admin";
              patch("contacts", (c) => c.id === msg.id, { notes: [...(msg.notes ?? []), { at: new Date().toISOString(), by, text: note.trim() }] });
              logActivity("Enquiries", "Added note", msg.name);
              setNote("");
              success("Note added");
            }}
          >
            Add note
          </Button>
        </div>
      </div>
    </Modal>
  );
}
