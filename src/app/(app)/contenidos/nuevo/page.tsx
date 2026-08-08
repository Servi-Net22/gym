import { createContent } from "@/app/actions/contents";
import { ContentForm } from "@/components/ContentForm";
import { PageHeader, Panel } from "@/components/Ui";
import { requireSession } from "@/lib/auth";
import {
  allowedContentTypes,
  isTrainer,
} from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoContenidoPage() {
  const session = await requireSession();
  const trainer = isTrainer(session);
  const types = allowedContentTypes(session);

  const clients = trainer
    ? []
    : await prisma.client.findMany({
        where: { organizationId: session.organizationId, active: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

  return (
    <div>
      <PageHeader
        title={trainer ? "Nueva rutina o dieta" : "Publicar contenido"}
        description={
          trainer
            ? "Plantillas compartidas: cada cliente ve solo las de su nivel; pueden filtrar por género y días."
            : "Lo verán en la app del cliente (PWA). Podés enviarlo a todos o a uno solo."
        }
      />
      <Panel className="max-w-2xl">
        <ContentForm
          action={createContent}
          clients={clients.map((c) => ({
            id: c.id,
            label: fullName(c.firstName, c.lastName),
          }))}
          allowedTypes={types}
          forceBroadcast={trainer}
          submitLabel={trainer ? "Guardar" : "Publicar"}
          initial={{
            type: trainer ? "rutina" : "info",
            title: "",
            body: "",
            published: true,
            level: "principiante",
            gender: "todos",
          }}
        />
      </Panel>
    </div>
  );
}
