import Link from "next/link";
import { togglePlan } from "@/app/actions/plans";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  SubmitButton,
} from "@/components/Ui";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const session = await requireSession();
  const plans = await prisma.plan.findMany({
    where: tenantWhere(session),
    orderBy: { price: "asc" },
    include: { _count: { select: { clients: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Planes"
        description="Planes de membresía con precio y duración."
        actions={<ButtonLink href="/planes/nuevo">Nuevo plan</ButtonLink>}
      />

      <DataTable
        headers={[
          "Plan",
          "Precio",
          "Duración",
          "Clientes",
          "Estado",
          "",
        ]}
      >
        {plans.map((plan) => (
          <tr key={plan.id}>
            <td className="px-4 py-3">
              <p className="font-medium">{plan.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {plan.description || "Sin descripción"}
              </p>
            </td>
            <td className="px-4 py-3">{formatCurrency(plan.price)}</td>
            <td className="px-4 py-3">{plan.durationDays} días</td>
            <td className="px-4 py-3">{plan._count.clients}</td>
            <td className="px-4 py-3">
              <StatusBadge active={plan.active} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-3">
                <Link
                  href={`/planes/${plan.id}/editar`}
                  className="text-sm font-semibold underline"
                >
                  Editar
                </Link>
                <form action={togglePlan.bind(null, plan.id)}>
                  <SubmitButton variant="ghost">
                    {plan.active ? "Desactivar" : "Activar"}
                  </SubmitButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
