"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AdminRole, AdminUser } from "@/types";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useSession, useStore } from "@/hooks/useStore";
import { canAccess, logActivity, ROLE_LABEL, type AdminSection } from "@/lib/admin";
import { insert, patch, removeWhere } from "@/lib/storage";
import { emailField, nameField } from "@/lib/validation";
import { formatDateTime, initials, uid } from "@/lib/utils";
import { Switch } from "./ServicesAdmin";

const MATRIX: { section: AdminSection; label: string }[] = [
  { section: "dashboard", label: "Dashboard" },
  { section: "bookings", label: "Bookings" },
  { section: "customers", label: "Customers" },
  { section: "pros", label: "Professionals" },
  { section: "services", label: "Services & Categories" },
  { section: "locations", label: "Locations" },
  { section: "pricing", label: "Pricing & Packages" },
  { section: "coupons", label: "Coupons & Discounts" },
  { section: "payments", label: "Payments & Transactions" },
  { section: "reviews", label: "Reviews & Ratings" },
  { section: "reports", label: "Reports & Analytics" },
  { section: "content", label: "Pages & Content" },
  { section: "blog", label: "Blog Management" },
  { section: "enquiries", label: "Enquiries & Support" },
  { section: "notifications", label: "Notifications" },
  { section: "admins", label: "Admin Users & Roles" },
  { section: "settings", label: "Settings" },
  { section: "activity", label: "Activity Logs" },
];
const ROLES: AdminRole[] = ["owner", "manager", "staff"];
const ROLE_TONE = { owner: "brand", manager: "info", staff: "neutral" } as const;

export function AdminUsersAdmin() {
  const admins = useStore("admins");
  const session = useSession();
  const { success, error } = useToast();
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const activeOwners = admins.filter((a) => a.role === "owner" && a.active);

  return (
    <div className="space-y-6">
      <Panel>
        <DataTable
          rows={admins}
          rowKey={(a) => a.id}
          searchText={(a) => `${a.name} ${a.email} ${a.role}`}
          searchPlaceholder="Search admin users"
          toolbar={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add admin user</Button>}
          columns={[
            {
              key: "name",
              header: "User",
              sortValue: (a) => a.name,
              render: (a) => (
                <span className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{initials(a.name)}</span>
                  <span>
                    <span className="block font-semibold">
                      {a.name} {a.id === session.adminId && <Badge tone="success">You</Badge>}
                    </span>
                    <span className="text-xs text-muted">{a.email}</span>
                  </span>
                </span>
              ),
            },
            { key: "role", header: "Role", sortValue: (a) => a.role, render: (a) => <Badge tone={ROLE_TONE[a.role]}>{ROLE_LABEL[a.role]}</Badge> },
            { key: "last", header: "Last sign-in", sortValue: (a) => a.lastLoginAt ?? "", render: (a) => <span className="text-xs">{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}</span> },
            {
              key: "active",
              header: "Active",
              render: (a) => (
                <Switch
                  on={a.active}
                  label={`Toggle ${a.name}`}
                  onChange={() => {
                    if (a.id === session.adminId) return error("You can't deactivate yourself");
                    if (a.active && a.role === "owner" && activeOwners.length <= 1) return error("Keep at least one active owner");
                    patch("admins", (x) => x.id === a.id, { active: !a.active });
                    logActivity("Admin users", a.active ? "Deactivated admin" : "Reactivated admin", a.name);
                    success(a.active ? `${a.name} can no longer sign in` : `${a.name} reactivated`);
                  }}
                />
              ),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (a) => (
                <div className="flex justify-end gap-1">
                  <IconButton label="Edit" onClick={() => setEditing(a)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete"
                    tone="danger"
                    onClick={() => {
                      if (a.id === session.adminId) return error("You can't delete your own account");
                      if (a.role === "owner" && activeOwners.length <= 1 && a.active) return error("Keep at least one active owner");
                      setDeleting(a);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Panel title="Role permissions">
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-cream-2 text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Section</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-4 py-3 text-center">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MATRIX.map((m) => (
                <tr key={m.section}>
                  <td className="px-4 py-2.5 font-medium">{m.label}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-4 py-2.5 text-center">
                      {canAccess(r, m.section) ? <Check className="mx-auto size-4 text-success" strokeWidth={3} /> : <Minus className="mx-auto size-4 text-muted/50" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && <AdminModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete admin user?"
        description={`${deleting?.name} will lose access to the admin panel.`}
        confirmLabel="Delete user"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("admins", (a) => a.id === deleting.id);
          logActivity("Admin users", "Deleted admin user", deleting.name);
          success("Admin user deleted");
        }}
      />
    </div>
  );
}

const adminSchema = z.object({
  name: nameField,
  email: emailField,
  role: z.enum(["owner", "manager", "staff"]),
  password: z.string().min(8, "At least 8 characters"),
});
type AdminForm = z.infer<typeof adminSchema>;

function AdminModal({ initial, onClose }: { initial?: AdminUser; onClose: () => void }) {
  const admins = useStore("admins");
  const session = useSession();
  const { success } = useToast();
  const { register, handleSubmit, formState, setError } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: initial ? { name: initial.name, email: initial.email, role: initial.role, password: initial.password } : { role: "staff", password: "Welcome123!" },
  });
  const save = handleSubmit((v) => {
    if (admins.some((a) => a.id !== initial?.id && a.email.toLowerCase() === v.email.toLowerCase())) return setError("email", { message: "Email already in use" });
    const owners = admins.filter((a) => a.role === "owner" && a.active && a.id !== initial?.id);
    if (initial?.role === "owner" && v.role !== "owner" && owners.length === 0) return setError("role", { message: "Keep at least one active owner" });
    if (initial && initial.id === session.adminId && v.role !== initial.role) return setError("role", { message: "You can't change your own role" });
    if (initial) patch("admins", (a) => a.id === initial.id, v);
    else insert("admins", { ...v, id: uid("adm"), active: true, createdAt: new Date().toISOString() }, false);
    logActivity("Admin users", initial ? `Edited admin (${ROLE_LABEL[v.role]})` : `Added admin (${ROLE_LABEL[v.role]})`, v.name);
    success(initial ? "Admin user updated" : "Admin user added", initial ? undefined : `They can sign in with ${v.email}`);
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit admin user" : "Add admin user"} footer={<Button onClick={save}>Save user</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input label="Full name" error={formState.errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={formState.errors.email?.message} {...register("email")} />
        <Select label="Role" options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} error={formState.errors.role?.message} {...register("role")} />
        <Input label="Demo password" error={formState.errors.password?.message} hint="Stored in this browser only" {...register("password")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
