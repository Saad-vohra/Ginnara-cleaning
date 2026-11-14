"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Cookie, Database, Download, KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Field";
import { ConfirmDialog } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, DemoNote } from "@/components/common/ui";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useSession, useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { patch, read, resetDemoData, write, type StoreKey } from "@/lib/storage";
import { formatDateTime, toISODate } from "@/lib/utils";
import { passwordField } from "@/lib/validation";

const pwSchema = z.object({ current: z.string().min(1, "Enter your current password"), password: passwordField, confirm: z.string() }).refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

const KEYS: StoreKey[] = ["services", "categories", "locations", "packages", "extras", "customers", "pros", "bookings", "reviews", "coupons", "contacts", "posts", "faqs", "content", "settings", "templates", "notifications", "activity", "admins"];

function storageSize() {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith("ginnara:"))
      .reduce((s, k) => s + (localStorage.getItem(k)?.length ?? 0) + k.length, 0);
  } catch {
    return 0;
  }
}

export function SettingsAdmin() {
  const session = useSession();
  const admins = useStore("admins");
  const consent = useStore("consent");
  const settings = useStore("settings");
  const { success } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const me = admins.find((a) => a.id === session.adminId);
  const pw = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema) });
  const [size] = useState(storageSize);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><KeyRound className="size-5 text-brand" /> My account</span>}>
          <p className="mb-4 text-sm text-ink-soft">
            Signed in as <strong className="text-ink">{me?.name}</strong> ({me?.email})
          </p>
          <form
            noValidate
            className="grid gap-4"
            onSubmit={pw.handleSubmit((v) => {
              if (!me || v.current !== me.password) return pw.setError("current", { message: "Current password is incorrect" });
              patch("admins", (a) => a.id === me.id, { password: v.password });
              logActivity("Settings", "Changed own password");
              pw.reset({ current: "", password: "", confirm: "" });
              success("Password updated");
            })}
          >
            <Input label="Current password" type="password" autoComplete="current-password" error={pw.formState.errors.current?.message} {...pw.register("current")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="New password" type="password" autoComplete="new-password" error={pw.formState.errors.password?.message} {...pw.register("password")} />
              <Input label="Confirm" type="password" autoComplete="new-password" error={pw.formState.errors.confirm?.message} {...pw.register("confirm")} />
            </div>
            <div>
              <Button type="submit" variant="dark">
                Update password
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><Cookie className="size-5 text-brand" /> Cookie consent</span>}>
          <p className="text-sm text-ink-soft">The website asks every visitor for consent. In this demo, only the choice made in this browser is stored:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={consent.decided ? "success" : "warning"}>{consent.decided ? "Choice made" : "Not answered yet"}</Badge>
            <Badge tone={consent.preferences ? "success" : "neutral"}>Preferences: {consent.preferences ? "on" : "off"}</Badge>
            <Badge tone={consent.statistics ? "success" : "neutral"}>Statistics: {consent.statistics ? "on" : "off"}</Badge>
            <Badge tone={consent.marketing ? "success" : "neutral"}>Marketing: {consent.marketing ? "on" : "off"}</Badge>
          </div>
          {consent.decidedAt && <p className="mt-3 text-xs text-muted">Saved {formatDateTime(consent.decidedAt)}</p>}
          <Button
            size="sm"
            variant="soft"
            className="mt-4"
            onClick={() => {
              write("consent", { decided: false, preferences: false, statistics: false, marketing: false });
              logActivity("Settings", "Reset cookie consent for this browser");
              success("Consent reset", "The cookie banner will show again on the website.");
            }}
          >
            Show the cookie banner again
          </Button>
        </Panel>
      </div>

      <Panel title={<span className="flex items-center gap-2"><Database className="size-5 text-brand" /> Demo data</span>}>
        <DemoNote>All data in this prototype lives in this browser&apos;s storage ({(size / 1024).toFixed(1)} KB used). Business: {settings.businessName} · {settings.website}.</DemoNote>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="soft"
            icon={<Download className="size-4" />}
            onClick={() => {
              const data = Object.fromEntries(KEYS.map((k) => [k, read(k)]));
              const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `ginnara-demo-data-${toISODate(new Date())}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              logActivity("Settings", "Exported all demo data (JSON)");
            }}
          >
            Export all data (JSON)
          </Button>
          <Button variant="danger" icon={<RefreshCw className="size-4" />} onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
        </div>
      </Panel>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all demo data?"
        description="Every change made in this browser (bookings, customers, services, prices, content, admin users, logs) will be erased and the original demo data restored. You'll stay signed in."
        confirmLabel="Reset everything"
        onConfirm={() => {
          resetDemoData(true);
          success("Demo data reset", "Everything is back to the original state.");
          setTimeout(() => window.location.reload(), 600);
        }}
      />
    </div>
  );
}
