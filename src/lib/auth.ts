/**
 * DEMO AUTHENTICATION — credentials live in localStorage in plain text.
 * This simulates sign-in for a prototype and is NOT secure production auth.
 */
import type { Address, Customer, Pro } from "@/types";
import { insert, patch, read, update } from "./storage";
import { uid } from "./utils";
import { notify } from "./admin";

const norm = (e: string) => e.trim().toLowerCase();

export function loginCustomer(email: string, password: string): { ok: true; customer: Customer } | { ok: false; error: string } {
  const c = read("customers").find((x) => norm(x.email) === norm(email));
  if (!c || c.password !== password) return { ok: false, error: "Email or password is incorrect." };
  if (c.status === "suspended") return { ok: false, error: "This account has been suspended. Contact support." };
  update("session", (s) => ({ ...s, customerId: c.id }));
  return { ok: true, customer: c };
}

export function registerCustomer(data: {
  title?: Customer["title"];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  marketing?: boolean;
  address?: Omit<Address, "id" | "label">;
}) {
  if (read("customers").some((x) => norm(x.email) === norm(data.email))) {
    return { ok: false as const, error: "An account with this email already exists." };
  }
  const customer: Customer = {
    id: uid("cus"),
    title: data.title,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    name: `${data.firstName.trim()} ${data.lastName.trim()}`,
    email: data.email.trim(),
    phone: data.phone.trim(),
    password: data.password,
    addresses: data.address ? [{ ...data.address, id: uid("adr"), label: "Home" }] : [],
    createdAt: new Date().toISOString(),
    marketing: !!data.marketing,
    smsReminders: true,
    status: "active",
  };
  insert("customers", customer);
  notify({ type: "customer", title: "New customer account", body: `${customer.name} (${customer.email}) created an account.`, section: "customers" });
  // Link guest bookings made with the same email
  update("bookings", (bs) => bs.map((b) => (!b.customerId && norm(b.customer.email) === norm(customer.email) ? { ...b, customerId: customer.id } : b)));
  update("session", (s) => ({ ...s, customerId: customer.id }));
  return { ok: true as const, customer };
}

export function resetCustomerPassword(email: string, password: string) {
  const exists = read("customers").some((x) => norm(x.email) === norm(email));
  if (!exists) return false;
  patch("customers", (c) => norm(c.email) === norm(email), { password });
  return true;
}

export function customerExists(email: string) {
  return read("customers").some((x) => norm(x.email) === norm(email));
}

export function logoutCustomer() {
  update("session", (s) => ({ ...s, customerId: undefined }));
}

export function loginPro(email: string, password: string): { ok: true; pro: Pro } | { ok: false; error: string } {
  const p = read("pros").find((x) => norm(x.email) === norm(email));
  if (!p || p.password !== password) return { ok: false, error: "Email or password is incorrect." };
  if (p.status === "rejected") return { ok: false, error: "Your application was not approved. Contact pros@ginnaracleaning.com." };
  update("session", (s) => ({ ...s, proId: p.id }));
  return { ok: true, pro: p };
}

export function logoutPro() {
  update("session", (s) => ({ ...s, proId: undefined }));
}

export function loginAdmin(email: string, password: string): { ok: true; name: string } | { ok: false; error: string } {
  const admin = read("admins").find((a) => norm(a.email) === norm(email));
  if (!admin || admin.password !== password) return { ok: false, error: "Invalid admin email or password." };
  if (!admin.active) return { ok: false, error: "This admin account has been deactivated." };
  patch("admins", (a) => a.id === admin.id, { lastLoginAt: new Date().toISOString() });
  update("session", (s) => ({ ...s, adminId: admin.id }));
  return { ok: true, name: admin.name };
}

export function logoutAdmin() {
  update("session", (s) => ({ ...s, adminId: undefined }));
}
