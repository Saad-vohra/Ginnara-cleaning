import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDashboard } from "@/components/dashboard/AccountDashboard";
import { Spinner } from "@/components/common/ui";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AccountDashboard />
    </Suspense>
  );
}
