import type {
  ClientGenderValue,
  ContentLevelValue,
} from "@/lib/content-permissions";
import { SignJWT, jwtVerify } from "jose";

export const CLIENT_SESSION_COOKIE = "gymflow_client_session";

export type ClientSession = {
  id: string;
  documentId: string;
  name: string;
  organizationId: string;
  organizationSlug: string;
  /** Nivel de entrenamiento; null = sin asignar (no ve rutinas/dietas) */
  trainingLevel: ContentLevelValue | null;
  /** Días/semana de asistencia; null = sin asignar (no ve rutinas/dietas) */
  daysPerWeek: number | null;
  /** Sexo; null = sin asignar (no ve rutinas/dietas) */
  gender: ClientGenderValue | null;
};

const SESSION_TTL = "30d";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET en .env");
  }
  return new TextEncoder().encode(secret);
}

export async function createClientSessionToken(
  client: Omit<ClientSession, "trainingLevel" | "daysPerWeek" | "gender"> & {
    trainingLevel?: ClientSession["trainingLevel"];
    daysPerWeek?: ClientSession["daysPerWeek"];
    gender?: ClientSession["gender"];
  },
) {
  return new SignJWT({
    documentId: client.documentId,
    name: client.name,
    organizationId: client.organizationId,
    organizationSlug: client.organizationSlug,
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
): Promise<Omit<
  ClientSession,
  "trainingLevel" | "daysPerWeek" | "gender"
> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || payload.kind !== "client") return null;
    if (typeof payload.documentId !== "string") return null;
    if (typeof payload.organizationId !== "string") return null;
    return {
      id: payload.sub,
      documentId: payload.documentId,
      name: String(payload.name ?? ""),
      organizationId: payload.organizationId,
      organizationSlug: String(payload.organizationSlug ?? ""),
    };
  } catch {
    return null;
  }
}
