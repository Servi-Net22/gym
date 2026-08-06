"use client";

import { useActionState } from "react";
import {
  createOrganizationAction,
  type OrgFormState,
} from "@/app/actions/organizations";
import {
  CheckboxField,
  Field,
  FormGrid,
  SubmitButton,
  TextArea,
} from "@/components/Ui";

const initial: OrgFormState = {};

export function OrgCreateForm() {
  const [state, action, pending] = useActionState(
    createOrganizationAction,
    initial,
  );

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Comercio</h2>
        <FormGrid>
          <Field label="Nombre" name="name" required />
          <Field
            label="Slug (URL portal)"
            name="slug"
            required
            placeholder="ej. fitness-norte"
          />
          <Field label="CUIT" name="cuit" />
          <Field label="Lugar de pago (recibo)" name="lugarPago" />
          <Field
            label="F. pago aportes (opcional)"
            name="fPagoAportes"
            placeholder="Vacío = fecha de pago del recibo"
          />
        </FormGrid>
        <TextArea label="Domicilio" name="address" rows={2} />
        <CheckboxField label="Comercio activo" name="active" />
      </div>

      <div className="space-y-4 border-t border-[var(--line)] pt-5">
        <h2 className="text-lg font-semibold text-[var(--ink)]">
          Primer administrador
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Usuario ADMIN del nuevo comercio. Podrá gestionar solo su tenant.
        </p>
        <FormGrid>
          <Field label="Nombre" name="adminName" required />
          <Field
            label="Email de acceso"
            name="adminEmail"
            type="email"
            required
          />
          <Field
            label="Contraseña inicial"
            name="adminPassword"
            type="password"
            required
            placeholder="Mínimo 6 caracteres"
          />
        </FormGrid>
      </div>

      {state.error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {state.error}
        </p>
      ) : null}

      <SubmitButton disabled={pending}>
        {pending ? "Creando…" : "Crear comercio"}
      </SubmitButton>
    </form>
  );
}
