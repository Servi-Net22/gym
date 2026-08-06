import { prisma } from "@/lib/prisma";

export function visibleContentWhere(clientId: string) {
  return {
    published: true as const,
    OR: [{ clientId: null }, { clientId }],
  };
}

export async function countUnreadContents(
  clientId: string,
  organizationId: string,
) {
  if (!organizationId) {
    throw new Error("organizationId requerido para contenidos del portal");
  }
  return prisma.content.count({
    where: {
      organizationId,
      ...visibleContentWhere(clientId),
      reads: { none: { clientId } },
    },
  });
}

export async function markContentAsRead(
  clientId: string,
  contentId: string,
  organizationId: string,
) {
  await prisma.contentRead.upsert({
    where: {
      contentId_clientId: { contentId, clientId },
    },
    create: { contentId, clientId, organizationId },
    update: { readAt: new Date() },
  });
}
