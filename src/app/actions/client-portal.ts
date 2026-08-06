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
import {
  markContentAsRead,
  visibleContentWhere,
} from "@/lib/client-contents";
import { sessionCookieOptions } from "@/lib/cookie-options";
import { prisma } from "@/lib/prisma";

export type ClientLoginState = { error?: string };

export async function clientLoginAction(
  _prev: ClientLoginState,
  formData: FormData,
): Promise<ClientLoginState> {
  const documentId = String(formData.get("documentId") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!documentId || !pin) {
    return { error: "Ingresá DNI y PIN" };
  }

  const client = await prisma.client.findUnique({
    where: { documentId },
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
  });

  const jar = await cookies();
  jar.set(
    CLIENT_SESSION_COOKIE,
    token,
    await sessionCookieOptions(60 * 60 * 24 * 30),
  );

  redirect("/mi");
}

export async function clientLogoutAction() {
  const jar = await cookies();
  jar.delete(CLIENT_SESSION_COOKIE);
  redirect("/mi/login");
}

/** Marca un contenido como leído (llamar desde el cliente, no durante el render RSC). */
export async function markContentReadAction(contentId: string) {
  const session = await requireClientSession();
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      ...visibleContentWhere(session.id),
    },
    select: { id: true },
  });
  if (!content) return { ok: false as const };

  await markContentAsRead(session.id, content.id);
  revalidatePath("/mi");
  revalidatePath("/mi/contenidos");
  revalidatePath(`/mi/contenidos/${content.id}`);
  return { ok: true as const };
}
