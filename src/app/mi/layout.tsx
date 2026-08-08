import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { clientLogoutAction } from "@/app/actions/client-portal";
import { getClientSession } from "@/lib/client-auth";
import {
  clientPortalContents,
  clientPortalHome,
} from "@/lib/client-portal-paths";
import { countUnreadContents } from "@/lib/client-contents";

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
  const unread = session
    ? await countUnreadContents(
        session.id,
        session.organizationId,
        session.trainingLevel,
        session.daysPerWeek,
        session.gender,
      )
    : 0;

  const slug = session?.organizationSlug;

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

      {session && slug ? (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur">
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 py-2 text-center text-xs font-semibold">
            <Link
              href={clientPortalHome(slug)}
              className="rounded-md px-2 py-2 hover:bg-white"
            >
              QR / Cuenta
            </Link>
            <Link
              href={clientPortalContents(slug)}
              className="relative rounded-md px-2 py-2 hover:bg-white"
            >
              Novedades
              {unread > 0 ? (
                <span className="absolute -top-0.5 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--accent-ink)]">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              href={clientPortalContents(slug, { tipo: "rutina" })}
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
