"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import { Photo } from "@/components/common/ui";
import { IMG } from "@/data/images";
import { customerExists, resetCustomerPassword } from "@/lib/auth";
import { emailField, passwordField } from "@/lib/validation";
import { sleep } from "@/lib/utils";

export function AuthLayout({ title, subtitle, children, image = IMG.coupleKitchen, quote }: { title: string; subtitle?: ReactNode; children: ReactNode; image?: string; quote?: string }) {
  return (
    <div className="container-site grid min-h-[calc(100dvh-160px)] items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[40px] lg:block">
        <Photo src={image} alt="" fill sizes="600px" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
        <p className="absolute right-8 bottom-8 left-8 font-display text-3xl leading-tight font-extrabold text-white">{quote ?? "“Coming home to a clean flat every Thursday is the best money I spend.”"}</p>
      </div>
    </div>
  );
}

const resetSchema = z.object({ password: passwordField, confirm: z.string() }).refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export function ForgotPasswordForm() {
  const { success } = useToast();
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "sent" | "reset">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  return (
    <AuthLayout title={stage === "reset" ? "Choose a new password" : "Reset your password"} subtitle={stage === "email" ? "Enter your email and we'll send you a reset link." : undefined} image={IMG.livingFire} quote="“Support sorted my booking in minutes. Lovely people.”">
      {stage === "email" && (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const r = emailField.safeParse(email);
            if (!r.success) return setEmailError(r.error.issues[0].message);
            setEmailError("");
            setLoading(true);
            await sleep(800);
            setLoading(false);
            setStage("sent");
          }}
          className="space-y-5"
        >
          <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leading={<Mail className="size-4" />} error={emailError} />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
      {stage === "sent" && (
        <div className="rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-line">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
            <MailCheck className="size-7" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold">Check your inbox</h2>
          <p className="mt-2 text-sm text-ink-soft">If an account exists for {email}, we&apos;ve sent a reset link. (Demo: no email is sent.)</p>
          {customerExists(email) ? (
            <Button className="mt-5 w-full" icon={<KeyRound className="size-4" />} onClick={() => setStage("reset")}>
              Simulate opening the reset link
            </Button>
          ) : (
            <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm">No demo account uses this email. <Link href="/register" className="font-semibold underline">Create one</Link>.</p>
          )}
        </div>
      )}
      {stage === "reset" && (
        <form
          noValidate
          onSubmit={resetForm.handleSubmit(async (v) => {
            await sleep(600);
            resetCustomerPassword(email, v.password);
            success("Password updated", "Sign in with your new password.");
            router.push("/login");
          })}
          className="space-y-5"
        >
          <Input label="New password" type="password" autoComplete="new-password" error={resetForm.formState.errors.password?.message} {...resetForm.register("password")} />
          <Input label="Confirm password" type="password" autoComplete="new-password" error={resetForm.formState.errors.confirm?.message} {...resetForm.register("confirm")} />
          <Button type="submit" size="lg" className="w-full" loading={resetForm.formState.isSubmitting}>
            Update password
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </AuthLayout>
  );
}
