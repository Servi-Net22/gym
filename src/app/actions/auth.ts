"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, verifyPassword } from "@/lib/auth";
import { sessionCookieOptions } from "@/lib/cookie-options";
import { reportarAccesoServiNet } from "@/lib/report-acceso-servi-net";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresá email y contraseña" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organization: { select: { id: true, name: true, slug: true, active: true } },
      employee: { select: { role: true } },
    },
  });
  if (!user || !user.active || !user.organization.active) {
    return { error: "Credenciales inválidas" };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Credenciales inválidas" };
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
    employeeRole: user.employee?.role ?? null,
    organizationId: user.organization.id,
    organizationName: user.organization.name,
    organizationSlug: user.organization.slug,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, await sessionCookieOptions(60 * 60 * 8));

  const cargoLabel =
    user.role === "SUPERADMIN"
      ? "Superadmin"
      : user.role === "ADMIN"
        ? "Administrador"
        : (user.employee?.role?.trim() || "Empleado");

  const reportPayload = {
    email: user.email,
    nombre: user.name,
    cargo: cargoLabel,
    app: "gym" as const,
  };

  // await: asegura el POST antes del redirect (Next puede cortar fetches en void).
  // after: red de seguridad si el runtime corta al lanzar redirect().
  await reportarAccesoServiNet(reportPayload);
  after(() => {
    void reportarAccesoServiNet(reportPayload);
  });

  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
