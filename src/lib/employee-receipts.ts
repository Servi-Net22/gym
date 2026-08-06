import { randomBytes } from "crypto";
import { getCompanyInfo } from "@/lib/company";
import {
  employerCostPieSlices,
  pieChartPaths,
  quincenaLabel,
  resolvePayrollSnapshot,
  yearsOfSeniority,
  type ReceiptLine,
} from "@/lib/payroll-receipt";
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

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linesTableHtml(
  title: string,
  totalLabel: string,
  total: number,
  lines: ReceiptLine[],
) {
  const rows = lines
    .map(
      (l) => `
      <tr>
        <td style="border:1px solid #000;padding:4px 6px;">${esc(l.concepto)}</td>
        <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${esc(l.unidad)}</td>
        <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${l.base != null ? formatCurrency(l.base) : "—"}</td>
        <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatCurrency(l.monto)}</td>
      </tr>`,
    )
    .join("");

  return `
  <div style="margin:12px 0;">
    <div style="background:#d0d0d0;border:1px solid #000;padding:6px 8px;font-weight:700;display:flex;justify-content:space-between;">
      <span>${esc(title)}</span><span>${formatCurrency(total)}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#e8e8e8;">
          <th style="border:1px solid #000;padding:4px 6px;text-align:left;">Concepto</th>
          <th style="border:1px solid #000;padding:4px 6px;">Unidad</th>
          <th style="border:1px solid #000;padding:4px 6px;">Base</th>
          <th style="border:1px solid #000;padding:4px 6px;">Monto</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="border:1px solid #000;padding:4px 6px;font-weight:700;">${esc(totalLabel)}</td>
          <td style="border:1px solid #000;padding:4px 6px;text-align:right;font-weight:700;">${formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>`;
}

