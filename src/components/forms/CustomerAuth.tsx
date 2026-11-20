"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { DemoNote } from "@/components/common/ui";
import { DEMO_CREDENTIALS } from "@/data/mock-users";
import { useStore } from "@/hooks/useStore";
import { loginCustomer, registerCustomer } from "@/lib/auth";
import { parseAddress } from "@/lib/address";
import { emailField, loginSchema, passwordField, type LoginValues } from "@/lib/validation";
import { cn, sleep } from "@/lib/utils";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

/* ---------------- Shared bits ---------------- */
function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[445px]">
        <h1 className="text-center font-display text-[3.2rem] leading-none font-extrabold tracking-tight sm:text-[4rem]">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

const fieldCls = "h-14 w-full rounded-xl bg-[#f3f2f0] px-5 text-[16px] text-ink placeholder:text-[#7b756f] transition focus:bg-white focus:ring-2 focus:ring-brand/40 focus:outline-none";

function FilledInput({ error, className, ...props }: ComponentProps<"input"> & { error?: string }) {
  return (
    <div>
      <input aria-invalid={!!error} className={cn(fieldCls, error && "ring-2 ring-danger/60", className)} {...props} />
      {error && <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}

function PasswordInput({ error, ...props }: ComponentProps<"input"> & { error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input type={show ? "text" : "password"} aria-invalid={!!error} className={cn(fieldCls, "pr-14", error && "ring-2 ring-danger/60")} {...props} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink hover:bg-white">
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}

function GradientButton({ children, loading, ...props }: ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || loading} className="bg-warm-gradient h-14 w-full rounded-full text-[18px] font-medium text-white transition hover:brightness-105 disabled:opacity-70">
      {loading ? "Please wait…" : children}
    </button>
  );
}

function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-[15px] text-ink-soft">
      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-8" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative flex h-14 w-full items-center justify-center rounded-full border border-ink text-[18px] font-medium transition hover:bg-cream-2">
        <span className="absolute left-5">
          <GoogleIcon />
        </span>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label} size="sm">
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Google sign-in needs a secure server connection to Google, which this frontend-only demo doesn&apos;t have. On the live site this button would open Google&apos;s sign-in window.
        </p>
        <p className="mt-3 text-[15px] text-ink-soft">For now, please use your email and password.</p>
      </Modal>
    </>
  );
}

/* ---------------- Log in ---------------- */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { success } = useToast();
  const [authError, setAuthError] = useState("");
  const { register, handleSubmit, formState, setValue } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const next = params.get("next");

  const onSubmit = handleSubmit(async (v) => {
    setAuthError("");
    await sleep(500);
    const res = loginCustomer(v.email, v.password);
    if (!res.ok) return setAuthError(res.error);
    success(`Welcome back, ${res.customer.firstName ?? res.customer.name.split(" ")[0]}!`);
    router.push(safeNext(next));
  });

  return (
    <AuthShell title="Log in">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FilledInput type="email" placeholder="Email" aria-label="Email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <PasswordInput placeholder="Password" aria-label="Password" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
        <div className="-mt-1 flex justify-end">
          <Link href="/forgot-password" className="text-[15px] font-medium underline underline-offset-2 hover:text-brand">
            Reset password?
          </Link>
        </div>
        {authError && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {authError}
          </p>
        )}
        <GradientButton type="submit" loading={formState.isSubmitting}>
          Log in
        </GradientButton>
      </form>
      <p className="mt-6 text-center text-[17px]">
        Not yet registered?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium underline underline-offset-2 hover:text-brand">
          Create an account
        </Link>
      </p>
      <OrDivider />
      <GoogleButton label="Connect with Google" />

      <div className="mt-10 rounded-2xl border border-dashed border-line p-4 text-sm text-ink-soft">
        <p className="font-semibold text-ink">Demo account</p>
        <p className="mt-1">
          {DEMO_CREDENTIALS.customer.email} · {DEMO_CREDENTIALS.customer.password}
        </p>
        <button
          type="button"
          onClick={() => {
            setValue("email", DEMO_CREDENTIALS.customer.email, { shouldValidate: true });
            setValue("password", DEMO_CREDENTIALS.customer.password, { shouldValidate: true });
          }}
          className="mt-2 font-semibold text-brand underline underline-offset-2"
        >
          Fill demo credentials
        </button>
      </div>
      <DemoNote className="mt-4">Frontend-only sign-in stored in your browser — not secure production authentication.</DemoNote>
    </AuthShell>
  );
}

