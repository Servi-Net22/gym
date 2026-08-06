"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireAdmin, requireSession } from "@/lib/auth";
import {
  emailMercadoPagoCheckout,
  emailPaymentConfirmed,
  emailPaymentPendingTransfer,
  emailPaymentVoided,
  clientDisplayName,
} from "@/lib/mail";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { transferReference } from "@/lib/payment-methods";
import {
  confirmPaymentRecord,
  createPaymentRecord,
  voidPaymentRecord,
} from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";

function parsePaymentForm(formData: FormData) {
  return paymentSchema.safeParse({
    clientId: formData.get("clientId"),
    amount: formData.get("amount"),
    method: formData.get("method") || "efectivo",
    periodFrom: formData.get("periodFrom"),
    periodTo: formData.get("periodTo"),
    notes: formData.get("notes") || undefined,
    extendMembership: formData.get("extendMembership") === "on",
    mode: formData.get("mode") || "manual",
  });
}

async function notifyConfirmedPayment(paymentId: string, registeredByName?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { client: true, registeredBy: true },
  });
  if (!payment || payment.status !== "confirmed") return;

  const base = await getAppBaseUrl();
  await emailPaymentConfirmed({
    to: payment.client.email,
    clientName: clientDisplayName(payment.client),
    amount: payment.amount,
    method: payment.method,
    periodFrom: payment.periodFrom,
    periodTo: payment.periodTo,
    registeredBy: registeredByName ?? payment.registeredBy?.name,
    paymentUrl: `${base}/pagos/${payment.id}`,
  });
}

/** Registrar un pago ya recibido (efectivo / transferencia / MP cobrado en caja). */
export async function registerManualPayment(formData: FormData) {
  const session = await requireSession();
  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: data.clientId },
  });

  const payment = await createPaymentRecord({
    clientId: data.clientId,
    amount: data.amount,
    method: data.method,
    source: "manual",
    status: "confirmed",
    periodFrom: data.periodFrom,
    periodTo: data.periodTo,
    notes: data.notes,
    reference:
      data.method === "transferencia"
        ? transferReference(client.documentId)
        : undefined,
    extendMembership: data.extendMembership,
    registeredById: session.id,
  });

  await notifyConfirmedPayment(payment.id, session.name);
  revalidatePaths(payment.clientId, payment.id);
  redirect(`/pagos/${payment.id}`);
}

/**
 * Cobro automático:
 * - Mercado Pago: crea preferencia/link y deja el pago pendiente hasta webhook/confirmación
 * - Transferencia: genera referencia y queda pendiente hasta confirmar acreditación
 * - Efectivo: se registra confirmado (cobro en mostrador)
 */
