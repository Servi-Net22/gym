"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireAdmin } from "@/lib/auth";
import {
  employeeDisplayName,
  generateReceiptViewToken,
  receiptHtml,
} from "@/lib/employee-receipts";
import { emailEmployeeReceipt } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  amount: z.coerce.number().positive("Monto inválido"),
  method: z.enum(["efectivo", "transferencia"]),
  periodFrom: z.string().min(1),
  periodTo: z.string().min(1),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
});

const signSchema = z.object({
  signatureData: z.string().startsWith("data:image/", "Firma inválida"),
  signedName: z.string().trim().min(2, "Nombre del firmante requerido"),
});

function revalidateEmployee(employeeId: string, receiptId?: string) {
  revalidatePath("/empleados");
  revalidatePath(`/empleados/${employeeId}`);
  if (receiptId) {
    revalidatePath(`/empleados/${employeeId}/recibos/${receiptId}`);
  }
}

export async function createEmployeeReceipt(employeeId: string, formData: FormData) {
  const session = await requireAdmin();
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
  });

  const parsed = createSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method") || "transferencia",
    periodFrom: formData.get("periodFrom"),
    periodTo: formData.get("periodTo"),
    paidAt: formData.get("paidAt"),
    notes: String(formData.get("notes") || "").trim() || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const periodFrom = new Date(`${parsed.data.periodFrom}T12:00:00`);
  const periodTo = new Date(`${parsed.data.periodTo}T12:00:00`);
  const paidAt = new Date(`${parsed.data.paidAt}T12:00:00`);
  if (Number.isNaN(periodFrom.getTime()) || Number.isNaN(periodTo.getTime())) {
    throw new Error("Fechas de período inválidas");
  }
  if (periodTo < periodFrom) {
    throw new Error("El período hasta debe ser posterior al desde");
  }

  const receipt = await prisma.employeeReceipt.create({
    data: {
      employeeId: employee.id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      periodFrom,
      periodTo,
      paidAt,
      notes: parsed.data.notes,
      viewToken: generateReceiptViewToken(),
      registeredById: session.id,
    },
  });

  revalidateEmployee(employee.id, receipt.id);
  redirect(`/empleados/${employee.id}/recibos/${receipt.id}`);
}

export async function signEmployeeReceipt(receiptId: string, formData: FormData) {
  await requireAdmin();
  const parsed = signSchema.safeParse({
    signatureData: formData.get("signatureData"),
    signedName: formData.get("signedName"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Firma inválida");
  }

  // Limitar tamaño aproximado del data URL (~1.5MB)
  if (parsed.data.signatureData.length > 1_500_000) {
    throw new Error("La firma es demasiado grande");
  }

  const receipt = await prisma.employeeReceipt.update({
    where: { id: receiptId },
    data: {
      signatureData: parsed.data.signatureData,
      signedName: parsed.data.signedName,
      signedAt: new Date(),
      status: "signed",
    },
  });

  revalidateEmployee(receipt.employeeId, receipt.id);
  revalidatePath(`/recibo/${receipt.viewToken}`);
}

export async function sendEmployeeReceiptEmail(receiptId: string) {
  await requireAdmin();
  const receipt = await prisma.employeeReceipt.findUniqueOrThrow({
    where: { id: receiptId },
    include: { employee: true },
  });

  const to = receipt.employee.email?.trim();
  if (!to) {
    throw new Error("El empleado no tiene email cargado");
  }

  const base = await getAppBaseUrl();
  const receiptUrl = `${base}/recibo/${receipt.viewToken}`;
  const html = receiptHtml({
    employeeName: employeeDisplayName(receipt.employee),
    documentId: receipt.employee.documentId,
    role: receipt.employee.role,
    amount: receipt.amount,
    method: receipt.method,
    periodFrom: receipt.periodFrom,
    periodTo: receipt.periodTo,
    paidAt: receipt.paidAt,
    notes: receipt.notes,
    signedName: receipt.signedName,
    signedAt: receipt.signedAt,
    signatureData: receipt.signatureData,
    receiptId: receipt.id,
  });

  const result = await emailEmployeeReceipt({
    to,
    employeeName: employeeDisplayName(receipt.employee),
    amount: receipt.amount,
    periodFrom: receipt.periodFrom,
    periodTo: receipt.periodTo,
    receiptUrl,
    receiptHtml: html,
  });

  if ("skipped" in result && result.skipped) {
    throw new Error("Email no configurado (RESEND_API_KEY)");
  }
  if ("ok" in result && result.ok === false) {
    throw new Error("No se pudo enviar el email");
  }

  await prisma.employeeReceipt.update({
    where: { id: receipt.id },
    data: {
      emailSentAt: new Date(),
      status: receipt.signatureData ? "sent" : receipt.status,
    },
  });

  revalidateEmployee(receipt.employeeId, receipt.id);
}

export async function markWhatsAppOpened(receiptId: string) {
  await requireAdmin();
  const receipt = await prisma.employeeReceipt.update({
    where: { id: receiptId },
    data: {
      whatsappOpenedAt: new Date(),
      status: "sent",
    },
  });
  revalidateEmployee(receipt.employeeId, receipt.id);
}
