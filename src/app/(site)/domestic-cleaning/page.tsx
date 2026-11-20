import type { Metadata } from "next";
import { DomesticCleaningHub } from "@/components/services/DomesticCleaningHub";

export const metadata: Metadata = {
  title: "Cleaning services",
  description: "Book trusted domestic cleaners near you. Regular cleaning £17/hr, one-off £20/hr, deep cleaning £22/hr and Airbnb cleaning from £39.",
};

export default function DomesticCleaningPage() {
  return <DomesticCleaningHub />;
}
