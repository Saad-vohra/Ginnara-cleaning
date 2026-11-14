import { CITIES, DEMO_POSTCODES } from "@/data/mock-cities";
import { coveredAreaNames, isCovered, normalisePostcode, outwardArea } from "./validation";

const POSTCODE_ANYWHERE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

export interface ParsedAddress {
  street: string;
  city: string;
  postcode: string;
  unit: string;
  full: string;
}

export type ParseResult = { ok: true; address: ParsedAddress } | { ok: false; error: string };

/**
 * Parse a single-line UK address typed as "number, street, city, postcode".
 * Demo-grade parsing — a production site would use an address-lookup API.
 */
export function parseAddress(input: string, opts: { requireCoverage?: boolean } = {}): ParseResult {
  const text = input.trim();
  if (!text) return { ok: false, error: "Enter your full address." };
  const m = text.match(POSTCODE_ANYWHERE);
  if (!m) return { ok: false, error: "Include your postcode, e.g. 221b, Baker Street, London, NW1 6XE." };
  const postcode = normalisePostcode(`${m[1]} ${m[2]}`);

  const parts = text
    .replace(m[0], "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^(united kingdom|uk|england|scotland|wales)$/i.test(p));

  const unitParts: string[] = [];
  while (parts.length > 1 && /^(flat|apt|apartment|unit|floor|room)\b/i.test(parts[0])) unitParts.push(parts.shift()!);

  if (!parts.length) return { ok: false, error: "Add your house number and street before the postcode." };

  let street: string;
  let rest: string[];
  if (/^[\d]+[a-z]?$/i.test(parts[0]) && parts[1]) {
    street = `${parts[0]} ${parts[1]}`;
    rest = parts.slice(2);
  } else {
    street = parts[0];
    rest = parts.slice(1);
  }
  if (!/\d/.test(street)) return { ok: false, error: "Start with your house or flat number so your pro can find you." };
  if (street.replace(/[\d\s]/g, "").length < 3) return { ok: false, error: "Add your street name after the house number." };

  const city = rest[rest.length - 1] || CITIES.find((c) => c.postcodes.includes(outwardArea(postcode)))?.name || "";
  if (!city) return { ok: false, error: "Add your town or city." };
  if (opts.requireCoverage !== false && !isCovered(postcode)) {
    return { ok: false, error: `Sorry, we don't cover ${outwardArea(postcode)} postcodes yet (we currently cover: ${coveredAreaNames().join(", ") || "no areas"}).` };
  }
  const unit = [...unitParts, ...(rest.length > 1 ? rest.slice(0, -1) : [])].join(", ");
  return { ok: true, address: { street, city, postcode, unit, full: formatFull({ street, city, postcode, unit }) } };
}

export function formatFull(a: { street: string; city: string; postcode: string; unit?: string }) {
  const [num, ...streetName] = a.street.split(" ");
  const line = /\d/.test(num) && streetName.length ? `${num}, ${streetName.join(" ")}` : a.street;
  return [a.unit, line, a.city, a.postcode, "United Kingdom"].filter(Boolean).join(", ");
}

const DEMO_STREETS: Record<string, string> = {
  "SW4 7AA": "14 Elmhurst Road",
  "N1 9GU": "8 Copenhagen Street",
  "E8 3DL": "5 Mare Street",
  "M20 2RN": "22 Lapwing Lane",
  "B15 2TT": "41 Harborne Road",
  "BS8 1QU": "3 Royal York Crescent",
  "LS6 3HN": "17 Cardigan Road",
  "L25 5JF": "9 Woolton Street",
  "CR0 1NX": "60 High Street",
  "MK9 2FP": "12 Midsummer Boulevard",
};

/** Demo suggestions shown under the address field */
export const DEMO_ADDRESSES = [
  "221b, Baker Street, London, NW1 6XE",
  ...DEMO_POSTCODES.map((p) => {
    const city = p.area.split(", ").pop()!;
    return formatFull({ street: DEMO_STREETS[p.postcode] ?? "1 High Street", city, postcode: p.postcode }).replace(", United Kingdom", "");
  }),
];
