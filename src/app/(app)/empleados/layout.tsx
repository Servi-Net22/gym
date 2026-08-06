import { requireAdmin } from "@/lib/auth";

export default async function EmpleadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
