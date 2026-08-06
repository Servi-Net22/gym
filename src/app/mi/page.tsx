import { QrCard } from "@/components/QrCard";
import { StatusBadge } from "@/components/StatusBadge";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isMembershipCurrent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientHomePage() {
  const session = await requireClientSession();
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: session.id },
    include: { plan: true },
  });

  const alDia = isMembershipCurrent(client.membershipEndsAt);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {client.active ? (
            <StatusBadge endsAt={client.membershipEndsAt} />
          ) : (
            <StatusBadge active={false} />
          )}
          <span className="text-sm text-[var(--muted)]">
            {client.plan?.name ?? "Sin plan"}
          </span>
        </div>
        <p className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {alDia ? "Podés ingresar" : "Cuenta no al día"}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Membresía hasta {formatDate(client.membershipEndsAt)}. Mostrá el QR en
          la barrera; solo abre si estás al día.
        </p>
      </section>

      <QrCard token={client.qrToken} title="Tu QR de ingreso" />

      <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
        <p>
          DNI <strong className="text-[var(--ink)]">{client.documentId}</strong>
        </p>
        <p className="mt-2">
          Más adelante vas a recibir acá rutinas, dietas e información del
          gimnasio.
        </p>
      </section>
    </div>
  );
}
