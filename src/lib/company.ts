import { prisma } from "@/lib/prisma";

/** Datos de la empresa para el encabezado del recibo. */
export type CompanyInfo = {
  name: string;
  address: string;
  cuit: string;
  lugarPago: string;
  fPagoAportes: string;
};

/** Fallback desde env (migración / bootstrap). Preferí Organization. */
export function getCompanyInfoFromEnv(): CompanyInfo {
  return {
    name:
      process.env.COMPANY_NAME?.trim() ||
      process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
      "GymFlow",
    address: process.env.COMPANY_ADDRESS?.trim() || "—",
    cuit: process.env.COMPANY_CUIT?.trim() || "—",
    lugarPago:
      process.env.COMPANY_LUGAR_PAGO?.trim() ||
      process.env.COMPANY_ADDRESS?.trim() ||
      "—",
    fPagoAportes: process.env.COMPANY_F_PAGO_APORTES?.trim() || "",
  };
}

/** @deprecated Usá getOrganizationCompany(organizationId). */
export function getCompanyInfo(): CompanyInfo {
  return getCompanyInfoFromEnv();
}

export function companyFromOrganization(org: {
  name: string;
  address: string;
  cuit: string;
  lugarPago: string;
  fPagoAportes: string;
}): CompanyInfo {
  const env = getCompanyInfoFromEnv();
  return {
    name: org.name.trim() || env.name,
    address: org.address.trim() || env.address,
    cuit: org.cuit.trim() || env.cuit,
    lugarPago:
      org.lugarPago.trim() || org.address.trim() || env.lugarPago,
    fPagoAportes: org.fPagoAportes.trim() || env.fPagoAportes,
  };
}

export async function getOrganizationCompany(
  organizationId: string,
): Promise<CompanyInfo> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      address: true,
      cuit: true,
      lugarPago: true,
      fPagoAportes: true,
    },
  });
  if (!org) return getCompanyInfoFromEnv();
  return companyFromOrganization(org);
}

export function normalizeOrgSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
