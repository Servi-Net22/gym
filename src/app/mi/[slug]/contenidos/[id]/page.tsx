import { ContentDetailScreen } from "@/app/mi/_portal/ContentDetailScreen";
import { requireClientPortalSlug } from "@/lib/client-portal-slug";

export const dynamic = "force-dynamic";

export default async function ClientSlugContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug: raw, id } = await params;
  const { session } = await requireClientPortalSlug(raw);
  return <ContentDetailScreen session={session} id={id} />;
}
