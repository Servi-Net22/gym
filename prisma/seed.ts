import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DIRECT_URL o DATABASE_URL para el seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function token() {
  return `GYM-${randomBytes(16).toString("hex").toUpperCase()}`;
}

async function main() {
  await prisma.accessLog.deleteMany();
  await prisma.contentRead.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.employeeReceipt.deleteMany();
  await prisma.content.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.organization.deleteMany();

  const orgName =
    process.env.COMPANY_NAME?.trim() ||
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    "GymFlow";
  const org = await prisma.organization.create({
    data: {
      id: "org_default_gymflow",
      name: orgName,
      slug: "gymflow",
      address: process.env.COMPANY_ADDRESS?.trim() || "",
      cuit: process.env.COMPANY_CUIT?.trim() || "",
      lugarPago:
        process.env.COMPANY_LUGAR_PAGO?.trim() ||
        process.env.COMPANY_ADDRESS?.trim() ||
        "",
      fPagoAportes: process.env.COMPANY_F_PAGO_APORTES?.trim() || "",
    },
  });

  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordEmployee = await bcrypt.hash("empleado123", 10);
  const portalPinHash = await bcrypt.hash("1234", 10);

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "admin@gymflow.local",
      passwordHash: passwordAdmin,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  const mensual = await prisma.plan.create({
    data: {
      organizationId: org.id,
      name: "Mensual",
      description: "Acceso libre 30 días",
      price: 35000,
      durationDays: 30,
    },
  });

  const trimestral = await prisma.plan.create({
    data: {
      organizationId: org.id,
      name: "Trimestral",
      description: "3 meses con descuento",
      price: 90000,
      durationDays: 90,
    },
  });

  await prisma.plan.create({
    data: {
      organizationId: org.id,
      name: "Anual",
      description: "12 meses + evaluación física",
      price: 300000,
      durationDays: 365,
    },
  });

  const endsOk = new Date();
  endsOk.setDate(endsOk.getDate() + 20);

  const endsSoon = new Date();
  endsSoon.setDate(endsSoon.getDate() + 3);

  const expired = new Date();
  expired.setDate(expired.getDate() - 5);

  const clientOk = await prisma.client.create({
    data: {
      organizationId: org.id,
      firstName: "Lucía",
      lastName: "Fernández",
      documentId: "30111222",
      email: "lucia@example.com",
      phone: "11-5555-1001",
      planId: mensual.id,
      membershipEndsAt: endsOk,
      qrToken: token(),
      portalPinHash,
      emergencyContact: "Carlos Fernández 11-5555-1002",
    },
  });

  await prisma.client.create({
    data: {
      organizationId: org.id,
      firstName: "Martín",
      lastName: "Gómez",
      documentId: "28999000",
      email: "martin@example.com",
      phone: "11-5555-2001",
      planId: trimestral.id,
      membershipEndsAt: endsSoon,
      qrToken: token(),
      portalPinHash,
    },
  });

  await prisma.client.create({
    data: {
      organizationId: org.id,
      firstName: "Ana",
      lastName: "Ruiz",
      documentId: "33444555",
      phone: "11-5555-3001",
      planId: mensual.id,
      membershipEndsAt: expired,
      qrToken: token(),
      portalPinHash,
      notes: "Deuda pendiente — no ingresar hasta regularizar",
    },
  });

  const diego = await prisma.employee.create({
    data: {
      organizationId: org.id,
      firstName: "Diego",
      lastName: "Paz",
      documentId: "25111222",
      email: "diego@gymflow.local",
      phone: "11-4000-1001",
      role: "Entrenador",
      salary: 650000,
    },
  });

  const sofia = await prisma.employee.create({
    data: {
      organizationId: org.id,
      firstName: "Sofía",
      lastName: "Mena",
      documentId: "27122333",
      email: "sofia@gymflow.local",
      phone: "11-4000-1002",
      role: "Recepción",
      salary: 520000,
    },
  });

  const julian = await prisma.employee.create({
    data: {
      organizationId: org.id,
      firstName: "Julián",
      lastName: "Castro",
      documentId: "24133444",
      email: "julian@gymflow.local",
      role: "Administración",
      salary: 780000,
    },
  });

  await prisma.user.createMany({
    data: [
      {
        organizationId: org.id,
        email: "diego@gymflow.local",
        passwordHash: passwordEmployee,
        name: "Diego Paz",
        role: "EMPLOYEE",
        employeeId: diego.id,
      },
      {
        organizationId: org.id,
        email: "sofia@gymflow.local",
        passwordHash: passwordEmployee,
        name: "Sofía Mena",
        role: "EMPLOYEE",
        employeeId: sofia.id,
      },
      {
        organizationId: org.id,
        email: "julian@gymflow.local",
        passwordHash: passwordEmployee,
        name: "Julián Castro",
        role: "EMPLOYEE",
        employeeId: julian.id,
      },
    ],
  });

  const from = new Date();
  from.setDate(from.getDate() - 10);
  await prisma.payment.create({
    data: {
      organizationId: org.id,
      clientId: clientOk.id,
      amount: mensual.price,
      method: "transferencia",
      status: "confirmed",
      source: "manual",
      periodFrom: from,
      periodTo: endsOk,
      paidAt: new Date(),
      reference: `GYM-${clientOk.documentId}-DEMO`,
      notes: "Pago inicial demo",
      registeredById: admin.id,
    },
  });

  await prisma.content.createMany({
    data: [
      {
        organizationId: org.id,
        type: "aviso",
        title: "Bienvenido a la app del gym",
        body: "Desde acá ves tu QR, el estado de tu cuenta y novedades. Más adelante también rutinas y dietas personalizadas.",
        clientId: null,
        createdById: admin.id,
        published: true,
      },
      {
        organizationId: org.id,
        type: "rutina",
        title: "Rutina inicial full body",
        body: "Día A: sentadilla 3x10, press banca 3x10, remo 3x10.\nDía B: peso muerto 3x8, press militar 3x10, dominadas asistidas 3x8.\nDescanso 60–90s entre series.",
        clientId: clientOk.id,
        createdById: admin.id,
        published: true,
      },
      {
        organizationId: org.id,
        type: "dieta",
        title: "Pauta nutricional básica",
        body: "Priorizá proteína en cada comida, hidratate (2L/día) y evitá ultraprocesados los días de entrenamiento intenso.\nConsultá con nutricionista para un plan a medida.",
        clientId: null,
        createdById: admin.id,
        published: true,
      },
    ],
  });

  console.log("Seed listo.");
  console.log(`  Org:      ${org.name} (slug: ${org.slug})`);
  console.log("  Admin:    admin@gymflow.local / admin123");
  console.log("  Empleado: sofia@gymflow.local / empleado123");
  console.log(
    `  Cliente PWA: DNI 30111222 / PIN 1234 → /mi/${org.slug}/login`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
