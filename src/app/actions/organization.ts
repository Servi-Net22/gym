"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isReservedClientPortalSlug } from "@/lib/client-portal-paths";
import { normalizeOrgSlug } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import { tenantId } from "@/lib/tenant";

const orgSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug requerido")
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usá minúsculas, números y guiones"),
  address: z.string().trim().optional().default(""),
  cuit: z.string().trim().optional().default(""),
  lugarPago: z.string().trim().optional().default(""),
  fPagoAportes: z.string().trim().optional().default(""),
});

export type OrgSettingsState = { error?: string; ok?: boolean };

export async function updateOrganizationAction(
  _prev: OrgSettingsState,
  formData: FormData,
): Promise<OrgSettingsState> {
  const session = await requireAdmin();

  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    slug: normalizeOrgSlug(String(formData.get("slug") ?? "")),
    address: String(formData.get("address") ?? ""),
    cuit: String(formData.get("cuit") ?? ""),
    lugarPago: String(formData.get("lugarPago") ?? ""),
    fPagoAportes: String(formData.get("fPagoAportes") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  if (isReservedClientPortalSlug(data.slug)) {
    return { error: "Ese slug está reservado por el portal de clientes" };
  }
  const orgId = tenantId(session);
  const clash = await prisma.organization.findFirst({
    where: {
      slug: data.slug,
      NOT: { id: orgId },
    },
    select: { id: true },
  });
  if (clash) {
    return { error: "Ese slug ya está en uso por otro comercio" };
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name,
      slug: data.slug,
      address: data.address,
      cuit: data.cuit,
      lugarPago: data.lugarPago,
      fPagoAportes: data.fPagoAportes,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/");
  return { ok: true };
}
