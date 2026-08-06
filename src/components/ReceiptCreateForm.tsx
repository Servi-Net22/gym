"use client";

import { useMemo, useState } from "react";
import { Field, FormGrid, SubmitButton, TextArea } from "@/components/Ui";
import { buildPayrollFromBruto } from "@/lib/payroll-receipt";
import { formatCurrency } from "@/lib/utils";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultBruto?: number | null;
  defaultFrom: string;
  defaultTo: string;
  defaultPaidAt: string;
};

export function ReceiptCreateForm({
  action,
  defaultBruto,
  defaultFrom,
  defaultTo,
  defaultPaidAt,
}: Props) {
  const [bruto, setBruto] = useState(
    defaultBruto != null && defaultBruto > 0 ? String(defaultBruto) : "",
  );

  const preview = useMemo(() => {
    const n = Number(bruto);
    if (!Number.isFinite(n) || n <= 0) return null;
    return buildPayrollFromBruto(n);
  }, [bruto]);

  return (
    <form action={action} className="space-y-5">
      <FormGrid>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Sueldo bruto</span>
          <input
            name="sueldoBruto"
            type="number"
            required
            min={1}
            step={1}
            value={bruto}
            onChange={(e) => setBruto(e.target.value)}
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Quincena / período</span>
          <select
            name="quincena"
            defaultValue="mensual"
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
          >
            <option value="mensual">Mensual</option>
            <option value="1">1ª quincena</option>
            <option value="2">2ª quincena</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Medio de pago</span>
          <select
            name="method"
            defaultValue="transferencia"
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
          >
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </label>
        <Field
          label="Período desde"
          name="periodFrom"
          type="date"
          required
          defaultValue={defaultFrom}
        />
        <Field
          label="Período hasta"
          name="periodTo"
          type="date"
          required
          defaultValue={defaultTo}
        />
        <Field
          label="Fecha de pago"
          name="paidAt"
          type="date"
          required
          defaultValue={defaultPaidAt}
        />
      </FormGrid>

      {preview ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm">
          <p className="font-semibold">Vista previa de liquidación</p>
          <p className="mt-1 text-[var(--muted)]">
            Neto estimado = bruto − descuentos del trabajador (Jub. 11% + Ley
            19.032 3% + Obra Social 3%, salvo overrides por env).
          </p>
          <dl className="mt-3 grid gap-1 sm:grid-cols-2">
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-[var(--muted)]">Sueldo bruto</dt>
              <dd className="font-medium">
                {formatCurrency(preview.sueldoBruto)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-[var(--muted)]">Descuentos trabajador</dt>
              <dd className="font-medium">
                {formatCurrency(preview.composition.descuentos)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-[var(--muted)]">Sueldo neto</dt>
              <dd className="text-base font-semibold">
                {formatCurrency(preview.sueldoNeto)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-[var(--muted)]">Contrib. empleador</dt>
              <dd className="font-medium">
                {formatCurrency(preview.subtotalContribuciones)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:col-span-2 sm:block">
              <dt className="text-[var(--muted)]">Costo total empleador</dt>
              <dd className="font-medium">
                {formatCurrency(preview.costoTotalEmpleador)}
              </dd>
            </div>
          </dl>
          <ul className="mt-3 space-y-0.5 text-xs text-[var(--muted)]">
            {preview.employeeLines
              .filter((l) => l.kind === "descuento")
              .map((l) => (
                <li key={l.concepto}>
                  {l.concepto} ({l.unidad}): {formatCurrency(l.monto)}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <TextArea label="Notas (opcional)" name="notes" rows={3} />
      <p className="text-xs text-[var(--muted)]">
        Recibo operativo al estilo del anexo. No es asesoramiento legal ni
        contable; los porcentajes son configurables.
      </p>
      <SubmitButton>Crear recibo y continuar a firma</SubmitButton>
    </form>
  );
}
