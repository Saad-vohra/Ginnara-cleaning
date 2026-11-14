"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Tag, Ticket, Trash2, TrendingDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Coupon } from "@/types";
import { Button } from "@/components/common/Button";
import { Checkbox, Input, Select } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { insert, patch, removeWhere } from "@/lib/storage";
import { gbp2, uid } from "@/lib/utils";
import { Switch } from "./ServicesAdmin";

const couponSchema = z.object({
  code: z.string().trim().min(3, "At least 3 characters").max(20).regex(/^[A-Z0-9]+$/i, "Letters and numbers only"),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive("Must be positive"),
  minSpend: z.coerce.number().min(0),
  description: z.string().trim().min(3, "Add a description"),
  active: z.boolean(),
});
type CouponForm = z.input<typeof couponSchema>;

export function CouponsAdmin() {
  const coupons = useStore("coupons");
  const bookings = useStore("bookings");
  const { success } = useToast();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const discounted = bookings.filter((b) => b.pricing.couponDiscount > 0);
  const given = discounted.reduce((s, b) => s + b.pricing.couponDiscount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active codes" value={coupons.filter((c) => c.active).length} icon={Tag} />
        <StatCard label="Total redemptions" value={coupons.reduce((s, c) => s + c.uses, 0)} icon={Ticket} tone="sky" hint="All-time uses" />
        <StatCard label="Discount given (demo bookings)" value={gbp2(given)} icon={TrendingDown} tone="sun" hint={`${discounted.length} bookings used a code`} />
      </div>
      <Panel>
        <DataTable
          rows={coupons}
          rowKey={(c) => c.id}
          searchText={(c) => `${c.code} ${c.description}`}
          searchPlaceholder="Search coupons"
          toolbar={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add coupon</Button>}
          columns={[
            { key: "code", header: "Code", sortValue: (c) => c.code, render: (c) => <code className="rounded-lg bg-cream px-2 py-1 font-bold">{c.code}</code> },
            { key: "value", header: "Discount", sortValue: (c) => c.value, render: (c) => (c.type === "percent" ? `${c.value}%` : gbp2(c.value)) },
            { key: "min", header: "Min spend", render: (c) => (c.minSpend ? gbp2(c.minSpend) : "—") },
            { key: "desc", header: "Description", render: (c) => <span className="text-ink-soft">{c.description}</span> },
            { key: "uses", header: "Uses", sortValue: (c) => c.uses, render: (c) => c.uses },
            {
              key: "status",
              header: "Active",
              render: (c) => (
                <Switch
                  on={c.active}
                  label={`Toggle ${c.code}`}
                  onChange={() => {
                    patch("coupons", (x) => x.id === c.id, { active: !c.active });
                    logActivity("Coupons", c.active ? "Deactivated coupon" : "Activated coupon", c.code);
                    success(c.active ? `${c.code} switched off` : `${c.code} is live`);
                  }}
                />
              ),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (c) => (
                <div className="flex justify-end gap-1">
                  <IconButton label="Edit" onClick={() => setEditing(c)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setDeleting(c)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
        {editing && <CouponModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          title="Delete coupon?"
          description={`${deleting?.code} will stop working immediately.`}
          confirmLabel="Delete coupon"
          onConfirm={() => {
            if (!deleting) return;
            removeWhere("coupons", (c) => c.id === deleting.id);
            logActivity("Coupons", "Deleted coupon", deleting.code);
            success("Coupon deleted");
          }}
        />
      </Panel>
    </div>
  );
}

function CouponModal({ initial, onClose }: { initial?: Coupon; onClose: () => void }) {
  const coupons = useStore("coupons");
  const { success } = useToast();
  const { register, handleSubmit, formState, setError } = useForm<CouponForm>({ resolver: zodResolver(couponSchema), defaultValues: initial ?? { code: "", type: "percent", value: 10, minSpend: 0, description: "", active: true } });
  const save = handleSubmit((raw) => {
    const v = couponSchema.parse(raw);
    const code = v.code.toUpperCase();
    if (coupons.some((c) => c.id !== initial?.id && c.code === code)) return setError("code", { message: "Code already exists" });
    if (v.type === "percent" && v.value > 90) return setError("value", { message: "Max 90%" });
    if (initial) patch("coupons", (c) => c.id === initial.id, { ...v, code });
    else insert("coupons", { ...v, code, id: uid("cpn"), uses: 0 });
    logActivity("Coupons", initial ? "Edited coupon" : "Created coupon", code);
    success(initial ? "Coupon updated" : "Coupon created", `Customers can use ${code} at checkout.`);
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit coupon" : "New coupon"} footer={<Button onClick={save}>Save coupon</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input label="Code" className="uppercase" error={formState.errors.code?.message} {...register("code")} />
        <Select label="Type" options={[{ value: "percent", label: "Percentage" }, { value: "fixed", label: "Fixed amount (£)" }]} {...register("type")} />
        <Input label="Value" type="number" step="0.5" error={formState.errors.value?.message} {...register("value")} />
        <Input label="Minimum spend (£)" type="number" error={formState.errors.minSpend?.message} {...register("minSpend")} />
        <Input label="Description" wrapClassName="sm:col-span-2" error={formState.errors.description?.message} {...register("description")} />
        <Checkbox label="Active" {...register("active")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
