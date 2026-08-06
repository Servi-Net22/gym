"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name?: string;
  defaultSignedName?: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function SignaturePad({
  name = "signatureData",
  defaultSignedName = "",
  action,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      setHasStroke(false);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStroke(true);
  }

  function onPointerUp() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasStroke(false);
    setError(null);
  }

  async function onSubmit(formData: FormData) {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke) {
      setError("Pedile al empleado que firme en el recuadro");
      return;
    }
    formData.set(name, canvas.toDataURL("image/png"));
    setError(null);
    await action(formData);
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nombre del firmante</span>
        <input
          name="signedName"
          required
          defaultValue={defaultSignedName}
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
      </label>

      <div>
        <p className="mb-1.5 text-sm font-medium">Firma</p>
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none rounded-md border border-[var(--line)] bg-white"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold"
          >
            Borrar firma
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
      >
        Guardar firma en el recibo
      </button>
    </form>
  );
}
