"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/app-url";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { emailEmployeeCredentials } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";

function parseEmployeeForm(formData: FormData) {
  return employeeSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    documentId: formData.get("documentId"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
    salary: formData.get("salary") || undefined,
    hireDate: formData.get("hireDate") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createEmployee(formData: FormData) {
  await requireAdmin();
  const parsed = parseEmployeeForm(formData);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const loginEmail = String(formData.get("loginEmail") || data.email || "")
    .trim()
    .toLowerCase();
  const loginPassword =
    String(formData.get("loginPassword") || "").trim() || "empleado123";

  if (!loginEmail) {
    throw new Error("Se necesita un email para crear el usuario de acceso");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: loginEmail },
  });
  if (existingUser) {
    throw new Error("Ya existe un usuario con ese email de acceso");
  }

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({ data });
    await tx.user.create({
      data: {
        email: loginEmail,
        passwordHash: await hashPassword(loginPassword),
        name: `${data.firstName} ${data.lastName}`,
        role: "EMPLOYEE",
        employeeId: employee.id,
        active: data.active ?? true,
      },
    });
  });

  const base = await getAppBaseUrl();
  await emailEmployeeCredentials({
    to: loginEmail,
    name: `${data.firstName} ${data.lastName}`,
    password: loginPassword,
    appUrl: base,
  });

  revalidatePath("/empleados");
  redirect("/empleados");
}

export async function updateEmployee(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseEmployeeForm(formData);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const loginPassword = String(formData.get("loginPassword") || "").trim();

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.update({ where: { id }, data });

    const linked = await tx.user.findUnique({ where: { employeeId: id } });
    if (linked) {
      await tx.user.update({
        where: { id: linked.id },
        data: {
          name: `${employee.firstName} ${employee.lastName}`,
          active: employee.active,
          ...(loginPassword
            ? { passwordHash: await hashPassword(loginPassword) }
            : {}),
          ...(employee.email
            ? { email: employee.email.toLowerCase() }
            : {}),
        },
      });
    }
  });

  revalidatePath("/empleados");
  revalidatePath(`/empleados/${id}/editar`);
  redirect(`/empleados/${id}/editar`);
}

export async function toggleEmployee(id: string) {
  await requireAdmin();
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id } });
  const active = !employee.active;

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({ where: { id }, data: { active } });
    await tx.user.updateMany({
      where: { employeeId: id },
      data: { active },
    });
  });

  revalidatePath("/empleados");
}
