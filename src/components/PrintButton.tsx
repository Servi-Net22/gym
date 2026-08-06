"use client";

export function PrintButton({ label = "Imprimir / guardar PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] print:hidden"
    >
      {label}
    </button>
  );
}
