import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "About us", description: "The story, values and team behind Ginnara Cleaning." };

export default function Page() {
  return <AboutPage />;
}
