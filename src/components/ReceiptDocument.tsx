import {
  employeeDisplayName,
  receiptMethodLabel,
} from "@/lib/employee-receipts";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type Employee = {
  firstName: string;
  lastName: string;
  documentId: string;
  role: string;
};

type Receipt = {
  id: string;
  amount: number;
  method: string;
  periodFrom: Date;
  periodTo: Date;
  paidAt: Date;
  notes?: string | null;
  signatureData?: string | null;
  signedName?: string | null;
  signedAt?: Date | null;
};

export function ReceiptDocument({
  receipt,
  employee,
  gymName,
}: {
  receipt: Receipt;
  employee: Employee;
  gymName?: string;
}) {
  const gym = gymName ?? process.env.NEXT_PUBLIC_APP_NAME ?? "GymFlow";
  const code = receipt.id.slice(-8).toUpperCase();
  const signed = Boolean(receipt.signatureData);

  return (
    <article className="receipt-doc overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
      <header className="border-b border-[var(--line)] bg-[linear-gradient(135deg,#f7f8f2,#eef6c8)] px-5 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          {gym}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
            Recibo de sueldo
          </h1>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
            #{code}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Constancia de pago de haberes
        </p>
      </header>

      <div className="space-y-5 px-5 py-5 text-sm">
        <section className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Empleado
            </p>
            <p className="mt-0.5 text-base font-semibold">
              {employeeDisplayName(employee)}
            </p>
            <p className="text-[var(--muted)]">DNI {employee.documentId}</p>
            <p className="text-[var(--muted)]">{employee.role}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Período liquidado
            </p>
            <p className="mt-0.5 font-semibold">
              {formatDate(receipt.periodFrom)} → {formatDate(receipt.periodTo)}
            </p>
            <p className="text-[var(--muted)]">
              Pagado el {formatDate(receipt.paidAt)}
            </p>
            <p className="text-[var(--muted)]">
              Medio: {receiptMethodLabel(receipt.method)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Neto percibido
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tracking-wide">
            {formatCurrency(receipt.amount)}
          </p>
          {receipt.notes ? (
            <p className="mt-2 text-[var(--muted)]">
              <span className="font-semibold text-[var(--ink)]">Notas: </span>
              {receipt.notes}
            </p>
          ) : null}
        </section>

        <section className="border-t border-[var(--line)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Conformidad del empleado
          </p>
          {signed ? (
            <div className="mt-2 space-y-2">
              <p>
                Declaro haber recibido la suma indicada correspondiente al
                período liquidado.
              </p>
              <p className="text-[var(--muted)]">
                {receipt.signedName} · {formatDateTime(receipt.signedAt)}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.signatureData!}
                alt="Firma del empleado"
                className="max-h-28 max-w-full rounded-md border border-[var(--line)] bg-white"
              />
            </div>
          ) : (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-amber-900">
              Pendiente de firma. El empleado puede firmar desde este enlace.
            </p>
          )}
        </section>
      </div>

      <footer className="border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
        Documento generado por {gym}. Conservar como constancia. Podés imprimir
        o guardar como PDF desde el navegador.
      </footer>
    </article>
  );
}
