/** Cuenta de plataforma: total acceso, no borrable ni desactivable. */
export const PROTECTED_SUPERADMIN_EMAIL = "cristian@servi-net.com.ar";

export function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

export function isProtectedSuperadminEmail(
  email: string | null | undefined,
): boolean {
  return normalizeEmail(email) === PROTECTED_SUPERADMIN_EMAIL;
}

export function assertMutableStaffUser(email: string | null | undefined): void {
  if (isProtectedSuperadminEmail(email)) {
    throw new Error(
      "La cuenta de sysadmin está protegida: no se puede dar de baja, eliminar ni cambiar su rol.",
    );
  }
}
