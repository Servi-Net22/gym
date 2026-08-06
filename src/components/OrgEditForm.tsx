"use client";

import { useActionState } from "react";
import {
  updateOrganizationByIdAction,
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

export function OrgEditForm({
  org,
}: {
  org: {
    id: string;
    name: string;
    slug: string;
    address: string;
    cuit: string;
    lugarPago: string;
    fPagoAportes: string;
    active: boolean;
  };
}) {
  const bound = updateOrganizationByIdAction.bind(null, org.id);
  const [state, action, pending] = useActionState(bound, initial);

  return (
    <form action={action} className="space-y-5">
      <FormGrid>
        <Field
          label="Nombre del comercio"
          name="name"
          defaultValue={org.name}
          required
        />
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
        <Field
          label="F. pago aportes (opcional)"
          name="fPagoAportes"
          defaultValue={org.fPagoAportes}
          placeholder="Vacío = fecha de pago del recibo"
        />
      </FormGrid>
      <TextArea
        label="Domicilio"
        name="address"
        defaultValue={org.address}
        rows={2}
      />
      <CheckboxField
        label="Comercio activo"
        name="active"
        defaultChecked={org.active}
      />
      <p className="text-xs text-[var(--muted)]">
        Desactivar un comercio impide el login de su staff y deja el portal
        inaccesible. No hay borrado desde esta pantalla.
      </p>
      {state.error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Comercio actualizado.
        </p>
      ) : null}
      <SubmitButton disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </SubmitButton>
    </form>
  );
}
