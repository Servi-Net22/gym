import { Sidebar } from "@/components/Sidebar";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session} />
      <main className="flex-1 overflow-auto px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
