/** Reporta un login al admin de servi-net.com.ar (Web's y accesos). */
export async function reportarAccesoServiNet(opts: {
  email: string;
  nombre?: string | null;
  /** Cargo o rol legible (ej. Administración, Entrenador, Administrador). */
  cargo?: string | null;
  app?: string;
}): Promise<boolean> {
  const url = process.env.SERVI_NET_ACCESOS_URL?.trim();
  const secret = process.env.SERVI_NET_ACCESOS_SECRET?.trim();
  const app = (opts.app || process.env.SERVI_NET_ACCESOS_APP || "gym").trim();
  const email = opts.email.trim().toLowerCase();
  if (!email) return false;
  if (!url || !secret) {
    console.error(
      "[accesos] Faltan SERVI_NET_ACCESOS_URL / SERVI_NET_ACCESOS_SECRET en el entorno de Vercel (Production).",
    );
    return false;
  }

  const nombreBase = (opts.nombre || "").trim();
  const cargo = (opts.cargo || "").trim();
  // El panel de externas usa el email como etiqueta; mandamos nombre legible igual.
  const nombre =
    nombreBase && cargo
      ? `${nombreBase} · ${cargo}`
      : nombreBase || cargo || email;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-accesos-secret": secret,
      },
      // Solo campos que entiende la edge function (app, email, nombre).
      body: JSON.stringify({ app, email, nombre }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(
        "[accesos] reporte falló",
        email,
        res.status,
        txt.slice(0, 200),
      );
      return false;
    }
    console.info("[accesos] reporte ok", { app, email });
    return true;
  } catch (err) {
    console.error("[accesos] reporte error", email, err);
    return false;
  }
}
