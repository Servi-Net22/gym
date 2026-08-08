"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import {
  CONTENT_GENDERS,
  CONTENT_LEVELS,
  canManageContentType,
  isTrainer,
} from "@/lib/content-permissions";
import { prisma } from "@/lib/prisma";
import { tenantId, tenantWhere } from "@/lib/tenant";
import { isHttpsUrl } from "@/lib/video";

export type ContentFormState = {
  error?: string;
};

const contentSchema = z
  .object({
    type: z.enum(["info", "rutina", "dieta", "aviso"]),
    title: z.string().trim().min(2, "Título requerido"),
    body: z.string().trim().min(2, "Contenido requerido"),
    clientId: z.string().optional(),
    published: z.boolean(),
    level: z.string().optional(),
    gender: z.string().optional(),
    daysPerWeek: z.number().int().optional(),
    videoUrl: z.string().optional(),
    videoTitle: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isPreset = data.type === "rutina" || data.type === "dieta";
    if (isPreset) {
      if (!data.level || !(CONTENT_LEVELS as readonly string[]).includes(data.level)) {
        ctx.addIssue({
          code: "custom",
          message: "Nivel requerido para rutinas y dietas",
          path: ["level"],
        });
      }
      if (
        data.gender &&
        !(CONTENT_GENDERS as readonly string[]).includes(data.gender)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Género inválido",
          path: ["gender"],
        });
      }
      if (
        data.daysPerWeek !== undefined &&
        (data.daysPerWeek < 2 || data.daysPerWeek > 6)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Días por semana debe ser entre 2 y 6",
          path: ["daysPerWeek"],
        });
      }
    }
    if (data.videoUrl && !isHttpsUrl(data.videoUrl)) {
      ctx.addIssue({
        code: "custom",
        message: "El video debe ser una URL HTTPS válida",
        path: ["videoUrl"],
      });
    }
  });

function emptyToUndef(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : undefined;
}

function parseContentForm(formData: FormData) {
  const daysRaw = emptyToUndef(formData.get("daysPerWeek"));
  const daysPerWeek = daysRaw ? Number(daysRaw) : undefined;

  return contentSchema.safeParse({
    type: emptyToUndef(formData.get("type")) || "info",
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    clientId: emptyToUndef(formData.get("clientId")),
    published: formData.get("published") === "on",
    level: emptyToUndef(formData.get("level")),
    gender: emptyToUndef(formData.get("gender")) || "todos",
    daysPerWeek:
      daysPerWeek !== undefined && Number.isFinite(daysPerWeek)
        ? daysPerWeek
        : undefined,
    videoUrl: emptyToUndef(formData.get("videoUrl")),
    videoTitle: emptyToUndef(formData.get("videoTitle")),
  });
}

function revalidateContents() {
  revalidatePath("/contenidos");
  revalidatePath("/mi");
  revalidatePath("/mi/contenidos");
  // Portal con slug: /mi/[slug]/contenidos
  revalidatePath("/mi", "layout");
}

type ContentInput = z.infer<typeof contentSchema>;

function toContentData(
  data: ContentInput,
  opts: { forceBroadcast: boolean },
) {
  const isPreset = data.type === "rutina" || data.type === "dieta";
  return {
    type: data.type,
    title: data.title,
    body: data.body,
    published: data.published,
    clientId: opts.forceBroadcast || !data.clientId ? null : data.clientId,
    level: isPreset
      ? (data.level as (typeof CONTENT_LEVELS)[number])
      : null,
    gender: isPreset
      ? ((data.gender as (typeof CONTENT_GENDERS)[number]) ?? "todos")
      : ("todos" as const),
    daysPerWeek: isPreset ? (data.daysPerWeek ?? null) : null,
    videoUrl: isPreset ? (data.videoUrl ?? null) : null,
    videoTitle: isPreset ? (data.videoTitle ?? null) : null,
  };
}

function prismaContentErrorMessage(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    /column .* does not exist/i.test(msg) ||
    /ContentLevel|ContentGender|daysPerWeek|videoUrl|videoTitle/i.test(msg) ||
    /P2022|P2010/i.test(msg)
  ) {
    return "La base de datos no tiene los campos nuevos de rutinas/dietas. Ejecutá las migraciones (prisma migrate deploy).";
  }
  return "No se pudo guardar el contenido";
}

export async function createContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const session = await requireSession();
  const orgId = tenantId(session);
  const parsed = parseContentForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (!canManageContentType(session, parsed.data.type)) {
    return { error: "No tenés permiso para este tipo de contenido" };
  }

  const forceBroadcast = isTrainer(session);
  if (!forceBroadcast && parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, organizationId: orgId },
      select: { id: true },
    });
    if (!client) return { error: "Cliente no encontrado" };
  }

  try {
    await prisma.content.create({
      data: {
        ...toContentData(parsed.data, { forceBroadcast }),
        organizationId: orgId,
        createdById: session.id,
      },
    });
  } catch (error) {
    console.error("createContent", error);
    return { error: prismaContentErrorMessage(error) };
  }

  revalidateContents();
  redirect("/contenidos");
}

export async function updateContent(
  id: string,
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const session = await requireSession();
  const orgId = tenantId(session);

  const existing = await prisma.content.findFirst({
    where: { id, ...tenantWhere(session) },
  });
  if (!existing) return { error: "Contenido no encontrado" };
  if (!canManageContentType(session, existing.type)) {
    return { error: "No tenés permiso para editar este contenido" };
  }

  const parsed = parseContentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (!canManageContentType(session, parsed.data.type)) {
    return { error: "No tenés permiso para este tipo de contenido" };
  }

  const forceBroadcast = isTrainer(session);
  if (!forceBroadcast && parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, organizationId: orgId },
      select: { id: true },
    });
    if (!client) return { error: "Cliente no encontrado" };
  }

  try {
    await prisma.content.update({
      where: { id },
      data: toContentData(parsed.data, { forceBroadcast }),
    });
  } catch (error) {
    console.error("updateContent", error);
    return { error: prismaContentErrorMessage(error) };
  }

  revalidateContents();
  revalidatePath(`/contenidos/${id}/editar`);
  redirect("/contenidos");
}

export async function toggleContent(id: string) {
  const session = await requireSession();
  const item = await prisma.content.findFirst({
    where: { id, ...tenantWhere(session) },
  });
  if (!item) throw new Error("Contenido no encontrado");
  if (!canManageContentType(session, item.type)) {
    throw new Error("No tenés permiso para este contenido");
  }
  await prisma.content.update({
    where: { id },
    data: { published: !item.published },
  });
  revalidateContents();
}

export async function deleteContent(id: string) {
  const session = await requireSession();
  const item = await prisma.content.findFirst({
    where: { id, ...tenantWhere(session) },
    select: { id: true, type: true },
  });
  if (!item) throw new Error("Contenido no encontrado");
  if (!canManageContentType(session, item.type)) {
    throw new Error("No tenés permiso para este contenido");
  }
  await prisma.content.delete({ where: { id: item.id } });
  revalidateContents();
}
