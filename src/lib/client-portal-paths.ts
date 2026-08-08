/** Segmentos reservados bajo /mi (no pueden ser slug de organización). */
export const CLIENT_PORTAL_RESERVED_SLUGS = new Set([
  "login",
  "contenidos",
]);

export function isReservedClientPortalSlug(slug: string) {
  return CLIENT_PORTAL_RESERVED_SLUGS.has(slug);
}

export function clientPortalHome(slug: string) {
  return `/mi/${slug}`;
}

export function clientPortalLogin(slug?: string | null) {
  return slug ? `/mi/${slug}/login` : "/mi/login";
}

export function clientPortalContents(
  slug: string,
  query?: { tipo?: string; genero?: string },
) {
  const q = new URLSearchParams();
  if (query?.tipo) q.set("tipo", query.tipo);
  if (query?.genero) q.set("genero", query.genero);
  const s = q.toString();
  return s ? `/mi/${slug}/contenidos?${s}` : `/mi/${slug}/contenidos`;
}

export function clientPortalContent(slug: string, id: string) {
  return `/mi/${slug}/contenidos/${id}`;
}
