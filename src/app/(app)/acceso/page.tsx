import { BarrierSimulator } from "@/components/BarrierSimulator";
import { DataTable, PageHeader, Panel } from "@/components/Ui";
import { AccessBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { formatDateTime, fullName, isMembershipCurrent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccesoPage() {
  const [clients, logs] = await Promise.all([
    prisma.client.findMany({
      orderBy: { lastName: "asc" },
      take: 12,
    }),
    prisma.accessLog.findMany({
      take: 20,
      orderBy: { scannedAt: "desc" },
      include: { client: true },
    }),
  ]);

  const samples = clients.map((c) => ({
    label: `${c.lastName} (${isMembershipCurrent(c.membershipEndsAt) ? "al día" : "vencido"})`,
    token: c.qrToken,
  }));

  return (
    <div>
      <PageHeader
        title="Acceso / Barrera"
        description="Validación de QR y apertura de barrera solo si la cuenta está al día."
      />

      <BarrierSimulator sampleTokens={samples} />

      <Panel className="mt-8 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
          Integración del hardware
        </h2>
        <p className="text-sm text-[var(--muted)]">
          El lector QR (o el controlador de la barrera) debe llamar:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-[#14231a] p-4 text-xs text-emerald-100">
{`POST /api/access/validate
Header: x-api-key: ${process.env.BARRIER_API_KEY ?? "gym-barrier-dev-key"}
Body: { "qrToken": "GYM-..." }

Respuesta OK:
{ "granted": true, "reason": "...", "barrier": { "ok": true } }`}
        </pre>
      </Panel>

      <div className="mt-8">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl tracking-wide">
          Historial reciente
        </h2>
        <DataTable headers={["Fecha", "Persona", "Resultado", "Motivo"]}>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3">{formatDateTime(log.scannedAt)}</td>
              <td className="px-4 py-3">
                {log.client
                  ? fullName(log.client.firstName, log.client.lastName)
                  : log.qrToken.slice(0, 18) + "…"}
              </td>
              <td className="px-4 py-3">
                <AccessBadge granted={log.granted} />
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">{log.reason}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
