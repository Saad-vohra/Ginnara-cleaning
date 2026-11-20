/**
 * Admin helpers: roles & permissions, activity log, in-app notifications and simulated payments.
 * All data lives in the localStorage store (demo only).
 */
import type { AdminRole, AppNotification, Booking, PaymentStatus } from "@/types";
import { insert, read, update } from "./storage";
import { hash, uid } from "./utils";

export type AdminSection =
  | "dashboard"
  | "bookings"
  | "customers"
  | "pros"
  | "services"
  | "locations"
  | "pricing"
  | "coupons"
  | "payments"
  | "reviews"
  | "reports"
  | "content"
  | "blog"
  | "enquiries"
  | "notifications"
  | "admins"
  | "settings"
  | "activity";

export const ROLE_LABEL: Record<AdminRole, string> = { owner: "Owner", manager: "Manager", staff: "Staff" };

export const ROLE_ACCESS: Record<AdminRole, AdminSection[] | "all"> = {
  owner: "all",
  manager: ["dashboard", "bookings", "customers", "pros", "services", "locations", "pricing", "coupons", "payments", "reviews", "reports", "content", "blog", "enquiries", "notifications", "activity"],
  staff: ["dashboard", "bookings", "customers", "pros", "reviews", "enquiries", "notifications"],
};

export function canAccess(role: AdminRole | undefined, section: AdminSection) {
  if (!role) return false;
  const access = ROLE_ACCESS[role];
  return access === "all" || access.includes(section);
}

export function currentAdmin() {
  const id = read("session").adminId;
  return id ? read("admins").find((a) => a.id === id) ?? null : null;
}

/** Record an admin action in Activity Logs */
export function logActivity(category: string, action: string, target?: string) {
  const admin = currentAdmin();
  insert("activity", {
    id: uid("act"),
    at: new Date().toISOString(),
    actorId: admin?.id ?? "system",
    actorName: admin?.name ?? "Website",
    category,
    action,
    target,
  });
  // keep the log to a sensible size in localStorage
  update("activity", (xs) => xs.slice(0, 400));
}

/** Push an in-app notification to the admin bell (called by website events) */
export function notify(n: Omit<AppNotification, "id" | "createdAt" | "read">) {
  insert("notifications", { ...n, id: uid("ntf"), createdAt: new Date().toISOString(), read: false });
  update("notifications", (xs) => xs.slice(0, 200));
}

/* ---------- Simulated payments ---------- */
export function paymentStatusOf(b: Booking): PaymentStatus {
  if (b.paymentStatus) return b.paymentStatus;
  if (b.status === "completed") return "paid";
  if (b.status === "cancelled") return "voided";
  return "authorised";
}

export function paymentMethodOf(b: Booking): "card" | "paypal" {
  return b.paymentMethod ?? (hash(b.ref) % 4 === 0 ? "paypal" : "card");
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = { authorised: "Authorised", paid: "Paid", partially_refunded: "Part refunded", refunded: "Refunded", voided: "Voided" };

/** CSV download built in the browser */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
