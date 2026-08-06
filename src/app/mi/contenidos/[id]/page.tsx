import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkContentRead } from "@/components/MarkContentRead";
import { requireClientSession } from "@/lib/client-auth";
import { visibleContentWhere } from "@/lib/client-contents";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  info: "Info",
  rutina: "Rutina",
  dieta: "Dieta",
  aviso: "Aviso",
};

export default async function ClientContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireClientSession();
  const { id } = await params;

  const item = await prisma.content.findFirst({
    where: {
      id,
      ...tenantWhere(session),
      ...visibleContentWhere(session.id),
    },
    include: {
      reads: {
        where: { clientId: session.id },
        take: 1,
      },
    },
  });

  if (!item) notFound();

  const unread = item.reads.length === 0;

  return (
    <div className="space-y-4">
      <MarkContentRead contentId={item.id} unread={unread} />

      <Link
        href="/mi/contenidos"
        className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Volver a novedades
      </Link>

      <article className="rounded-xl border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold">
            {LABELS[item.type] ?? item.type}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {formatDateTime(item.publishedAt)}
          </span>
          {unread ? (
            <span className="rounded bg-[var(--ink)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Nuevo
            </span>
          ) : (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              Leído
            </span>
          )}
        </div>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {item.title}
        </h1>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
          {item.body}
        </p>
      </article>
    </div>
  );
}
