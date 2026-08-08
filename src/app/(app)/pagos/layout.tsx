import { requireAdmin } from "@/lib/auth";

export default async function PagosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
