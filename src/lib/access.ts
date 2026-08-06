import { prisma } from "@/lib/prisma";
import { isMembershipCurrent } from "@/lib/utils";

export type AccessCheckResult = {
  granted: boolean;
  reason: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    documentId: string;
    membershipEndsAt: Date | null;
    planName: string | null;
  };
  openBarrier: boolean;
};

export async function validateAccessToken(
  qrToken: string,
): Promise<AccessCheckResult> {
  const token = qrToken.trim();

  if (!token) {
    return {
      granted: false,
      reason: "Token QR vacío",
      openBarrier: false,
    };
  }

  const client = await prisma.client.findUnique({
    where: { qrToken: token },
    include: { plan: true },
  });

  if (!client) {
    await prisma.accessLog.create({
      data: {
        qrToken: token,
        granted: false,
        reason: "QR no registrado",
      },
    });

    return {
      granted: false,
      reason: "QR no registrado en el sistema",
      openBarrier: false,
    };
  }

  if (!client.active) {
    await prisma.accessLog.create({
      data: {
        clientId: client.id,
        qrToken: token,
        granted: false,
        reason: "Cliente inactivo",
      },
    });

    return {
      granted: false,
      reason: "Cliente inactivo",
      client: summarizeClient(client),
      openBarrier: false,
    };
  }

  if (!isMembershipCurrent(client.membershipEndsAt)) {
    await prisma.accessLog.create({
      data: {
        clientId: client.id,
        qrToken: token,
        granted: false,
        reason: "Cuenta vencida",
      },
    });

    return {
      granted: false,
      reason: "Cuenta no al día. Renovar membresía para ingresar.",
      client: summarizeClient(client),
      openBarrier: false,
    };
  }

  await prisma.accessLog.create({
    data: {
      clientId: client.id,
      qrToken: token,
      granted: true,
      reason: "Acceso autorizado",
    },
  });

  return {
    granted: true,
    reason: "Acceso autorizado. Abriendo barrera.",
    client: summarizeClient(client),
    openBarrier: true,
  };
}

function summarizeClient(client: {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  membershipEndsAt: Date | null;
  plan: { name: string } | null;
}) {
  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    documentId: client.documentId,
    membershipEndsAt: client.membershipEndsAt,
    planName: client.plan?.name ?? null,
  };
}

/** Simula el comando hacia el controlador físico de la barrera. */
export async function openBarrierCommand(clientLabel: string) {
  // Aquí se conectaría MQTT / HTTP / GPIO del hardware real.
  // Por ahora dejamos un log estructurado listo para integrar.
  console.info(
    JSON.stringify({
      event: "barrier.open",
      at: new Date().toISOString(),
      client: clientLabel,
      durationMs: 3000,
    }),
  );

  return {
    ok: true,
    message: "Señal de apertura enviada a la barrera",
    durationMs: 3000,
  };
}
