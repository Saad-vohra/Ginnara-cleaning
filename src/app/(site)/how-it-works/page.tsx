import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "How it works", description: "Book a vetted cleaner in three simple steps." };

export default function Page() {
  return <HowItWorksPage />;
}
