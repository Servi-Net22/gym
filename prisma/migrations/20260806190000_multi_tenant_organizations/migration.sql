-- Multi-tenant: Organization + organizationId en datos existentes

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT NOT NULL DEFAULT '',
    "cuit" TEXT NOT NULL DEFAULT '',
    "lugarPago" TEXT NOT NULL DEFAULT '',
    "fPagoAportes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Org por defecto (datos de letterhead se pueden editar luego en /configuracion)
INSERT INTO "Organization" ("id", "name", "slug", "active", "address", "cuit", "lugarPago", "fPagoAportes", "createdAt", "updatedAt")
VALUES (
  'org_default_gymflow',
  'GymFlow',
  'gymflow',
  true,
  '',
  '',
  '',
  '',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Plan
ALTER TABLE "Plan" ADD COLUMN "organizationId" TEXT;
UPDATE "Plan" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "Plan" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Plan_organizationId_idx" ON "Plan"("organizationId");

-- Client
ALTER TABLE "Client" ADD COLUMN "organizationId" TEXT;
UPDATE "Client" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "Client" ALTER COLUMN "organizationId" SET NOT NULL;
DROP INDEX IF EXISTS "Client_documentId_key";
CREATE UNIQUE INDEX "Client_organizationId_documentId_key" ON "Client"("organizationId", "documentId");
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");

-- Employee
ALTER TABLE "Employee" ADD COLUMN "organizationId" TEXT;
UPDATE "Employee" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "Employee" ALTER COLUMN "organizationId" SET NOT NULL;
DROP INDEX IF EXISTS "Employee_documentId_key";
CREATE UNIQUE INDEX "Employee_organizationId_documentId_key" ON "Employee"("organizationId", "documentId");
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Employee_organizationId_idx" ON "Employee"("organizationId");

-- User
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
UPDATE "User" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- Payment
ALTER TABLE "Payment" ADD COLUMN "organizationId" TEXT;
UPDATE "Payment" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "Payment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- Content
ALTER TABLE "Content" ADD COLUMN "organizationId" TEXT;
UPDATE "Content" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "Content" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Content" ADD CONSTRAINT "Content_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Content_organizationId_idx" ON "Content"("organizationId");

-- ContentRead
ALTER TABLE "ContentRead" ADD COLUMN "organizationId" TEXT;
UPDATE "ContentRead" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "ContentRead" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ContentRead" ADD CONSTRAINT "ContentRead_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ContentRead_organizationId_idx" ON "ContentRead"("organizationId");

-- AccessLog (nullable: QR desconocido sin org)
ALTER TABLE "AccessLog" ADD COLUMN "organizationId" TEXT;
UPDATE "AccessLog" SET "organizationId" = 'org_default_gymflow' WHERE "clientId" IS NOT NULL;
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "AccessLog_organizationId_idx" ON "AccessLog"("organizationId");

-- EmployeeReceipt
ALTER TABLE "EmployeeReceipt" ADD COLUMN "organizationId" TEXT;
UPDATE "EmployeeReceipt" SET "organizationId" = 'org_default_gymflow';
ALTER TABLE "EmployeeReceipt" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "EmployeeReceipt" ADD CONSTRAINT "EmployeeReceipt_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "EmployeeReceipt_organizationId_idx" ON "EmployeeReceipt"("organizationId");

-- RLS lockdown (PostgREST); Prisma como owner bypasea RLS
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Organization" FROM anon, authenticated;
