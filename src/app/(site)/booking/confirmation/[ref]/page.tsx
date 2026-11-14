import type { Metadata } from "next";
import { Confirmation } from "@/components/booking/Confirmation";

export const metadata: Metadata = { title: "Booking confirmed" };

export default async function ConfirmationPage({ params }: PageProps<"/booking/confirmation/[ref]">) {
  const { ref } = await params;
  return <Confirmation bookingRef={decodeURIComponent(ref)} />;
}
