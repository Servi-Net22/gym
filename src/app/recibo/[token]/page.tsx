import { notFound } from "next/navigation";
import {
  employeeDisplayName,
  receiptMethodLabel,
} from "@/lib/employee-receipts";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicReciboPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const receipt = await prisma.employeeReceipt.findUnique({
    where: { viewToken: token },
    include: { employee: true },
  });
  if (!receipt) notFound();

  const gym = process.env.NEXT_PUBLIC_APP_NAME ?? "GymFlow";

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {gym}
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-wide">
        Recibo de sueldo
      </h1>
      <p className="text-sm text-[var(--muted)]">
        #{receipt.id.slice(-8).toUpperCase()}
      </p>

      <article className="mt-6 space-y-3 rounded-xl border border-[var(--line)] bg-white p-5 text-sm">
        <p>
          <strong>Empleado:</strong> {employeeDisplayName(receipt.employee)}
        </p>
        <p>
          <strong>Documento:</strong> {receipt.employee.documentId}
        </p>
        <p>
          <strong>Cargo:</strong> {receipt.employee.role}
        </p>
        <p>
          <strong>Período:</strong> {formatDate(receipt.periodFrom)} →{" "}
          {formatDate(receipt.periodTo)}
        </p>
        <p>
          <strong>Fecha de pago:</strong> {formatDate(receipt.paidAt)}
        </p>
        <p>
          <strong>Medio:</strong> {receiptMethodLabel(receipt.method)}
        </p>
        <p className="text-xl font-semibold">
          Neto: {formatCurrency(receipt.amount)}
        </p>
        {receipt.notes ? (
          <p>
            <strong>Notas:</strong> {receipt.notes}
          </p>
        ) : null}

        <div className="border-t border-[var(--line)] pt-4">
          {receipt.signatureData ? (
            <>
              <p className="mb-2 text-sm">
                <strong>Firma:</strong> {receipt.signedName} ·{" "}
                {formatDateTime(receipt.signedAt)}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.signatureData}
                alt="Firma"
                className="max-w-full rounded-md border border-[var(--line)]"
              />
            </>
          ) : (
            <p className="text-[var(--muted)]">Pendiente de firma</p>
          )}
        </div>
      </article>

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Constancia generada por {gym}. Podés guardar o imprimir esta página.
      </p>
    </div>
  );
}
