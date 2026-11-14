import type { Metadata } from "next";
import { FaqPage } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "FAQs", description: "Answers about booking, pricing, cleaners and your account." };

export default function Page() {
  return <FaqPage />;
}
