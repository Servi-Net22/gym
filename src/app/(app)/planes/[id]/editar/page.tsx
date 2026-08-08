import { notFound } from "next/navigation";
import { updatePlan } from "@/app/actions/plans";
import {
  CheckboxField,
  Field,
  FormGrid,
  PageHeader,
  Panel,
  SubmitButton,
  TextArea,
} from "@/components/Ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const plan = await prisma.plan.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!plan) notFound();

  const action = updatePlan.bind(null, plan.id);

  return (
    <div>
      <PageHeader title="Editar plan" description={plan.name} />
      <Panel className="max-w-2xl">
        <form action={action} className="space-y-5">
          <FormGrid>
            <Field
              label="Nombre"
              name="name"
              required
              defaultValue={plan.name}
            />
            <Field
              label="Precio"
              name="price"
              type="number"
              required
              min="0"
              step="100"
              defaultValue={plan.price}
            />
            <Field
              label="Duración (días)"
              name="durationDays"
              type="number"
              required
              min="1"
              defaultValue={plan.durationDays}
            />
          </FormGrid>
          <TextArea
            label="Descripción"
            name="description"
            defaultValue={plan.description}
          />
          <CheckboxField
            label="Plan activo"
            name="active"
            defaultChecked={plan.active}
          />
          <SubmitButton>Guardar cambios</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
