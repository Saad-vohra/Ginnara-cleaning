import type { Metadata } from "next";
import { ReviewsPage } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "Customer reviews", description: "Read what customers say about Ginnara cleaners." };

export default function Page() {
  return <ReviewsPage />;
}
