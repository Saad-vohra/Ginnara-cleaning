"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceExtra, ServicePackage } from "@/types";
import { Button } from "@/components/common/Button";
import { Input, Select, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, DemoNote, EmptyState, PillTabs } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { insert, patch, removeWhere, write } from "@/lib/storage";
import { gbp2, uid } from "@/lib/utils";
import { Switch, slugify } from "./ServicesAdmin";

type Tab = "rates" | "extras" | "discounts" | "packages";

export function PricingAdmin() {
  const [tab, setTab] = useState<Tab>("rates");
  return (
    <div className="space-y-5">
      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "rates", label: "Service rates" },
          { value: "extras", label: "Extras & add-ons" },
          { value: "discounts", label: "Discounts & fees" },
          { value: "packages", label: "Packages" },
        ]}
      />
      {tab === "rates" && <Rates />}
      {tab === "extras" && <Extras />}
      {tab === "discounts" && <Discounts />}
      {tab === "packages" && <Packages />}
    </div>
  );
}

/* ---------------- Rates ---------------- */
function Rates() {
  const services = useStore("services");
  const { success } = useToast();
  const [draft, setDraft] = useState<Record<string, { rate: string; min: string; oneOff?: string }>>({});
  const val = (id: string, k: "rate" | "min" | "oneOff", fallback: number) => draft[id]?.[k] ?? String(fallback);
  const hourly = services.filter((s) => s.bookingMode !== "quote" && !s.packages?.length);
  const fixed = services.filter((s) => s.packages?.length);
  const quote = services.filter((s) => s.bookingMode === "quote");
  return (
    <>
    <Panel title="Hourly rates & minimum hours">
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-cream-2 text-left text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Regular rate (£/h)</th>
              <th className="px-4 py-3">One-off rate (£/h)</th>
              <th className="px-4 py-3">Minimum hours</th>
              <th className="px-4 py-3">Minimum booking</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {hourly.map((s) => {
              const rate = Number(val(s.id, "rate", s.hourlyRate));
              const min = Number(val(s.id, "min", s.minHours));
              const oneOff = Number(val(s.id, "oneOff", s.oneOffRate ?? 0));
              const changed = rate !== s.hourlyRate || min !== s.minHours || oneOff !== (s.oneOffRate ?? 0);
              const invalid = !(rate >= 5 && rate <= 80) || !(min >= 1 && min <= 8) || !(oneOff === 0 || (oneOff >= 5 && oneOff <= 80));
              const set = (k: "rate" | "min" | "oneOff", v: string) => setDraft((d) => ({ ...d, [s.id]: { rate: val(s.id, "rate", s.hourlyRate), min: val(s.id, "min", s.minHours), oneOff: val(s.id, "oneOff", s.oneOffRate ?? 0), [k]: v } }));
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-semibold">{s.name}</td>
                  <td className="px-4 py-3">
                    <input aria-label={`${s.name} rate`} type="number" step="0.1" value={val(s.id, "rate", s.hourlyRate)} onChange={(e) => set("rate", e.target.value)} className="h-10 w-24 rounded-xl border-[1.5px] border-line px-3 focus:border-ink focus:outline-none" />
                  </td>
                  <td className="px-4 py-3">
                    <input aria-label={`${s.name} one-off rate`} type="number" step="0.1" value={val(s.id, "oneOff", s.oneOffRate ?? 0)} onChange={(e) => set("oneOff", e.target.value)} className="h-10 w-24 rounded-xl border-[1.5px] border-line px-3 focus:border-ink focus:outline-none" />
                  </td>
                  <td className="px-4 py-3">
                    <input aria-label={`${s.name} minimum hours`} type="number" step="0.5" value={val(s.id, "min", s.minHours)} onChange={(e) => set("min", e.target.value)} className="h-10 w-20 rounded-xl border-[1.5px] border-line px-3 focus:border-ink focus:outline-none" />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{invalid ? "—" : gbp2(rate * min)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      disabled={!changed || invalid}
                      onClick={() => {
                        patch("services", (x) => x.id === s.id, { hourlyRate: rate, minHours: min, oneOffRate: oneOff > 0 ? oneOff : undefined });
                        logActivity("Pricing", `Set ${s.name} to ${gbp2(rate)}/h${oneOff > 0 ? ` (one-off ${gbp2(oneOff)}/h)` : ""}, min ${min}h`, s.name);
                        setDraft((d) => {
                          const n = { ...d };
                          delete n[s.id];
                          return n;
                        });
                        success("Price updated", `${s.name}: ${gbp2(rate)}/h — live on the website`);
                      }}
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DemoNote className="mt-4">Rates must be between £5 and £80 per hour. One-off rate applies to “Just once” bookings; set 0 to use the regular rate. Changes apply immediately to service pages and the booking form.</DemoNote>
    </Panel>
    {fixed.map((s) => (
      <FixedPrices key={s.id} serviceId={s.id} />
    ))}
    {quote.length > 0 && (
      <Panel title="WhatsApp-quote services">
        <p className="text-sm text-ink-soft">
          {quote.map((s) => s.name).join(", ")} can&apos;t be booked online — customers see “WhatsApp us for a quote” and “Call” buttons instead. Change this per service in Services &amp; Categories, and the WhatsApp number in Pages &amp; Content → Contact details.
        </p>
      </Panel>
    )}
    </>
  );
}

/* ---------------- Extras ---------------- */
function Extras() {
  const extras = useStore("extras");
  const services = useStore("services");
  const { success } = useToast();
  const [editing, setEditing] = useState<ServiceExtra | "new" | null>(null);
  const [deleting, setDeleting] = useState<ServiceExtra | null>(null);
  return (
    <Panel>
      <DataTable
        rows={extras}
        rowKey={(e) => e.id}
        searchText={(e) => `${e.label} ${e.description ?? ""}`}
        searchPlaceholder="Search extras"
        toolbar={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add extra</Button>}
        columns={[
          { key: "label", header: "Extra", sortValue: (e) => e.label, render: (e) => <span><span className="block font-semibold">{e.label}</span><span className="text-xs text-muted">{e.description}</span></span> },
          { key: "price", header: "Price", sortValue: (e) => e.price, render: (e) => (e.price ? gbp2(e.price) : <Badge tone="info">Included in time</Badge>) },
          { key: "used", header: "Offered on", render: (e) => <span className="text-xs text-ink-soft">{services.filter((s) => s.extras.includes(e.id)).map((s) => s.name).join(", ") || "—"}</span> },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (e) => (
              <div className="flex justify-end gap-1">
                <IconButton label="Edit extra" onClick={() => setEditing(e)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label="Delete extra" tone="danger" onClick={() => setDeleting(e)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
      {editing && <ExtraModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete extra?"
        description={`"${deleting?.label}" will be removed from every service.`}
        confirmLabel="Delete extra"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("extras", (e) => e.id === deleting.id);
          services.filter((s) => s.extras.includes(deleting.id)).forEach((s) => patch("services", (x) => x.id === s.id, { extras: s.extras.filter((id) => id !== deleting.id) }));
          logActivity("Pricing", "Deleted extra", deleting.label);
          success("Extra deleted");
        }}
      />
    </Panel>
  );
}

function ExtraModal({ initial, onClose }: { initial?: ServiceExtra; onClose: () => void }) {
  const extras = useStore("extras");
  const { success } = useToast();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    const p = Number(price);
    if (label.trim().length < 3) e.label = "Enter a name";
    if (!(p >= 0 && p <= 500)) e.price = "Enter a price between £0 and £500";
    setErr(e);
    if (Object.keys(e).length) return;
    if (initial) patch("extras", (x) => x.id === initial.id, { label: label.trim(), price: p, description: description.trim() });
    else {
      let id = slugify(label);
      if (extras.some((x) => x.id === id)) id = `${id}-${uid("x").slice(-4)}`;
      insert("extras", { id, label: label.trim(), price: p, description: description.trim() }, false);
    }
    logActivity("Pricing", initial ? `Edited extra (${gbp2(p)})` : "Added extra", label.trim());
    success(initial ? "Extra updated" : "Extra added", initial ? undefined : "Enable it on a service in Services & Categories.");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? "Edit extra" : "Add extra"} size="sm" footer={<Button onClick={save}>Save extra</Button>}>
      <div className="space-y-4">
        <Input label="Name" name="extra-label" value={label} onChange={(e) => setLabel(e.target.value)} error={err.label} />
        <Input label="Price (£)" name="extra-price" type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} hint="Use 0 for add-ons done within the booked time" error={err.price} />
        <Textarea label="Description" name="extra-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Modal>
  );
}

/* ---------------- Discounts & fees ---------------- */
const feeSchema = z.object({
  weeklyDiscount: z.coerce.number().min(0).max(50),
  fortnightlyDiscount: z.coerce.number().min(0).max(50),
  monthlyDiscount: z.coerce.number().min(0).max(50),
  serviceFee: z.coerce.number().min(0).max(20),
  suppliesPerHour: z.coerce.number().min(0).max(10),
});
type FeeForm = z.input<typeof feeSchema>;

function Discounts() {
  const settings = useStore("settings");
  const { success } = useToast();
  const { register, handleSubmit, formState, reset } = useForm<FeeForm>({ resolver: zodResolver(feeSchema), defaultValues: settings });
  return (
    <Panel title="Recurring discounts & fees">
      <form
        noValidate
        className="grid max-w-3xl gap-5 sm:grid-cols-3"
        onSubmit={handleSubmit((raw) => {
          const v = feeSchema.parse(raw);
          write("settings", { ...settings, ...v });
          reset(v);
          logActivity("Pricing", `Updated discounts & fees (weekly ${v.weeklyDiscount}%, fee ${gbp2(v.serviceFee)})`);
          success("Pricing saved", "New prices apply to new bookings immediately.");
        })}
      >
        <Input label="Weekly discount (%)" type="number" error={formState.errors.weeklyDiscount?.message} {...register("weeklyDiscount")} />
        <Input label="Fortnightly discount (%)" type="number" error={formState.errors.fortnightlyDiscount?.message} {...register("fortnightlyDiscount")} />
        <Input label="Monthly discount (%)" type="number" error={formState.errors.monthlyDiscount?.message} {...register("monthlyDiscount")} />
        <Input label="Service & insurance fee (£ per booking)" type="number" step="0.1" error={formState.errors.serviceFee?.message} {...register("serviceFee")} />
        <Input label="Cleaning products (£ per hour)" type="number" step="0.5" error={formState.errors.suppliesPerHour?.message} {...register("suppliesPerHour")} />
        <div className="flex items-end sm:col-span-3">
          <Button type="submit" disabled={!formState.isDirty}>
            Save pricing
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* ---------------- Packages ---------------- */
const pkgSchema = z.object({
  name: z.string().trim().min(3, "Enter a name"),
  serviceId: z.string().min(1, "Choose a service"),
  sessions: z.coerce.number().int().min(2, "At least 2 sessions").max(52),
  hoursPerSession: z.coerce.number().min(1).max(10),
  discountPct: z.coerce.number().min(0).max(50),
  description: z.string().trim().min(10, "At least 10 characters"),
});
type PkgForm = z.input<typeof pkgSchema>;

function Packages() {
  const packages = useStore("packages");
  const services = useStore("services");
  const { success } = useToast();
  const [editing, setEditing] = useState<ServicePackage | "new" | null>(null);
  const [deleting, setDeleting] = useState<ServicePackage | null>(null);
  return (
    <Panel title="Packages" action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add package</Button>}>
      {packages.length === 0 ? (
        <EmptyState icon={<Package className="size-6" />} title="No packages yet" description="Bundle several sessions at a discount." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((p) => {
            const s = services.find((x) => x.id === p.serviceId);
            const full = s ? p.sessions * p.hoursPerSession * s.hourlyRate : 0;
            return (
              <div key={p.id} className="flex flex-col rounded-2xl border border-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold">{p.name}</p>
                    <p className="text-sm text-muted">{s?.name ?? "Service removed"}</p>
                  </div>
                  <Switch
                    on={p.active}
                    label={`Toggle ${p.name}`}
                    onChange={() => {
                      patch("packages", (x) => x.id === p.id, { active: !p.active });
                      logActivity("Pricing", p.active ? "Hid package" : "Published package", p.name);
                      success(p.active ? "Package hidden" : "Package shown on the service page");
                    }}
                  />
                </div>
                <p className="mt-2 flex-1 text-sm text-ink-soft">{p.description}</p>
                <p className="mt-3 text-sm">
                  {p.sessions} × {p.hoursPerSession}h · <Badge tone="success">−{p.discountPct}%</Badge>
                </p>
                <p className="mt-2">
                  <span className="font-display text-2xl font-extrabold">{gbp2(full * (1 - p.discountPct / 100))}</span> <span className="text-sm text-muted line-through">{gbp2(full)}</span>
                </p>
                <div className="mt-3 flex justify-end gap-1">
                  <IconButton label="Edit package" onClick={() => setEditing(p)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label="Delete package" tone="danger" onClick={() => setDeleting(p)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <DemoNote className="mt-4">Active packages are shown on their service page on the website.</DemoNote>
      {editing && <PackageModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete package?"
        description={`"${deleting?.name}" will be removed from the website.`}
        confirmLabel="Delete package"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("packages", (p) => p.id === deleting.id);
          logActivity("Pricing", "Deleted package", deleting.name);
          success("Package deleted");
        }}
      />
    </Panel>
  );
}

function PackageModal({ initial, onClose }: { initial?: ServicePackage; onClose: () => void }) {
  const services = useStore("services");
  const { success } = useToast();
  const { register, handleSubmit, formState } = useForm<PkgForm>({
    resolver: zodResolver(pkgSchema),
    defaultValues: initial ?? { name: "", serviceId: services[0]?.id ?? "", sessions: 4, hoursPerSession: 3, discountPct: 10, description: "" },
  });
  const save = handleSubmit((raw) => {
    const v = pkgSchema.parse(raw);
    if (initial) patch("packages", (p) => p.id === initial.id, v);
    else insert("packages", { ...v, id: uid("pkg"), active: true }, false);
    logActivity("Pricing", initial ? "Edited package" : "Added package", v.name);
    success(initial ? "Package updated" : "Package added");
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit package" : "Add package"} footer={<Button onClick={save}>Save package</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input label="Package name" wrapClassName="sm:col-span-2" error={formState.errors.name?.message} {...register("name")} />
        <Select label="Service" wrapClassName="sm:col-span-2" options={services.map((s) => ({ value: s.id, label: `${s.name} (${gbp2(s.hourlyRate)}/h)` }))} error={formState.errors.serviceId?.message} {...register("serviceId")} />
        <Input label="Sessions" type="number" error={formState.errors.sessions?.message} {...register("sessions")} />
        <Input label="Hours per session" type="number" step="0.5" error={formState.errors.hoursPerSession?.message} {...register("hoursPerSession")} />
        <Input label="Discount (%)" type="number" error={formState.errors.discountPct?.message} {...register("discountPct")} />
        <Textarea label="Description" wrapClassName="sm:col-span-2" error={formState.errors.description?.message} {...register("description")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

function FixedPrices({ serviceId }: { serviceId: string }) {
  const service = useStore("services").find((s) => s.id === serviceId);
  const { success } = useToast();
  const [prices, setPrices] = useState<Record<string, string>>({});
  if (!service?.packages) return null;
  const value = (id: string, fallback: number) => prices[id] ?? String(fallback);
  const changed = service.packages.some((p) => Number(value(p.id, p.price)) !== p.price);
  const invalid = service.packages.some((p) => !(Number(value(p.id, p.price)) >= 5 && Number(value(p.id, p.price)) <= 1000));
  return (
    <Panel title={`${service.name} — fixed prices`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {service.packages.map((p) => (
          <label key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
            <span className="text-sm font-semibold">{p.label}</span>
            <span className="flex items-center gap-1 text-sm">
              £
              <input aria-label={`${p.label} price`} type="number" step="1" value={value(p.id, p.price)} onChange={(e) => setPrices((x) => ({ ...x, [p.id]: e.target.value }))} className="h-10 w-24 rounded-xl border-[1.5px] border-line px-3 focus:border-ink focus:outline-none" />
            </span>
          </label>
        ))}
      </div>
      <Button
        className="mt-4"
        size="sm"
        disabled={!changed || invalid}
        onClick={() => {
          patch("services", (x) => x.id === service.id, { packages: service.packages!.map((p) => ({ ...p, price: Number(value(p.id, p.price)) })) });
          logActivity("Pricing", `Updated ${service.name} fixed prices`, service.name);
          setPrices({});
          success("Prices updated", `${service.name} — live on the website`);
        }}
      >
        Save prices
      </Button>
    </Panel>
  );
}
