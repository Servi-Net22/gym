import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelPendingPayment,
  confirmPendingPayment,
} from "@/app/actions/payments";
import { VoidPaymentForm } from "@/components/VoidPaymentForm";
import {
  ButtonLink,
  PageHeader,
  Panel,
  SubmitButton,
} from "@/components/Ui";
import { getSession } from "@/lib/auth";
import {
  paymentMethodLabel,
  paymentSourceLabel,
  paymentStatusLabel,
} from "@/lib/payment-methods";
import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PagoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mp?: string }>;
}) {
  const { id } = await params;
  const { mp } = await searchParams;
  const session = await getSession();
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      client: { include: { plan: true } },
      registeredBy: { select: { id: true, name: true, email: true, role: true } },
      voidedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!payment) notFound();

  const pending = payment.status === "pending";
  const canVoid =
    session?.role === "ADMIN" &&
    (payment.status === "confirmed" || payment.status === "pending");

  return (
    <div>
      <PageHeader
        title={`Pago ${formatCurrency(payment.amount)}`}
        description={`${fullName(payment.client.firstName, payment.client.lastName)} · ${paymentMethodLabel(payment.method)}`}
        actions={
          <ButtonLink href="/pagos" variant="ghost">
            Volver a pagos
          </ButtonLink>
        }
      />

      {mp === "success" ? (
        <Notice tone="ok">
          Mercado Pago reportó el pago. Si sigue pendiente, esperá el webhook o
          confirmalo manualmente.
        </Notice>
      ) : null}
      {mp === "failure" ? (
        <Notice tone="bad">El pago en Mercado Pago falló o fue cancelado.</Notice>
      ) : null}
      {mp === "pending" ? (
        <Notice tone="neutral">
          Mercado Pago dejó el pago en revisión. Quedará pendiente hasta
          acreditarse.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Pill>{paymentStatusLabel(payment.status)}</Pill>
            <Pill>{paymentMethodLabel(payment.method)}</Pill>
            <Pill>{paymentSourceLabel(payment.source)}</Pill>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Item label="Cliente">
              <Link
                href={`/clientes/${payment.clientId}`}
                className="underline"
              >
                {fullName(payment.client.firstName, payment.client.lastName)}
              </Link>
            </Item>
            <Item label="Monto">{formatCurrency(payment.amount)}</Item>
            <Item label="Período">
              {formatDate(payment.periodFrom)} → {formatDate(payment.periodTo)}
            </Item>
            <Item label="Pagado">
              {payment.paidAt ? formatDateTime(payment.paidAt) : "—"}
            </Item>
            <Item label="Registrado por">
              {payment.registeredBy
                ? `${payment.registeredBy.name} (${payment.registeredBy.role === "ADMIN" ? "Admin" : "Empleado"})`
                : "—"}
            </Item>
            <Item label="Email usuario">
              {payment.registeredBy?.email || "—"}
            </Item>
            <Item label="Referencia">{payment.reference || "—"}</Item>
            <Item label="ID externo MP">{payment.externalId || "—"}</Item>
            <Item label="Creado">{formatDateTime(payment.createdAt)}</Item>
            <Item label="Plan">{payment.client.plan?.name || "—"}</Item>
          </dl>

          {payment.notes ? (
            <p className="rounded-lg bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)]">
              {payment.notes}
            </p>
          ) : null}

          {payment.status === "cancelled" && payment.voidReason ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-950">
              <p className="font-semibold">Pago anulado</p>
              <p className="mt-1">Motivo: {payment.voidReason}</p>
              <p className="mt-1 text-rose-900/80">
                Por {payment.voidedBy?.name ?? "—"}
                {payment.voidedAt
                  ? ` · ${formatDateTime(payment.voidedAt)}`
                  : ""}
              </p>
            </div>
          ) : null}

          {pending ? (
            <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
              <form action={confirmPendingPayment.bind(null, payment.id)}>
                <SubmitButton>Confirmar acreditación</SubmitButton>
              </form>
              <form action={cancelPendingPayment.bind(null, payment.id)}>
                <SubmitButton variant="ghost">Cancelar cobro</SubmitButton>
              </form>
            </div>
          ) : null}

          {payment.status === "confirmed" ? (
            <p className="text-sm text-emerald-800">
              Membresía habilitada hasta{" "}
              {formatDate(payment.client.membershipEndsAt)}.
            </p>
          ) : null}

          {canVoid ? (
            <div className="border-t border-[var(--line)] pt-4">
              <VoidPaymentForm paymentId={payment.id} />
            </div>
          ) : null}
        </Panel>

        <Panel className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
            Cobro
          </h2>

          {payment.method === "mercadopago" && payment.checkoutUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">
                Enviá este link al cliente o abrilo en caja para cobrar con
                Mercado Pago.
              </p>
              <a
                href={payment.checkoutUrl}
                className="inline-flex rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
              >
                Abrir checkout Mercado Pago
              </a>
              <p className="break-all text-xs text-[var(--muted)]">
                {payment.checkoutUrl}
              </p>
            </div>
          ) : null}

          {payment.method === "transferencia" ? (
            <div className="space-y-2 text-sm">
              <p className="text-[var(--muted)]">
                Pedile al cliente que transfiera e incluya esta referencia en el
                concepto:
              </p>
              <code className="block rounded-lg bg-[var(--panel)] px-3 py-2 font-mono text-sm text-[var(--ink)]">
                {payment.reference}
              </code>
              <p className="text-xs text-[var(--muted)]">
                Alias/CBU del gimnasio:{" "}
                {process.env.TRANSFER_ALIAS ||
                  "configurar TRANSFER_ALIAS en .env"}
              </p>
              {pending ? (
                <p className="text-xs text-[var(--muted)]">
                  Cuando el dinero figure en la cuenta, usá{" "}
                  <strong>Confirmar acreditación</strong>.
                </p>
              ) : null}
            </div>
          ) : null}

          {payment.method === "efectivo" ? (
            <p className="text-sm text-[var(--muted)]">
              Cobro en efectivo en mostrador.{" "}
              {payment.status === "confirmed"
                ? "Ya quedó registrado."
                : payment.status === "cancelled"
                  ? "Fue anulado."
                  : "Pendiente de confirmación."}
            </p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-[var(--panel)] px-2 py-1 text-xs font-semibold">
      {children}
    </span>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "bad" | "neutral";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
      : tone === "bad"
        ? "border-rose-300 bg-rose-50 text-rose-950"
        : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)]";
  return (
    <p className={`mb-4 rounded-lg border px-4 py-3 text-sm ${cls}`}>
      {children}
    </p>
  );
}
