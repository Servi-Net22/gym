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
import { requireAdmin } from "@/lib/auth";
import {
  CONTENT_DAYS_PER_WEEK,
  CONTENT_GENDER_LABELS,
  CLIENT_GENDERS,
  CONTENT_LEVEL_LABELS,
  CONTENT_LEVELS,
} from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  const session = await requireAdmin();
  const plans = await prisma.plan.findMany({
    where: { organizationId: session.organizationId, active: true },
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
            <SelectField
              label="Nivel"
              name="trainingLevel"
              allowEmpty
              emptyLabel="Sin asignar"
              options={CONTENT_LEVELS.map((v) => ({
                value: v,
                label: CONTENT_LEVEL_LABELS[v],
              }))}
            />
            <SelectField
              label="Días por semana"
              name="daysPerWeek"
              allowEmpty
              emptyLabel="Sin asignar"
              options={CONTENT_DAYS_PER_WEEK.map((n) => ({
                value: String(n),
                label: `${n} días`,
              }))}
            />
            <SelectField
              label="Sexo"
              name="gender"
              allowEmpty
              emptyLabel="Sin asignar"
              options={CLIENT_GENDERS.map((v) => ({
                value: v,
                label: CONTENT_GENDER_LABELS[v],
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
            El cliente entra a{" "}
            <code>/mi/{session.organizationSlug}/login</code> con DNI + PIN, ve
            su QR y más adelante rutinas/dietas.
          </p>
          <div className="flex gap-3">
            <SubmitButton>Guardar cliente</SubmitButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
