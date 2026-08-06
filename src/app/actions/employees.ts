"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/app-url";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { emailEmployeeCredentials } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import {
  assertMutableStaffUser,
  isProtectedSuperadminEmail,
} from "@/lib/superadmin";
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
    cuil: formData.get("cuil") || undefined,
    legajo: formData.get("legajo") || undefined,
    categoriaLaboral: formData.get("categoriaLaboral") || undefined,
    notes: formData.get("notes") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createEmployee(formData: FormData) {
  const session = await requireAdmin();
  const orgId = session.organizationId;
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
  if (isProtectedSuperadminEmail(loginEmail)) {
    throw new Error(
      "Ese email está reservado para el sysadmin de plataforma.",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: loginEmail },
  });
  if (existingUser) {
    throw new Error("Ya existe un usuario con ese email de acceso");
  }

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: { ...data, organizationId: orgId },
    });
    await tx.user.create({
      data: {
        organizationId: orgId,
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
  const session = await requireAdmin();
  const orgId = session.organizationId;
  const parsed = parseEmployeeForm(formData);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const existing = await prisma.employee.findFirst({
    where: { id, organizationId: orgId },
    include: { user: { select: { id: true, email: true, role: true } } },
  });
  if (!existing) throw new Error("Empleado no encontrado");

  const data = parsed.data;
  const loginPassword = String(formData.get("loginPassword") || "").trim();
  const protectedAccount =
    isProtectedSuperadminEmail(existing.user?.email) ||
    isProtectedSuperadminEmail(existing.email);

  if (protectedAccount) {
    if (data.active === false) {
      assertMutableStaffUser(existing.user?.email ?? existing.email);
    }
    if (
      data.email &&
      existing.user?.email &&
      data.email.toLowerCase() !== existing.user.email.toLowerCase()
    ) {
      throw new Error(
        "No se puede cambiar el email de la cuenta de sysadmin protegida.",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const employeeData = protectedAccount ? { ...data, active: true } : data;
    const employee = await tx.employee.update({
      where: { id },
      data: employeeData,
    });

    const linked = await tx.user.findUnique({ where: { employeeId: id } });
    if (linked) {
      if (linked.organizationId !== orgId) {
        throw new Error("Empleado no encontrado");
      }
      if (isProtectedSuperadminEmail(linked.email)) {
        await tx.user.update({
          where: { id: linked.id },
          data: {
            name: `${employee.firstName} ${employee.lastName}`,
            active: true,
            role: "SUPERADMIN",
            email: linked.email,
            ...(loginPassword
              ? { passwordHash: await hashPassword(loginPassword) }
              : {}),
          },
        });
        return;
      }
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
  const session = await requireAdmin();
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { user: { select: { email: true } } },
  });
  if (!employee) throw new Error("Empleado no encontrado");

  assertMutableStaffUser(employee.user?.email ?? employee.email);

  const active = !employee.active;

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({ where: { id }, data: { active } });
    await tx.user.updateMany({
      where: { employeeId: id, organizationId: session.organizationId },
      data: { active },
    });
  });

  revalidatePath("/empleados");
}
