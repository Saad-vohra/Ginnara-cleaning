import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with the Ginnara support team." };

export default function Page() {
  return <ContactPage />;
}
