-- Sysadmin de plataforma: solo cristian@servi-net.com.ar como SUPERADMIN.
-- Si el usuario no existe, se crea con hash bcrypt de una contraseña temporal
-- (documentada solo en el deploy/salida del agente; no se resetea si ya existía).

-- Deja un único SUPERADMIN (demueve al resto a ADMIN de su org).
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "role" = 'SUPERADMIN'
  AND lower("email") <> 'cristian@servi-net.com.ar';

-- Upsert: crear si no existe (anclado a org default o la más antigua).
INSERT INTO "User" (
  "id",
  "organizationId",
  "email",
  "passwordHash",
  "name",
  "role",
  "active",
  "createdAt",
  "updatedAt"
)
SELECT
  'user_protected_superadmin_cristian',
  COALESCE(
    (SELECT "id" FROM "Organization" WHERE "id" = 'org_default_gymflow'),
    (SELECT "id" FROM "Organization" ORDER BY "createdAt" ASC LIMIT 1)
  ),
  'cristian@servi-net.com.ar',
  '$2b$10$cyT1BMa5AfqnRJ39fhoOSuK6Nu/FXWA8EEcCJnZHMaaeSYaXPFQhe',
  'Cristian Sysadmin',
  'SUPERADMIN',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE lower("email") = 'cristian@servi-net.com.ar'
)
AND EXISTS (SELECT 1 FROM "Organization" LIMIT 1);

-- Promover / asegurar activo y rol (sin tocar password si ya existía).
UPDATE "User"
SET
  "role" = 'SUPERADMIN',
  "active" = true,
  "updatedAt" = NOW()
WHERE lower("email") = 'cristian@servi-net.com.ar';
