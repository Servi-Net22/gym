import { redirectLegacyClientPortal } from "@/lib/client-portal-slug";

export const dynamic = "force-dynamic";

/** Legacy: /mi/contenidos/[id] → /mi/{slug}/contenidos/[id] */
export default async function ClientContentDetailLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await redirectLegacyClientPortal(`/contenidos/${id}`);
}
