/**
 * Integración Mercado Pago vía API REST.
 * Si no hay MERCADOPAGO_ACCESS_TOKEN, opera en modo demo (checkout simulado).
 */

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export function isDemoCheckoutEnabled() {
  return process.env.MERCADOPAGO_DEMO !== "false";
}

type PreferenceInput = {
  paymentId: string;
  title: string;
  amount: number;
  payerEmail?: string | null;
  externalReference: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
};

export type PreferenceResult = {
  preferenceId: string;
  checkoutUrl: string;
  demo: boolean;
};

export async function createCheckoutPreference(
  input: PreferenceInput,
): Promise<PreferenceResult> {
  if (!isMercadoPagoConfigured()) {
    if (!isDemoCheckoutEnabled()) {
      throw new Error(
        "Falta MERCADOPAGO_ACCESS_TOKEN en .env para cobrar con Mercado Pago",
      );
    }

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    return {
      preferenceId: `demo-pref-${input.paymentId}`,
      checkoutUrl: `${base}/pagos/${input.paymentId}/checkout-demo`,
      demo: true,
    };
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN!;
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          unit_price: Number(input.amount.toFixed(2)),
          currency_id: "ARS",
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.externalReference,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      notification_url: input.notificationUrl,
      metadata: { paymentId: input.paymentId },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mercado Pago error: ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point || data.sandbox_init_point || "",
    demo: false,
  };
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return null;
  return (await res.json()) as {
    id: number;
    status: string;
    external_reference?: string;
    transaction_amount?: number;
  };
}
