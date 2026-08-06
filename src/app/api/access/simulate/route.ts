import { NextRequest, NextResponse } from "next/server";
import { openBarrierCommand, validateAccessToken } from "@/lib/access";

/** Simulador interno de lectura QR (sin API key, solo para panel admin). */
export async function POST(request: NextRequest) {
  let body: { qrToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { granted: false, reason: "JSON inválido" },
      { status: 400 },
    );
  }

  const result = await validateAccessToken(body.qrToken ?? "");

  let barrier = null;
  if (result.openBarrier && result.client) {
    barrier = await openBarrierCommand(
      `${result.client.lastName}, ${result.client.firstName}`,
    );
  }

  return NextResponse.json({ ...result, barrier });
}
