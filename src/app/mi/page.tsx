import Link from "next/link";
import { QrCard } from "@/components/QrCard";
import { StatusBadge } from "@/components/StatusBadge";
import { requireClientSession } from "@/lib/client-auth";
import { countUnreadContents } from "@/lib/client-contents";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, isMembershipCurrent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientHomePage() {
  const session = await requireClientSession();
  const [client, unread] = await Promise.all([
    prisma.client.findFirstOrThrow({
      where: { id: session.id, ...tenantWhere(session) },
      include: { plan: true },
    }),
    countUnreadContents(
      session.id,
      session.organizationId,
      session.trainingLevel,
      session.daysPerWeek,
    ),
  ]);

  const alDia = isMembershipCurrent(client.membershipEndsAt);

  return (
    <div className="space-y-5">
      {unread > 0 ? (
        <Link
          href="/mi/contenidos"
          className="block rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)]/50 p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink)]">
            Nuevos mensajes
          </p>
          <p className="mt-1 font-semibold text-[var(--ink)]">
            Tenés {unread} novedad{unread === 1 ? "" : "es"} sin leer
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">Tocá para abrir →</p>
        </Link>
      ) : null}

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
          En Novedades ves rutinas, dietas e info del gimnasio. Los mensajes
          nuevos se marcan hasta que los abras.
        </p>
      </section>
    </div>
  );
}
