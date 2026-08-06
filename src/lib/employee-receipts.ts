import { randomBytes } from "crypto";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";

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
  // AR: si viene 10 dígitos locales, anteponer 54
  const normalized =
    digits.startsWith("54") ? digits : digits.length <= 10 ? `54${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
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
}) {
  const gym = input.gymName ?? process.env.NEXT_PUBLIC_APP_NAME ?? "GymFlow";
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <h1 style="font-size: 22px; margin-bottom: 4px;">Recibo de sueldo</h1>
    <p style="color:#666; margin-top:0;">${gym} · #${input.receiptId.slice(-8).toUpperCase()}</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
    <p><strong>Empleado:</strong> ${input.employeeName}</p>
    <p><strong>Documento:</strong> ${input.documentId}</p>
    <p><strong>Cargo:</strong> ${input.role}</p>
    <p><strong>Período:</strong> ${formatDate(input.periodFrom)} → ${formatDate(input.periodTo)}</p>
    <p><strong>Fecha de pago:</strong> ${formatDate(input.paidAt)}</p>
    <p><strong>Medio:</strong> ${receiptMethodLabel(input.method)}</p>
    <p style="font-size:20px;margin:20px 0;"><strong>Neto percibido:</strong> ${formatCurrency(input.amount)}</p>
    ${input.notes ? `<p><strong>Notas:</strong> ${input.notes}</p>` : ""}
    <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
    ${
      input.signatureData
        ? `<p><strong>Firma:</strong> ${input.signedName ?? ""} ${input.signedAt ? `(${formatDate(input.signedAt)})` : ""}</p>
           <img src="${input.signatureData}" alt="Firma" style="max-width:280px;border:1px solid #ddd;background:#fff;" />`
        : `<p style="color:#666;">Pendiente de firma</p>`
    }
    <p style="color:#888;font-size:12px;margin-top:24px;">Documento generado por ${gym}. Conservar como constancia de pago.</p>
  </div>`;
}

export function employeeDisplayName(employee: {
  firstName: string;
  lastName: string;
}) {
  return fullName(employee.firstName, employee.lastName);
}
