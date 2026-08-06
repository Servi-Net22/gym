import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migraciones usan conexión directa; runtime usa pooler (DATABASE_URL).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
