import { randomBytes } from "crypto";
import { formatCurrency, formatDate, formatDateTime, fullName } from "@/lib/utils";

export function generateReceiptViewToken() {
  return randomBytes(24).toString("hex");
}

export function receiptMethodLabel(method: string) {
  if (method === "efectivo") return "Efectivo";
  if (method === "transferencia") return "Transferencia";
  return method;
}

export function buildWhatsAppShareUrl(phone: string | null | undefined, text: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  const normalized =
    digits.startsWith("54") ? digits : digits.length <= 10 ? `54${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function buildReceiptWhatsAppText(input: {
  firstName: string;
  amount: number;
  periodFrom: Date;
  periodTo: Date;
  receiptUrl: string;
  signed: boolean;
}) {
  if (input.signed) {
    return `Hola ${input.firstName}, te envío tu recibo de sueldo firmado por ${formatCurrency(input.amount)} (${formatDate(input.periodFrom)} al ${formatDate(input.periodTo)}).\n\nPodés verlo, guardarlo o imprimirlo acá:\n${input.receiptUrl}`;
  }
  return `Hola ${input.firstName}, te envío tu recibo de sueldo por ${formatCurrency(input.amount)} (${formatDate(input.periodFrom)} al ${formatDate(input.periodTo)}).\n\nAbrí el link, firmá en pantalla y listo:\n${input.receiptUrl}`;
}

export function receiptHtml(input: {
  employeeName: string;
  documentId: string;
  role: string;
  amount: number;
  method: string;
  periodFrom: Date;
  periodTo: Date;
  paidAt: Date;
  notes?: string | null;
  signedName?: string | null;
  signedAt?: Date | null;
  signatureData?: string | null;
  receiptId: string;
  gymName?: string;
  receiptUrl?: string;
}) {
  const gym = input.gymName ?? process.env.NEXT_PUBLIC_APP_NAME ?? "GymFlow";
  const code = input.receiptId.slice(-8).toUpperCase();
  const signed = Boolean(input.signatureData);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;border:1px solid #ddd;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#f7f8f2,#eef6c8);padding:20px 24px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#666;font-weight:700;">${gym}</p>
      <h1 style="margin:6px 0 0;font-size:26px;">Recibo de sueldo</h1>
      <p style="margin:4px 0 0;color:#666;">#${code} · Constancia de pago de haberes</p>
    </div>
    <div style="padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="vertical-align:top;padding:0 12px 12px 0;">
            <p style="margin:0;color:#666;font-size:11px;text-transform:uppercase;font-weight:700;">Empleado</p>
            <p style="margin:4px 0 0;font-weight:700;">${input.employeeName}</p>
            <p style="margin:2px 0 0;color:#666;">DNI ${input.documentId}</p>
            <p style="margin:2px 0 0;color:#666;">${input.role}</p>
          </td>
          <td style="vertical-align:top;padding:0 0 12px;">
            <p style="margin:0;color:#666;font-size:11px;text-transform:uppercase;font-weight:700;">Período</p>
            <p style="margin:4px 0 0;font-weight:700;">${formatDate(input.periodFrom)} → ${formatDate(input.periodTo)}</p>
            <p style="margin:2px 0 0;color:#666;">Pagado el ${formatDate(input.paidAt)}</p>
            <p style="margin:2px 0 0;color:#666;">Medio: ${receiptMethodLabel(input.method)}</p>
          </td>
        </tr>
      </table>
      <div style="margin:8px 0 16px;padding:16px;border:1px solid #e5e5e5;border-radius:10px;background:#fafafa;">
        <p style="margin:0;color:#666;font-size:11px;text-transform:uppercase;font-weight:700;">Neto percibido</p>
        <p style="margin:6px 0 0;font-size:28px;font-weight:700;">${formatCurrency(input.amount)}</p>
        ${input.notes ? `<p style="margin:8px 0 0;color:#666;"><strong>Notas:</strong> ${input.notes}</p>` : ""}
      </div>
      ${
        signed
          ? `<p style="margin:0 0 8px;"><strong>Firma:</strong> ${input.signedName ?? ""} · ${input.signedAt ? formatDateTime(input.signedAt) : ""}</p>
             <img src="${input.signatureData}" alt="Firma" style="max-width:260px;border:1px solid #ddd;background:#fff;border-radius:6px;" />`
          : `<p style="margin:0;padding:10px 12px;background:#fff8e6;border-radius:8px;color:#7a5a00;">Pendiente de firma. Abrí el link para firmar en pantalla.</p>`
      }
      ${
        input.receiptUrl
          ? `<p style="margin:20px 0 0;"><a href="${input.receiptUrl}" style="display:inline-block;background:#c8f542;color:#111;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">${signed ? "Ver recibo online" : "Abrir y firmar recibo"}</a></p>`
          : ""
      }
      <p style="margin:20px 0 0;color:#888;font-size:12px;">Documento generado por ${gym}. Conservar como constancia de pago.</p>
    </div>
  </div>`;
}

export function employeeDisplayName(employee: {
  firstName: string;
  lastName: string;
}) {
  return fullName(employee.firstName, employee.lastName);
}
