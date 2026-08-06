import Link from "next/link";
import { requireClientSession } from "@/lib/client-auth";
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

  const items = await prisma.content.findMany({
    where: {
      published: true,
      ...(typeFilter ? { type: typeFilter } : {}),
      OR: [{ clientId: null }, { clientId: session.id }],
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {typeFilter ? LABELS[typeFilter] : "Novedades"}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Info, rutinas y dietas que te envía el gimnasio.
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
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--line)] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold">
                  {LABELS[item.type] ?? item.type}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {formatDateTime(item.publishedAt)}
                </span>
              </div>
              <h2 className="mt-2 font-semibold text-[var(--ink)]">
                {item.title}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
