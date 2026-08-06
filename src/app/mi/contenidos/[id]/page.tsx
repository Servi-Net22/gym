import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireClientSession } from "@/lib/client-auth";
import {
  markContentAsRead,
  visibleContentWhere,
} from "@/lib/client-contents";
import { prisma } from "@/lib/prisma";
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

  if (item.reads.length === 0) {
    await markContentAsRead(session.id, item.id);
    revalidatePath("/mi");
    revalidatePath("/mi/contenidos");
  }

  return (
    <div className="space-y-4">
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
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            Leído
          </span>
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
