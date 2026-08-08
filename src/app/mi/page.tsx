import { redirectLegacyClientPortal } from "@/lib/client-portal-slug";

export const dynamic = "force-dynamic";

/** Legacy: /mi → /mi/{slug} */
export default async function ClientHomeLegacyPage() {
  await redirectLegacyClientPortal("");
}
