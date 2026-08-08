import { redirectLegacyClientPortal } from "@/lib/client-portal-slug";

export const dynamic = "force-dynamic";

/** Legacy: /mi/contenidos → /mi/{slug}/contenidos */
export default async function ClientContentsLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; genero?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.tipo) q.set("tipo", sp.tipo);
  if (sp.genero) q.set("genero", sp.genero);
  await redirectLegacyClientPortal("/contenidos", q.toString());
}
