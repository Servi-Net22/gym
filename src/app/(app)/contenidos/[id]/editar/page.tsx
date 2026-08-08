import { notFound } from "next/navigation";
import { updateContent } from "@/app/actions/contents";
import { ContentForm } from "@/components/ContentForm";
import { PageHeader, Panel } from "@/components/Ui";
import { requireSession } from "@/lib/auth";
import {
  allowedContentTypes,
  canManageContentType,
  isTrainer,
} from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditarContenidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const trainer = isTrainer(session);

  const item = await prisma.content.findFirst({
    where: { id, ...tenantWhere(session) },
  });
  if (!item || !canManageContentType(session, item.type)) {
    notFound();
  }

  const clients = trainer
    ? []
    : await prisma.client.findMany({
        where: { organizationId: session.organizationId, active: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

  const action = updateContent.bind(null, item.id);

  return (
    <div>
      <PageHeader
        title="Editar contenido"
        description={item.title}
      />
      <Panel className="max-w-2xl">
        <ContentForm
          action={action}
          clients={clients.map((c) => ({
            id: c.id,
            label: fullName(c.firstName, c.lastName),
          }))}
          allowedTypes={allowedContentTypes(session)}
          forceBroadcast={trainer}
          submitLabel="Guardar cambios"
          initial={{
            type: item.type,
            title: item.title,
            body: item.body,
            clientId: item.clientId,
            published: item.published,
            level: item.level,
            gender: item.gender,
            daysPerWeek: item.daysPerWeek,
            videoUrl: item.videoUrl,
            videoTitle: item.videoTitle,
          }}
        />
      </Panel>
    </div>
  );
}
