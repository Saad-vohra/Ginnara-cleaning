"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Download, Eye, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Customer } from "@/types";
import { Button } from "@/components/common/Button";
import { Input, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, StatusBadge } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { downloadCsv, logActivity } from "@/lib/admin";
import { insert, patch, removeWhere } from "@/lib/storage";
import { emailField, nameField, phoneField } from "@/lib/validation";
import { formatDate, gbp2, initials, toISODate, uid } from "@/lib/utils";

const customerSchema = z.object({ name: nameField, email: emailField, phone: phoneField, password: z.string().min(6, "At least 6 characters") });
type CustomerForm = z.infer<typeof customerSchema>;

export function CustomersAdmin() {
  const customers = useStore("customers");
  const bookings = useStore("bookings");
  const { success } = useToast();
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = customers.find((c) => c.id === viewingId) ?? null;

  const bookingsOf = (c: Customer) => bookings.filter((b) => b.customerId === c.id || b.customer.email.toLowerCase() === c.email.toLowerCase());
  const spentOf = (c: Customer) => bookingsOf(c).filter((b) => b.status === "completed").reduce((s, b) => s + b.pricing.total, 0);

  return (
    <Panel>
      <DataTable
        rows={customers}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.name} ${c.email} ${c.phone} ${c.addresses.map((a) => a.postcode).join(" ")}`}
        searchPlaceholder="Search name, email, phone, postcode"
        toolbar={
          <>
            <Button
              size="sm"
              variant="soft"
              icon={<Download className="size-4" />}
              onClick={() => {
                downloadCsv(`ginnara-customers-${toISODate(new Date())}.csv`, [["Name", "Email", "Phone", "City", "Bookings", "Spent (£)", "Marketing", "Joined", "Status"], ...customers.map((c) => [c.name, c.email, c.phone, c.addresses[0]?.city ?? "", bookingsOf(c).length, spentOf(c).toFixed(2), c.marketing ? "yes" : "no", c.createdAt.slice(0, 10), c.status])]);
                logActivity("Customers", `Exported ${customers.length} customers to CSV`);
              }}
            >
              Export CSV
            </Button>
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
              Add customer
            </Button>
          </>
        }
        columns={[
          {
            key: "name",
            header: "Customer",
            sortValue: (c) => c.name,
            render: (c) => (
              <button onClick={() => setViewingId(c.id)} className="flex items-center gap-3 text-left">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-xs font-bold">{initials(c.name)}</span>
                <span>
                  <span className="block font-semibold hover:underline">{c.name}</span>
                  <span className="text-xs text-muted">{c.email}</span>
                </span>
              </button>
            ),
          },
          { key: "phone", header: "Phone", render: (c) => c.phone },
          { key: "city", header: "City", render: (c) => c.addresses[0]?.city ?? "—" },
          { key: "bookings", header: "Bookings", sortValue: (c) => bookingsOf(c).length, render: (c) => bookingsOf(c).length },
          { key: "spent", header: "Spent", sortValue: (c) => spentOf(c), render: (c) => gbp2(spentOf(c)) },
          { key: "joined", header: "Joined", sortValue: (c) => c.createdAt, render: (c) => formatDate(c.createdAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }) },
          { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (c) => (
              <div className="flex justify-end gap-1">
                <IconButton label="View" onClick={() => setViewingId(c.id)}>
                  <Eye className="size-4" />
                </IconButton>
                <IconButton label="Edit" onClick={() => setEditing(c)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton
                  label={c.status === "active" ? "Suspend" : "Reactivate"}
                  onClick={() => {
                    const status = c.status === "active" ? "suspended" : "active";
                    patch("customers", (x) => x.id === c.id, { status });
                    logActivity("Customers", status === "suspended" ? "Suspended customer" : "Reactivated customer", c.name);
                    success(status === "suspended" ? "Customer suspended" : "Customer reactivated");
                  }}
                >
                  {c.status === "active" ? <Ban className="size-4" /> : <RotateCcw className="size-4" />}
                </IconButton>
                <IconButton label="Delete" tone="danger" onClick={() => setDeleting(c)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />

      {editing && <CustomerModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {viewing && <CustomerDetail customer={viewing} onClose={() => setViewingId(null)} onEdit={() => setEditing(viewing)} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete customer?"
        description={`${deleting?.name} will be removed. Their bookings stay in the system.`}
        confirmLabel="Delete customer"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("customers", (c) => c.id === deleting.id);
          logActivity("Customers", "Deleted customer", deleting.name);
          success("Customer deleted");
        }}
      />
    </Panel>
  );
}

function CustomerDetail({ customer, onClose, onEdit }: { customer: Customer; onClose: () => void; onEdit: () => void }) {
  const bookings = useStore("bookings").filter((b) => b.customerId === customer.id || b.customer.email.toLowerCase() === customer.email.toLowerCase());
  const { success } = useToast();
  const [notes, setNotes] = useState(customer.notes ?? "");
  const completed = bookings.filter((b) => b.status === "completed");
  const spent = completed.reduce((s, b) => s + b.pricing.total, 0);
  return (
    <Modal open onClose={onClose} title={customer.name} description={`${customer.email} · ${customer.phone}`} size="lg" footer={<Button variant="soft" onClick={onEdit}>Edit customer</Button>}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Bookings", bookings.length],
            ["Completed", completed.length],
            ["Total spent", gbp2(spent)],
            ["Member since", formatDate(customer.createdAt.slice(0, 10), { month: "short", year: "numeric" })],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-2xl bg-cream-2 p-3">
              <p className="text-xs text-muted">{l}</p>
              <p className="font-display text-xl font-extrabold">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <StatusBadge status={customer.status} />
          {customer.title && <Badge>{customer.title}</Badge>}
          <Badge tone={customer.marketing ? "success" : "neutral"}>{customer.marketing ? "Accepts marketing" : "No marketing"}</Badge>
          <Badge tone={customer.smsReminders ? "info" : "neutral"}>{customer.smsReminders ? "SMS reminders on" : "SMS reminders off"}</Badge>
        </div>
        <div>
          <p className="mb-2 font-extrabold">Saved addresses</p>
          {customer.addresses.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {customer.addresses.map((a) => (
                <li key={a.id} className="rounded-2xl border border-line p-3 text-sm">
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-ink-soft">
                    {a.unit && `${a.unit}, `}
                    {a.street}, {a.city} {a.postcode}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No saved addresses.</p>
          )}
        </div>
        <div>
          <p className="mb-2 font-extrabold">Booking history</p>
          {bookings.length ? (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {[...bookings]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((b) => (
                  <li key={b.ref} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span>
                      <span className="block font-semibold">{b.serviceName}</span>
                      <span className="text-muted">
                        {b.ref} · {formatDate(b.date)} {b.time}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{gbp2(b.pricing.total)}</span>
                      <StatusBadge status={b.status} />
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No bookings yet.</p>
          )}
        </div>
        <div>
          <Textarea label="Private admin notes" name="customer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Prefers morning slots, has a dog, key with concierge…" />
          <Button
            size="sm"
            className="mt-2"
            disabled={notes === (customer.notes ?? "")}
            onClick={() => {
              patch("customers", (c) => c.id === customer.id, { notes });
              logActivity("Customers", "Updated notes", customer.name);
              success("Notes saved");
            }}
          >
            Save notes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CustomerModal({ initial, onClose }: { initial?: Customer; onClose: () => void }) {
  const customers = useStore("customers");
  const { success } = useToast();
  const { register, handleSubmit, formState, setError } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: initial ? { name: initial.name, email: initial.email, phone: initial.phone, password: initial.password } : { password: "Password1" } });
  const save = handleSubmit((v) => {
    if (customers.some((c) => c.id !== initial?.id && c.email.toLowerCase() === v.email.toLowerCase())) return setError("email", { message: "Email already in use" });
    if (initial) patch("customers", (c) => c.id === initial.id, v);
    else insert("customers", { ...v, id: uid("cus"), addresses: [], createdAt: new Date().toISOString(), marketing: false, smsReminders: true, status: "active" });
    logActivity("Customers", initial ? "Edited customer" : "Added customer", v.name);
    success(initial ? "Customer updated" : "Customer added");
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit customer" : "Add customer"} footer={<Button onClick={save}>{initial ? "Save changes" : "Add customer"}</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input label="Full name" wrapClassName="sm:col-span-2" error={formState.errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={formState.errors.email?.message} {...register("email")} />
        <Input label="Phone" error={formState.errors.phone?.message} {...register("phone")} />
        <Input label="Demo password" wrapClassName="sm:col-span-2" hint="The customer can sign in with this on the demo site" error={formState.errors.password?.message} {...register("password")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
