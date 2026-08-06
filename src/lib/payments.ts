import { prisma } from "@/lib/prisma";

type ApplyInput = {
  clientId: string;
  /** Si se pasa, el cliente debe pertenecer a este tenant. */
  organizationId?: string;
  amount: number;
  method: "efectivo" | "transferencia" | "mercadopago";
  source: "manual" | "automatic";
  periodFrom: Date;
  periodTo: Date;
  notes?: string;
  reference?: string;
  externalId?: string;
  preferenceId?: string;
  checkoutUrl?: string;
  status?: "pending" | "confirmed" | "cancelled" | "rejected";
  extendMembership?: boolean;
  registeredById?: string;
};

/** Crea un pago. Si queda confirmado, puede extender la membresía. */
export async function createPaymentRecord(input: ApplyInput) {
  const status = input.status ?? "confirmed";
  const extend =
    input.extendMembership !== false && status === "confirmed";

  let registeredById = input.registeredById;
  if (registeredById) {
    const actor = await prisma.user.findUnique({
      where: { id: registeredById },
      select: { id: true, active: true },
    });
    if (!actor?.active) {
      throw new Error(
        "Tu sesión ya no es válida. Cerrá sesión e ingresá de nuevo.",
      );
    }
    registeredById = actor.id;
  }

  const client = await prisma.client.findFirst({
    where: {
      id: input.clientId,
      ...(input.organizationId
        ? { organizationId: input.organizationId }
        : {}),
    },
    select: { id: true, organizationId: true },
  });
  if (!client) {
    throw new Error("Cliente no encontrado");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        organizationId: client.organizationId,
        clientId: input.clientId,
        amount: input.amount,
        method: input.method,
        source: input.source,
        status,
        periodFrom: input.periodFrom,
        periodTo: input.periodTo,
        notes: input.notes,
        reference: input.reference,
        externalId: input.externalId,
        preferenceId: input.preferenceId,
        checkoutUrl: input.checkoutUrl,
        registeredById,
        paidAt: status === "confirmed" ? new Date() : null,
      },
    });

    if (extend) {
      await extendMembershipForClient(tx, input.clientId, input.periodTo);
    }

    return payment;
  });
}

export async function confirmPaymentRecord(
  paymentId: string,
  extras?: {
    externalId?: string;
    notes?: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    if (payment.status === "confirmed") {
      return payment;
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "confirmed",
        paidAt: new Date(),
        ...(extras?.externalId ? { externalId: extras.externalId } : {}),
        ...(extras?.notes
          ? {
              notes: payment.notes
                ? `${payment.notes}\n${extras.notes}`
                : extras.notes,
            }
          : {}),
      },
    });

    await extendMembershipForClient(tx, payment.clientId, payment.periodTo);
    return updated;
  });
}

export async function voidPaymentRecord(input: {
  paymentId: string;
  voidedById: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 3) {
    throw new Error("Indicá un motivo de anulación (mínimo 3 caracteres)");
  }

  const actor = await prisma.user.findUnique({
    where: { id: input.voidedById },
    select: { id: true, active: true },
  });
  if (!actor?.active) {
    throw new Error(
      "Tu sesión ya no es válida. Cerrá sesión e ingresá de nuevo.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: input.paymentId },
    });

    if (payment.status === "cancelled") {
      return payment;
    }

    if (payment.status === "rejected") {
      throw new Error("No se puede anular un pago rechazado");
    }

    const updated = await tx.payment.update({
      where: { id: input.paymentId },
      data: {
        status: "cancelled",
        voidedById: actor.id,
        voidedAt: new Date(),
        voidReason: reason,
      },
    });

    // Recalcula membresía según pagos confirmados restantes
    await recalculateMembershipFromPayments(tx, payment.clientId);
    return updated;
  });
}

async function extendMembershipForClient(
  tx: {
    client: {
      findUniqueOrThrow: typeof prisma.client.findUniqueOrThrow;
      update: typeof prisma.client.update;
    };
  },
  clientId: string,
  periodTo: Date,
) {
  const client = await tx.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const currentEnd =
    client.membershipEndsAt && client.membershipEndsAt > new Date()
      ? client.membershipEndsAt
      : new Date();

  const nextEnd = periodTo > currentEnd ? periodTo : currentEnd;

  await tx.client.update({
    where: { id: clientId },
    data: {
      membershipEndsAt: nextEnd,
      active: true,
    },
  });
}

async function recalculateMembershipFromPayments(
  tx: {
    payment: { findMany: typeof prisma.payment.findMany };
    client: { update: typeof prisma.client.update };
  },
  clientId: string,
) {
  const confirmed = await tx.payment.findMany({
    where: { clientId, status: "confirmed" },
    select: { periodTo: true },
  });

  const membershipEndsAt =
    confirmed.length === 0
      ? null
      : confirmed.reduce(
          (max, p) => (p.periodTo > max ? p.periodTo : max),
          confirmed[0].periodTo,
        );

  await tx.client.update({
    where: { id: clientId },
    data: { membershipEndsAt },
  });
}
