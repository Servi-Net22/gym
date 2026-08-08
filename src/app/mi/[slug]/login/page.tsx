import { notFound, redirect } from "next/navigation";
import { ClientLoginForm } from "@/components/ClientLoginForm";
import { getClientSession } from "@/lib/client-auth";
import {
  clientPortalHome,
  clientPortalLogin,
  isReservedClientPortalSlug,
} from "@/lib/client-portal-paths";
import { normalizeOrgSlug } from "@/lib/company";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Mi Gym — Ingresar",
  appleWebApp: {
    capable: true,
    title: "Mi Gym",
  },
};

export default async function ClientOrgLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = normalizeOrgSlug(raw);
  if (!slug || isReservedClientPortalSlug(slug)) notFound();

  const org = await prisma.organization.findFirst({
    where: { slug, active: true },
    select: { name: true, slug: true },
  });
  if (!org) notFound();

  const session = await getClientSession();
  // Misma org → portal; otra org → no reutilizar sesión cross-tenant.
  if (session?.organizationSlug === org.slug) {
    redirect(clientPortalHome(org.slug));
  }
  if (session && session.organizationSlug !== org.slug) {
    redirect(
      `/api/auth/clear-client-session?next=${encodeURIComponent(clientPortalLogin(org.slug))}`,
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white/90 p-7 shadow-sm">
        <p className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Mi Gym
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {org.name} — accedé con tu DNI y PIN.
        </p>
        <div className="mt-6">
          <ClientLoginForm defaultOrgSlug={org.slug} />
        </div>
        <p className="mt-5 text-xs text-[var(--muted)]">
          Pedí tu PIN en recepción. Después podés instalar esta app en el
          celular desde el menú del navegador (“Agregar a inicio”).
        </p>
      </div>
    </div>
  );
}
