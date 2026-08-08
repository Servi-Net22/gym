import { prisma } from "@/lib/prisma";

const DISMISSIBLE_TYPES = ["info", "aviso"] as const;

export type DismissibleContentType = (typeof DISMISSIBLE_TYPES)[number];

export function isDismissibleContentType(
  type: string,
): type is DismissibleContentType {
  return (DISMISSIBLE_TYPES as readonly string[]).includes(type);
}

export function visibleContentWhere(clientId: string) {
  return {
    published: true as const,
    OR: [{ clientId: null }, { clientId }],
    dismissals: { none: { clientId } },
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

/** Quita info/aviso del portal del cliente (dismiss broadcast o hard-delete personal). */
export async function dismissClientContent(
  clientId: string,
  contentId: string,
  organizationId: string,
) {
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      organizationId,
      ...visibleContentWhere(clientId),
    },
    select: {
      id: true,
      type: true,
      clientId: true,
      organizationId: true,
      reads: {
        where: { clientId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!content) return { ok: false as const, reason: "not_found" as const };
  if (!isDismissibleContentType(content.type)) {
    return { ok: false as const, reason: "not_dismissible" as const };
  }
  if (content.reads.length === 0) {
    return { ok: false as const, reason: "unread" as const };
  }

  // Personal (dirigido a este cliente): hard-delete. Broadcast: dismiss por cliente.
  if (content.clientId === clientId) {
    await prisma.content.delete({ where: { id: content.id } });
    return { ok: true as const, mode: "deleted" as const };
  }

  await prisma.contentDismiss.upsert({
    where: {
      contentId_clientId: { contentId: content.id, clientId },
    },
    create: {
      contentId: content.id,
      clientId,
      organizationId: content.organizationId,
    },
    update: { dismissedAt: new Date() },
  });

  return { ok: true as const, mode: "dismissed" as const };
}
