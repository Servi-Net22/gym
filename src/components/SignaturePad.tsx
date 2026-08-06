"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name?: string;
  defaultSignedName?: string;
  /** Server action que recibe FormData con signatureData + signedName */
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
};

export function SignaturePad({
  name = "signatureData",
  defaultSignedName = "",
  action,
  submitLabel = "Guardar firma en el recibo",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const hasStrokeRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paintBlank = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      hasStrokeRef.current = false;
      setHasStroke(false);
    };

    paintBlank();

    const ro = new ResizeObserver(() => {
      if (!hasStrokeRef.current) paintBlank();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
    hasStrokeRef.current = true;
    setHasStroke(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokeRef.current = true;
    setHasStroke(true);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    hasStrokeRef.current = false;
    setHasStroke(false);
    setError(null);
    if (hiddenRef.current) hiddenRef.current.value = "";
  }

  function prepareSubmit(e: React.FormEvent<HTMLFormElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokeRef.current || !hiddenRef.current) {
      e.preventDefault();
      setError("Firmá en el recuadro antes de guardar");
      return;
    }
    hiddenRef.current.value = canvas.toDataURL("image/png");
    setError(null);
  }

  return (
    <form action={action} onSubmit={prepareSubmit} className="space-y-3">
      <input ref={hiddenRef} type="hidden" name={name} defaultValue="" />

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
          className="h-44 w-full touch-none rounded-md border border-[var(--line)] bg-white"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
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
        disabled={!hasStroke}
        className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}
