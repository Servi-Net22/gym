import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { confirmPaymentRecord } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { formatCurrency, fullName } from "@/lib/utils";
import { PageHeader, Panel, SubmitButton } from "@/components/Ui";

export const dynamic = "force-dynamic";

async function simulateApprove(paymentId: string) {
  "use server";
  const session = await requireSession();
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId: session.organizationId },
  });
  if (!payment || payment.method !== "mercadopago") {
    redirect("/pagos");
  }
  await confirmPaymentRecord(paymentId, {
    externalId: `demo-${Date.now()}`,
    notes: "Simulación de pago aprobado (modo demo Mercado Pago)",
  });
  redirect(`/pagos/${paymentId}?mp=success`);
}

export default async function CheckoutDemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { client: true },
  });
  if (!payment || payment.method !== "mercadopago") notFound();

  if (payment.status === "confirmed") {
    redirect(`/pagos/${payment.id}?mp=success`);
  }

  const approve = simulateApprove.bind(null, payment.id);

  return (
    <div>
      <PageHeader
        title="Checkout demo Mercado Pago"
        description="Sin ACCESS_TOKEN configurado: simulá la acreditación automática."
      />
      <Panel className="max-w-lg space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Cliente:{" "}
          <strong className="text-[var(--ink)]">
            {fullName(payment.client.firstName, payment.client.lastName)}
          </strong>
        </p>
        <p className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          {formatCurrency(payment.amount)}
        </p>
        <p className="text-sm text-[var(--muted)]">
          En producción este paso es el checkout real de Mercado Pago. El
          webhook confirmará el pago y habilitará el QR.
        </p>
        <form action={approve}>
          <SubmitButton>Simular pago aprobado</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
