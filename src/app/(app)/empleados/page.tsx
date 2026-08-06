import Link from "next/link";
import { toggleEmployee } from "@/app/actions/employees";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  SubmitButton,
} from "@/components/Ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isProtectedSuperadminEmail } from "@/lib/superadmin";
import { tenantWhere } from "@/lib/tenant";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmpleadosPage() {
  const session = await requireAdmin();
  const employees = await prisma.employee.findMany({
    where: tenantWhere(session),
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { user: { select: { email: true, active: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Empleados"
        description="Alta y edición de fichas del personal, sueldos y usuarios de acceso."
        actions={
          <ButtonLink href="/empleados/nuevo">Nuevo empleado</ButtonLink>
        }
      />

      <DataTable
        headers={[
          "Empleado",
          "Documento",
          "Cargo",
          "Sueldo",
          "Usuario",
          "Ingreso",
          "Estado",
          "",
        ]}
      >
        {employees.map((employee) => {
          const protectedUser = isProtectedSuperadminEmail(
            employee.user?.email ?? employee.email,
          );
          return (
          <tr key={employee.id} className="hover:bg-[var(--accent-soft)]/40">
            <td className="px-4 py-3 font-medium">
              {fullName(employee.firstName, employee.lastName)}
            </td>
            <td className="px-4 py-3">{employee.documentId}</td>
            <td className="px-4 py-3">{employee.role}</td>
            <td className="px-4 py-3">
              {employee.salary != null
                ? formatCurrency(employee.salary)
                : "—"}
            </td>
            <td className="px-4 py-3 text-[var(--muted)]">
              {employee.user?.email ?? employee.email ?? "Sin usuario"}
              {protectedUser ? (
                <span className="mt-0.5 block text-xs text-[var(--ink)]">
                  Sysadmin protegido
                </span>
              ) : null}
            </td>
            <td className="px-4 py-3">{formatDate(employee.hireDate)}</td>
            <td className="px-4 py-3">
              <StatusBadge active={employee.active} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-3">
                <Link
                  href={`/empleados/${employee.id}`}
                  className="text-sm font-semibold underline"
                >
                  Ficha / recibos
                </Link>
                <Link
                  href={`/empleados/${employee.id}/editar`}
                  className="text-sm font-semibold underline"
                >
                  Editar
                </Link>
                {protectedUser ? (
                  <span className="text-xs text-[var(--muted)]">Sin baja</span>
                ) : (
                  <form action={toggleEmployee.bind(null, employee.id)}>
                    <SubmitButton variant="ghost">
                      {employee.active ? "Baja" : "Alta"}
                    </SubmitButton>
                  </form>
                )}
              </div>
            </td>
          </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
