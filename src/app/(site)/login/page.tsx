import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/forms/CustomerAuth";
import { Spinner } from "@/components/common/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginForm />
    </Suspense>
  );
}
