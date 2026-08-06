import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Limpia cookie de sesión inválida (p. ej. tras un seed) y vuelve al login. */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/login";
  const target = new URL(next, request.url);
  const response = NextResponse.redirect(target);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
