import { notFound } from "next/navigation";
import { OrgEditForm } from "@/components/OrgEditForm";
import { PageHeader, Panel } from "@/components/Ui";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarOrganizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) notFound();

  const base = await getAppBaseUrl();
  const portalUrl = `${base}/mi/${org.slug}/login`;

  return (
    <div>
      <PageHeader
        title={`Editar: ${org.name}`}
        description="Datos del comercio. No se elimina desde aquí; usá activo/inactivo."
      />
      <Panel className="max-w-3xl space-y-6">
        <div className="rounded-md border border-[var(--line)] bg-[var(--accent-soft)]/40 px-4 py-3 text-sm">
          <p className="font-semibold text-[var(--ink)]">Portal clientes</p>
          <p className="mt-1 text-[var(--muted)]">
            <a href={portalUrl} className="font-medium underline">
              {portalUrl}
            </a>
          </p>
        </div>
        <OrgEditForm org={org} />
      </Panel>
    </div>
  );
}
