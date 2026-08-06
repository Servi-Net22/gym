"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireSession } from "@/lib/auth";
import { generatePortalPin } from "@/lib/client-auth";
import { emailNewClient } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { tenantId } from "@/lib/tenant";
import { generateQrToken } from "@/lib/utils";
import { clientSchema } from "@/lib/validations";

export async function createClient(formData: FormData) {
  const session = await requireSession();
  const orgId = tenantId(session);
  const parsed = clientSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    documentId: formData.get("documentId"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    address: formData.get("address") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
    notes: formData.get("notes") || undefined,
    planId: formData.get("planId") || undefined,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { planId, ...rest } = parsed.data;
  let membershipEndsAt: Date | undefined;
  let planName: string | undefined;

  if (planId) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, organizationId: orgId },
    });
    if (plan) {
      planName = plan.name;
      membershipEndsAt = new Date();
      membershipEndsAt.setDate(membershipEndsAt.getDate() + plan.durationDays);
    }
  }

  const pin =
    String(formData.get("portalPin") || "").trim() || generatePortalPin();
  const portalPinHash = await bcrypt.hash(pin, 10);

  const client = await prisma.client.create({
    data: {
      ...rest,
      organizationId: orgId,
      planId,
      membershipEndsAt,
      qrToken: generateQrToken(),
      portalPinHash,
    },
  });

  const base = await getAppBaseUrl();
  const portalUrl = `${base}/mi/${session.organizationSlug}/login`;
  await emailNewClient({
    to: client.email,
    firstName: client.firstName,
    lastName: client.lastName,
    planName,
    membershipEndsAt: client.membershipEndsAt,
    appUrl: `${base}/clientes/${client.id}`,
    portalUrl,
    portalPin: pin,
    documentId: client.documentId,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}?pin=${encodeURIComponent(pin)}`);
}

export async function updateClient(id: string, formData: FormData) {
  const session = await requireSession();
  const orgId = session.organizationId;
  const parsed = clientSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    documentId: formData.get("documentId"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    address: formData.get("address") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
    notes: formData.get("notes") || undefined,
    planId: formData.get("planId") || undefined,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const existing = await prisma.client.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Cliente no encontrado");

  const { planId, ...rest } = parsed.data;
  if (planId) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, organizationId: orgId },
      select: { id: true },
    });
    if (!plan) throw new Error("Plan no encontrado");
  }

  await prisma.client.update({
    where: { id },
    data: {
      ...rest,
      planId: planId ?? null,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function regenerateClientQr(id: string) {
  const session = await requireSession();
  const result = await prisma.client.updateMany({
    where: { id, organizationId: session.organizationId },
    data: { qrToken: generateQrToken() },
  });
  if (result.count === 0) throw new Error("Cliente no encontrado");
  revalidatePath(`/clientes/${id}`);
}

export async function resetClientPortalPin(id: string) {
  const session = await requireSession();
  const pin = generatePortalPin();
  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!client) throw new Error("Cliente no encontrado");

  await prisma.client.update({
    where: { id },
    data: { portalPinHash: await bcrypt.hash(pin, 10) },
  });

  const base = await getAppBaseUrl();
  await emailNewClient({
    to: client.email,
    firstName: client.firstName,
    lastName: client.lastName,
    planName: null,
    membershipEndsAt: client.membershipEndsAt,
    appUrl: `${base}/clientes/${client.id}`,
    portalUrl: `${base}/mi/${session.organizationSlug}/login`,
    portalPin: pin,
    documentId: client.documentId,
  });

  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}?pin=${encodeURIComponent(pin)}`);
}

export async function toggleClient(id: string) {
  const session = await requireSession();
  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!client) throw new Error("Cliente no encontrado");
  await prisma.client.update({
    where: { id },
    data: { active: !client.active },
  });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
