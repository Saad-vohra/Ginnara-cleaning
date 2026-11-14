"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Lock, Mail, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/common/Button";
import { Checkbox, FieldWrap, Input, Select, Textarea } from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import { DemoNote } from "@/components/common/ui";
import { AuthLayout } from "@/components/forms/AuthForms";
import { IMG } from "@/data/images";
import { DEMO_CREDENTIALS } from "@/data/mock-users";
import { useActiveServices } from "@/hooks/useStore";
import { loginPro } from "@/lib/auth";
import { registerPro } from "@/lib/pros";
import { loginSchema, normalisePostcode, proRegisterSchema, type LoginValues, type ProRegisterValues } from "@/lib/validation";
import { cn, sleep } from "@/lib/utils";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const EXPERIENCE = ["Less than 1 year", "1-2 years", "3-5 years", "6+ years"];

export function ChipMulti({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn("inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition", on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/50")}
          >
            {on && <Check className="size-3.5" strokeWidth={3} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function AvatarUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  return (
    <FieldWrap label="Profile photo" hint="JPG or PNG, max 1MB. A clear, friendly photo helps customers choose you." error={error}>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => input.current?.click()} className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line bg-cream-2 text-muted hover:border-ink" aria-label="Upload profile photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="Profile preview" className="size-full object-cover" /> : <Camera className="size-7" />}
        </button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="soft" icon={<Upload className="size-4" />} onClick={() => input.current?.click()}>
            {value ? "Change photo" : "Upload photo"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => onChange("")}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
            if (file.size > 1024 * 1024) return setError("That image is over 1MB — please choose a smaller one.");
            setError("");
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </div>
    </FieldWrap>
  );
}

export function ProRegisterForm() {
  const router = useRouter();
  const services = useActiveServices();
  const { success } = useToast();
  const [avatar, setAvatar] = useState("");
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState, control } = useForm<ProRegisterValues>({
    resolver: zodResolver(proRegisterSchema),
    mode: "onTouched",
    defaultValues: { services: [], availability: ["Mon", "Tue", "Wed", "Thu", "Fri"], experience: "", rightToWork: false },
  });

  const onSubmit = handleSubmit(async (v) => {
    setErr("");
    await sleep(900);
    const res = registerPro({ name: v.name, email: v.email, phone: v.phone, postcode: normalisePostcode(v.postcode), services: v.services, experience: v.experience, qualifications: v.qualifications, availability: v.availability, bio: v.bio, password: v.password, avatar });
    if (!res.ok) return setErr(res.error);
    success("Application submitted!", "We've added some demo booking requests to your dashboard.");
    router.push("/pro/dashboard");
  });

  const section = "rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/60 sm:p-8";

  return (
    <div className="bg-cream-2 py-10 lg:py-16">
      <div className="container-site max-w-3xl">
        <p className="text-sm font-bold tracking-wider text-brand uppercase">Pro application</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Join Ginnara as a cleaning pro</h1>
        <p className="mt-3 text-ink-soft">Takes about 5 minutes. Already applied? <Link href="/pro/login" className="font-semibold text-brand underline">Sign in</Link></p>
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
          <section className={section}>
            <h2 className="mb-5 text-xl font-extrabold">1. About you</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AvatarUpload value={avatar} onChange={setAvatar} />
              </div>
              <Input label="Full name" autoComplete="name" wrapClassName="sm:col-span-2" error={formState.errors.name?.message} {...register("name")} />
              <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
              <Input label="Phone" type="tel" autoComplete="tel" placeholder="07700 900123" error={formState.errors.phone?.message} {...register("phone")} />
              <Input label="Home postcode" className="uppercase" placeholder="SW9 8HQ" hint="We'll show you jobs nearby" error={formState.errors.postcode?.message} {...register("postcode")} />
              <Input label="Create a password" type="password" autoComplete="new-password" hint="8+ characters, letters & numbers" error={formState.errors.password?.message} {...register("password")} />
            </div>
          </section>

          <section className={section}>
            <h2 className="mb-5 text-xl font-extrabold">2. Your experience</h2>
            <div className="space-y-5">
              <Controller
                control={control}
                name="services"
                render={({ field, fieldState }) => (
                  <FieldWrap label="Services you offer" error={fieldState.error?.message}>
                    <ChipMulti options={services.map((s) => ({ value: s.id, label: s.name }))} value={field.value} onChange={field.onChange} />
                  </FieldWrap>
                )}
              />
              <Select label="Cleaning experience" placeholder="Select…" options={EXPERIENCE.map((e) => ({ value: e, label: e }))} error={formState.errors.experience?.message} {...register("experience")} />
              <Textarea label="Qualifications & checks" placeholder="e.g. BICSc certificate, existing DBS, office cleaning experience…" error={formState.errors.qualifications?.message} {...register("qualifications")} />
              <Textarea label="Short bio for customers" placeholder="What makes you great at what you do?" error={formState.errors.bio?.message} {...register("bio")} />
            </div>
          </section>

          <section className={section}>
            <h2 className="mb-5 text-xl font-extrabold">3. Availability</h2>
            <Controller
              control={control}
              name="availability"
              render={({ field, fieldState }) => (
                <FieldWrap label="Days you can usually work" error={fieldState.error?.message}>
                  <ChipMulti options={WEEKDAYS.map((d) => ({ value: d, label: d }))} value={field.value} onChange={field.onChange} />
                </FieldWrap>
              )}
            />
            <Checkbox className="mt-6" label="I confirm I have the right to work in the UK and consent to background checks." error={formState.errors.rightToWork?.message} {...register("rightToWork")} />
          </section>

          {err && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {err}
            </p>
          )}
          {Object.keys(formState.errors).length > 0 && formState.isSubmitted && <p className="text-sm font-medium text-danger">Please fix the highlighted fields above.</p>}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <DemoNote>Applications are stored in this browser. No checks are actually run.</DemoNote>
            <Button type="submit" size="lg" loading={formState.isSubmitting}>
              Submit application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProLoginForm() {
  const router = useRouter();
  const { success } = useToast();
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState, setValue } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  return (
    <AuthLayout title="Pro sign in" subtitle="Manage requests, your schedule and earnings." image={IMG.proWindow} quote="“Weekly payouts and jobs near home. It just works.”">
      <div className="mb-6 rounded-3xl border border-dashed border-brand/40 bg-brand/5 p-4">
        <p className="text-sm font-bold">Demo pro account</p>
        <p className="mt-1 text-sm text-ink-soft">
          Email: <code className="font-semibold">{DEMO_CREDENTIALS.pro.email}</code>
          <br />
          Password: <code className="font-semibold">{DEMO_CREDENTIALS.pro.password}</code>
        </p>
        <Button
          type="button"
          size="sm"
          variant="dark"
          className="mt-3"
          onClick={() => {
            setValue("email", DEMO_CREDENTIALS.pro.email, { shouldValidate: true });
            setValue("password", DEMO_CREDENTIALS.pro.password, { shouldValidate: true });
          }}
        >
          Fill demo credentials
        </Button>
      </div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit(async (v) => {
          setErr("");
          await sleep(600);
          const res = loginPro(v.email, v.password);
          if (!res.ok) return setErr(res.error);
          success(`Welcome back, ${res.pro.name.split(" ")[0]}!`);
          router.push("/pro/dashboard");
        })}
      >
        <Input label="Email" type="email" autoComplete="email" leading={<Mail className="size-4" />} error={formState.errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" autoComplete="current-password" leading={<Lock className="size-4" />} error={formState.errors.password?.message} {...register("password")} />
        {err && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {err}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <DemoNote className="mt-6">Frontend-only sign-in for demonstration purposes.</DemoNote>
    </AuthLayout>
  );
}
