import { Resend } from "resend";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
} from "@/lib/utils";
import { paymentMethodLabel } from "@/lib/payment-methods";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return (
    process.env.RESEND_FROM ||
    "GymFlow <onboarding@resend.dev>"
  );
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY no configurada — email omitido:", input.subject);
    return { skipped: true as const };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const filtered = to.filter(Boolean);
  if (filtered.length === 0) {
    return { skipped: true as const };
  }

  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: filtered,
      subject: input.subject,
      html: input.html,
    });
    if (result.error) {
      console.error("[mail] Resend error:", result.error);
      return { ok: false as const, error: result.error };
    }
    return { ok: true as const, id: result.data?.id };
  } catch (error) {
    console.error("[mail] Falló el envío:", error);
    return { ok: false as const, error };
  }
}

export async function emailPaymentConfirmed(input: {
  to?: string | null;
  clientName: string;
  amount: number;
  method: string;
  periodFrom: Date;
  periodTo: Date;
  registeredBy?: string;
  paymentUrl: string;
}) {
  if (!input.to) return;
  await sendEmail({
    to: input.to,
    subject: `Pago confirmado — ${formatCurrency(input.amount)}`,
    html: `
      <p>Hola ${input.clientName},</p>
      <p>Registramos tu pago correctamente.</p>
      <ul>
        <li><strong>Monto:</strong> ${formatCurrency(input.amount)}</li>
        <li><strong>Método:</strong> ${paymentMethodLabel(input.method)}</li>
        <li><strong>Período:</strong> ${formatDate(input.periodFrom)} → ${formatDate(input.periodTo)}</li>
        ${input.registeredBy ? `<li><strong>Registró:</strong> ${input.registeredBy}</li>` : ""}
      </ul>
      <p>Tu membresía queda habilitada para ingreso con QR.</p>
      <p><a href="${input.paymentUrl}">Ver detalle del pago</a></p>
    `,
  });
}

export async function emailPaymentPendingTransfer(input: {
  to?: string | null;
  clientName: string;
  amount: number;
  reference: string;
  alias: string;
  paymentUrl: string;
}) {
  if (!input.to) return;
  await sendEmail({
    to: input.to,
    subject: `Transferencia pendiente — ${formatCurrency(input.amount)}`,
    html: `
      <p>Hola ${input.clientName},</p>
      <p>Para acreditar tu membresía, transferí <strong>${formatCurrency(input.amount)}</strong> e incluí esta referencia:</p>
      <p style="font-size:18px;font-family:monospace"><strong>${input.reference}</strong></p>
      <p>Alias/CBU: <strong>${input.alias}</strong></p>
      <p><a href="${input.paymentUrl}">Ver instrucciones</a></p>
    `,
  });
}

export async function emailMercadoPagoCheckout(input: {
  to?: string | null;
  clientName: string;
  amount: number;
  checkoutUrl: string;
}) {
  if (!input.to || !input.checkoutUrl) return;
  await sendEmail({
    to: input.to,
    subject: `Link de pago Mercado Pago — ${formatCurrency(input.amount)}`,
    html: `
      <p>Hola ${input.clientName},</p>
      <p>Completá tu pago de <strong>${formatCurrency(input.amount)}</strong> con este link:</p>
      <p><a href="${input.checkoutUrl}">Pagar con Mercado Pago</a></p>
      <p>Cuando se acredite, tu ingreso por QR quedará habilitado.</p>
    `,
  });
}

export async function emailPaymentVoided(input: {
  to?: string | null;
  clientName: string;
  amount: number;
  reason: string;
  voidedBy: string;
  voidedAt: Date;
}) {
  if (!input.to) return;
  await sendEmail({
    to: input.to,
    subject: `Pago anulado — ${formatCurrency(input.amount)}`,
    html: `
      <p>Hola ${input.clientName},</p>
      <p>Se anuló un pago de <strong>${formatCurrency(input.amount)}</strong>.</p>
      <ul>
        <li><strong>Motivo:</strong> ${input.reason}</li>
        <li><strong>Anuló:</strong> ${input.voidedBy}</li>
        <li><strong>Fecha:</strong> ${formatDateTime(input.voidedAt)}</li>
      </ul>
      <p>Si creés que es un error, contactá al gimnasio.</p>
    `,
  });
}

