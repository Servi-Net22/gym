import { getCompanyInfo } from "@/lib/company";
import {
  employeeDisplayName,
  receiptMethodLabel,
} from "@/lib/employee-receipts";
import {
  employerCostPieSlices,
  pieChartPaths,
  quincenaLabel,
  resolvePayrollSnapshot,
  yearsOfSeniority,
  type ReceiptLine,
} from "@/lib/payroll-receipt";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type Employee = {
  firstName: string;
  lastName: string;
  documentId: string;
  role: string;
  hireDate: Date;
  cuil?: string | null;
  legajo?: string | null;
  categoriaLaboral?: string | null;
};

type Receipt = {
  id: string;
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
  signatureData?: string | null;
  signedName?: string | null;
  signedAt?: Date | null;
};

function money(n: number) {
  return formatCurrency(n);
}

function LinesTable({
  title,
  totalLabel,
  total,
  lines,
}: {
  title: string;
  totalLabel: string;
  total: number;
  lines: ReceiptLine[];
}) {
  return (
    <section className="receipt-block">
      <div className="receipt-block-title">
        <span>{title}</span>
        <span>{money(total)}</span>
      </div>
      <table className="receipt-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="w-[14%]">Unidad</th>
            <th className="w-[18%]">Base</th>
            <th className="w-[18%]">Monto</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={`${line.concepto}-${line.unidad}`}>
              <td>{line.concepto}</td>
              <td className="text-center">{line.unidad}</td>
              <td className="text-right">
                {line.base != null ? money(line.base) : "—"}
              </td>
              <td className="text-right">{money(line.monto)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>{totalLabel}</td>
            <td className="text-right font-semibold">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function EmployerPie({
  slices,
}: {
  slices: ReturnType<typeof employerCostPieSlices>;
}) {
  const paths = pieChartPaths(slices);
  if (paths.length === 0) return null;

  return (
    <div className="receipt-pie">
      <p className="receipt-pie-title">Costo total empleador</p>
      <div className="receipt-pie-body">
        <svg
          viewBox="0 0 100 100"
          className="receipt-pie-svg"
          role="img"
          aria-label="Distribución del costo total empleador"
        >
          {paths.map((p) => (
            <path key={p.label} d={p.d} fill={p.color} stroke="#fff" strokeWidth="0.4" />
          ))}
        </svg>
        <ul className="receipt-pie-legend">
          {paths.map((p) => (
            <li key={p.label}>
              <span
                className="receipt-pie-swatch"
                style={{ background: p.color }}
              />
              <span>
                {p.label} ({p.pct.toFixed(0)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReceiptDocument({
  receipt,
  employee,
  gymName,
}: {
  receipt: Receipt;
  employee: Employee;
  gymName?: string;
}) {
  const company = getCompanyInfo();
  const empresa = gymName?.trim() || company.name;

  const code = receipt.id.slice(-8).toUpperCase();
  const signed = Boolean(receipt.signatureData);
  const payroll = resolvePayrollSnapshot({
    sueldoBruto: receipt.sueldoBruto,
    amount: receipt.amount,
    employerLines: receipt.employerLines,
    employeeLines: receipt.employeeLines,
  });
  const antiguedad = yearsOfSeniority(employee.hireDate, receipt.periodTo);
  const mes = receipt.periodFrom.toLocaleDateString("es-AR", { month: "2-digit" });
  const anio = receipt.periodFrom.getFullYear();
  const categoria = employee.categoriaLaboral?.trim() || employee.role;
  const fPagoAportes =
    company.fPagoAportes || formatDate(receipt.paidAt);
  const pieSlices = employerCostPieSlices(payroll);
  const b = payroll.breakdown;

  return (
    <div className="receipt-print-fit">
      <article className="receipt-doc overflow-hidden border border-black bg-white text-[11px] text-black shadow-sm print:shadow-none">
        <p className="receipt-disclaimer border-b border-black px-3 py-1.5 text-[10px] italic text-neutral-700">
          <span className="print:hidden">
            El recibo de sueldo deberá ajustarse al modelo previsto en el presente
            anexo. Documento operativo — no constituye asesoramiento legal ni
            contable.
          </span>
          <span className="hidden print:inline">
            Anexo operativo — modelo de recibo de sueldo (uso interno).
          </span>
        </p>

        <div className="overflow-x-auto">
          <table className="receipt-header-table">
            <tbody>
              <tr>
                <td colSpan={4}>
                  <strong>EMPRESA:</strong> {empresa}
                </td>
                <td colSpan={3}>
                  <strong>C.U.I.T. EMPRESA:</strong> {company.cuit}
                </td>
              </tr>
              <tr>
                <td colSpan={7}>
                  <strong>Domicilio:</strong> {company.address}
                </td>
              </tr>
              <tr className="receipt-th">
                <th>Q</th>
                <th>MES</th>
                <th>AÑO</th>
                <th>APELLIDO Y NOMBRE</th>
                <th>Nº LEGAJO</th>
                <th>SUELDO BRUTO</th>
                <th>ANTIGÜEDAD</th>
              </tr>
              <tr>
                <td className="text-center">{quincenaLabel(receipt.quincena)}</td>
                <td className="text-center">{mes}</td>
                <td className="text-center">{anio}</td>
                <td>{employeeDisplayName(employee)}</td>
                <td className="text-center">{employee.legajo?.trim() || "—"}</td>
                <td className="text-right">{money(payroll.sueldoBruto)}</td>
                <td className="text-center">{antiguedad} años</td>
              </tr>
              <tr className="receipt-th">
                <th colSpan={2}>FECHA INGRESO</th>
                <th colSpan={2}>CATEGORÍA LABORAL</th>
                <th>C.U.I.L.</th>
                <th>LUGAR DE PAGO</th>
                <th>F. PAGO APORTES</th>
              </tr>
              <tr>
                <td colSpan={2} className="text-center">
                  {formatDate(employee.hireDate)}
                </td>
                <td colSpan={2}>{categoria}</td>
                <td className="text-center">
                  {employee.cuil?.trim() || employee.documentId}
                </td>
                <td className="text-center">{company.lugarPago}</td>
                <td className="text-center">{fPagoAportes}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="receipt-body flex flex-col gap-3 px-2 py-3 print:gap-1">
          <LinesTable
            title="COSTO TOTAL EMPLEADOR"
            totalLabel="SUBTOTAL CONTRIBUCIONES EMPLEADOR"
            total={payroll.subtotalContribuciones}
            lines={payroll.employerLines}
          />
          <p className="receipt-costo-line px-1 text-[10px] text-neutral-600">
            Costo total empleador (bruto + contribuciones):{" "}
            <strong>{money(payroll.costoTotalEmpleador)}</strong>
          </p>

          <LinesTable
            title="SUELDO BRUTO"
            totalLabel="TOTAL DESCUENTOS TRABAJADOR"
            total={payroll.composition.descuentos}
            lines={payroll.employeeLines}
          />

          <div className="receipt-comp-bar">
            <span>
              COMPOSICIÓN SALARIAL — Remunerativo:{" "}
              <strong>{money(payroll.composition.remunerativo)}</strong>
            </span>
            <span>
              No remunerativo:{" "}
              <strong>{money(payroll.composition.noRemunerativo)}</strong>
            </span>
            <span>
              Descuentos:{" "}
              <strong>{money(payroll.composition.descuentos)}</strong>
            </span>
          </div>

          <div className="receipt-neto-bar">
            <span>SUELDO NETO</span>
            <span>{money(payroll.sueldoNeto)}</span>
          </div>

          <p className="receipt-meta px-1 text-[10px] text-neutral-600">
            Medio de pago: {receiptMethodLabel(receipt.method)} · Período{" "}
            {formatDate(receipt.periodFrom)} → {formatDate(receipt.periodTo)} ·
            Pagado el {formatDate(receipt.paidAt)}
            {receipt.notes ? ` · Notas: ${receipt.notes}` : ""}
            {" · "}#{code}
          </p>

          <div className="receipt-bottom-grid grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-1">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Empleador</th>
                  <th>Trabajador</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Sindical", b.sindical],
                    ["Seguridad Social", b.seguridadSocial],
                    ["Obra Social", b.obraSocial],
                    ["INSSJP", b.inssjp],
                    ["ART", b.art],
                    ["SCVO", b.scvo],
                  ] as const
                ).map(([label, row]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td className="text-right">{money(row.empleador)}</td>
                    <td className="text-right">{money(row.trabajador)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <EmployerPie slices={pieSlices} />
          </div>

          <p className="receipt-note border border-black bg-neutral-100 px-2 py-1.5 text-[10px] leading-snug">
            Nota: las contribuciones de seguridad social a cargo del empleador
            figuran en el bloque superior (costo empleador). Los porcentajes son
            configurables y orientativos para uso operativo del gimnasio.
          </p>

          <section className="receipt-sign border border-black p-2">
            <p className="receipt-sign-title mb-1 text-[10px] font-bold uppercase tracking-wide">
              Conformidad del empleado
            </p>
            {signed ? (
              <div className="space-y-1 print:space-y-0.5">
                <p>
                  Declaro haber recibido la suma neta indicada correspondiente al
                  período liquidado.
                </p>
                <p className="text-neutral-700">
                  {receipt.signedName} · {formatDateTime(receipt.signedAt)}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receipt.signatureData!}
                  alt="Firma del empleado"
                  className="max-h-24 max-w-full border border-neutral-400 bg-white print:max-h-12"
                />
              </div>
            ) : (
              <p className="bg-amber-50 px-2 py-1.5 text-amber-950">
                Pendiente de firma. El empleado puede firmar desde este enlace.
              </p>
            )}
          </section>
        </div>

        <footer className="border-t border-black px-3 py-1.5 text-[9px] text-neutral-600">
          {empresa} · Recibo operativo generado por el sistema · Conservar como
          constancia.
        </footer>
      </article>
    </div>
  );
}
