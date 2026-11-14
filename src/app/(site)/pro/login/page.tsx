import type { Metadata } from "next";
import { ProLoginForm } from "@/components/pro/ProForms";

export const metadata: Metadata = { title: "Pro sign in" };

export default function ProLoginPage() {
  return <ProLoginForm />;
}
