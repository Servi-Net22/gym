import { OrgCreateForm } from "@/components/OrgCreateForm";
import { PageHeader, Panel } from "@/components/Ui";
import { requireSuperAdmin } from "@/lib/auth";

export default async function NuevoOrganizacionPage() {
  await requireSuperAdmin();

  return (
    <div>
      <PageHeader
        title="Nuevo comercio"
        description="Creá la organización y su primer usuario administrador."
      />
      <Panel className="max-w-3xl">
        <OrgCreateForm />
      </Panel>
    </div>
  );
}
