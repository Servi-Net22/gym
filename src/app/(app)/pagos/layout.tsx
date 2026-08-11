import { requirePaymentOps } from "@/lib/auth";

export default async function PagosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePaymentOps();
  return children;
}
