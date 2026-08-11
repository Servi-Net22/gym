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
  if (!opts.email) return false;
  if (!url || !secret) {
    console.error(
      "[accesos] Faltan SERVI_NET_ACCESOS_URL / SERVI_NET_ACCESOS_SECRET en el entorno de Vercel (Production).",
    );
    return false;
  }

  const nombreBase = (opts.nombre || "").trim();
  const cargo = (opts.cargo || "").trim();
  // El panel muestra "Nombre"; si viene vacío parece que no hubo login útil.
  const nombre =
    nombreBase && cargo
      ? `${nombreBase} · ${cargo}`
      : nombreBase || cargo || opts.email;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-accesos-secret": secret,
      },
      body: JSON.stringify({
        app,
        email: opts.email,
        nombre,
        ...(cargo ? { cargo } : {}),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[accesos] reporte falló", res.status, txt.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[accesos] reporte error", err);
    return false;
  }
}
