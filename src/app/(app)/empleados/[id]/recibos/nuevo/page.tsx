import { notFound } from "next/navigation";
import { createEmployeeReceipt } from "@/app/actions/employee-receipts";
import {
  ButtonLink,
  Field,
  FormGrid,
  PageHeader,
  Panel,
  SubmitButton,
  TextArea,
} from "@/components/Ui";
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
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  const { from, to, today } = monthBounds();
  const action = createEmployeeReceipt.bind(null, employee.id);

  return (
    <div>
      <PageHeader
        title="Nuevo recibo de sueldo"
        description={employeeDisplayName(employee)}
        actions={
          <ButtonLink href={`/empleados/${employee.id}`} variant="ghost">
            Volver a la ficha
          </ButtonLink>
        }
      />
      <Panel className="max-w-2xl">
        <form action={action} className="space-y-5">
          <FormGrid>
            <Field
              label="Monto"
              name="amount"
              type="number"
              required
              defaultValue={employee.salary ?? undefined}
              min="1"
              step="1"
            />
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
              defaultValue={from}
            />
            <Field
              label="Período hasta"
              name="periodTo"
              type="date"
              required
              defaultValue={to}
            />
            <Field
              label="Fecha de pago"
              name="paidAt"
              type="date"
              required
              defaultValue={today}
            />
          </FormGrid>
          <TextArea label="Notas (opcional)" name="notes" rows={3} />
          <SubmitButton>Crear recibo y continuar a firma</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
