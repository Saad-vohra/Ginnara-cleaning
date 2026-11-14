import { z } from "zod";
import { COVERED_PREFIXES } from "@/data/mock-cities";
import { read } from "./storage";

export const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export function normalisePostcode(pc: string) {
  const m = pc.trim().toUpperCase().match(UK_POSTCODE);
  if (!m) return pc.trim().toUpperCase();
  return `${m[1]} ${m[2]}`;
}

export function outwardArea(pc: string) {
  const m = pc.trim().toUpperCase().match(/^([A-Z]{1,2})/);
  return m ? m[1] : "";
}

/** Coverage check — postcode areas of the active locations managed in Admin → Locations */
export function coveredPrefixes() {
  try {
    return read("locations").filter((l) => l.active).flatMap((l) => l.postcodes.map((p) => p.toUpperCase()));
  } catch {
    return COVERED_PREFIXES;
  }
}

/** Names of active locations, for user-facing messages */
export function coveredAreaNames() {
  try {
    return read("locations").filter((l) => l.active).map((l) => l.name);
  } catch {
    return [];
  }
}

export function isCovered(pc: string) {
  if (!UK_POSTCODE.test(pc.trim())) return false;
  return coveredPrefixes().includes(outwardArea(pc));
}

const UK_PHONE = /^(\+44\s?7\d{3}|\(?07\d{3}\)?|\+44\s?\d{2,4}|0\d{2,4})\s?\d{3,4}\s?\d{3,4}$/;

export const postcodeField = z
  .string()
  .trim()
  .min(1, "Enter your postcode")
  .regex(UK_POSTCODE, "Enter a valid UK postcode, e.g. SW4 7AA");

export const nameField = z.string().trim().min(2, "Enter your full name").max(80, "Name is too long");
export const emailField = z.string().trim().min(1, "Enter your email").email("Enter a valid email address");
export const phoneField = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .refine((v) => UK_PHONE.test(v.replace(/-/g, " ")), "Enter a valid UK phone number, e.g. 07700 900123");
export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const locationSchema = z.object({
  postcode: postcodeField,
  street: z.string().trim().min(3, "Enter your street address"),
  city: z.string().trim().min(2, "Enter your town or city"),
  unit: z.string().trim().max(40, "Keep this short").optional().or(z.literal("")),
});
export type LocationValues = z.infer<typeof locationSchema>;

export const detailsSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  notes: z.string().max(500, "Keep notes under 500 characters").optional().or(z.literal("")),
  terms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
});
export type DetailsValues = z.infer<typeof detailsSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirm: z.string(),
    terms: z.boolean().refine((v) => v, "Please accept the terms"),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });
export type RegisterValues = z.infer<typeof registerSchema>;

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  topic: z.string().min(1, "Choose a topic"),
  message: z.string().trim().min(20, "Tell us a little more (20 characters minimum)").max(1500),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const proRegisterSchema = z
  .object({
    name: nameField,
    email: emailField,
    phone: phoneField,
    postcode: postcodeField,
    services: z.array(z.string()).min(1, "Choose at least one service"),
    experience: z.string().min(1, "Select your experience"),
    qualifications: z.string().trim().min(5, "Tell us about your qualifications or checks"),
    availability: z.array(z.string()).min(1, "Pick at least one day"),
    bio: z.string().trim().min(20, "Write at least 20 characters").max(300),
    password: passwordField,
    rightToWork: z.boolean().refine((v) => v, "You must confirm your right to work in the UK"),
  });
export type ProRegisterValues = z.infer<typeof proRegisterSchema>;

export const addressSchema = z.object({
  label: z.string().trim().min(2, "Give this address a name"),
  postcode: postcodeField,
  street: z.string().trim().min(3, "Enter the street address"),
  city: z.string().trim().min(2, "Enter the town or city"),
  unit: z.string().trim().optional().or(z.literal("")),
});
export type AddressValues = z.infer<typeof addressSchema>;