export async function startAutomaticCharge(formData: FormData) {
  const session = await requireSession();
  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: data.clientId },
    include: { plan: true },
  });

  const base = await getAppBaseUrl();

  if (data.method === "efectivo") {
    const payment = await createPaymentRecord({
      clientId: data.clientId,
      amount: data.amount,
      method: "efectivo",
      source: "automatic",
      status: "confirmed",
      periodFrom: data.periodFrom,
      periodTo: data.periodTo,
      notes: data.notes ?? "Cobro en efectivo en mostrador",
      extendMembership: true,
      registeredById: session.id,
    });
    await notifyConfirmedPayment(payment.id, session.name);
    revalidatePaths(payment.clientId, payment.id);
    redirect(`/pagos/${payment.id}`);
  }

  if (data.method === "transferencia") {
    const reference = transferReference(client.documentId);
    const payment = await createPaymentRecord({
      clientId: data.clientId,
      amount: data.amount,
      method: "transferencia",
      source: "automatic",
      status: "pending",
      periodFrom: data.periodFrom,
      periodTo: data.periodTo,
      notes:
        data.notes ??
        `Transferencia pendiente. Alias/CBU del gym + concepto ${reference}`,
      reference,
      extendMembership: false,
      registeredById: session.id,
    });

    await emailPaymentPendingTransfer({
      to: client.email,
      clientName: clientDisplayName(client),
      amount: data.amount,
      reference,
      alias: process.env.TRANSFER_ALIAS || "configurar TRANSFER_ALIAS",
      paymentUrl: `${base}/pagos/${payment.id}`,
    });

    revalidatePaths(payment.clientId, payment.id);
    redirect(`/pagos/${payment.id}`);
  }

  // Mercado Pago
  const draft = await createPaymentRecord({
    clientId: data.clientId,
    amount: data.amount,
    method: "mercadopago",
    source: "automatic",
    status: "pending",
    periodFrom: data.periodFrom,
    periodTo: data.periodTo,
    notes: data.notes,
    reference: `mp-${Date.now()}`,
    extendMembership: false,
    registeredById: session.id,
  });

  const title = `Membresía ${client.plan?.name ?? "GymFlow"} — ${client.lastName}`;
  const preference = await createCheckoutPreference({
    paymentId: draft.id,
    title,
    amount: data.amount,
    payerEmail: client.email,
    externalReference: draft.id,
    successUrl: `${base}/pagos/${draft.id}?mp=success`,
    failureUrl: `${base}/pagos/${draft.id}?mp=failure`,
    pendingUrl: `${base}/pagos/${draft.id}?mp=pending`,
    notificationUrl: `${base}/api/payments/mercadopago/webhook`,
  });

  const payment = await prisma.payment.update({
    where: { id: draft.id },
    data: {
      preferenceId: preference.preferenceId,
      checkoutUrl: preference.checkoutUrl,
      notes: preference.demo
        ? [draft.notes, "Checkout demo (sin token MP)"].filter(Boolean).join(" · ")
        : draft.notes,
    },
  });

  await emailMercadoPagoCheckout({
    to: client.email,
    clientName: clientDisplayName(client),
    amount: data.amount,
    checkoutUrl: preference.checkoutUrl,
  });

  revalidatePaths(payment.clientId, payment.id);
  redirect(`/pagos/${payment.id}`);
}

export async function confirmPendingPayment(paymentId: string) {
  const session = await requireSession();
  const payment = await confirmPaymentRecord(paymentId, {
    notes: `Confirmado manualmente por ${session.name}`,
  });
  await notifyConfirmedPayment(payment.id, session.name);
  revalidatePaths(payment.clientId, payment.id);
  redirect(`/pagos/${payment.id}`);
}

export async function cancelPendingPayment(paymentId: string) {
  const session = await requireSession();
  const payment = await voidPaymentRecord({
    paymentId,
    voidedById: session.id,
    reason: "Cobro pendiente cancelado",
  });

  const full = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: { client: true, voidedBy: true },
  });
  if (full?.voidedAt) {
    await emailPaymentVoided({
      to: full.client.email,
      clientName: clientDisplayName(full.client),
      amount: full.amount,
      reason: full.voidReason || "Cobro pendiente cancelado",
      voidedBy: full.voidedBy?.name || session.name,
      voidedAt: full.voidedAt,
    });
  }

  revalidatePaths(payment.clientId, payment.id);
  redirect(`/pagos/${payment.id}`);
}

/** Solo administrador: anula un pago confirmado (o pendiente) con motivo. */
export async function voidPayment(formData: FormData) {
  const session = await requireAdmin();
  const paymentId = String(formData.get("paymentId") ?? "");
  const reason = String(formData.get("voidReason") ?? "");

  if (!paymentId) {
    throw new Error("Pago inválido");
  }

  const payment = await voidPaymentRecord({
    paymentId,
    voidedById: session.id,
    reason,
  });

  const full = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: { client: true, voidedBy: true },
  });
  if (full?.voidedAt) {
    await emailPaymentVoided({
      to: full.client.email,
      clientName: clientDisplayName(full.client),
      amount: full.amount,
      reason: full.voidReason || reason,
      voidedBy: full.voidedBy?.name || session.name,
      voidedAt: full.voidedAt,
    });
  }

  revalidatePaths(payment.clientId, payment.id);
  redirect(`/pagos/${payment.id}`);
}

function revalidatePaths(clientId: string, paymentId?: string) {
  revalidatePath("/pagos");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  if (paymentId) revalidatePath(`/pagos/${paymentId}`);
}

/** Compatibilidad con formularios anteriores */
export async function createPayment(formData: FormData) {
  formData.set("mode", "manual");
  return registerManualPayment(formData);
}
