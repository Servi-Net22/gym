import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  createSessionToken,
  readSessionToken,
  type SessionUser,
} from "@/lib/session";

export {
  SESSION_COOKIE,
  createSessionToken,
  readSessionToken,
  type SessionUser,
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await readSessionToken(token);
  if (!session) return null;

  // Evita IDs viejos tras un seed/reset (rompe FKs al registrar/anular pagos)
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      employeeId: true,
      active: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true, slug: true, active: true },
      },
    },
  });

  // No borrar cookies acá: getSession corre en Server Components (layout).
  // Si el usuario ya no existe, devolvemos null y el proxy/layout mandan a login.
  if (!user || !user.active || !user.organization.active) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
    organizationId: user.organization.id,
    organizationName: user.organization.name,
    organizationSlug: user.organization.slug,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (session) return session;

  const jar = await cookies();
  // Cookie presente pero usuario inexistente → limpiar en Route Handler
  if (jar.get(SESSION_COOKIE)?.value) {
    redirect("/api/auth/clear-session?next=/login");
  }
  redirect("/login");
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect("/?error=sin-permiso");
  }
  return session;
}

export function canViewSalaries(user: SessionUser | null | undefined) {
  return user?.role === "ADMIN";
}