export function receiptHtml(input: {
  employeeName: string;
  documentId: string;
  role: string;
  hireDate: Date;
  cuil?: string | null;
  legajo?: string | null;
  categoriaLaboral?: string | null;
  amount: number;
  sueldoBruto: number;
  quincena?: number | null;
  method: string;
  periodFrom: Date;
  periodTo: Date;
  paidAt: Date;
  notes?: string | null;
  employerLines?: unknown;
  employeeLines?: unknown;
  signedName?: string | null;
  signedAt?: Date | null;
  signatureData?: string | null;
  receiptId: string;
  gymName?: string;
  receiptUrl?: string;
}) {
  const company = getCompanyInfo();
  const empresa = input.gymName?.trim() || company.name;
  const code = input.receiptId.slice(-8).toUpperCase();
  const signed = Boolean(input.signatureData);
  const payroll = resolvePayrollSnapshot({
    sueldoBruto: input.sueldoBruto,
    amount: input.amount,
    employerLines: input.employerLines,
    employeeLines: input.employeeLines,
  });
  const antiguedad = yearsOfSeniority(input.hireDate, input.periodTo);
  const mes = input.periodFrom.toLocaleDateString("es-AR", { month: "2-digit" });
  const anio = input.periodFrom.getFullYear();
  const categoria = input.categoriaLaboral?.trim() || input.role;
  const fPagoAportes = company.fPagoAportes || formatDate(input.paidAt);
  const pie = pieChartPaths(employerCostPieSlices(payroll));
  const pieSvg =
    pie.length === 0
      ? ""
      : `<svg viewBox="0 0 100 100" width="120" height="120" style="display:block;margin:0 auto;">
          ${pie.map((p) => `<path d="${p.d}" fill="${p.color}" stroke="#fff" stroke-width="0.4"/>`).join("")}
         </svg>
         <ul style="list-style:none;padding:0;margin:8px 0 0;font-size:11px;">
           ${pie
             .map(
               (p) =>
                 `<li style="margin:2px 0;"><span style="display:inline-block;width:10px;height:10px;background:${p.color};margin-right:6px;"></span>${esc(p.label)} (${p.pct.toFixed(0)}%)</li>`,
             )
             .join("")}
         </ul>`;

  const b = payroll.breakdown;
  const breakdownRows = (
    [
      ["Sindical", b.sindical],
      ["Seguridad Social", b.seguridadSocial],
      ["Obra Social", b.obraSocial],
      ["INSSJP", b.inssjp],
      ["ART", b.art],
      ["SCVO", b.scvo],
    ] as const
  )
    .map(
      ([label, row]) =>
        `<tr>
          <td style="border:1px solid #000;padding:4px 6px;">${label}</td>
          <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatCurrency(row.empleador)}</td>
          <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatCurrency(row.trabajador)}</td>
        </tr>`,
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;color:#111;border:1px solid #000;background:#fff;">
    <p style="margin:0;padding:8px 10px;border-bottom:1px solid #000;font-size:11px;font-style:italic;color:#444;">
      El recibo de sueldo deberá ajustarse al modelo previsto en el presente anexo. Documento operativo.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr>
        <td colspan="4" style="border:1px solid #000;padding:5px 6px;"><strong>EMPRESA:</strong> ${esc(empresa)}</td>
        <td colspan="3" style="border:1px solid #000;padding:5px 6px;"><strong>C.U.I.T.:</strong> ${esc(company.cuit)}</td>
      </tr>
      <tr>
        <td colspan="7" style="border:1px solid #000;padding:5px 6px;"><strong>Domicilio:</strong> ${esc(company.address)}</td>
      </tr>
      <tr style="background:#d8d8d8;">
        <th style="border:1px solid #000;padding:4px;">Q</th>
        <th style="border:1px solid #000;padding:4px;">MES</th>
        <th style="border:1px solid #000;padding:4px;">AÑO</th>
        <th style="border:1px solid #000;padding:4px;">APELLIDO Y NOMBRE</th>
        <th style="border:1px solid #000;padding:4px;">LEGAJO</th>
        <th style="border:1px solid #000;padding:4px;">BRUTO</th>
        <th style="border:1px solid #000;padding:4px;">ANTIG.</th>
      </tr>
      <tr>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${esc(quincenaLabel(input.quincena))}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${mes}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${anio}</td>
        <td style="border:1px solid #000;padding:4px;">${esc(input.employeeName)}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${esc(input.legajo?.trim() || "—")}</td>
        <td style="border:1px solid #000;padding:4px;text-align:right;">${formatCurrency(payroll.sueldoBruto)}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${antiguedad} a.</td>
      </tr>
      <tr style="background:#d8d8d8;">
        <th colspan="2" style="border:1px solid #000;padding:4px;">INGRESO</th>
        <th colspan="2" style="border:1px solid #000;padding:4px;">CATEGORÍA</th>
        <th style="border:1px solid #000;padding:4px;">CUIL</th>
        <th style="border:1px solid #000;padding:4px;">LUGAR PAGO</th>
        <th style="border:1px solid #000;padding:4px;">F. APORTES</th>
      </tr>
      <tr>
        <td colspan="2" style="border:1px solid #000;padding:4px;text-align:center;">${formatDate(input.hireDate)}</td>
        <td colspan="2" style="border:1px solid #000;padding:4px;">${esc(categoria)}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${esc(input.cuil?.trim() || input.documentId)}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${esc(company.lugarPago)}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${esc(fPagoAportes)}</td>
      </tr>
    </table>
    <div style="padding:8px 10px;">
      ${linesTableHtml("COSTO TOTAL EMPLEADOR", "SUBTOTAL CONTRIBUCIONES EMPLEADOR", payroll.subtotalContribuciones, payroll.employerLines)}
      ${linesTableHtml("SUELDO BRUTO", "TOTAL DESCUENTOS TRABAJADOR", payroll.composition.descuentos, payroll.employeeLines)}
      <div style="border:1px solid #000;background:#eee;padding:6px 8px;font-size:11px;margin:8px 0;">
        COMPOSICIÓN — Remunerativo: <strong>${formatCurrency(payroll.composition.remunerativo)}</strong>
        · No rem.: <strong>${formatCurrency(payroll.composition.noRemunerativo)}</strong>
        · Descuentos: <strong>${formatCurrency(payroll.composition.descuentos)}</strong>
      </div>
      <div style="border:2px solid #000;background:#222;color:#fff;padding:10px 12px;font-weight:700;display:flex;justify-content:space-between;font-size:16px;">
        <span>SUELDO NETO</span><span>${formatCurrency(payroll.sueldoNeto)}</span>
      </div>
      <p style="font-size:11px;color:#555;margin:8px 0;">
        Medio: ${esc(receiptMethodLabel(input.method))} · ${formatDate(input.periodFrom)} → ${formatDate(input.periodTo)}
        · Pagado ${formatDate(input.paidAt)} · #${code}
        ${input.notes ? ` · Notas: ${esc(input.notes)}` : ""}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;width:55%;padding-right:8px;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#e8e8e8;">
                  <th style="border:1px solid #000;padding:4px;text-align:left;">Concepto</th>
                  <th style="border:1px solid #000;padding:4px;">Empleador</th>
                  <th style="border:1px solid #000;padding:4px;">Trabajador</th>
                </tr>
              </thead>
              <tbody>${breakdownRows}</tbody>
            </table>
          </td>
          <td style="vertical-align:top;border:1px solid #000;padding:8px;">
            <p style="margin:0 0 6px;font-weight:700;text-align:center;font-size:12px;">Costo total empleador</p>
            ${pieSvg}
          </td>
        </tr>
      </table>
      ${
        signed
          ? `<p style="margin:14px 0 6px;"><strong>Firma:</strong> ${esc(input.signedName ?? "")} · ${input.signedAt ? formatDateTime(input.signedAt) : ""}</p>
             <img src="${input.signatureData}" alt="Firma" style="max-width:240px;border:1px solid #999;background:#fff;" />`
          : `<p style="margin:14px 0 0;padding:10px 12px;background:#fff8e6;border:1px solid #e0c36a;color:#7a5a00;">Pendiente de firma. Abrí el link para firmar en pantalla.</p>`
      }
      ${
        input.receiptUrl
          ? `<p style="margin:18px 0 0;"><a href="${input.receiptUrl}" style="display:inline-block;background:#c8f542;color:#111;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">${signed ? "Ver recibo online" : "Abrir y firmar recibo"}</a></p>`
          : ""
      }
      <p style="margin:16px 0 0;color:#666;font-size:11px;">${esc(empresa)}. Documento operativo — conservar como constancia.</p>
    </div>
  </div>`;
}

export function employeeDisplayName(employee: {
  firstName: string;
  lastName: string;
}) {
  return fullName(employee.firstName, employee.lastName);
}
