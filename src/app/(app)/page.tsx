import Link from "next/link";
import { PageHeader, Panel } from "@/components/Ui";
import { AccessBadge, StatusBadge } from "@/components/StatusBadge";
import { canManagePayments, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import {
  formatCurrency,
  formatDateTime,
  fullName,
  isMembershipCurrent,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireSession();
  const canPay = canManagePayments(session);
  const scope = tenantWhere(session);

  const [clients, employees, plans, payments, recentAccess, overdue] =
    await Promise.all([
      prisma.client.count({ where: { ...scope, active: true } }),
      prisma.employee.count({ where: { ...scope, active: true } }),
      prisma.plan.count({ where: { ...scope, active: true } }),
      canPay
        ? prisma.payment.aggregate({
            where: scope,
            _sum: { amount: true },
            _count: true,
          })
        : Promise.resolve({ _sum: { amount: 0 }, _count: 0 }),
      prisma.accessLog.findMany({
        where: scope,
        take: 8,
        orderBy: { scannedAt: "desc" },
        include: { client: true },
      }),
      prisma.client.findMany({
        where: {
          ...scope,
          active: true,
          OR: [
            { membershipEndsAt: null },
            { membershipEndsAt: { lt: new Date() } },
          ],
        },
        take: 6,
        orderBy: { membershipEndsAt: "asc" },
        include: { plan: true },
      }),
    ]);

  const currentClients = await prisma.client.count({
    where: {
      ...scope,
      active: true,
      membershipEndsAt: { gte: new Date() },
    },
  });

  return (
    <div>
      <PageHeader
        title="Panel"
        description="Resumen de cuentas, personal y control de ingreso del gimnasio."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Clientes activos" value={String(clients)} />
        <Stat label="Cuentas al día" value={String(currentClients)} />
        <Stat label="Empleados" value={String(employees)} />
        {canPay ? (
          <Stat
            label="Ingresos registrados"
            value={formatCurrency(payments._sum.amount ?? 0)}
            hint={`${payments._count} pagos · ${plans} planes`}
          />
        ) : (
          <Stat label="Planes activos" value={String(plans)} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
              Últimos accesos
            </h2>
            <Link href="/acceso" className="text-sm font-medium underline">
              Ir a barrera
            </Link>
          </div>
          <ul className="space-y-3">
            {recentAccess.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">
                Aún no hay lecturas de QR.
              </li>
            ) : (
              recentAccess.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {log.client
                        ? fullName(log.client.firstName, log.client.lastName)
                        : "QR desconocido"}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{log.reason}</p>
                  </div>
                  <div className="text-right">
                    <AccessBadge granted={log.granted} />
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDateTime(log.scannedAt)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
              Cuentas vencidas
            </h2>
            {canPay ? (
              <Link
                href="/pagos/nuevo"
                className="text-sm font-medium underline"
              >
                Registrar pago
              </Link>
            ) : (
              <Link href="/clientes" className="text-sm font-medium underline">
                Ver clientes
              </Link>
            )}
          </div>
          <ul className="space-y-3">
            {overdue.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">
                Todos los clientes activos están al día.
              </li>
            ) : (
              overdue.map((client) => (
                <li
                  key={client.id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0"
                >
                  <div>
                    <Link
                      href={`/clientes/${client.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {fullName(client.firstName, client.lastName)}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      {client.plan?.name ?? "Sin plan"} ·{" "}
                      {isMembershipCurrent(client.membershipEndsAt)
                        ? "Al día"
                        : "Sin acceso"}
                    </p>
                  </div>
                  <StatusBadge endsAt={client.membershipEndsAt} />
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white/80 p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
