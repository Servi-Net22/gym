"use client";

import {
  CheckboxField,
  Field,
  FormGrid,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/Ui";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import {
  registerManualPayment,
  startAutomaticCharge,
} from "@/app/actions/payments";
import { useState } from "react";

type ClientOption = {
  id: string;
  label: string;
  planPrice?: number | null;
  durationDays?: number | null;
};

export function PaymentForm({
  clients,
  selectedClientId,
  defaultFrom,
  defaultTo,
  defaultAmount,
}: {
  clients: ClientOption[];
  selectedClientId?: string;
  defaultFrom: string;
  defaultTo: string;
  defaultAmount?: number;
}) {
  const [mode, setMode] = useState<"manual" | "automatic">("manual");
  const [method, setMethod] = useState<string>("efectivo");

  const action =
    mode === "manual" ? registerManualPayment : startAutomaticCharge;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          active={mode === "manual"}
          title="Registrar pago"
          description="Ya cobraste en efectivo, transferencia o Mercado Pago. Confirma y extiende la membresía."
          onClick={() => setMode("manual")}
        />
        <ModeCard
          active={mode === "automatic"}
          title="Cobrar automáticamente"
          description="Genera link de Mercado Pago, referencia de transferencia o cobra efectivo en mostrador."
          onClick={() => setMode("automatic")}
        />
      </div>

      <form action={action} className="space-y-5">
        <input type="hidden" name="mode" value={mode} />
        <SelectField
          label="Cliente"
          name="clientId"
          required
          defaultValue={selectedClientId}
          options={clients.map((c) => ({ value: c.id, label: c.label }))}
        />
        <FormGrid>
          <Field
            label="Monto"
            name="amount"
            type="number"
            required
            min="0"
            step="100"
            defaultValue={defaultAmount}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">Método</span>
            <select
              name="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
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
        </FormGrid>
        <TextArea label="Notas" name="notes" />

        {mode === "manual" ? (
          <CheckboxField
            label="Extender membresía hasta la fecha de fin (habilita ingreso por QR)"
            name="extendMembership"
            defaultChecked
          />
        ) : (
          <p className="rounded-lg bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)]">
            {method === "mercadopago" &&
              "Se generará un link de pago. La membresía se habilita al acreditarse (webhook o simulación)."}
            {method === "transferencia" &&
              "Se genera una referencia. Cuando veas la transferencia, confirmala desde el detalle del pago."}
            {method === "efectivo" &&
              "Se registra el cobro en mostrador y se habilita la membresía de inmediato."}
          </p>
        )}

        <SubmitButton>
          {mode === "manual" ? "Registrar pago" : "Iniciar cobro"}
        </SubmitButton>
      </form>
    </div>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--line)] bg-white hover:bg-[var(--panel)]"
      }`}
    >
      <p className="font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
    </button>
  );
}
