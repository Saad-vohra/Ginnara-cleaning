import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/forms/CustomerAuth";
import { Spinner } from "@/components/common/ui";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterForm />
    </Suspense>
  );
}
