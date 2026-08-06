"use client";

import { useState } from "react";

type Result = {
  granted: boolean;
  reason: string;
  client?: {
    firstName: string;
    lastName: string;
    documentId: string;
    planName: string | null;
  };
  barrier?: { ok: boolean; message: string } | null;
};

export function BarrierSimulator({
  sampleTokens,
}: {
  sampleTokens: { label: string; token: string }[];
}) {
  const [token, setToken] = useState(sampleTokens[0]?.token ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  async function scan() {
    setLoading(true);
    setResult(null);
    setGateOpen(false);
    try {
      const res = await fetch("/api/access/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });
      const data = (await res.json()) as Result;
      setResult(data);
      if (data.granted) {
        setGateOpen(true);
        window.setTimeout(() => setGateOpen(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4 rounded-xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
          Simulador de lector QR
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Pegá el token del QR o elegí un cliente de ejemplo. El sistema valida
          si la cuenta está al día antes de abrir la barrera.
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Token QR</span>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-md border border-[var(--line)] px-3 py-2 font-mono text-sm outline-none ring-[var(--accent)] focus:ring-2"
          />
        </label>

        {sampleTokens.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sampleTokens.map((s) => (
              <button
                key={s.token}
                type="button"
                onClick={() => setToken(s.token)}
                className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs hover:bg-[var(--accent-soft)]"
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={scan}
          disabled={loading || !token}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-50"
        >
          {loading ? "Validando…" : "Escanear y validar"}
        </button>

        {result ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              result.granted
                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                : "border-rose-300 bg-rose-50 text-rose-950"
            }`}
          >
            <p className="font-semibold">
              {result.granted ? "INGRESO PERMITIDO" : "INGRESO DENEGADO"}
            </p>
            <p className="mt-1">{result.reason}</p>
            {result.client ? (
              <p className="mt-2 text-[var(--muted)]">
                {result.client.lastName}, {result.client.firstName} · DNI{" "}
                {result.client.documentId}
                {result.client.planName ? ` · ${result.client.planName}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--line)] bg-[linear-gradient(160deg,#1a2a20_0%,#0f1712_100%)] p-6 text-center text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
          Barrera de ingreso
        </p>
        <div
          className={`relative h-40 w-full max-w-xs overflow-hidden rounded-lg border-2 ${
            gateOpen ? "border-emerald-400" : "border-stone-500"
          }`}
        >
          <div
            className={`absolute inset-y-0 left-0 w-1/2 bg-[repeating-linear-gradient(135deg,#c4a35a_0_12px,#1a2a20_12px_24px)] transition-transform duration-700 ${
              gateOpen ? "-translate-x-full" : "translate-x-0"
            }`}
          />
          <div
            className={`absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(45deg,#c4a35a_0_12px,#1a2a20_12px_24px)] transition-transform duration-700 ${
              gateOpen ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-black/50 px-3 py-1 text-sm font-semibold">
              {gateOpen ? "ABIERTA" : "CERRADA"}
            </span>
          </div>
        </div>
        <p className="max-w-xs text-sm text-stone-300">
          En producción, este mismo flujo llama al controlador físico (HTTP /
          MQTT / relé) vía{" "}
          <code className="text-emerald-300">/api/access/validate</code>.
        </p>
      </div>
    </div>
  );
}
