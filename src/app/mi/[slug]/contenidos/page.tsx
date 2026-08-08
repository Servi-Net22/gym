import { ContentsListScreen } from "@/app/mi/_portal/ContentsListScreen";
import { requireClientPortalSlug } from "@/lib/client-portal-slug";

export const dynamic = "force-dynamic";

export default async function ClientSlugContentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; genero?: string }>;
}) {
  const { slug: raw } = await params;
  const { tipo, genero } = await searchParams;
  const { session } = await requireClientPortalSlug(raw);
  return <ContentsListScreen session={session} tipo={tipo} genero={genero} />;
}
