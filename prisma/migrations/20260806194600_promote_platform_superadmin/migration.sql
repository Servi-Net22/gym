-- Promueve el admin demo / bootstrap de la org por defecto (si existe)
UPDATE "User"
SET "role" = 'SUPERADMIN'
WHERE "email" = 'admin@gymflow.local';
