import { PaymentForm } from "@/components/PaymentForm";
import { PageHeader, Panel } from "@/components/Ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await requireAdmin();
  const { clientId } = await searchParams;
  const clients = await prisma.client.findMany({
    where: { organizationId: session.organizationId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { plan: true },
  });

  const selected = clients.find((c) => c.id === clientId) ?? clients[0];
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + (selected?.plan?.durationDays ?? 30));
  const to = toDate.toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Nuevo cobro"
        description="Registrá un pago recibido o iniciá un cobro automático (efectivo, transferencia o Mercado Pago)."
      />
      <Panel className="max-w-3xl">
        {clients.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Primero cargá un cliente para poder registrar pagos.
          </p>
        ) : (
          <PaymentForm
            selectedClientId={selected?.id}
            defaultFrom={from}
            defaultTo={to}
            defaultAmount={selected?.plan?.price}
            clients={clients.map((c) => ({
              id: c.id,
              label: `${fullName(c.firstName, c.lastName)} · ${c.plan?.name ?? "Sin plan"}`,
              planPrice: c.plan?.price,
              durationDays: c.plan?.durationDays,
            }))}
          />
        )}
      </Panel>
    </div>
  );
}
