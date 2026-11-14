"use client";

import { Banknote, CreditCard, Download, Hourglass, RotateCcw, Wallet } from "lucide-react";
import { useState } from "react";
import type { Booking, PaymentStatus } from "@/types";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, DemoNote, Photo, PillTabs } from "@/components/common/ui";
import { DataTable } from "@/components/dashboard/DataTable";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { downloadCsv, logActivity, PAYMENT_LABEL, paymentMethodOf, paymentStatusOf } from "@/lib/admin";
import { PRO_SHARE } from "@/lib/pros";
import { patch } from "@/lib/storage";
import { formatDate, formatDateTime, gbp2, toISODate } from "@/lib/utils";

const TONE: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = { paid: "success", authorised: "warning", refunded: "danger", voided: "neutral" };

export function PaymentsAdmin() {
  const [tab, setTab] = useState<"transactions" | "payouts">("transactions");
  return (
    <div className="space-y-5">
      <DemoNote>Payments are simulated for this demo — no card is charged and no money moves.</DemoNote>
      <PillTabs value={tab} onChange={setTab} tabs={[{ value: "transactions", label: "Transactions" }, { value: "payouts", label: "Cleaner payouts" }]} />
      {tab === "transactions" ? <Transactions /> : <Payouts />}
    </div>
  );
}

function Transactions() {
  const bookings = useStore("bookings");
  const { success } = useToast();
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [method, setMethod] = useState<"all" | "card" | "paypal">("all");
  const [confirm, setConfirm] = useState<{ b: Booking; action: "capture" | "refund" } | null>(null);

  const sum = (s: PaymentStatus) => bookings.filter((b) => paymentStatusOf(b) === s).reduce((t, b) => t + b.pricing.total, 0);
  const rows = bookings
    .filter((b) => (filter === "all" || paymentStatusOf(b) === filter) && (method === "all" || paymentMethodOf(b) === method))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={gbp2(sum("paid"))} icon={Banknote} tone="mint" hint={`${bookings.filter((b) => paymentStatusOf(b) === "paid").length} paid bookings`} />
        <StatCard label="Authorised (to capture)" value={gbp2(sum("authorised"))} icon={Hourglass} tone="sun" hint="Charged after the clean" />
        <StatCard label="Refunded" value={gbp2(sum("refunded"))} icon={RotateCcw} tone="blush" />
        <StatCard label="Net revenue" value={gbp2(sum("paid"))} icon={Wallet} tone="sky" hint={`Platform share ≈ ${gbp2(sum("paid") * (1 - PRO_SHARE))}`} />
      </div>
      <Panel>
        <PillTabs
          className="mb-5"
          value={filter}
          onChange={setFilter}
          tabs={(["all", "authorised", "paid", "refunded", "voided"] as const).map((s) => ({ value: s, label: s === "all" ? "All" : PAYMENT_LABEL[s], count: s === "all" ? bookings.length : bookings.filter((b) => paymentStatusOf(b) === s).length }))}
        />
        <DataTable
          rows={rows}
          rowKey={(b) => b.ref}
          pageSize={10}
          searchText={(b) => `${b.ref} ${b.customer.name} ${b.customer.email}`}
          searchPlaceholder="Search ref or customer"
          toolbar={
            <>
              <select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="h-9 rounded-full border border-line bg-white px-3 text-sm font-semibold">
                <option value="all">All methods</option>
                <option value="card">Card</option>
                <option value="paypal">PayPal</option>
              </select>
              <Button
                size="sm"
                variant="soft"
                icon={<Download className="size-4" />}
                onClick={() => {
                  downloadCsv(`ginnara-transactions-${toISODate(new Date())}.csv`, [["Transaction", "Booking", "Date", "Customer", "Method", "Status", "Amount (£)"], ...rows.map((b) => [`TX-${b.ref.slice(3)}`, b.ref, b.createdAt.slice(0, 10), b.customer.name, paymentMethodOf(b), PAYMENT_LABEL[paymentStatusOf(b)], b.pricing.total.toFixed(2)])]);
                  logActivity("Payments", `Exported ${rows.length} transactions to CSV`);
                }}
              >
                Export CSV
              </Button>
            </>
          }
          columns={[
            { key: "tx", header: "Transaction", sortValue: (b) => b.createdAt, render: (b) => <span><span className="block font-semibold">TX-{b.ref.slice(3)}</span><span className="text-xs text-muted">{formatDateTime(b.createdAt)}</span></span> },
            { key: "booking", header: "Booking", render: (b) => <span><span className="block">{b.ref}</span><span className="text-xs text-muted">{b.serviceName}</span></span> },
            { key: "customer", header: "Customer", sortValue: (b) => b.customer.name, render: (b) => b.customer.name },
            { key: "method", header: "Method", render: (b) => <span className="inline-flex items-center gap-1.5"><CreditCard className="size-4 text-muted" />{paymentMethodOf(b) === "card" ? "Card" : "PayPal"}</span> },
            { key: "amount", header: "Amount", sortValue: (b) => b.pricing.total, render: (b) => <span className="font-semibold">{gbp2(b.pricing.total)}</span> },
            { key: "status", header: "Status", render: (b) => <Badge tone={TONE[paymentStatusOf(b)]}>{PAYMENT_LABEL[paymentStatusOf(b)]}</Badge> },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (b) => {
                const s = paymentStatusOf(b);
                if (s === "authorised" && b.status !== "cancelled") return <Button size="sm" variant="soft" onClick={() => setConfirm({ b, action: "capture" })}>Capture</Button>;
                if (s === "paid") return <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirm({ b, action: "refund" })}>Refund</Button>;
                return <span className="text-xs text-muted">{b.refundedAt ? formatDate(b.refundedAt.slice(0, 10)) : "—"}</span>;
              },
            },
          ]}
        />
      </Panel>
      <ConfirmDialog
        open={!!confirm}
        tone={confirm?.action === "refund" ? "danger" : "primary"}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "refund" ? "Refund payment?" : "Capture payment?"}
        description={confirm ? `${gbp2(confirm.b.pricing.total)} for ${confirm.b.ref} (${confirm.b.customer.name}). Simulated — no money moves.` : ""}
        confirmLabel={confirm?.action === "refund" ? "Refund" : "Capture"}
        onConfirm={() => {
          if (!confirm) return;
          const { b, action } = confirm;
          if (action === "refund") {
            patch("bookings", (x) => x.ref === b.ref, { paymentStatus: "refunded", refundedAt: new Date().toISOString() });
            logActivity("Payments", `Refunded ${gbp2(b.pricing.total)}`, b.ref);
            success("Refund recorded", b.ref);
          } else {
            patch("bookings", (x) => x.ref === b.ref, { paymentStatus: "paid" });
            logActivity("Payments", `Captured ${gbp2(b.pricing.total)}`, b.ref);
            success("Payment captured", b.ref);
          }
        }}
      />
    </>
  );
}

