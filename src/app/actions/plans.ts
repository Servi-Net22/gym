"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planSchema } from "@/lib/validations";

export async function createPlan(formData: FormData) {
  await requireSession();
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

  await prisma.plan.create({ data: parsed.data });
  revalidatePath("/planes");
  redirect("/planes");
}

export async function updatePlan(id: string, formData: FormData) {
  await requireSession();
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

  await prisma.plan.update({ where: { id }, data: parsed.data });
  revalidatePath("/planes");
  redirect("/planes");
}

export async function togglePlan(id: string) {
  await requireSession();
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id } });
  await prisma.plan.update({
    where: { id },
    data: { active: !plan.active },
  });
  revalidatePath("/planes");
}
