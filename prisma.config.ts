import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` (postinstall) no necesita DB real.
// migrate deploy / runtime sí usan DATABASE_URL o DIRECT_URL en Vercel.
const datasourceUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
