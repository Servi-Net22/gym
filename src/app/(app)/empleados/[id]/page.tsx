import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  Panel,
} from "@/components/Ui";
import {
  employeeDisplayName,
  receiptMethodLabel,
} from "@/lib/employee-receipts";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  signed: "Firmado",
  sent: "Enviado",
};

export default async function EmpleadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      user: { select: { email: true } },
      receipts: {
        orderBy: { paidAt: "desc" },
        include: { registeredBy: { select: { name: true } } },
      },
    },
  });
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={employeeDisplayName(employee)}
        description={`${employee.role} · DNI ${employee.documentId}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/empleados/${employee.id}/recibos/nuevo`}>
              Nuevo recibo
            </ButtonLink>
            <ButtonLink href={`/empleados/${employee.id}/editar`} variant="ghost">
              Editar ficha
            </ButtonLink>
            <ButtonLink href="/empleados" variant="ghost">
              Volver
            </ButtonLink>
          </div>
        }
      />

      <Panel className="max-w-3xl">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-[var(--muted)]">Sueldo base: </span>
            <strong>
              {employee.salary != null ? formatCurrency(employee.salary) : "—"}
            </strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">Email: </span>
            <strong>{employee.email ?? employee.user?.email ?? "—"}</strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">Teléfono: </span>
            <strong>{employee.phone ?? "—"}</strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">Ingreso: </span>
            <strong>{formatDate(employee.hireDate)}</strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">CUIL: </span>
            <strong>{employee.cuil ?? "—"}</strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">Legajo: </span>
            <strong>{employee.legajo ?? "—"}</strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">Categoría: </span>
            <strong>{employee.categoriaLaboral ?? employee.role}</strong>
          </p>
        </div>
      </Panel>

      <div>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl tracking-wide">
          Historial de recibos
        </h2>
        {employee.receipts.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--muted)]">
              Todavía no hay recibos. Generá el primero con “Nuevo recibo”.
            </p>
          </Panel>
        ) : (
          <DataTable
            headers={[
              "Período",
              "Pago",
              "Bruto",
              "Neto",
              "Medio",
              "Estado",
              "Firma",
              "Envío",
              "",
            ]}
          >
            {employee.receipts.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--accent-soft)]/40">
                <td className="px-4 py-3 text-sm">
                  {formatDate(r.periodFrom)} → {formatDate(r.periodTo)}
                </td>
                <td className="px-4 py-3 text-sm">{formatDate(r.paidAt)}</td>
                <td className="px-4 py-3 text-sm">
                  {formatCurrency(r.sueldoBruto)}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {formatCurrency(r.amount)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {receiptMethodLabel(r.method)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {STATUS_LABEL[r.status] ?? r.status}
                </td>
                <td className="px-4 py-3 text-sm">
                  {r.signedAt ? formatDateTime(r.signedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted)]">
                  {[
                    r.emailSentAt ? "Mail" : null,
                    r.whatsappOpenedAt ? "WhatsApp" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/empleados/${employee.id}/recibos/${r.id}`}
                    className="text-sm font-semibold underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
