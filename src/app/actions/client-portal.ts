"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  CLIENT_SESSION_COOKIE,
  createClientSessionToken,
  requireClientSession,
} from "@/lib/client-auth";
import { readClientSessionToken } from "@/lib/client-session";
import {
  dismissClientContent,
  markContentAsRead,
  visibleContentWhere,
} from "@/lib/client-contents";
import {
  clientPortalContent,
  clientPortalContents,
  clientPortalHome,
  clientPortalLogin,
} from "@/lib/client-portal-paths";
import { normalizeOrgSlug } from "@/lib/company";
import { sessionCookieOptions } from "@/lib/cookie-options";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";

export type ClientLoginState = { error?: string };

export async function clientLoginAction(
  _prev: ClientLoginState,
  formData: FormData,
): Promise<ClientLoginState> {
  const orgSlug = normalizeOrgSlug(String(formData.get("orgSlug") ?? ""));
  const documentId = String(formData.get("documentId") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!orgSlug || !documentId || !pin) {
    return { error: "Ingresá el código del gym, DNI y PIN" };
  }

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, active: true },
    select: { id: true, slug: true },
  });
  if (!org) {
    return { error: "Gimnasio no encontrado" };
  }

  const client = await prisma.client.findUnique({
    where: {
      organizationId_documentId: {
        organizationId: org.id,
        documentId,
      },
    },
  });

  if (!client || !client.active || !client.portalPinHash) {
    return { error: "Datos incorrectos o portal no habilitado" };
  }

  const ok = await bcrypt.compare(pin, client.portalPinHash);
  if (!ok) {
    return { error: "Datos incorrectos o portal no habilitado" };
  }

  const token = await createClientSessionToken({
    id: client.id,
    documentId: client.documentId,
    name: `${client.firstName} ${client.lastName}`,
    organizationId: org.id,
    organizationSlug: org.slug,
  });

  const jar = await cookies();
  jar.set(
    CLIENT_SESSION_COOKIE,
    token,
    await sessionCookieOptions(60 * 60 * 24 * 30),
  );

  redirect(clientPortalHome(org.slug));
}

export async function clientLogoutAction() {
  const jar = await cookies();
  const token = jar.get(CLIENT_SESSION_COOKIE)?.value;
  const session = token ? await readClientSessionToken(token) : null;
  jar.delete(CLIENT_SESSION_COOKIE);
  redirect(clientPortalLogin(session?.organizationSlug));
}

/** Marca un contenido como leído (llamar desde el cliente, no durante el render RSC). */
export async function markContentReadAction(contentId: string) {
  const session = await requireClientSession();
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      ...tenantWhere(session),
      ...visibleContentWhere(
        session.id,
        session.trainingLevel,
        session.daysPerWeek,
        session.gender,
      ),
    },
    select: { id: true, organizationId: true },
  });
  if (!content) return { ok: false as const };

  await markContentAsRead(session.id, content.id, content.organizationId);
  const slug = session.organizationSlug;
  revalidatePath(clientPortalHome(slug));
  revalidatePath(clientPortalContents(slug));
  revalidatePath(clientPortalContent(slug, content.id));
  revalidatePath("/mi");
  revalidatePath("/mi/contenidos");
  revalidatePath(`/mi/contenidos/${content.id}`);
  return { ok: true as const };
}

/** Quita info/aviso ya leído del portal (dismiss broadcast o borra si era personal). */
export async function dismissContentAction(contentId: string) {
  const session = await requireClientSession();
  const result = await dismissClientContent(
    session.id,
    contentId,
    session.organizationId,
    session.trainingLevel,
    session.daysPerWeek,
    session.gender,
  );
  if (!result.ok) return;

  const slug = session.organizationSlug;
  revalidatePath(clientPortalHome(slug));
  revalidatePath(clientPortalContents(slug));
  revalidatePath(clientPortalContent(slug, contentId));
  revalidatePath("/mi");
  revalidatePath("/mi/contenidos");
  revalidatePath(`/mi/contenidos/${contentId}`);
  redirect(clientPortalContents(slug));
}
