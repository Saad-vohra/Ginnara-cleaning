import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingEntry } from "@/components/booking/flow/BookingEntry";
import { Spinner } from "@/components/common/ui";

export const metadata: Metadata = { title: "Pricing and booking" };

export default function BookingPage() {
  return (
    <Suspense fallback={<Spinner label="Loading booking" />}>
      <BookingEntry />
    </Suspense>
  );
}
