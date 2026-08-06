import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginForm } from "@/components/LoginForm";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value) {
    redirect("/api/auth/clear-session?next=/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white/90 p-8 shadow-sm">
        <p className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[var(--ink)]">
          GymFlow
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ingresá con tu usuario de administración o empleado.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-6 rounded-lg bg-[var(--panel)] p-3 text-xs text-[var(--muted)]">
          <p className="font-semibold text-[var(--ink)]">Demo</p>
          <p>Admin: admin@gymflow.local / admin123</p>
          <p>Empleado: sofia@gymflow.local / empleado123</p>
        </div>
      </div>
    </div>
  );
}
