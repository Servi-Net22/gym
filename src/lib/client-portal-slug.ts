import { notFound, redirect } from "next/navigation";
import {
  CLIENT_PORTAL_RESERVED_SLUGS,
  clientPortalHome,
} from "@/lib/client-portal-paths";
import { requireClientSession } from "@/lib/client-auth";
import { normalizeOrgSlug } from "@/lib/company";

/** Sesión de cliente + slug de URL alineados al mismo comercio. */
export async function requireClientPortalSlug(rawSlug: string) {
  const session = await requireClientSession();
  const slug = normalizeOrgSlug(rawSlug);

  if (!slug || CLIENT_PORTAL_RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  if (!session.organizationSlug) {
    redirect("/api/auth/clear-client-session?next=/mi/login");
  }

  if (session.organizationSlug !== slug) {
    redirect(clientPortalHome(session.organizationSlug));
  }

  return { session, slug };
}

/** Redirige rutas legacy /mi/... a /mi/{slug}/... usando la sesión. */
export async function redirectLegacyClientPortal(
  pathAfterMi: string,
  search = "",
) {
  const session = await requireClientSession();
  if (!session.organizationSlug) {
    redirect("/api/auth/clear-client-session?next=/mi/login");
  }
  const base = `/mi/${session.organizationSlug}${pathAfterMi}`;
  redirect(search ? `${base}?${search}` : base);
}
