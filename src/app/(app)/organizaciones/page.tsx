import Link from "next/link";
import { enterOrganizationAsSuperAdmin } from "@/app/actions/organizations";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  SubmitButton,
} from "@/components/Ui";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrganizacionesPage() {
  const session = await requireSuperAdmin();
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
        description="Organizaciones (tenants) de la plataforma. Cada una tiene su staff, clientes y portal /mi/{slug}. Usá «Entrar como este comercio» para operar su panel sin perder el rol SUPERADMIN."
        actions={
          <ButtonLink href="/organizaciones/nuevo">Nuevo comercio</ButtonLink>
        }
      />

      <p className="mb-4 text-sm text-[var(--muted)]">
        Comercio activo en sesión:{" "}
        <strong className="text-[var(--ink)]">
          {session.organizationName}
        </strong>{" "}
        (/{session.organizationSlug})
      </p>

      <DataTable
        headers={["Nombre", "Slug", "CUIT", "Usuarios", "Clientes", "Estado", ""]}
      >
        {orgs.map((org) => {
          const isCurrent = org.id === session.organizationId;
          return (
            <tr key={org.id} className="hover:bg-[var(--accent-soft)]/40">
              <td className="px-4 py-3 font-medium">
                {org.name}
                {isCurrent ? (
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                    (sesión)
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                {org.slug}
              </td>
              <td className="px-4 py-3">{org.cuit || "—"}</td>
              <td className="px-4 py-3">{org._count.users}</td>
              <td className="px-4 py-3">{org._count.clients}</td>
              <td className="px-4 py-3">
                <StatusBadge active={org.active} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/organizaciones/${org.id}/editar`}
                    className="text-sm font-semibold underline"
                  >
                    Editar
                  </Link>
                  {org.active && !isCurrent ? (
                    <form
                      action={enterOrganizationAsSuperAdmin.bind(null, org.id)}
                    >
                      <SubmitButton variant="ghost">
                        Entrar como este comercio
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
