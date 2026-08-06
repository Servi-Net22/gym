import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "gymflow_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeId: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};

const SESSION_TTL = "8h";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET en .env");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    organizationSlug: user.organizationSlug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

export async function readSessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    if (typeof payload.organizationId !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: String(payload.name ?? ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
      employeeId:
        typeof payload.employeeId === "string" ? payload.employeeId : null,
      organizationId: payload.organizationId,
      organizationName: String(payload.organizationName ?? ""),
      organizationSlug: String(payload.organizationSlug ?? ""),
    };
  } catch {
    return null;
  }
}
