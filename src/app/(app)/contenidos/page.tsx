import Link from "next/link";
import { deleteContent, toggleContent } from "@/app/actions/contents";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  SubmitButton,
} from "@/components/Ui";
import { requireSession } from "@/lib/auth";
import {
  TRAINER_CONTENT_TYPES,
  contentsNavLabel,
  isTrainer,
} from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDateTime, fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  info: "Info",
  rutina: "Rutina",
  dieta: "Dieta",
  aviso: "Aviso",
};

const LEVEL_LABELS: Record<string, string> = {
  principiante: "Princ.",
  intermedio: "Inter.",
  avanzado: "Avanz.",
};

const GENDER_LABELS: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  todos: "Todos",
};

export default async function ContenidosPage() {
  const session = await requireSession();
  const trainer = isTrainer(session);

  const items = await prisma.content.findMany({
    where: {
      ...tenantWhere(session),
      ...(trainer ? { type: { in: [...TRAINER_CONTENT_TYPES] } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    include: {
      client: { select: { firstName: true, lastName: true } },
      createdBy: { select: { name: true } },
    },
    take: 100,
  });

  const title = contentsNavLabel(session);

  return (
    <div>
      <PageHeader
        title={title}
        description={
          trainer
            ? "Plantillas de rutinas y dietas con filtros de nivel, género y días."
            : "Info, rutinas, dietas y avisos que ven los clientes en /mi."
        }
        actions={
          <ButtonLink href="/contenidos/nuevo">
            {trainer ? "Nueva rutina / dieta" : "Publicar contenido"}
          </ButtonLink>
        }
      />

      <DataTable
        headers={["Tipo", "Título", "Filtros", "Destino", "Estado", "Fecha", ""]}
      >
        {items.map((item) => {
          const isPreset = item.type === "rutina" || item.type === "dieta";
          return (
            <tr key={item.id}>
              <td className="px-4 py-3">{LABELS[item.type] ?? item.type}</td>
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/contenidos/${item.id}/editar`}
                  className="hover:underline"
                >
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                {isPreset ? (
                  <div className="flex flex-wrap gap-1">
                    {item.level ? (
                      <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[11px] font-semibold">
                        {LEVEL_LABELS[item.level] ?? item.level}
                      </span>
                    ) : null}
                    <span className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      {GENDER_LABELS[item.gender] ?? item.gender}
                    </span>
                    {item.daysPerWeek != null ? (
                      <span className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                        {item.daysPerWeek}d
                      </span>
                    ) : null}
                    {item.videoUrl ? (
                      <span className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                        Video
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">
                {item.client
                  ? fullName(item.client.firstName, item.client.lastName)
                  : "Todos"}
              </td>
              <td className="px-4 py-3">
                {item.published ? "Publicado" : "Oculto"}
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">
                {formatDateTime(item.publishedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <ButtonLink
                    href={`/contenidos/${item.id}/editar`}
                    variant="ghost"
                  >
                    Editar
                  </ButtonLink>
                  <form action={toggleContent.bind(null, item.id)}>
                    <SubmitButton variant="ghost">
                      {item.published ? "Ocultar" : "Publicar"}
                    </SubmitButton>
                  </form>
                  <form action={deleteContent.bind(null, item.id)}>
                    <SubmitButton variant="danger">Borrar</SubmitButton>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <p className="mt-4 text-sm text-[var(--muted)]">
        App del cliente:{" "}
        <Link
          href={`/mi/${session.organizationSlug}/login`}
          className="underline"
        >
          /mi/{session.organizationSlug}/login
        </Link>
      </p>
    </div>
  );
}
