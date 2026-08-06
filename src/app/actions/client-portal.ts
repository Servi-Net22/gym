"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  CLIENT_SESSION_COOKIE,
  createClientSessionToken,
} from "@/lib/client-auth";
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
  jar.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/mi");
}

export async function clientLogoutAction() {
  const jar = await cookies();
  jar.delete(CLIENT_SESSION_COOKIE);
  redirect("/mi/login");
}