function Payouts() {
  const pros = useStore("pros").filter((p) => p.status === "approved");
  const bookings = useStore("bookings");
  const { success } = useToast();
  const rows = pros.map((p) => {
    const done = bookings.filter((b) => b.proId === p.id && b.status === "completed");
    const unpaid = done.filter((b) => !p.lastPayoutAt || b.date > p.lastPayoutAt.slice(0, 10));
    return { pro: p, jobs: done.length, earned: done.reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0), owed: unpaid.reduce((s, b) => s + b.pricing.total * PRO_SHARE, 0), unpaidJobs: unpaid.length };
  });
  const totalOwed = rows.reduce((s, r) => s + r.owed, 0);
  return (
    <Panel
      title={`Payouts owed: ${gbp2(totalOwed)}`}
      action={
        <Button
          size="sm"
          disabled={totalOwed <= 0}
          onClick={() => {
            rows.filter((r) => r.owed > 0).forEach((r) => patch("pros", (x) => x.id === r.pro.id, { lastPayoutAt: new Date().toISOString() }));
            logActivity("Payments", `Ran payouts for all cleaners (${gbp2(totalOwed)})`);
            success("Payout run recorded", `${gbp2(totalOwed)} (simulated)`);
          }}
        >
          Pay all
        </Button>
      }
    >
      <DataTable
        rows={rows}
        rowKey={(r) => r.pro.id}
        columns={[
          {
            key: "pro",
            header: "Cleaner",
            sortValue: (r) => r.pro.name,
            render: (r) => (
              <span className="flex items-center gap-3">
                <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
                  <Photo src={r.pro.avatar} alt="" fill sizes="36px" />
                </span>
                <span className="font-semibold">{r.pro.name}</span>
              </span>
            ),
          },
          { key: "jobs", header: "Completed jobs", sortValue: (r) => r.jobs, render: (r) => r.jobs },
          { key: "earned", header: "Earned (demo)", sortValue: (r) => r.earned, render: (r) => gbp2(r.earned) },
          { key: "last", header: "Last payout", render: (r) => (r.pro.lastPayoutAt ? formatDateTime(r.pro.lastPayoutAt) : "Never") },
          { key: "owed", header: "Owed now", sortValue: (r) => r.owed, render: (r) => <span className="font-semibold">{gbp2(r.owed)}</span> },
          {
            key: "pay",
            header: "",
            className: "text-right",
            render: (r) => (
              <Button
                size="sm"
                variant="soft"
                disabled={r.owed <= 0}
                onClick={() => {
                  patch("pros", (x) => x.id === r.pro.id, { lastPayoutAt: new Date().toISOString() });
                  logActivity("Payments", `Recorded payout of ${gbp2(r.owed)}`, r.pro.name);
                  success("Payout recorded", `${gbp2(r.owed)} to ${r.pro.name}`);
                }}
              >
                Pay {r.owed > 0 ? gbp2(r.owed) : ""}
              </Button>
            ),
          },
        ]}
      />
      <p className="mt-3 text-xs text-muted">Cleaners keep {PRO_SHARE * 100}% of each completed booking.</p>
    </Panel>
  );
}
