import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ButtonLink,
  DataTable,
  PageHeader,
} from "@/components/Ui";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrganizacionesPage() {
  await requireSuperAdmin();
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, clients: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Comercios"
        description="Organizaciones (tenants) de la plataforma. Cada una tiene su staff, clientes y portal /mi/{slug}."
        actions={
          <ButtonLink href="/organizaciones/nuevo">Nuevo comercio</ButtonLink>
        }
      />

      <DataTable
        headers={["Nombre", "Slug", "CUIT", "Usuarios", "Clientes", "Estado", ""]}
      >
        {orgs.map((org) => (
          <tr key={org.id} className="hover:bg-[var(--accent-soft)]/40">
            <td className="px-4 py-3 font-medium">{org.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
              {org.slug}
            </td>
            <td className="px-4 py-3">{org.cuit || "—"}</td>
            <td className="px-4 py-3">{org._count.users}</td>
            <td className="px-4 py-3">{org._count.clients}</td>
            <td className="px-4 py-3">
              <StatusBadge active={org.active} />
            </td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/organizaciones/${org.id}/editar`}
                className="text-sm font-semibold underline"
              >
                Editar
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
