import { isTrainer } from "@/lib/content-permissions";
import type { SessionUser } from "@/lib/session";

/** ADMIN / SUPERADMIN del comercio. */
export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "ADMIN" || user?.role === "SUPERADMIN";
}

/**
 * Alta/edición de clientes, QR, PIN y ficha operativa.
 * Admin + empleados de recepción/administración (no entrenadores).
 */
export function canManageClients(user: SessionUser | null | undefined) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.role === "EMPLOYEE" && !isTrainer(user);
}

/** Cobranzas y registro de pagos: mismo alcance que clientes. */
export function canManagePayments(user: SessionUser | null | undefined) {
  return canManageClients(user);
}
