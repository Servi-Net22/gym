import { HomeScreen } from "@/app/mi/_portal/HomeScreen";
import { requireClientPortalSlug } from "@/lib/client-portal-slug";

export const dynamic = "force-dynamic";

export default async function ClientSlugHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const { session } = await requireClientPortalSlug(raw);
  return <HomeScreen session={session} />;
}