export async function emailNewClient(input: {
  to?: string | null;
  firstName: string;
  lastName: string;
  planName?: string | null;
  membershipEndsAt?: Date | null;
  appUrl: string;
  portalUrl?: string;
  portalPin?: string;
  documentId?: string;
}) {
  if (!input.to) return;
  await sendEmail({
    to: input.to,
    subject: "Bienvenido/a — tu app y QR del gimnasio",
    html: `
      <p>Hola ${input.firstName} ${input.lastName},</p>
      <p>Tu ficha quedó registrada.</p>
      <ul>
        <li><strong>Plan:</strong> ${input.planName ?? "Sin plan"}</li>
        <li><strong>Membresía hasta:</strong> ${formatDate(input.membershipEndsAt)}</li>
      </ul>
      ${
        input.portalUrl && input.portalPin
          ? `<p><strong>App del cliente (PWA)</strong></p>
             <ul>
               <li>Entrada: <a href="${input.portalUrl}">${input.portalUrl}</a></li>
               <li>DNI: ${input.documentId ?? ""}</li>
               <li>PIN: <strong>${input.portalPin}</strong></li>
             </ul>
             <p>Ahí ves tu QR de ingreso, el estado de cuenta y novedades (rutinas, dietas, avisos).</p>`
          : `<p>El ingreso se realiza con tu QR en recepción o en la app del cliente.</p>`
      }
      <p><a href="${input.appUrl}">Más información</a></p>
    `,
  });
}

export async function emailEmployeeCredentials(input: {
  to: string;
  name: string;
  password: string;
  appUrl: string;
}) {
  await sendEmail({
    to: input.to,
    subject: "Acceso a GymFlow",
    html: `
      <p>Hola ${input.name},</p>
      <p>Se creó tu usuario de empleado.</p>
      <ul>
        <li><strong>Email:</strong> ${input.to}</li>
        <li><strong>Contraseña temporal:</strong> ${input.password}</li>
      </ul>
      <p>Ingresá en <a href="${input.appUrl}">${input.appUrl}</a> y cambiá la contraseña si es necesario.</p>
    `,
  });
}

export async function emailOrgAdminCredentials(input: {
  to: string;
  name: string;
  password: string;
  orgName: string;
  appUrl: string;
  portalUrl: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Acceso administrador — ${input.orgName}`,
    html: `
      <p>Hola ${input.name},</p>
      <p>Se creó tu comercio <strong>${input.orgName}</strong> en GymFlow.</p>
      <ul>
        <li><strong>Panel staff:</strong> <a href="${input.appUrl}/login">${input.appUrl}/login</a></li>
        <li><strong>Email:</strong> ${input.to}</li>
        <li><strong>Contraseña temporal:</strong> ${input.password}</li>
        <li><strong>Portal clientes:</strong> <a href="${input.portalUrl}">${input.portalUrl}</a></li>
      </ul>
      <p>Ingresá al panel y cambiá la contraseña si es necesario.</p>
    `,
  });
}

export async function emailEmployeeReceipt(input: {
  to: string;
  employeeName: string;
  amount: number;
  periodFrom: Date;
  periodTo: Date;
  receiptUrl: string;
  receiptHtml: string;
  signed?: boolean;
}) {
  const signed = Boolean(input.signed);
  const subject = signed
    ? `Tu recibo de sueldo — ${formatCurrency(input.amount)}`
    : `Firmá tu recibo de sueldo — ${formatCurrency(input.amount)}`;

  return sendEmail({
    to: input.to,
    subject,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <p>Hola ${input.employeeName},</p>
        <p>
          ${
            signed
              ? `Ya está disponible tu recibo de sueldo firmado por el período
                 <strong>${formatDate(input.periodFrom)} → ${formatDate(input.periodTo)}</strong>.`
              : `Te enviamos tu recibo de sueldo del período
                 <strong>${formatDate(input.periodFrom)} → ${formatDate(input.periodTo)}</strong>.
                 Abrí el link, revisá los datos y <strong>firmá en pantalla</strong>.`
          }
        </p>
        <p style="margin:24px 0;">
          <a href="${input.receiptUrl}"
             style="display:inline-block;background:#c8f542;color:#111;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:8px;">
            ${signed ? "Ver / imprimir recibo" : "Abrir y firmar recibo"}
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Si el botón no funciona, copiá este enlace:<br/>
          <a href="${input.receiptUrl}">${input.receiptUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />
        ${input.receiptHtml}
      </div>
    `,
  });
}

export function clientDisplayName(client: {
  firstName: string;
  lastName: string;
}) {
  return fullName(client.firstName, client.lastName);
}
