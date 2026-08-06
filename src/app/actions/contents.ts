"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const contentSchema = z.object({
  type: z.enum(["info", "rutina", "dieta", "aviso"]),
  title: z.string().trim().min(2, "Título requerido"),
  body: z.string().trim().min(2, "Contenido requerido"),
  clientId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  published: z.coerce.boolean().optional().default(true),
});

export async function createContent(formData: FormData) {
  const session = await requireSession();
  const orgId = session.organizationId;
  const parsed = contentSchema.safeParse({
    type: formData.get("type") || "info",
    title: formData.get("title"),
    body: formData.get("body"),
    clientId: formData.get("clientId") || undefined,
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, organizationId: orgId },
      select: { id: true },
    });
    if (!client) throw new Error("Cliente no encontrado");
  }

  await prisma.content.create({
    data: {
      ...parsed.data,
      organizationId: orgId,
      clientId: parsed.data.clientId ?? null,
      createdById: session.id,
    },
  });

  revalidatePath("/contenidos");
  revalidatePath("/mi");
  revalidatePath("/mi/contenidos");
  redirect("/contenidos");
}

export async function toggleContent(id: string) {
  const session = await requireSession();
  const item = await prisma.content.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!item) throw new Error("Contenido no encontrado");
  await prisma.content.update({
    where: { id },
    data: { published: !item.published },
  });
  revalidatePath("/contenidos");
  revalidatePath("/mi");
}

export async function deleteContent(id: string) {
  const session = await requireSession();
  const result = await prisma.content.deleteMany({
    where: { id, organizationId: session.organizationId },
  });
  if (result.count === 0) throw new Error("Contenido no encontrado");
  revalidatePath("/contenidos");
  revalidatePath("/mi");
}
