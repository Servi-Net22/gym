import { notFound } from "next/navigation";
import { updateClient } from "@/app/actions/clients";
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
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const orgId = session.organizationId;
  const [client, plans] = await Promise.all([
    prisma.client.findFirst({ where: { id, organizationId: orgId } }),
    prisma.plan.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!client) notFound();

  const action = updateClient.bind(null, client.id);
  const birth = client.birthDate
    ? client.birthDate.toISOString().slice(0, 10)
    : "";

  return (
    <div>
      <PageHeader
        title="Editar cliente"
        description={fullName(client.firstName, client.lastName)}
      />
      <Panel className="max-w-3xl">
        <form action={action} className="space-y-5">
          <FormGrid>
            <Field
              label="Nombre"
              name="firstName"
              required
              defaultValue={client.firstName}
            />
            <Field
              label="Apellido"
              name="lastName"
              required
              defaultValue={client.lastName}
            />
            <Field
              label="Documento / DNI"
              name="documentId"
              required
              defaultValue={client.documentId}
            />
            <Field
              label="Teléfono"
              name="phone"
              defaultValue={client.phone}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={client.email}
            />
            <Field
              label="Fecha de nacimiento"
              name="birthDate"
              type="date"
              defaultValue={birth}
            />
            <Field
              label="Dirección"
              name="address"
              defaultValue={client.address}
            />
            <Field
              label="Contacto de emergencia"
              name="emergencyContact"
              defaultValue={client.emergencyContact}
            />
            <SelectField
              label="Plan"
              name="planId"
              allowEmpty
              defaultValue={client.planId}
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.name} · ${p.durationDays} días`,
              }))}
            />
          </FormGrid>
          <TextArea label="Notas" name="notes" defaultValue={client.notes} />
          <CheckboxField
            label="Cliente activo"
            name="active"
            defaultChecked={client.active}
          />
          <SubmitButton>Guardar cambios</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
