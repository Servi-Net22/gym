"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { contentsNavLabel, isTrainer } from "@/lib/content-permissions";
import { canManagePayments } from "@/lib/staff-permissions";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

const links: {
  href: string;
  label: string;
  roles: Array<SessionUser["role"]>;
  contents?: boolean;
  /** Si true, solo admin o recepción/administración (no entrenador). */
  frontDesk?: boolean;
}[] = [
  { href: "/", label: "Panel", roles: ["ADMIN", "EMPLOYEE", "SUPERADMIN"] },
  {
    href: "/organizaciones",
    label: "Comercios",
    roles: ["SUPERADMIN"],
  },
  {
    href: "/clientes",
    label: "Clientes",
    roles: ["ADMIN", "EMPLOYEE", "SUPERADMIN"],
  },
  { href: "/empleados", label: "Empleados", roles: ["ADMIN", "SUPERADMIN"] },
  {
    href: "/planes",
    label: "Planes",
    roles: ["ADMIN", "EMPLOYEE", "SUPERADMIN"],
  },
  {
    href: "/pagos",
    label: "Pagos",
    roles: ["ADMIN", "EMPLOYEE", "SUPERADMIN"],
    frontDesk: true,
  },
  {
    href: "/contenidos",
    label: "Contenidos PWA",
    roles: ["ADMIN", "EMPLOYEE", "SUPERADMIN"],
    contents: true,
  },
  {
    href: "/acceso",
    label: "Acceso / Barrera",
    roles: ["ADMIN", "EMPLOYEE", "SUPERADMIN"],
  },
  {
    href: "/configuracion",
    label: "Configuración",
    roles: ["ADMIN", "SUPERADMIN"],
  },
];

function roleLabel(user: SessionUser) {
  if (user.role === "SUPERADMIN") return "Superadmin";
  if (user.role === "ADMIN") return "Administrador";
  if (isTrainer(user)) return "Entrenador";
  return "Empleado";
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const visibleLinks = links
    .filter((link) => link.roles.includes(user.role))
    .filter((link) => !link.frontDesk || canManagePayments(user))
    .map((link) =>
      link.contents ? { ...link, label: contentsNavLabel(user) } : link,
    );

  return (
    <aside className="no-print flex w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)] print:hidden">
      <div className="border-b border-[var(--line)] px-6 py-7">
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--ink)]">
          GymFlow
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--ink)]">
          {user.organizationName || "Comercio"}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          /{user.organizationSlug || "—"}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleLinks.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-[var(--ink)] hover:bg-[var(--accent-soft)]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-[var(--line)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">{user.name}</p>
          <p className="text-xs text-[var(--muted)]">
            {roleLabel(user)} · {user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-left text-sm font-medium hover:bg-[var(--accent-soft)]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
