"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          setOk(false);
        }
      }}
      className="inline-flex rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
    >
      {ok ? "Link copiado" : "Copiar link"}
    </button>
  );
}
