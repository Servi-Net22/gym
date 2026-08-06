/**
 * Verifica aislamiento multi-tenant a nivel de queries.
 * Uso: npx tsx scripts/check-tenant-isolation.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DIRECT_URL o DATABASE_URL");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function tenantWhere(organizationId: string) {
  return { organizationId };
}

async function main() {
  const orgs = await prisma.organization.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, name: true },
  });

  if (orgs.length < 2) {
    // Crea un segundo comercio efímero para la prueba si solo hay uno.
    const other = await prisma.organization.create({
      data: {
        name: "Fitnes Este (isolation test)",
        slug: `fitnes-este-iso-${Date.now()}`,
        active: true,
      },
    });
    orgs.push(other);
    console.log(`Creado comercio temporal: ${other.slug}`);
  }

  const a = orgs[0]!;
  const b = orgs.find((o) => o.id !== a.id)!;

  // Cliente en B (si no hay, crear uno mínimo)
  let clientB = await prisma.client.findFirst({
    where: { organizationId: b.id },
    select: { id: true, documentId: true, organizationId: true },
  });
  if (!clientB) {
    clientB = await prisma.client.create({
      data: {
        organizationId: b.id,
        firstName: "Iso",
        lastName: "Test",
        documentId: `ISO-${Date.now()}`,
        qrToken: `GYM-ISO-${Date.now()}`,
      },
      select: { id: true, documentId: true, organizationId: true },
    });
    console.log(`Creado cliente temporal en ${b.slug}`);
  }

  // ADMIN de A (simulado): findMany clientes de B con filtro de A → 0
  const leaked = await prisma.client.findMany({
    where: {
      ...tenantWhere(a.id),
      id: clientB.id,
    },
  });

  const crossList = await prisma.client.findMany({
    where: tenantWhere(a.id),
  });
  const foreign = crossList.filter((c) => c.organizationId !== a.id);

  // QR de B no debe resolverse con scope de A
  const qrB = await prisma.client.findFirst({
    where: { id: clientB.id },
    select: { qrToken: true },
  });
  const qrLeak = await prisma.client.findFirst({
    where: {
      qrToken: qrB!.qrToken,
      organizationId: a.id,
    },
  });

  console.log("--- Tenant isolation check ---");
  console.log(`Org A: ${a.slug} (${a.id})`);
  console.log(`Org B: ${b.slug} (${b.id})`);
  console.log(`Cliente B id: ${clientB.id}`);
  console.log(
    `ADMIN A findFirst cliente B con tenantWhere(A): ${leaked.length} (esperado 0)`,
  );
  console.log(
    `ADMIN A list con foreign orgs: ${foreign.length} (esperado 0)`,
  );
  console.log(
    `QR de B con scope A: ${qrLeak ? "LEAK" : "ok (null)"}`,
  );

  if (leaked.length || foreign.length || qrLeak) {
    throw new Error("FALLO: aislamiento de tenant roto");
  }

  console.log("OK: ADMIN de A no ve datos de B.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
