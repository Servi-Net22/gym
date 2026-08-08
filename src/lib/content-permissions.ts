import type { SessionUser } from "@/lib/session";

export const TRAINER_CONTENT_TYPES = ["rutina", "dieta"] as const;
export type TrainerContentType = (typeof TRAINER_CONTENT_TYPES)[number];

export const CONTENT_LEVELS = [
  "principiante",
  "intermedio",
  "avanzado",
] as const;
export type ContentLevelValue = (typeof CONTENT_LEVELS)[number];

export const CONTENT_LEVEL_LABELS: Record<ContentLevelValue, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const CONTENT_GENDERS = ["hombre", "mujer", "todos"] as const;
export type ContentGenderValue = (typeof CONTENT_GENDERS)[number];

function normalizeCargo(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Cargo de empleado tipo entrenador (ignora acentos). */
export function isTrainerCargo(role: string | null | undefined) {
  if (!role) return false;
  return /entrenador/.test(normalizeCargo(role));
}

/** EMPLOYEE con cargo Entrenador. */
export function isTrainer(user: SessionUser | null | undefined) {
  return (
    user?.role === "EMPLOYEE" && isTrainerCargo(user.employeeRole ?? null)
  );
}

export function canManageAllContentTypes(user: SessionUser | null | undefined) {
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "SUPERADMIN") return true;
  // Empleados no-entrenador mantienen acceso amplio al módulo Contenidos
  return user.role === "EMPLOYEE" && !isTrainer(user);
}

export function canManageContentType(
  user: SessionUser | null | undefined,
  type: string,
) {
  if (!user) return false;
  if (canManageAllContentTypes(user)) return true;
  if (isTrainer(user)) {
    return (TRAINER_CONTENT_TYPES as readonly string[]).includes(type);
  }
  return false;
}

export function allowedContentTypes(user: SessionUser) {
  if (canManageAllContentTypes(user)) {
    return ["aviso", "info", "rutina", "dieta"] as const;
  }
  return TRAINER_CONTENT_TYPES;
}

export function contentsNavLabel(user: SessionUser) {
  return isTrainer(user) ? "Rutinas y dietas" : "Contenidos PWA";
}
