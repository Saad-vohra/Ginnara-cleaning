import type { Metadata } from "next";
import { ProRegisterForm } from "@/components/pro/ProForms";

export const metadata: Metadata = { title: "Pro application" };

export default function ProRegisterPage() {
  return <ProRegisterForm />;
}
