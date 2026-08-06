import Link from "next/link";
import { ButtonLink, DataTable, PageHeader } from "@/components/Ui";
import {
  paymentMethodLabel,
  paymentSourceLabel,
  paymentStatusLabel,
} from "@/lib/payment-methods";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const session = await requireSession();
  const payments = await prisma.payment.findMany({
    where: tenantWhere(session),
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      registeredBy: { select: { name: true } },
      voidedBy: { select: { name: true } },
    },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Pagos"
        description="Efectivo, transferencia y Mercado Pago — registro manual o cobro automático."
        actions={<ButtonLink href="/pagos/nuevo">Nuevo cobro</ButtonLink>}
      />

      <DataTable
        headers={[
          "Fecha",
          "Cliente",
          "Monto",
          "Método",
          "Estado",
          "Registró",
          "Período",
          "",
        ]}
      >
        {payments.map((payment) => (
          <tr key={payment.id} className="hover:bg-[var(--accent-soft)]/40">
            <td className="px-4 py-3">
              {formatDateTime(payment.paidAt ?? payment.createdAt)}
            </td>
            <td className="px-4 py-3 font-medium">
              {fullName(payment.client.firstName, payment.client.lastName)}
            </td>
            <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
            <td className="px-4 py-3">
              {paymentMethodLabel(payment.method)}
            </td>
            <td className="px-4 py-3">
              <StatusPill status={payment.status}>
                {paymentStatusLabel(payment.status)}
              </StatusPill>
              {payment.status === "cancelled" && payment.voidedBy ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Anuló: {payment.voidedBy.name}
                </p>
              ) : null}
            </td>
            <td className="px-4 py-3 text-[var(--muted)]">
              {payment.registeredBy?.name ?? "—"}
              <span className="mt-0.5 block text-xs">
                {paymentSourceLabel(payment.source)}
              </span>
            </td>
            <td className="px-4 py-3 text-[var(--muted)]">
              {formatDate(payment.periodFrom)} → {formatDate(payment.periodTo)}
            </td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/pagos/${payment.id}`}
                className="text-sm font-semibold underline"
              >
                Ver
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function StatusPill({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) {
  const tone =
    status === "confirmed"
      ? "bg-emerald-100 text-emerald-900"
      : status === "pending"
        ? "bg-amber-100 text-amber-900"
        : "bg-rose-100 text-rose-900";
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {children}
    </span>
  );
}
