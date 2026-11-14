import type { Metadata } from "next";
import { ProDashboard } from "@/components/pro/ProDashboard";

export const metadata: Metadata = { title: "Pro dashboard" };

export default function ProDashboardPage() {
  return <ProDashboard />;
}
