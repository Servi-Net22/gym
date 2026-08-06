import { prisma } from "@/lib/prisma";

export function visibleContentWhere(clientId: string) {
  return {
    published: true as const,
    OR: [{ clientId: null }, { clientId }],
  };
}

export async function countUnreadContents(clientId: string) {
  return prisma.content.count({
    where: {
      ...visibleContentWhere(clientId),
      reads: { none: { clientId } },
    },
  });
}

export async function markContentAsRead(clientId: string, contentId: string) {
  await prisma.contentRead.upsert({
    where: {
      contentId_clientId: { contentId, clientId },
    },
    create: { contentId, clientId },
    update: { readAt: new Date() },
  });
}
