import type { Metadata } from "next";
import { HelpPage } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "Help centre", description: "Search help articles or find your booking." };

export default function Page() {
  return <HelpPage />;
}
