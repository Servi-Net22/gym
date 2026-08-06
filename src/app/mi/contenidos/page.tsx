import Link from "next/link";
import { requireClientSession } from "@/lib/client-auth";
import { countUnreadContents, visibleContentWhere } from "@/lib/client-contents";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  info: "Info",
  rutina: "Rutina",
  dieta: "Dieta",
  aviso: "Aviso",
};

export default async function ClientContentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const session = await requireClientSession();
  const { tipo } = await searchParams;
  const typeFilter =
    tipo && ["info", "rutina", "dieta", "aviso"].includes(tipo)
      ? (tipo as "info" | "rutina" | "dieta" | "aviso")
      : undefined;

  const [items, unreadTotal] = await Promise.all([
    prisma.content.findMany({
      where: {
        ...visibleContentWhere(session.id),
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
      include: {
        reads: {
          where: { clientId: session.id },
          select: { id: true },
          take: 1,
        },
      },
    }),
    countUnreadContents(session.id),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {typeFilter ? LABELS[typeFilter] : "Novedades"}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Info, rutinas y dietas que te envía el gimnasio.
          {unreadTotal > 0
            ? ` Tenés ${unreadTotal} sin leer.`
            : " Estás al día."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { href: "/mi/contenidos", label: "Todo" },
          { href: "/mi/contenidos?tipo=aviso", label: "Avisos" },
          { href: "/mi/contenidos?tipo=rutina", label: "Rutinas" },
          { href: "/mi/contenidos?tipo=dieta", label: "Dietas" },
          { href: "/mi/contenidos?tipo=info", label: "Info" },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-full border border-[var(--line)] bg-white px-3 py-1 font-semibold"
          >
            {f.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
          Todavía no hay contenidos{typeFilter ? ` de ${LABELS[typeFilter]}` : ""}.
          Cuando el gimnasio publique, van a aparecer acá.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const unread = item.reads.length === 0;
            return (
              <li key={item.id}>
                <Link
                  href={`/mi/contenidos/${item.id}`}
                  className={`block rounded-xl border p-4 transition hover:border-[var(--ink)] ${
                    unread
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]/40"
                      : "border-[var(--line)] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold">
                        {LABELS[item.type] ?? item.type}
                      </span>
                      {unread ? (
                        <span className="rounded bg-[var(--ink)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Nuevo
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {formatDateTime(item.publishedAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 font-semibold text-[var(--ink)]">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {item.body}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[var(--ink)]">
                    Abrir →
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
