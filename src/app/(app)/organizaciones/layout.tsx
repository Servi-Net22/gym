import { requireSuperAdmin } from "@/lib/auth";

export default async function OrganizacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return children;
}