/* ---------------- Sign up ---------------- */
const COUNTRIES = [
  { iso: "GB", dial: "+44", name: "United Kingdom" },
  { iso: "IE", dial: "+353", name: "Ireland" },
  { iso: "FR", dial: "+33", name: "France" },
  { iso: "ES", dial: "+34", name: "Spain" },
  { iso: "PL", dial: "+48", name: "Poland" },
  { iso: "RO", dial: "+40", name: "Romania" },
  { iso: "IN", dial: "+91", name: "India" },
  { iso: "PK", dial: "+92", name: "Pakistan" },
  { iso: "US", dial: "+1", name: "United States" },
];

function UkFlag() {
  return (
    <svg viewBox="0 0 60 30" className="h-4 w-7 rounded-sm" aria-hidden="true">
      <clipPath id="uk-s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="uk-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#uk-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

const signupSchema = z
  .object({
    title: z.enum(["Ms/Mrs", "Mr"], { message: "Please choose Ms/Mrs or Mr" }),
    firstName: z.string().trim().min(2, "Enter your first name"),
    lastName: z.string().trim().min(2, "Enter your last name"),
    dial: z.string(),
    phone: z.string().trim().min(1, "Enter your telephone number"),
    email: emailField,
    address: z.string().trim().min(1, "Enter your address"),
    password: passwordField,
    marketing: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const digits = v.phone.replace(/[\s()-]/g, "");
    const ok = v.dial === "+44" ? /^0?7\d{9}$|^0?[1-3]\d{8,9}$/.test(digits) : /^\d{6,14}$/.test(digits);
    if (!ok) ctx.addIssue({ code: "custom", path: ["phone"], message: v.dial === "+44" ? "Enter a valid UK number, e.g. 07700 900123" : "Enter a valid telephone number" });
    const addr = parseAddress(v.address, { requireCoverage: false });
    if (!addr.ok) ctx.addIssue({ code: "custom", path: ["address"], message: addr.error.replace("Include your postcode, e.g.", "Enter number, street, city and postcode, e.g.") });
  });
type SignupValues = z.infer<typeof signupSchema>;

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const settings = useStore("settings");
  const { success } = useToast();
  const [authError, setAuthError] = useState("");
  const { register, handleSubmit, formState, control, watch } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { dial: "+44", marketing: false, firstName: "", lastName: "", phone: "", email: "", address: "", password: "" },
  });
  const dial = watch("dial");
  const country = COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0];

  const onSubmit = handleSubmit(async (v) => {
    setAuthError("");
    await sleep(600);
    const national = v.phone.replace(/[\s()-]/g, "").replace(/^0/, "");
    const phone = `${v.dial} ${national.slice(0, 4)} ${national.slice(4)}`.trim();
    const addr = parseAddress(v.address, { requireCoverage: false });
    const res = registerCustomer({
      title: v.title,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone,
      password: v.password,
      marketing: v.marketing,
      address: addr.ok ? { street: addr.address.street, city: addr.address.city, postcode: addr.address.postcode, unit: addr.address.unit } : undefined,
    });
    if (!res.ok) return setAuthError(res.error);
    success("Welcome to Ginnara!", "Your account is ready. Any bookings made with this email are now linked.");
    router.push(safeNext(params.get("next")));
  });

  return (
    <AuthShell title="New customer">
      <GoogleButton label="Sign up with Google" />
      <OrDivider />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <div>
              <div role="radiogroup" aria-label="Title" className="grid grid-cols-2 gap-1 rounded-xl bg-[#f3f2f0] p-1">
                {(["Ms/Mrs", "Mr"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={field.value === t}
                    onClick={() => field.onChange(t)}
                    className={cn("h-10 rounded-lg text-[15px] transition", field.value === t ? "bg-white font-semibold shadow-soft" : "text-ink-soft hover:text-ink")}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {fieldState.error && <p className="mt-1.5 text-[13px] font-medium text-danger">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <FilledInput placeholder="First name" aria-label="First name" autoComplete="given-name" error={formState.errors.firstName?.message} {...register("firstName")} />
        <FilledInput placeholder="Last name" aria-label="Last name" autoComplete="family-name" error={formState.errors.lastName?.message} {...register("lastName")} />

        <div>
          <div className={cn("flex h-14 items-center rounded-xl bg-[#f3f2f0] focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/40", formState.errors.phone && "ring-2 ring-danger/60")}>
            <label className="relative flex h-full shrink-0 items-center gap-1 pr-2 pl-5">
              <span className="sr-only">Country code</span>
              {country.iso === "GB" ? <UkFlag /> : <span className="w-7 text-center text-xs font-bold">{country.iso}</span>}
              <ChevronDown className="size-3.5" />
              <select {...register("dial")} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Country code">
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.dial}>
                    {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </label>
            <span className="pr-1 text-[15px] text-ink-soft">{dial}</span>
            <input type="tel" placeholder="Telephone number" aria-label="Telephone number" autoComplete="tel-national" className="h-full min-w-0 flex-1 bg-transparent pr-5 pl-1 text-[16px] placeholder:text-[#7b756f] focus:outline-none" {...register("phone")} />
          </div>
          {formState.errors.phone ? <p className="mt-1.5 text-[13px] font-medium text-danger">{formState.errors.phone.message}</p> : <p className="mt-1.5 text-[13px] text-muted">Will be used by pro to contact you.</p>}
        </div>

        <FilledInput type="email" placeholder="Email" aria-label="Email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <FilledInput placeholder="Address" aria-label="Address (number, street, city, postcode)" autoComplete="street-address" error={formState.errors.address?.message} {...register("address")} />
        <PasswordInput placeholder="Password" aria-label="Password" autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />

        <label className="flex cursor-pointer items-start gap-4 pt-1">
          <span className="relative mt-0.5 inline-flex">
            <input type="checkbox" className="peer size-7 cursor-pointer appearance-none rounded-lg border border-ink bg-white transition checked:border-brand checked:bg-brand" {...register("marketing")} />
            <Check className="pointer-events-none absolute inset-0 m-auto size-4 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
          </span>
          <span className="text-[15px] leading-snug">I agree to receive Ginnara&apos;s offers and news by email and SMS.</span>
        </label>
        <p className="text-[13px] leading-snug text-ink-soft">
          By creating an account, you accept{" "}
          <Link href="/terms" className="font-medium text-ink underline">
            Ginnara&apos;s terms of service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-ink underline">
            privacy policy
          </Link>
          .
        </p>
        {authError && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {authError}{" "}
            <Link href="/login" className="underline">
              Log in instead
            </Link>
          </p>
        )}
        <GradientButton type="submit" loading={formState.isSubmitting}>
          Sign up
        </GradientButton>
      </form>
      <p className="mt-6 text-center text-[17px]">
        Signed up already?{" "}
        <Link href={`/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="font-medium underline underline-offset-2 hover:text-brand">
          Log in here
        </Link>
      </p>
      <div className="my-6 h-px bg-line" />
      <p className="text-center text-[17px]">
        At-home professional?{" "}
        <Link href="/pro/register" className="font-medium underline underline-offset-2 hover:text-brand">
          Sign up here.
        </Link>
      </p>
      <p className="mt-8 text-center text-sm text-muted">
        Questions? Call {settings.supportPhone} or email {settings.supportEmail}
      </p>
    </AuthShell>
  );
}
