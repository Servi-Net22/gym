import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Migraciones: preferí DIRECT_URL; en Vercel alcanza DATABASE_URL (pooler :6543).
const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!datasourceUrl) {
  // Error claro si faltan en Vercel → Settings → Environment Variables
  env("DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl!,
  },
});
