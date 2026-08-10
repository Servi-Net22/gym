/** Reporta un login al admin de servi-net.com.ar (Web's y accesos). No bloquea UX. */
export async function reportarAccesoServiNet(opts: {
  email: string;
  nombre?: string | null;
  app?: string;
}): Promise<void> {
  const url = process.env.SERVI_NET_ACCESOS_URL?.trim();
  const secret = process.env.SERVI_NET_ACCESOS_SECRET?.trim();
  const app = (opts.app || process.env.SERVI_NET_ACCESOS_APP || "gym").trim();
  if (!url || !secret || !opts.email) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-accesos-secret": secret,
      },
      body: JSON.stringify({
        app,
        email: opts.email,
        nombre: opts.nombre || undefined,
      }),
      // No esperamos más de lo razonable; el login no debe colgarse
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Silencioso: el acceso a Gym no depende del reporte
  }
}
