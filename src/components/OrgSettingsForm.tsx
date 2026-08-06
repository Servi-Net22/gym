"use client";

import { useActionState } from "react";
import {
  updateOrganizationAction,
  type OrgSettingsState,
} from "@/app/actions/organization";
import { Field, FormGrid, SubmitButton, TextArea } from "@/components/Ui";

const initial: OrgSettingsState = {};

export function OrgSettingsForm({
  org,
}: {
  org: {
    name: string;
    slug: string;
    address: string;
    cuit: string;
    lugarPago: string;
    fPagoAportes: string;
  };
}) {
  const [state, action, pending] = useActionState(
    updateOrganizationAction,
    initial,
  );

  return (
    <form action={action} className="space-y-5">
      <FormGrid>
        <Field label="Nombre del comercio" name="name" defaultValue={org.name} required />
        <Field
          label="Slug (código portal)"
          name="slug"
          defaultValue={org.slug}
          required
          placeholder="ej. gymflow"
        />
        <Field label="CUIT" name="cuit" defaultValue={org.cuit} />
        <Field
          label="Lugar de pago (recibo)"
          name="lugarPago"
          defaultValue={org.lugarPago}
        />
      </FormGrid>
      <TextArea
        label="Domicilio"
        name="address"
        defaultValue={org.address}
        rows={2}
      />
      <Field
        label="F. pago aportes (opcional)"
        name="fPagoAportes"
        defaultValue={org.fPagoAportes}
        placeholder="Vacío = fecha de pago del recibo"
      />
      {state.error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Datos guardados. Si cambiaste el slug, volvé a iniciar sesión para
          actualizar el menú.
        </p>
      ) : null}
      <SubmitButton disabled={pending}>
        {pending ? "Guardando…" : "Guardar configuración"}
      </SubmitButton>
    </form>
  );
}
