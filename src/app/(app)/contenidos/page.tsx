import Link from "next/link";
import { deleteContent, toggleContent } from "@/app/actions/contents";
import {
  ButtonLink,
  DataTable,
  PageHeader,
  SubmitButton,
} from "@/components/Ui";
import { requireSession } from "@/lib/auth";
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

export default async function ContenidosPage() {
  const session = await requireSession();
  const items = await prisma.content.findMany({
    where: tenantWhere(session),
    orderBy: { publishedAt: "desc" },
    include: {
      client: { select: { firstName: true, lastName: true } },
      createdBy: { select: { name: true } },
    },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Contenidos PWA"
        description="Info, rutinas, dietas y avisos que ven los clientes en /mi."
        actions={
          <ButtonLink href="/contenidos/nuevo">Publicar contenido</ButtonLink>
        }
      />

      <DataTable
        headers={["Tipo", "Título", "Destino", "Estado", "Fecha", ""]}
      >
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3">{LABELS[item.type] ?? item.type}</td>
            <td className="px-4 py-3 font-medium">{item.title}</td>
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
        ))}
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
