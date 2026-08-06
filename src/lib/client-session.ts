import { SignJWT, jwtVerify } from "jose";

export const CLIENT_SESSION_COOKIE = "gymflow_client_session";

export type ClientSession = {
  id: string;
  documentId: string;
  name: string;
};

const SESSION_TTL = "30d";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET en .env");
  }
  return new TextEncoder().encode(secret);
}

export async function createClientSessionToken(client: ClientSession) {
  return new SignJWT({
    documentId: client.documentId,
    name: client.name,
    kind: "client",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(client.id)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

export async function readClientSessionToken(
  token: string,
): Promise<ClientSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || payload.kind !== "client") return null;
    if (typeof payload.documentId !== "string") return null;
    return {
      id: payload.sub,
      documentId: payload.documentId,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
