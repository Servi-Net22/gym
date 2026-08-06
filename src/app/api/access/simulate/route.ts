import { NextRequest, NextResponse } from "next/server";
import { openBarrierCommand, validateAccessToken } from "@/lib/access";
import { getSession } from "@/lib/auth";

/** Simulador interno de lectura QR: solo staff autenticado, scoped al tenant de sesión. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) {
    return NextResponse.json(
      { granted: false, reason: "No autorizado" },
      { status: 401 },
    );
  }

  let body: { qrToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { granted: false, reason: "JSON inválido" },
      { status: 400 },
    );
  }

  const result = await validateAccessToken(body.qrToken ?? "", {
    organizationId: session.organizationId,
  });

  let barrier = null;
  if (result.openBarrier && result.client) {
    barrier = await openBarrierCommand(
      `${result.client.lastName}, ${result.client.firstName}`,
    );
  }

  return NextResponse.json({ ...result, barrier });
}
