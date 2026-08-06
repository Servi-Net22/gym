export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "mercadopago", label: "Mercado Pago" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export function paymentMethodLabel(method: string) {
  return (
    PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method
  );
}

export function paymentStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "confirmed":
      return "Confirmado";
    case "cancelled":
      return "Cancelado";
    case "rejected":
      return "Rechazado";
    default:
      return status;
  }
}

export function paymentSourceLabel(source: string) {
  return source === "automatic" ? "Automático" : "Manual";
}

export function transferReference(clientDocumentId: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  return `GYM-${clientDocumentId}-${stamp}`;
}
