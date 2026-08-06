import { headers } from "next/headers";

/** En Vercel, si el usuario entra por http (SSL aún no listo), Secure impediría guardar la sesión. */
export async function sessionCookieOptions(maxAge: number) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: proto === "https",
    path: "/",
    maxAge,
  };
}
