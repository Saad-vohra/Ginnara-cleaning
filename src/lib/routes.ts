/** Canonical URLs for services */
export function serviceHref(slug: string) {
  return `/cleaning/${slug}`;
}

export function bookingHref(params: { service?: string; postcode?: string } = {}) {
  const q = new URLSearchParams();
  if (params.service) q.set("service", params.service);
  if (params.postcode) q.set("postcode", params.postcode);
  const s = q.toString();
  return s ? `/booking?${s}` : "/booking";
}
