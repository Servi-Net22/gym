import { notFound } from "next/navigation";
import { updateEmployee } from "@/app/actions/employees";
import {
  ButtonLink,
  CheckboxField,
  Field,
  FormGrid,
  PageHeader,
  Panel,
  SubmitButton,
  TextArea,
} from "@/components/Ui";
import { prisma } from "@/lib/prisma";
import { formatCurrency, fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { email: true, active: true } } },
  });
  if (!employee) notFound();

  const action = updateEmployee.bind(null, employee.id);
  const hire = employee.hireDate.toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Editar ficha de empleado"
        description={fullName(employee.firstName, employee.lastName)}
        actions={
          <ButtonLink href="/empleados" variant="ghost">
            Volver al listado
          </ButtonLink>
        }
      />
      <Panel className="max-w-3xl">
        <form action={action} className="space-y-5">
          <FormGrid>
            <Field
              label="Nombre"
              name="firstName"
              required
              defaultValue={employee.firstName}
            />
            <Field
              label="Apellido"
              name="lastName"
              required
              defaultValue={employee.lastName}
            />
            <Field
              label="Documento / DNI"
              name="documentId"
              required
              defaultValue={employee.documentId}
            />
            <Field
              label="Cargo / rol"
              name="role"
              required
              defaultValue={employee.role}
            />
            <Field
              label="Teléfono"
              name="phone"
              defaultValue={employee.phone}
            />
            <Field
              label="Email de contacto / acceso"
              name="email"
              type="email"
              required
              defaultValue={employee.email}
            />
            <Field
              label="Sueldo bruto de referencia"
              name="salary"
              type="number"
              step="1000"
              min="0"
              defaultValue={employee.salary ?? undefined}
            />
            <Field
              label="Fecha de ingreso"
              name="hireDate"
              type="date"
              defaultValue={hire}
            />
            <Field
              label="CUIL"
              name="cuil"
              placeholder="20-12345678-9"
              defaultValue={employee.cuil ?? undefined}
            />
            <Field
              label="Nº legajo"
              name="legajo"
              defaultValue={employee.legajo ?? undefined}
            />
            <Field
              label="Categoría laboral"
              name="categoriaLaboral"
              placeholder="Si vacío, se usa el cargo"
              defaultValue={employee.categoriaLaboral ?? undefined}
            />
            <Field
              label="Dirección"
              name="address"
              defaultValue={employee.address}
            />
            <Field
              label="Nueva contraseña (opcional)"
              name="loginPassword"
              type="password"
              placeholder="Dejar vacío para no cambiar"
            />
          </FormGrid>
          <TextArea
            label="Notas"
            name="notes"
            defaultValue={employee.notes}
          />
          <CheckboxField
            label="Empleado activo"
            name="active"
            defaultChecked={employee.active}
          />
          <div className="rounded-lg bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)]">
            <p>
              Usuario de acceso:{" "}
              <strong className="text-[var(--ink)]">
                {employee.user?.email ?? "Sin usuario vinculado"}
              </strong>
            </p>
            {employee.salary != null ? (
              <p>Sueldo actual: {formatCurrency(employee.salary)}</p>
            ) : null}
          </div>
          <SubmitButton>Guardar cambios</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
