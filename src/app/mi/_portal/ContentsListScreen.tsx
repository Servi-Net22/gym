import Link from "next/link";
import { DismissContentButton } from "@/components/DismissContentButton";
import type { ClientSession } from "@/lib/client-session";
import {
  clientPortalContent,
  clientPortalContents,
} from "@/lib/client-portal-paths";
import {
  countUnreadContents,
  isDismissibleContentType,
  visibleContentWhere,
} from "@/lib/client-contents";
import {
  CONTENT_GENDER_LABELS,
  CONTENT_LEVEL_LABELS,
} from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";

const LABELS: Record<string, string> = {
  info: "Info",
  rutina: "Rutina",
  dieta: "Dieta",
  aviso: "Aviso",
};

function chipClass(active: boolean) {
  return active
    ? "rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 font-semibold text-[var(--ink)] hover:bg-[var(--accent)]"
    : "rounded-full border border-[var(--line)] bg-white px-3 py-1 font-semibold text-[var(--ink)] hover:bg-[var(--accent-soft)]";
}

export async function ContentsListScreen({
  session,
  tipo,
}: {
  session: ClientSession;
  tipo?: string;
}) {
  const slug = session.organizationSlug;

  const typeFilter =
    tipo && ["info", "rutina", "dieta", "aviso"].includes(tipo)
      ? (tipo as "info" | "rutina" | "dieta" | "aviso")
      : undefined;

  const isPresetView = typeFilter === "rutina" || typeFilter === "dieta";
  const missingLevel = isPresetView && !session.trainingLevel;
  const missingDays = isPresetView && session.daysPerWeek == null;
  const missingGender = isPresetView && !session.gender;
  const blockedPreset = missingLevel || missingDays || missingGender;

  const visibility = visibleContentWhere(
    session.id,
    session.trainingLevel,
    session.daysPerWeek,
    session.gender,
  );

  const profileReady =
    session.trainingLevel &&
    session.daysPerWeek != null &&
    session.gender;

  const [items, unreadTotal] = blockedPreset
    ? [
        [],
        await countUnreadContents(
          session.id,
          session.organizationId,
          session.trainingLevel,
          session.daysPerWeek,
          session.gender,
        ),
      ]
    : await Promise.all([
        prisma.content.findMany({
          where: {
            ...tenantWhere(session),
            published: visibility.published,
            OR: visibility.OR,
            dismissals: visibility.dismissals,
            AND: visibility.AND,
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
        countUnreadContents(
          session.id,
          session.organizationId,
          session.trainingLevel,
          session.daysPerWeek,
          session.gender,
        ),
      ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {typeFilter ? LABELS[typeFilter] : "Novedades"}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {isPresetView
            ? profileReady
              ? `Tu perfil: ${CONTENT_LEVEL_LABELS[session.trainingLevel!]} · ${session.daysPerWeek} días/sem · ${CONTENT_GENDER_LABELS[session.gender!]}.`
              : "Las rutinas y dietas se muestran según tu nivel, días y sexo."
            : "Info, rutinas y dietas que te envía el gimnasio."}
          {unreadTotal > 0
            ? ` Tenés ${unreadTotal} sin leer.`
            : " Estás al día."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {[
          {
            href: clientPortalContents(slug),
            label: "Todo",
            active: !typeFilter,
          },
          {
            href: clientPortalContents(slug, { tipo: "aviso" }),
            label: "Avisos",
            active: typeFilter === "aviso",
          },
          {
            href: clientPortalContents(slug, { tipo: "rutina" }),
            label: "Rutinas",
            active: typeFilter === "rutina",
          },
          {
            href: clientPortalContents(slug, { tipo: "dieta" }),
            label: "Dietas",
            active: typeFilter === "dieta",
          },
          {
            href: clientPortalContents(slug, { tipo: "info" }),
            label: "Info",
            active: typeFilter === "info",
          },
        ].map((f) => (
          <Link key={f.href} href={f.href} className={chipClass(f.active)}>
            {f.label}
          </Link>
        ))}
      </div>

      {missingLevel ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
          Pedí que te asignen un nivel en recepción
        </p>
      ) : missingDays ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
          Pedí que te asignen los días por semana en recepción
        </p>
      ) : missingGender ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
          Pedí que te asignen el sexo en recepción
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
          Todavía no hay contenidos
          {typeFilter ? ` de ${LABELS[typeFilter]}` : ""}
          {isPresetView ? " para tu perfil" : ""}. Cuando el gimnasio publique,
          van a aparecer acá.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const unread = item.reads.length === 0;
            const canDismiss = !unread && isDismissibleContentType(item.type);
            const isPreset = item.type === "rutina" || item.type === "dieta";
            return (
              <li
                key={item.id}
                className={`rounded-xl border ${
                  unread
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]/40"
                    : "border-[var(--line)] bg-white"
                }`}
              >
                <Link
                  href={clientPortalContent(slug, item.id)}
                  className="block p-4 transition hover:opacity-90"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold">
                        {LABELS[item.type] ?? item.type}
                      </span>
                      {unread ? (
                        <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-ink)]">
                          Nuevo
                        </span>
                      ) : null}
                      {isPreset && item.level ? (
                        <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                          {CONTENT_LEVEL_LABELS[item.level] ?? item.level}
                        </span>
                      ) : null}
                      {isPreset && item.daysPerWeek != null ? (
                        <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                          {item.daysPerWeek} días
                        </span>
                      ) : null}
                      {isPreset && item.gender ? (
                        <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                          {CONTENT_GENDER_LABELS[item.gender] ?? item.gender}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
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
                {canDismiss ? (
                  <div className="flex justify-end border-t border-[var(--line)] px-4 py-2">
                    <DismissContentButton contentId={item.id} label="Quitar" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
