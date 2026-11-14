"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Pro } from "@/types";
import { Button } from "@/components/common/Button";
import { Input, Select, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, Photo, PillTabs, Stars, StatusBadge } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { EXPERIENCE } from "@/components/pro/ProForms";
import { useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { PRO_SHARE, randomAvatar } from "@/lib/pros";
import { insert, patch, removeWhere } from "@/lib/storage";
import { emailField, nameField, phoneField, postcodeField } from "@/lib/validation";
import { cn, formatDate, formatDateTime, gbp2, toISODate, uid } from "@/lib/utils";

const proSchema = z.object({ name: nameField, email: emailField, phone: phoneField, postcode: postcodeField, experience: z.string().min(1, "Select experience"), qualifications: z.string().min(3, "Required"), bio: z.string().min(10, "At least 10 characters") });
type ProForm = z.infer<typeof proSchema>;

export function ProsAdmin() {
  const pros = useStore("pros");
  const services = useStore("services");
  const bookings = useStore("bookings");
  const { success, info } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Pro | null>(null);
  const rows = filter === "all" ? pros : pros.filter((p) => p.status === filter);
  const viewing = pros.find((p) => p.id === viewingId) ?? null;

  const owedOf = (p: Pro) =>
    bookings.filter((b) => b.proId === p.id && b.status === "completed" && (!p.lastPayoutAt || b.date > p.lastPayoutAt.slice(0, 10))).reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0);

  const setStatus = (p: Pro, status: Pro["status"]) => {
    patch("pros", (x) => x.id === p.id, { status });
    logActivity("Professionals", status === "approved" ? "Approved professional" : "Rejected professional", p.name);
    if (status === "approved") success(`${p.name} approved`, "They can now receive bookings.");
    else info(`${p.name} rejected`);
  };

  return (
    <Panel>
      <PillTabs className="mb-5" value={filter} onChange={setFilter} tabs={(["all", "pending", "approved", "rejected"] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: s === "all" ? pros.length : pros.filter((p) => p.status === s).length }))} />
      <DataTable
        rows={rows}
        rowKey={(p) => p.id}
        searchText={(p) => `${p.name} ${p.email} ${p.postcode}`}
        searchPlaceholder="Search professionals"
        toolbar={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>Add professional</Button>}
        columns={[
          {
            key: "name",
            header: "Professional",
            sortValue: (p) => p.name,
            render: (p) => (
              <button onClick={() => setViewingId(p.id)} className="flex items-center gap-3 text-left">
                <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
                  <Photo src={p.avatar} alt="" fill sizes="36px" />
                </span>
                <span>
                  <span className="block font-semibold hover:underline">{p.name}</span>
                  <span className="text-xs text-muted">{p.email}</span>
                </span>
              </button>
            ),
          },
          { key: "area", header: "Postcode", render: (p) => p.postcode },
          { key: "services", header: "Services", render: (p) => <span className="text-xs text-ink-soft">{p.services.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ")}</span> },
          { key: "rating", header: "Rating", sortValue: (p) => p.rating, render: (p) => (p.rating ? `★ ${p.rating.toFixed(2)}` : "New") },
          { key: "jobs", header: "Jobs", sortValue: (p) => p.jobs, render: (p) => p.jobs },
          { key: "owed", header: "Owed", sortValue: (p) => owedOf(p), render: (p) => gbp2(owedOf(p)) },
          { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (p) => (
              <div className="flex justify-end gap-1">
                <IconButton label="View" onClick={() => setViewingId(p.id)}>
                  <Eye className="size-4" />
                </IconButton>
                {p.status !== "approved" && (
                  <IconButton label="Approve" tone="success" onClick={() => setStatus(p, "approved")}>
                    <Check className="size-4" />
                  </IconButton>
                )}
                {p.status !== "rejected" && (
                  <IconButton label="Reject" tone="danger" onClick={() => setStatus(p, "rejected")}>
                    <X className="size-4" />
                  </IconButton>
                )}
                <IconButton label="Delete" tone="danger" onClick={() => setDeleting(p)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />

      {viewing && <ProDetail pro={viewing} owed={owedOf(viewing)} onClose={() => setViewingId(null)} onStatus={(s) => setStatus(viewing, s)} />}
      {adding && <ProModal onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete professional?"
        description={`${deleting?.name} will be removed from the platform.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("pros", (p) => p.id === deleting.id);
          logActivity("Professionals", "Deleted professional", deleting.name);
          success("Professional deleted");
        }}
      />
    </Panel>
  );
}

function ProDetail({ pro, owed, onClose, onStatus }: { pro: Pro; owed: number; onClose: () => void; onStatus: (s: Pro["status"]) => void }) {
  const bookings = useStore("bookings").filter((b) => b.proId === pro.id);
  const reviews = useStore("reviews").filter((r) => r.proId === pro.id && r.published);
  const { success } = useToast();
  const today = toISODate(new Date());
  const upcoming = bookings.filter((b) => b.date >= today && (b.status === "confirmed" || b.status === "pending")).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const completed = bookings.filter((b) => b.status === "completed");
  const earned = completed.reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0);
  return (
    <Modal
      open
      onClose={onClose}
      title="Professional profile"
      size="lg"
      footer={
        <>
          {pro.status !== "rejected" && (
            <Button variant="outline" onClick={() => onStatus("rejected")}>
              Reject
            </Button>
          )}
          {pro.status !== "approved" && <Button onClick={() => onStatus("approved")}>Approve</Button>}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="relative size-20 overflow-hidden rounded-full">
            <Photo src={pro.avatar} alt="" fill sizes="80px" />
          </span>
          <div>
            <p className="text-xl font-extrabold">{pro.name}</p>
            <p className="text-sm text-muted">
              {pro.email} · {pro.phone}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={pro.status} />
              {pro.rating > 0 && <Stars value={pro.rating} size={14} />}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Jobs done", pro.jobs],
            ["Upcoming", upcoming.length],
            ["Earned (demo)", gbp2(earned)],
            ["Payout owed", gbp2(owed)],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-2xl bg-cream-2 p-3">
              <p className="text-xs text-muted">{l}</p>
              <p className="font-display text-xl font-extrabold">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <p className="text-sm">
            <span className="font-semibold">Payouts</span> · last paid {pro.lastPayoutAt ? formatDateTime(pro.lastPayoutAt) : "never"} · cleaners keep {PRO_SHARE * 100}% of each booking
          </p>
          <Button
            size="sm"
            disabled={owed <= 0}
            onClick={() => {
              patch("pros", (p) => p.id === pro.id, { lastPayoutAt: new Date().toISOString() });
              logActivity("Payments", `Recorded payout of ${gbp2(owed)}`, pro.name);
              success("Payout recorded", `${gbp2(owed)} to ${pro.name} (simulated)`);
            }}
          >
            Record payout {owed > 0 && gbp2(owed)}
          </Button>
        </div>
        <dl className="grid gap-3 rounded-2xl bg-cream-2 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Postcode</dt>
            <dd className="font-semibold">{pro.postcode}</dd>
          </div>
          <div>
            <dt className="text-muted">Experience</dt>
            <dd className="font-semibold">{pro.experience}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Qualifications</dt>
            <dd className="font-semibold">{pro.qualifications}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Availability</dt>
            <dd className="flex flex-wrap gap-1.5 pt-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", pro.availability.includes(d) ? "bg-success/15 text-success" : "bg-white text-muted line-through")}>
                  {d}
                </span>
              ))}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Bio</dt>
            <dd>{pro.bio}</dd>
          </div>
        </dl>
        <div>
          <p className="mb-2 font-extrabold">Upcoming schedule</p>
          {upcoming.length ? (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {upcoming.slice(0, 6).map((b) => (
                <li key={b.ref} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="block font-semibold">
                      {formatDate(b.date, { weekday: "short", day: "numeric", month: "short" })} · {b.time}
                    </span>
                    <span className="text-muted">
                      {b.serviceName} · {b.customer.name} · {b.address.postcode}
                    </span>
                  </span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming jobs.</p>
          )}
        </div>
        <div>
          <p className="mb-2 font-extrabold">Reviews ({reviews.length})</p>
          {reviews.length ? (
            <ul className="space-y-2">
              {reviews.slice(0, 4).map((r) => (
                <li key={r.id} className="rounded-2xl border border-line p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} size={13} />
                    <span className="text-xs text-muted">{formatDate(r.date)}</span>
                  </div>
                  <p className="mt-1 font-semibold">{r.title}</p>
                  <p className="text-ink-soft">{r.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Badge>No published reviews yet</Badge>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ProModal({ onClose }: { onClose: () => void }) {
  const services = useStore("services");
  const { success } = useToast();
  const [svc, setSvc] = useState<string[]>([services[0]?.id ?? ""]);
  const { register, handleSubmit, formState } = useForm<ProForm>({ resolver: zodResolver(proSchema), defaultValues: { experience: "1-2 years" } });
  const save = handleSubmit((v) => {
    insert("pros", { ...v, id: uid("pro"), password: "Password1", services: svc, availability: ["Mon", "Tue", "Wed", "Thu", "Fri"], blockedDates: [], avatar: randomAvatar(), rating: 0, jobs: 0, status: "approved", createdAt: new Date().toISOString() });
    logActivity("Professionals", "Added professional", v.name);
    success("Professional added", "Created as approved. Demo password: Password1");
    onClose();
  });
  return (
    <Modal open onClose={onClose} title="Add professional" size="lg" footer={<Button onClick={save}>Add professional</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input label="Full name" error={formState.errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={formState.errors.email?.message} {...register("email")} />
        <Input label="Phone" error={formState.errors.phone?.message} {...register("phone")} />
        <Input label="Postcode" className="uppercase" error={formState.errors.postcode?.message} {...register("postcode")} />
        <Select label="Experience" options={EXPERIENCE.map((e) => ({ value: e, label: e }))} {...register("experience")} />
        <Input label="Qualifications" error={formState.errors.qualifications?.message} {...register("qualifications")} />
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold">Services</p>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button type="button" key={s.id} aria-pressed={svc.includes(s.id)} onClick={() => setSvc((x) => (x.includes(s.id) ? x.filter((y) => y !== s.id) : [...x, s.id]))} className={cn("rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold", svc.includes(s.id) ? "border-ink bg-ink text-white" : "border-line")}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <Textarea label="Bio" wrapClassName="sm:col-span-2" error={formState.errors.bio?.message} {...register("bio")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
