import { NextRequest, NextResponse } from "next/server";
import {
  CLIENT_SESSION_COOKIE,
  readClientSessionToken,
} from "@/lib/client-session";
import {
  CLIENT_PORTAL_RESERVED_SLUGS,
  clientPortalLogin,
} from "@/lib/client-portal-paths";
import { isTrainerCargo } from "@/lib/content-permissions";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

function isClientLoginPath(pathname: string) {
  if (pathname === "/mi/login" || pathname.startsWith("/mi/login/")) {
    return true;
  }
  // /mi/[slug]/login
  return /^\/mi\/[^/]+\/login\/?$/.test(pathname);
}

/** Extrae slug de org desde /mi/{slug}/... (ignora segmentos reservados). */
function clientPortalSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/mi\/([^/]+)(?:\/|$)/);
  if (!m) return null;
  const segment = m[1];
  if (CLIENT_PORTAL_RESERVED_SLUGS.has(segment)) return null;
  return segment;
}

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
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/recibo/")
  ) {
    return NextResponse.next();
  }

  // --- Portal clientes (PWA) ---
  // Rutas autenticadas: /mi, /mi/contenidos..., /mi/[slug], /mi/[slug]/contenidos...
  if (pathname === "/mi" || pathname.startsWith("/mi/")) {
    if (isClientLoginPath(pathname)) {
      return NextResponse.next();
    }

    const clientToken = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const clientSession = clientToken
      ? await readClientSessionToken(clientToken)
      : null;

    if (!clientSession) {
      const slug = clientPortalSlugFromPath(pathname);
      return NextResponse.redirect(
        new URL(clientPortalLogin(slug), request.url),
      );
    }
    return NextResponse.next();
  }

  // --- Panel staff ---
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  const staffToken = request.cookies.get(SESSION_COOKIE)?.value;
  const staffSession = staffToken ? await readSessionToken(staffToken) : null;

  if (!staffSession?.organizationId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Comercios: solo SUPERADMIN (ADMIN/EMPLOYEE no listan otros tenants).
  if (
    (pathname === "/organizaciones" || pathname.startsWith("/organizaciones/")) &&
    staffSession.role !== "SUPERADMIN"
  ) {
    return NextResponse.redirect(new URL("/?error=sin-permiso", request.url));
  }

  if (staffSession.role === "EMPLOYEE") {
    const isTrainerEmployee = isTrainerCargo(staffSession.employeeRole);
    // Edición de planes: solo admin.
    const planEditBlocked = /^\/planes\/[^/]+\/editar\/?$/.test(pathname);
    // Clientes (alta/edición) y pagos: recepción/administración sí; entrenador no.
    const frontDeskBlocked =
      isTrainerEmployee &&
      (pathname === "/pagos" ||
        pathname.startsWith("/pagos/") ||
        pathname === "/clientes/nuevo" ||
        pathname.startsWith("/clientes/nuevo/") ||
        /^\/clientes\/[^/]+\/editar\/?$/.test(pathname));

    if (planEditBlocked || frontDeskBlocked) {
      return NextResponse.redirect(new URL("/?error=sin-permiso", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
