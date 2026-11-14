"use client";

import { Spinner } from "@/components/common/ui";
import { useHydrated } from "@/hooks/useStore";
import { BookingFlow } from "./BookingFlow";

/** Mount the flow only on the client so saved drafts (sessionStorage) restore without hydration mismatches */
export function BookingEntry() {
  const hydrated = useHydrated();
  if (!hydrated) return <Spinner label="Loading booking" />;
  return <BookingFlow />;
}
