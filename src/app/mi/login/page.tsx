import { redirect } from "next/navigation";
import { ClientLoginForm } from "@/components/ClientLoginForm";
import { getClientSession } from "@/lib/client-auth";

export const metadata = {
  title: "Mi Gym — Ingresar",
  appleWebApp: {
    capable: true,
    title: "Mi Gym",
  },
};

export default async function ClientLoginPage() {
  const session = await getClientSession();
  if (session) redirect("/mi");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white/90 p-7 shadow-sm">
        <p className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Mi Gym
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Accedé con tu DNI y PIN para ver tu QR, cuenta y novedades.
        </p>
        <div className="mt-6">
          <ClientLoginForm />
        </div>
        <p className="mt-5 text-xs text-[var(--muted)]">
          Pedí tu PIN en recepción. Después podés instalar esta app en el
          celular desde el menú del navegador (“Agregar a inicio”).
        </p>
      </div>
    </div>
  );
}
