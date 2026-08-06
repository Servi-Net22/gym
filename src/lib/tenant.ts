import type { SessionUser } from "@/lib/session";
import type { ClientSession } from "@/lib/client-session";

/** Filtro Prisma para acotar queries al tenant de la sesión. */
export function tenantWhere(
  session: Pick<SessionUser, "organizationId"> | Pick<ClientSession, "organizationId">,
): { organizationId: string } {
  if (!session.organizationId) {
    throw new Error("Sesión sin organizationId: aislamiento de tenant requerido");
  }
  return { organizationId: session.organizationId };
}

export function tenantId(
  session: Pick<SessionUser, "organizationId"> | Pick<ClientSession, "organizationId">,
): string {
  return tenantWhere(session).organizationId;
}
