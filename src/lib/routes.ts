/** Canonical URLs for services */
export function serviceHref(slug: string) {
  return OTHER_SERVICE_SLUGS.includes(slug) ? `/services/${slug}` : `/cleaning/${slug}`;
}

/** Non-cleaning services live under /services */
export const OTHER_SERVICE_SLUGS = ["plumbing", "house-moving"];

export function bookingHref(params: { service?: string; postcode?: string } = {}) {
  const q = new URLSearchParams();
  if (params.service) q.set("service", params.service);
  if (params.postcode) q.set("postcode", params.postcode);
  const s = q.toString();
  return s ? `/booking?${s}` : "/booking";
}
