import type { Metadata } from "next";
import { BlogIndex } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "The mag", description: "Cleaning tips, moving guides and home inspiration." };

export default function Page() {
  return <BlogIndex />;
}
