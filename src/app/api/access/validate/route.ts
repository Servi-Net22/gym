import { NextRequest, NextResponse } from "next/server";
import { openBarrierCommand, validateAccessToken } from "@/lib/access";

/**
 * Endpoint para el lector / controlador de barrera.
 *
 * POST /api/access/validate
 * Headers: x-api-key: <BARRIER_API_KEY>
 * Body: { "qrToken": "GYM-..." }  o  { "token": "GYM-..." }
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

  let body: { qrToken?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { granted: false, reason: "JSON inválido" },
      { status: 400 },
    );
  }

  const qrToken = body.qrToken ?? body.token ?? "";
  const result = await validateAccessToken(qrToken);

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
