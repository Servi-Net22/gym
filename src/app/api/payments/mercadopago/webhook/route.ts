import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  clientDisplayName,
  emailPaymentConfirmed,
} from "@/lib/mail";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago";
import { confirmPaymentRecord } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

/**
 * Webhook de Mercado Pago.
 * Documentación: topic=payment & id=<payment_id>
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const topic =
    url.searchParams.get("topic") ||
    url.searchParams.get("type") ||
    (typeof body.type === "string" ? body.type : null);

  const dataId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    (typeof body.data === "object" &&
    body.data &&
    "id" in body.data
      ? String((body.data as { id: string | number }).id)
      : null);

  if (topic && !String(topic).includes("payment")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!dataId) {
    return NextResponse.json({ ok: true, waiting: true });
  }

  const mpPayment = await fetchMercadoPagoPayment(dataId);
  if (!mpPayment) {
    return NextResponse.json({ ok: true, unresolved: true });
  }

  if (mpPayment.status !== "approved") {
    if (mpPayment.external_reference) {
      await prisma.payment.updateMany({
        where: {
          id: mpPayment.external_reference,
          status: "pending",
        },
        data: {
          status: mpPayment.status === "rejected" ? "rejected" : "pending",
          externalId: String(mpPayment.id),
        },
      });
    }
    return NextResponse.json({ ok: true, status: mpPayment.status });
  }

  const localId = mpPayment.external_reference;
  if (!localId) {
    return NextResponse.json({ ok: false, reason: "sin reference" }, { status: 400 });
  }

  await confirmPaymentRecord(localId, {
    externalId: String(mpPayment.id),
    notes: "Confirmado automáticamente por Mercado Pago",
  });

  const payment = await prisma.payment.findUnique({
    where: { id: localId },
    include: { client: true },
  });
  if (payment) {
    const base = await getAppBaseUrl();
    await emailPaymentConfirmed({
      to: payment.client.email,
      clientName: clientDisplayName(payment.client),
      amount: payment.amount,
      method: payment.method,
      periodFrom: payment.periodFrom,
      periodTo: payment.periodTo,
      registeredBy: "Mercado Pago",
      paymentUrl: `${base}/pagos/${payment.id}`,
    });
  }

  return NextResponse.json({ ok: true, confirmed: localId });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
