import { EXTRAS } from "@/data/mock-services";
import { read } from "./storage";

/** Extra add-ons are editable in Admin → Pricing & Packages; fall back to the seed list. */
export function extraById(id: string) {
  let list = EXTRAS;
  try {
    list = read("extras");
  } catch {
    /* store not ready during module initialisation */
  }
  return list.find((e) => e.id === id) ?? EXTRAS.find((e) => e.id === id);
}
