"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppBaseUrl } from "@/lib/app-url";
import { hashPassword, requireSuperAdmin } from "@/lib/auth";
import { normalizeOrgSlug } from "@/lib/company";
import { emailOrgAdminCredentials } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const orgFieldsSchema = z.object({
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
  active: z.boolean(),
});

const createOrgSchema = orgFieldsSchema.extend({
  adminName: z.string().trim().min(2, "Nombre del admin requerido"),
  adminEmail: z.string().trim().email("Email del admin inválido").toLowerCase(),
  adminPassword: z
    .string()
    .min(6, "La contraseña del admin debe tener al menos 6 caracteres"),
});

export type OrgFormState = { error?: string; ok?: boolean };

function parseOrgFields(formData: FormData) {
  return orgFieldsSchema.safeParse({
    name: formData.get("name"),
    slug: normalizeOrgSlug(String(formData.get("slug") ?? "")),
    address: String(formData.get("address") ?? ""),
    cuit: String(formData.get("cuit") ?? ""),
    lugarPago: String(formData.get("lugarPago") ?? ""),
    fPagoAportes: String(formData.get("fPagoAportes") ?? ""),
    active: formData.get("active") === "on",
  });
}

export async function createOrganizationAction(
  _prev: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  await requireSuperAdmin();

  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    slug: normalizeOrgSlug(String(formData.get("slug") ?? "")),
    address: String(formData.get("address") ?? ""),
    cuit: String(formData.get("cuit") ?? ""),
    lugarPago: String(formData.get("lugarPago") ?? ""),
    fPagoAportes: String(formData.get("fPagoAportes") ?? ""),
    active: formData.get("active") === "on",
    adminName: formData.get("adminName"),
    adminEmail: String(formData.get("adminEmail") ?? "")
      .trim()
      .toLowerCase(),
    adminPassword: String(formData.get("adminPassword") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  const slugTaken = await prisma.organization.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (slugTaken) {
    return { error: "Ese slug ya está en uso" };
  }

  const emailTaken = await prisma.user.findUnique({
    where: { email: data.adminEmail },
    select: { id: true },
  });
  if (emailTaken) {
    return { error: "Ya existe un usuario con ese email" };
  }

  const passwordHash = await hashPassword(data.adminPassword);

  const org = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        address: data.address,
        cuit: data.cuit,
        lugarPago: data.lugarPago,
        fPagoAportes: data.fPagoAportes,
        active: data.active,
      },
    });

    await tx.user.create({
      data: {
        organizationId: organization.id,
        email: data.adminEmail,
        passwordHash,
        name: data.adminName,
        role: "ADMIN",
        active: true,
      },
    });

    return organization;
  });

  const base = await getAppBaseUrl();
  await emailOrgAdminCredentials({
    to: data.adminEmail,
    name: data.adminName,
    password: data.adminPassword,
    orgName: org.name,
    appUrl: base,
    portalUrl: `${base}/mi/${org.slug}/login`,
  });

  revalidatePath("/organizaciones");
  revalidatePath(`/organizaciones/${org.id}/editar`);
  redirect(`/organizaciones/${org.id}/editar`);
}

export async function updateOrganizationByIdAction(
  id: string,
  _prev: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  await requireSuperAdmin();

  const parsed = parseOrgFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const existing = await prisma.organization.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Comercio no encontrado" };
  }

  const clash = await prisma.organization.findFirst({
    where: {
      slug: data.slug,
      NOT: { id },
    },
    select: { id: true },
  });
  if (clash) {
    return { error: "Ese slug ya está en uso por otro comercio" };
  }

  await prisma.organization.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      address: data.address,
      cuit: data.cuit,
      lugarPago: data.lugarPago,
      fPagoAportes: data.fPagoAportes,
      active: data.active,
    },
  });

  revalidatePath("/organizaciones");
  revalidatePath(`/organizaciones/${id}/editar`);
  revalidatePath("/configuracion");
  return { ok: true };
}
