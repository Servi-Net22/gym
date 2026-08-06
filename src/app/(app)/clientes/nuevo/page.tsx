import { createClient } from "@/app/actions/clients";
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
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Nuevo cliente"
        description="Se generan QR de ingreso y PIN para la app del cliente (/mi)."
      />
      <Panel className="max-w-3xl">
        <form action={createClient} className="space-y-5">
          <FormGrid>
            <Field label="Nombre" name="firstName" required />
            <Field label="Apellido" name="lastName" required />
            <Field label="Documento / DNI" name="documentId" required />
            <Field label="Teléfono" name="phone" />
            <Field label="Email" name="email" type="email" />
            <Field label="Fecha de nacimiento" name="birthDate" type="date" />
            <Field label="Dirección" name="address" />
            <Field label="Contacto de emergencia" name="emergencyContact" />
            <SelectField
              label="Plan"
              name="planId"
              allowEmpty
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.name} · ${p.durationDays} días`,
              }))}
            />
            <Field
              label="PIN portal (opcional)"
              name="portalPin"
              placeholder="Automático si lo dejás vacío"
            />
          </FormGrid>
          <TextArea label="Notas" name="notes" />
          <CheckboxField label="Cliente activo" name="active" />
          <p className="text-xs text-[var(--muted)]">
            El cliente entra a <code>/mi/login</code> con DNI + PIN, ve su QR y
            más adelante rutinas/dietas.
          </p>
          <div className="flex gap-3">
            <SubmitButton>Guardar cliente</SubmitButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
