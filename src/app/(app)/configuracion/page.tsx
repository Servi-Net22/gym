import { OrgSettingsForm } from "@/components/OrgSettingsForm";
import { PageHeader, Panel } from "@/components/Ui";
import { requireAdmin } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { tenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await requireAdmin();
  // Solo la org de la sesión (ADMIN no puede editar otro comercio).
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: tenantId(session) },
  });
  const base = await getAppBaseUrl();
  const portalUrl = `${base}/mi/${org.slug}/login`;

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Datos del comercio para recibos y portal de clientes."
      />
      <Panel className="max-w-3xl space-y-6">
        <div className="rounded-md border border-[var(--line)] bg-[var(--accent-soft)]/40 px-4 py-3 text-sm">
          <p className="font-semibold text-[var(--ink)]">Portal clientes</p>
          <p className="mt-1 text-[var(--muted)]">
            Compartí este link con tus socios:{" "}
            <a href={portalUrl} className="font-medium underline">
              {portalUrl}
            </a>
          </p>
        </div>
        <OrgSettingsForm org={org} />
      </Panel>
    </div>
  );
}
