import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CLIENT_SESSION_COOKIE,
  createClientSessionToken,
  readClientSessionToken,
  type ClientSession,
} from "@/lib/client-session";

export {
  CLIENT_SESSION_COOKIE,
  createClientSessionToken,
  type ClientSession,
};

export async function getClientSession(): Promise<ClientSession | null> {
  const jar = await cookies();
  const token = jar.get(CLIENT_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await readClientSessionToken(token);
  if (!session) return null;

  const client = await prisma.client.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      documentId: true,
      firstName: true,
      lastName: true,
      active: true,
      portalPinHash: true,
      organizationId: true,
      organization: { select: { slug: true, active: true } },
    },
  });

  if (
    !client ||
    !client.active ||
    !client.portalPinHash ||
    !client.organization.active
  ) {
    return null;
  }

  return {
    id: client.id,
    documentId: client.documentId,
    name: `${client.firstName} ${client.lastName}`,
    organizationId: client.organizationId,
    organizationSlug: client.organization.slug,
  };
}

export async function requireClientSession(): Promise<ClientSession> {
  const session = await getClientSession();
  if (session) return session;

  const jar = await cookies();
  if (jar.get(CLIENT_SESSION_COOKIE)?.value) {
    redirect("/api/auth/clear-client-session?next=/mi/login");
  }
  redirect("/mi/login");
}

export function generatePortalPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
