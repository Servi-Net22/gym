import { createContent } from "@/app/actions/contents";
import {
  CheckboxField,
  Field,
  FormGrid,
  PageHeader,
  Panel,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/Ui";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoContenidoPage() {
  const session = await requireSession();
  const clients = await prisma.client.findMany({
    where: { organizationId: session.organizationId, active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Publicar contenido"
        description="Lo verán en la app del cliente (PWA). Podés enviarlo a todos o a uno solo."
      />
      <Panel className="max-w-2xl">
        <form action={createContent} className="space-y-5">
          <FormGrid>
            <SelectField
              label="Tipo"
              name="type"
              defaultValue="info"
              options={[
                { value: "aviso", label: "Aviso" },
                { value: "info", label: "Info" },
                { value: "rutina", label: "Rutina" },
                { value: "dieta", label: "Dieta" },
              ]}
            />
            <SelectField
              label="Destino"
              name="clientId"
              allowEmpty
              emptyLabel="Todos los clientes"
              options={clients.map((c) => ({
                value: c.id,
                label: fullName(c.firstName, c.lastName),
              }))}
            />
          </FormGrid>
          <p className="text-xs text-[var(--muted)]">
            Si elegís “Todos los clientes”, se publica para todo el portal.
          </p>
          <Field label="Título" name="title" required />
          <TextArea label="Contenido" name="body" rows={8} />
          <CheckboxField label="Publicado" name="published" />
          <SubmitButton>Publicar</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
