import type { Metadata } from "next";
import { BecomeAPro } from "@/components/pro/BecomeAPro";

export const metadata: Metadata = {
  title: "Become a cleaning pro",
  description: "Join Ginnara as a self-employed cleaning professional. Choose your hours, keep 80% of every booking and get paid weekly.",
};

export default function BecomeAProPage() {
  return <BecomeAPro />;
}
