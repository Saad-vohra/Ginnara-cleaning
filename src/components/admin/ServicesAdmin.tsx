"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Service, ServiceCategory } from "@/types";
import { Button } from "@/components/common/Button";
import { Checkbox, FieldWrap, Input, Select, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, EmptyState, Photo, PillTabs } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { IMG } from "@/data/images";
import { logActivity } from "@/lib/admin";
import { serviceHref } from "@/lib/routes";
import { insert, patch, removeWhere } from "@/lib/storage";
import { cn, gbp2, uid } from "@/lib/utils";

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-success" : "bg-line")}>
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function ServicesAdmin() {
  const [tab, setTab] = useState<"services" | "categories">("services");
  const services = useStore("services");
  const categories = useStore("categories");
  return (
    <div className="space-y-5">
      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "services", label: "Services", count: services.length },
          { value: "categories", label: "Categories", count: categories.length },
        ]}
      />
      {tab === "services" ? <ServicesTable /> : <CategoriesTable />}
    </div>
  );
}

/* ---------------- Services ---------------- */
function ServicesTable() {
  const services = useStore("services");
  const categories = useStore("categories");
  const bookings = useStore("bookings");
  const { success } = useToast();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [cat, setCat] = useState("all");
  const rows = cat === "all" ? services : services.filter((s) => (s.category ?? "none") === cat);

  return (
    <Panel>
      <DataTable
        rows={rows}
        rowKey={(s) => s.id}
        searchText={(s) => `${s.name} ${s.slug}`}
        searchPlaceholder="Search services"
        toolbar={
          <>
            <select aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-full border border-line bg-white px-3 text-sm font-semibold">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="none">Uncategorised</option>
            </select>
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
              Add service
            </Button>
          </>
        }
        columns={[
          {
            key: "name",
            header: "Service",
            sortValue: (s) => s.name,
            render: (s) => (
              <div className="flex items-center gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                  <Photo src={s.image} alt="" fill sizes="44px" />
                </span>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <a href={serviceHref(s.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                    {serviceHref(s.slug)} <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (s) => {
              const c = categories.find((x) => x.id === s.category);
              return c ? (
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
                </span>
              ) : (
                <span className="text-muted">Uncategorised</span>
              );
            },
          },
          { key: "rate", header: "Rate", sortValue: (s) => s.hourlyRate, render: (s) => `${gbp2(s.hourlyRate)}/hr` },
          { key: "min", header: "Min", render: (s) => `${s.minHours}h` },
          { key: "bookings", header: "Bookings", sortValue: (s) => bookings.filter((b) => b.serviceId === s.id).length, render: (s) => bookings.filter((b) => b.serviceId === s.id).length },
          { key: "popular", header: "Popular", render: (s) => (s.popular ? <Badge tone="brand">Popular</Badge> : <span className="text-muted">—</span>) },
          {
            key: "active",
            header: "Live",
            render: (s) => (
              <Switch
                on={s.active}
                label={`Toggle ${s.name}`}
                onChange={() => {
                  patch("services", (x) => x.id === s.id, { active: !s.active });
                  logActivity("Services", s.active ? "Hid service from website" : "Published service", s.name);
                  success(s.active ? `${s.name} hidden from site` : `${s.name} is live`);
                }}
              />
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (s) => (
              <div className="flex justify-end gap-1">
                <IconButton label="Edit" onClick={() => setEditing(s)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label="Delete" tone="danger" onClick={() => setDeleting(s)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
      {editing && <ServiceModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete service?"
        description={`${deleting?.name} will be removed from the website and booking form. Existing bookings are kept.`}
        confirmLabel="Delete service"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("services", (s) => s.id === deleting.id);
          logActivity("Services", "Deleted service", deleting.name);
          success("Service deleted");
        }}
      />
    </Panel>
  );
}

const serviceSchema = z.object({
  name: z.string().trim().min(3, "Name is required"),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  category: z.string(),
  tagline: z.string().trim().min(3, "Add a tagline"),
  short: z.string().trim().min(10, "At least 10 characters"),
  description: z.string().trim().min(30, "At least 30 characters"),
  hourlyRate: z.coerce.number().min(5, "Min £5").max(80, "Max £80"),
  minHours: z.coerce.number().min(1).max(8),
  image: z.string().min(1),
  includes: z.string().min(3, "Add at least one item"),
  features: z.string().min(3, "Add at least one feature"),
  popular: z.boolean(),
  active: z.boolean(),
  allowsFrequency: z.boolean(),
});
type ServiceForm = z.input<typeof serviceSchema>;

export const IMAGE_OPTIONS = Object.entries(IMG).map(([k, v]) => ({ value: v, label: k.replace(/([A-Z])/g, " $1").toLowerCase() }));
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function ServiceModal({ initial, onClose }: { initial?: Service; onClose: () => void }) {
  const services = useStore("services");
  const categories = useStore("categories");
  const allExtras = useStore("extras");
  const { success } = useToast();
  const [extras, setExtras] = useState<string[]>(initial?.extras ?? ["oven", "fridge"]);
  const { register, handleSubmit, formState, setValue, watch, setError } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initial
      ? { ...initial, category: initial.category ?? "", includes: initial.includes.join("\n"), features: initial.features.join("\n") }
      : { name: "", slug: "", category: categories[0]?.id ?? "", tagline: "", short: "", description: "", hourlyRate: 16.5, minHours: 2, image: IMG.livingBright, includes: "", features: "", popular: false, active: true, allowsFrequency: false },
  });
  const image = watch("image");
  const save = handleSubmit((raw) => {
    const v = serviceSchema.parse(raw);
    if (services.some((s) => s.id !== initial?.id && s.slug === v.slug)) return setError("slug", { message: "Slug already used" });
    const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
    const data = { ...v, category: v.category || undefined, kind: "cleaning" as const, includes: lines(v.includes), features: lines(v.features), extras, hoursMultiplier: initial?.hoursMultiplier ?? 1.2, accent: initial?.accent ?? "#2e5ea8" };
    if (initial) patch("services", (s) => s.id === initial.id, data);
    else insert("services", { ...data, id: uid("svc") }, false);
    logActivity("Services", initial ? "Edited service" : "Added service", v.name);
    success(initial ? "Service updated" : "Service added", initial ? undefined : `Live at ${serviceHref(v.slug)}`);
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? `Edit ${initial.name}` : "Add a service"} size="lg" footer={<Button onClick={save}>{initial ? "Save service" : "Create service"}</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input
          label="Name"
          error={formState.errors.name?.message}
          {...register("name", {
            onChange: (e) => {
              if (!initial) setValue("slug", slugify(e.target.value));
            },
          })}
        />
        <Input label="URL slug" hint="/cleaning/your-slug" error={formState.errors.slug?.message} {...register("slug")} />
        <Select label="Category" placeholder="Uncategorised" options={categories.map((c) => ({ value: c.id, label: c.name }))} {...register("category")} />
        <Input label="Tagline" error={formState.errors.tagline?.message} {...register("tagline")} />
        <Input label="Hourly rate (£)" type="number" step="0.1" error={formState.errors.hourlyRate?.message} {...register("hourlyRate")} />
        <Input label="Minimum hours" type="number" step="0.5" error={formState.errors.minHours?.message} {...register("minHours")} />
        <Input label="Short description" wrapClassName="sm:col-span-2" error={formState.errors.short?.message} {...register("short")} />
        <Textarea label="Full description" wrapClassName="sm:col-span-2" error={formState.errors.description?.message} {...register("description")} />
        <Textarea label="What's included (one per line)" error={formState.errors.includes?.message} {...register("includes")} />
        <Textarea label="Key features (one per line)" error={formState.errors.features?.message} {...register("features")} />
        <div className="flex items-end gap-3 sm:col-span-2">
          <Select label="Photo" wrapClassName="flex-1" options={IMAGE_OPTIONS} {...register("image")} />
          <span className="relative size-12 shrink-0 overflow-hidden rounded-xl">
            <Photo src={image} alt="" fill sizes="48px" />
          </span>
        </div>
        <FieldWrap label="Available extras" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {allExtras.map((e) => (
              <button type="button" key={e.id} aria-pressed={extras.includes(e.id)} onClick={() => setExtras((x) => (x.includes(e.id) ? x.filter((y) => y !== e.id) : [...x, e.id]))} className={cn("rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold", extras.includes(e.id) ? "border-ink bg-ink text-white" : "border-line")}>
                {e.label} (+£{e.price})
              </button>
            ))}
          </div>
        </FieldWrap>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Checkbox label="Popular" {...register("popular")} />
          <Checkbox label="Live on website" {...register("active")} />
          <Checkbox label="Allows weekly/fortnightly bookings" {...register("allowsFrequency")} />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

/* ---------------- Categories ---------------- */
const COLORS = ["#2e5ea8", "#1f3f78", "#2e8b3c", "#c8102e", "#e8a700", "#7a6bc1", "#3a8fd0"];

function CategoriesTable() {
  const categories = useStore("categories");
  const services = useStore("services");
  const { success } = useToast();
  const [editing, setEditing] = useState<ServiceCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<ServiceCategory | null>(null);
  return (
    <Panel title="Service categories" action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add category</Button>}>
      {categories.length === 0 ? (
        <EmptyState title="No categories" description="Group your services, e.g. Home, Business, Events." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const inCat = services.filter((s) => s.category === c.id);
            return (
              <div key={c.id} className="rounded-2xl border border-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-2 text-lg font-extrabold">
                    <span className="size-3 rounded-full" style={{ background: c.color }} /> {c.name}
                  </p>
                  <div className="flex gap-1">
                    <IconButton label="Edit category" onClick={() => setEditing(c)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label="Delete category" tone="danger" onClick={() => setDeleting(c)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {inCat.length ? inCat.map((s) => <Badge key={s.id}>{s.name}</Badge>) : <span className="text-xs text-muted">No services yet</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editing && <CategoryModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete category?"
        description={`Services in "${deleting?.name}" become uncategorised. The services themselves are not deleted.`}
        confirmLabel="Delete category"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("categories", (c) => c.id === deleting.id);
          services.filter((s) => s.category === deleting.id).forEach((s) => patch("services", (x) => x.id === s.id, { category: undefined }));
          logActivity("Services", "Deleted category", deleting.name);
          success("Category deleted");
        }}
      />
    </Panel>
  );
}

function CategoryModal({ initial, onClose }: { initial?: ServiceCategory; onClose: () => void }) {
  const { success } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [error, setError] = useState("");
  const save = () => {
    if (name.trim().length < 2) return setError("Enter a category name");
    if (initial) patch("categories", (c) => c.id === initial.id, { name: name.trim(), description: description.trim(), color });
    else insert("categories", { id: uid("cat"), name: name.trim(), description: description.trim(), color }, false);
    logActivity("Services", initial ? "Edited category" : "Added category", name.trim());
    success(initial ? "Category updated" : "Category added");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? "Edit category" : "Add category"} size="sm" footer={<Button onClick={save}>Save category</Button>}>
      <div className="space-y-4">
        <Input label="Name" name="cat-name" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <Textarea label="Description" name="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        <FieldWrap label="Colour">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className={cn("size-8 rounded-full ring-offset-2 transition", color === c && "ring-2 ring-ink")} style={{ background: c }} />
            ))}
          </div>
        </FieldWrap>
      </div>
    </Modal>
  );
}
