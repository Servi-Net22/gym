"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantId, tenantWhere } from "@/lib/tenant";
import { planSchema } from "@/lib/validations";

export async function createPlan(formData: FormData) {
  const session = await requireSession();
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  await prisma.plan.create({
    data: { ...parsed.data, organizationId: tenantId(session) },
  });
  revalidatePath("/planes");
  redirect("/planes");
}

export async function updatePlan(id: string, formData: FormData) {
  const session = await requireSession();
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const result = await prisma.plan.updateMany({
    where: { id, ...tenantWhere(session) },
    data: parsed.data,
  });
  if (result.count === 0) throw new Error("Plan no encontrado");
  revalidatePath("/planes");
  redirect("/planes");
}

export async function togglePlan(id: string) {
  const session = await requireSession();
  const plan = await prisma.plan.findFirst({
    where: { id, ...tenantWhere(session) },
  });
  if (!plan) throw new Error("Plan no encontrado");
  await prisma.plan.update({
    where: { id },
    data: { active: !plan.active },
  });
  revalidatePath("/planes");
}
