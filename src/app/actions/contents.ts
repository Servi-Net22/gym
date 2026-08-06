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

  await prisma.content.create({
    data: {
      ...parsed.data,
      clientId: parsed.data.clientId ?? null,
      createdById: session.id,
    },
  });

  revalidatePath("/contenidos");
  revalidatePath("/mi");
  redirect("/contenidos");
}

export async function toggleContent(id: string) {
  await requireSession();
  const item = await prisma.content.findUniqueOrThrow({ where: { id } });
  await prisma.content.update({
    where: { id },
    data: { published: !item.published },
  });
  revalidatePath("/contenidos");
  revalidatePath("/mi");
}

export async function deleteContent(id: string) {
  await requireSession();
  await prisma.content.delete({ where: { id } });
  revalidatePath("/contenidos");
  revalidatePath("/mi");
}
