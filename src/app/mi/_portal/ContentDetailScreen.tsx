import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentVideo } from "@/components/ContentVideo";
import { DismissContentButton } from "@/components/DismissContentButton";
import { MarkContentRead } from "@/components/MarkContentRead";
import type { ClientSession } from "@/lib/client-session";
import { clientPortalContents } from "@/lib/client-portal-paths";
import {
  isDismissibleContentType,
  visibleContentWhere,
} from "@/lib/client-contents";
import { CONTENT_LEVEL_LABELS } from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";

const LABELS: Record<string, string> = {
  info: "Info",
  rutina: "Rutina",
  dieta: "Dieta",
  aviso: "Aviso",
};

const GENDER_LABELS: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  todos: "Todos",
};

export async function ContentDetailScreen({
  session,
  id,
}: {
  session: ClientSession;
  id: string;
}) {
  const slug = session.organizationSlug;

  const item = await prisma.content.findFirst({
    where: {
      id,
      ...tenantWhere(session),
      ...visibleContentWhere(
        session.id,
        session.trainingLevel,
        session.daysPerWeek,
        session.gender,
      ),
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
  const canDismiss = !unread && isDismissibleContentType(item.type);
  const isPreset = item.type === "rutina" || item.type === "dieta";
  const backHref =
    item.type === "rutina" || item.type === "dieta"
      ? clientPortalContents(slug, { tipo: item.type })
      : clientPortalContents(slug);

  return (
    <div className="space-y-4">
      <MarkContentRead contentId={item.id} unread={unread} />

      <Link
        href={backHref}
        className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Volver
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
            <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-ink)]">
              Nuevo
            </span>
          ) : (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              Leído
            </span>
          )}
          {isPreset && item.level ? (
            <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
              {CONTENT_LEVEL_LABELS[item.level] ?? item.level}
            </span>
          ) : null}
          {isPreset ? (
            <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
              {GENDER_LABELS[item.gender] ?? item.gender}
            </span>
          ) : null}
          {isPreset && item.daysPerWeek != null ? (
            <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
              {item.daysPerWeek} días/sem
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {item.title}
        </h1>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
          {item.body}
        </p>

        <ContentVideo videoUrl={item.videoUrl} videoTitle={item.videoTitle} />

        {canDismiss ? (
          <div className="mt-5 flex justify-end border-t border-[var(--line)] pt-4">
            <DismissContentButton contentId={item.id} label="Eliminar" />
          </div>
        ) : null}
      </article>
    </div>
  );
}
