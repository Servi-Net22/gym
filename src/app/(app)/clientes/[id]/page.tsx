import Link from "next/link";
import { notFound } from "next/navigation";
import {
  regenerateClientQr,
  resetClientPortalPin,
  toggleClient,
} from "@/app/actions/clients";
import { QrCard } from "@/components/QrCard";
import { AccessBadge, StatusBadge } from "@/components/StatusBadge";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  Panel,
  SubmitButton,
} from "@/components/Ui";
import { isAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pin?: string }>;
}) {
  const session = await requireSession();
  const canManage = isAdmin(session);
  const { id } = await params;
  const { pin } = await searchParams;
  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      plan: true,
      payments: canManage
        ? { orderBy: { paidAt: "desc" }, take: 10 }
        : false,
      accessLogs: { orderBy: { scannedAt: "desc" }, take: 10 },
    },
  });

  if (!client) notFound();

  return (
    <div>
      <PageHeader
        title={fullName(client.firstName, client.lastName)}
        description={`DNI ${client.documentId} · ${client.plan?.name ?? "Sin plan"}`}
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/clientes/${client.id}/editar`} variant="ghost">
                Editar datos
              </ButtonLink>
              <ButtonLink href={`/pagos/nuevo?clientId=${client.id}`}>
                Cobrar / registrar pago
              </ButtonLink>
            </div>
          ) : undefined
        }
      />

      {canManage && pin ? (
        <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          PIN del portal (mostralo una vez al cliente):{" "}
          <strong className="font-mono text-lg">{pin}</strong> · App:{" "}
          <Link
            href={`/mi/${session.organizationSlug}/login`}
            className="underline"
          >
            /mi/{session.organizationSlug}/login
          </Link>
        </div>
      ) : null}

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {client.active ? (
              <StatusBadge endsAt={client.membershipEndsAt} />
            ) : (
              <StatusBadge active={false} />
            )}
            <span className="text-sm text-[var(--muted)]">
              Membresía hasta {formatDate(client.membershipEndsAt)}
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Item label="Email" value={client.email} />
            <Item label="Teléfono" value={client.phone} />
            <Item
              label="Nacimiento"
              value={formatDate(client.birthDate)}
            />
            <Item label="Dirección" value={client.address} />
            <Item
              label="Emergencia"
              value={client.emergencyContact}
            />
            <Item label="Notas" value={client.notes} />
            {canManage ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  PIN portal
                </dt>
                <dd className="text-sm">
                  {client.portalPin ? (
                    <>
                      <span className="font-mono text-lg font-semibold tracking-widest">
                        {client.portalPin}
                      </span>
                      <span className="ml-2 text-[var(--muted)]">
                        (DNI + PIN)
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--muted)]">
                      Sin PIN — usá «Nuevo PIN portal»
                    </span>
                  )}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-wrap gap-2 pt-2">
            {canManage ? (
              <>
                <form action={toggleClient.bind(null, client.id)}>
                  <SubmitButton variant="ghost">
                    {client.active ? "Desactivar" : "Activar"}
                  </SubmitButton>
                </form>
                <form action={regenerateClientQr.bind(null, client.id)}>
                  <SubmitButton variant="ghost">Regenerar QR</SubmitButton>
                </form>
                <form action={resetClientPortalPin.bind(null, client.id)}>
                  <SubmitButton variant="ghost">Nuevo PIN portal</SubmitButton>
                </form>
              </>
            ) : null}
            <Link href="/acceso" className="self-center text-sm underline">
              Probar en barrera
            </Link>
            {canManage ? (
              <Link
                href={`/mi/${session.organizationSlug}/login`}
                className="self-center text-sm underline"
              >
                Ver app cliente
              </Link>
            ) : null}
          </div>
        </Panel>

        <QrCard
          token={client.qrToken}
          title="Credencial QR"
        />
      </div>

      <div className={`grid gap-6 ${canManage ? "lg:grid-cols-2" : ""}`}>
        {canManage ? (
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl tracking-wide">
              Pagos
            </h2>
            <DataTable headers={["Fecha", "Monto", "Método", "Estado", ""]}>
              {client.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    {formatDateTime(p.paidAt ?? p.createdAt)}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/pagos/${p.id}`} className="text-sm underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        ) : null}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl tracking-wide">
            Accesos
          </h2>
          <DataTable headers={["Fecha", "Resultado", "Motivo"]}>
            {client.accessLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3">{formatDateTime(log.scannedAt)}</td>
                <td className="px-4 py-3">
                  <AccessBadge granted={log.granted} />
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{log.reason}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </div>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}
