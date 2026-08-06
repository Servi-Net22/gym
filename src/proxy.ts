import { NextRequest, NextResponse } from "next/server";
import {
  CLIENT_SESSION_COOKIE,
  readClientSessionToken,
} from "@/lib/client-session";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/access/validate") ||
    pathname.startsWith("/api/payments/mercadopago/webhook") ||
    pathname.startsWith("/api/auth/clear-session") ||
    pathname.startsWith("/api/auth/clear-client-session") ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  // --- Portal clientes (PWA) ---
  if (pathname === "/mi" || pathname.startsWith("/mi/")) {
    if (pathname === "/mi/login" || pathname.startsWith("/mi/login/")) {
      return NextResponse.next();
    }

    const clientToken = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const clientSession = clientToken
      ? await readClientSessionToken(clientToken)
      : null;

    if (!clientSession) {
      return NextResponse.redirect(new URL("/mi/login", request.url));
    }
    return NextResponse.next();
  }

  // --- Panel staff ---
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  const staffToken = request.cookies.get(SESSION_COOKIE)?.value;
  const staffSession = staffToken ? await readSessionToken(staffToken) : null;

  if (!staffSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
