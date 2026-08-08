import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const planSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido"),
  description: optionalString,
  price: z.coerce.number().positive("Precio inválido"),
  durationDays: z.coerce.number().int().positive("Duración inválida"),
  active: z.coerce.boolean().optional().default(true),
});

export const trainingLevelSchema = z.enum([
  "principiante",
  "intermedio",
  "avanzado",
]);

export const clientSchema = z.object({
  firstName: z.string().trim().min(2, "Nombre requerido"),
  lastName: z.string().trim().min(2, "Apellido requerido"),
  documentId: z.string().trim().min(6, "Documento requerido"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: optionalString,
  birthDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  address: optionalString,
  emergencyContact: optionalString,
  notes: optionalString,
  trainingLevel: z
    .union([trainingLevelSchema, z.literal(""), z.undefined()])
    .transform((v) => (v && v.length > 0 ? v : null)),
  planId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  active: z.coerce.boolean().optional().default(true),
});

export const employeeSchema = z.object({
  firstName: z.string().trim().min(2, "Nombre requerido"),
  lastName: z.string().trim().min(2, "Apellido requerido"),
  documentId: z.string().trim().min(6, "Documento requerido"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: optionalString,
  role: z.string().trim().min(2, "Cargo requerido"),
  salary: z
    .union([z.coerce.number().nonnegative(), z.nan()])
    .optional()
    .transform((v) =>
      typeof v === "number" && !Number.isNaN(v) ? v : undefined,
    ),
  hireDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : new Date())),
  address: optionalString,
  cuil: optionalString,
  legajo: optionalString,
  categoriaLaboral: optionalString,
  notes: optionalString,
  active: z.coerce.boolean().optional().default(true),
});

export const paymentMethodSchema = z.enum([
  "efectivo",
  "transferencia",
  "mercadopago",
]);

export const paymentSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  amount: z.coerce.number().positive("Monto inválido"),
  method: paymentMethodSchema.default("efectivo"),
  periodFrom: z.string().transform((v) => new Date(v)),
  periodTo: z.string().transform((v) => new Date(v)),
  notes: optionalString,
  extendMembership: z.coerce.boolean().optional().default(true),
  /** manual = ya cobrado; automatic = genera pendiente / link MP */
  mode: z.enum(["manual", "automatic"]).default("manual"),
});
