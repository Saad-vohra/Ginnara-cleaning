import type { Metadata } from "next";
import { DomesticCleaningHub } from "@/components/services/DomesticCleaningHub";

export const metadata: Metadata = {
  title: "Cleaning services",
  description: "Book trusted domestic cleaners near you. Residential, office, deep, move-in/move-out and special event cleaning from £16.50/hr.",
};

export default function DomesticCleaningPage() {
  return <DomesticCleaningHub />;
}
