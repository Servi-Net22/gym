"use client";

import { voidPayment } from "@/app/actions/payments";
import { useState } from "react";

export function VoidPaymentForm({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
      >
        Anular pago
      </button>
    );
  }

  return (
    <form
      action={voidPayment}
      className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/80 p-4"
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <p className="text-sm font-semibold text-rose-950">Anular este pago</p>
      <p className="text-xs text-rose-900/80">
        Quedará registrado quién lo anuló y el motivo. La membresía se
        recalculará según los pagos confirmados restantes.
      </p>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-rose-950">Motivo</span>
        <textarea
          name="voidReason"
          required
          minLength={3}
          rows={3}
          placeholder="Ej: cobro duplicado, error de monto…"
          className="w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm outline-none ring-rose-400 focus:ring-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        >
          Confirmar anulación
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
