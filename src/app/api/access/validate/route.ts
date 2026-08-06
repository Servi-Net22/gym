import { NextRequest, NextResponse } from "next/server";
import { openBarrierCommand, validateAccessToken } from "@/lib/access";
import { normalizeOrgSlug } from "@/lib/company";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para el lector / controlador de barrera.
 *
 * POST /api/access/validate
 * Headers: x-api-key: <BARRIER_API_KEY>
 *          x-organization-slug: gymflow   (recomendado)
 * Body: { "qrToken": "GYM-...", "organizationSlug": "gymflow" }
 *
 * Sin slug/id de comercio no se valida (evita filtrar clientes de otro tenant).
 * En despliegues de un solo gym: BARRIER_ORGANIZATION_ID o BARRIER_ORGANIZATION_SLUG.
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.BARRIER_API_KEY;

  if (!expected || apiKey !== expected) {
    return NextResponse.json(
      { granted: false, reason: "No autorizado" },
      { status: 401 },
    );
  }

  let body: {
    qrToken?: string;
    token?: string;
    organizationId?: string;
    organizationSlug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { granted: false, reason: "JSON inválido" },
      { status: 400 },
    );
  }

  const organizationId = await resolveBarrierOrganizationId(request, body);
  if (!organizationId) {
    return NextResponse.json(
      {
        granted: false,
        reason:
          "Indicá el comercio (header x-organization-slug / body organizationSlug)",
      },
      { status: 400 },
    );
  }

  const qrToken = body.qrToken ?? body.token ?? "";
  const result = await validateAccessToken(qrToken, { organizationId });

  let barrier = null;
  if (result.openBarrier && result.client) {
    barrier = await openBarrierCommand(
      `${result.client.lastName}, ${result.client.firstName}`,
    );
  }

  return NextResponse.json({
    granted: result.granted,
    reason: result.reason,
    client: result.client
      ? {
          id: result.client.id,
          name: `${result.client.lastName}, ${result.client.firstName}`,
          documentId: result.client.documentId,
          plan: result.client.planName,
          membershipEndsAt: result.client.membershipEndsAt,
        }
      : null,
    barrier,
  });
}

async function resolveBarrierOrganizationId(
  request: NextRequest,
  body: {
    organizationId?: string;
    organizationSlug?: string;
  },
): Promise<string | null> {
  const headerId = request.headers.get("x-organization-id")?.trim();
  const bodyId = body.organizationId?.trim();
  const id = headerId || bodyId || process.env.BARRIER_ORGANIZATION_ID?.trim();
  if (id) {
    const org = await prisma.organization.findFirst({
      where: { id, active: true },
      select: { id: true },
    });
    return org?.id ?? null;
  }

  const headerSlug = request.headers.get("x-organization-slug");
  const bodySlug = body.organizationSlug;
  const envSlug = process.env.BARRIER_ORGANIZATION_SLUG;
  const slug = normalizeOrgSlug(
    String(headerSlug ?? bodySlug ?? envSlug ?? ""),
  );
  if (!slug) return null;

  const org = await prisma.organization.findFirst({
    where: { slug, active: true },
    select: { id: true },
  });
  return org?.id ?? null;
}
