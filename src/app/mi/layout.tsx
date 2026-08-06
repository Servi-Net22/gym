import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { clientLogoutAction } from "@/app/actions/client-portal";
import { getClientSession } from "@/lib/client-auth";

export const metadata: Metadata = {
  title: "Mi Gym",
  description: "QR de ingreso, cuenta y contenidos del gimnasio",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mi Gym",
  },
};

export const viewport: Viewport = {
  themeColor: "#c8f542",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-24 pt-5">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
            Mi Gym
          </p>
          {session ? (
            <p className="text-sm text-[var(--muted)]">{session.name}</p>
          ) : null}
        </div>
        {session ? (
          <form action={clientLogoutAction}>
            <button
              type="submit"
              className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold"
            >
              Salir
            </button>
          </form>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      {session ? (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur">
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 py-2 text-center text-xs font-semibold">
            <Link href="/mi" className="rounded-md px-2 py-2 hover:bg-white">
              QR / Cuenta
            </Link>
            <Link
              href="/mi/contenidos"
              className="rounded-md px-2 py-2 hover:bg-white"
            >
              Novedades
            </Link>
            <Link
              href="/mi/contenidos?tipo=rutina"
              className="rounded-md px-2 py-2 hover:bg-white"
            >
              Rutinas
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
