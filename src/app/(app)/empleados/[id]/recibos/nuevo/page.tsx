import { notFound } from "next/navigation";
import { createEmployeeReceipt } from "@/app/actions/employee-receipts";
import { ReceiptCreateForm } from "@/components/ReceiptCreateForm";
import { ButtonLink, PageHeader, Panel } from "@/components/Ui";
import { requireAdmin } from "@/lib/auth";
import { employeeDisplayName } from "@/lib/employee-receipts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function monthBounds(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to), today: iso(d) };
}

export default async function NuevoReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!employee) notFound();

  const { from, to, today } = monthBounds();
  const action = createEmployeeReceipt.bind(null, employee.id);

  return (
    <div>
      <PageHeader
        title="Nuevo recibo de sueldo"
        description={`${employeeDisplayName(employee)} · Ingresá el bruto; el neto se calcula con los aportes del trabajador.`}
        actions={
          <ButtonLink href={`/empleados/${employee.id}`} variant="ghost">
            Volver a la ficha
          </ButtonLink>
        }
      />
      <Panel className="max-w-2xl">
        <ReceiptCreateForm
          action={action}
          defaultBruto={employee.salary}
          defaultFrom={from}
          defaultTo={to}
          defaultPaidAt={today}
        />
      </Panel>
    </div>
  );
}
