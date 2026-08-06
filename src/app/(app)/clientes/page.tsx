import Link from "next/link";
import { PageHeader, ButtonLink, DataTable } from "@/components/Ui";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const session = await requireSession();
  const clients = await prisma.client.findMany({
    where: tenantWhere(session),
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { plan: true },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Alta, datos personales, plan y estado de cuenta."
        actions={<ButtonLink href="/clientes/nuevo">Nuevo cliente</ButtonLink>}
      />

      <DataTable
        headers={[
          "Cliente",
          "Documento",
          "Plan",
          "Vence",
          "Estado",
          "Contacto",
          "",
        ]}
      >
        {clients.map((client) => (
          <tr key={client.id} className="hover:bg-[var(--accent-soft)]/40">
            <td className="px-4 py-3 font-medium">
              {fullName(client.firstName, client.lastName)}
            </td>
            <td className="px-4 py-3">{client.documentId}</td>
            <td className="px-4 py-3">{client.plan?.name ?? "—"}</td>
            <td className="px-4 py-3">
              {formatDate(client.membershipEndsAt)}
            </td>
            <td className="px-4 py-3">
              {client.active ? (
                <StatusBadge endsAt={client.membershipEndsAt} />
              ) : (
                <StatusBadge active={false} />
              )}
            </td>
            <td className="px-4 py-3 text-[var(--muted)]">
              {client.phone || client.email || "—"}
            </td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/clientes/${client.id}`}
                className="text-sm font-semibold underline"
              >
                Ver / QR
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
