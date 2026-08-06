"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCard({
  token,
  title,
}: {
  token: string;
  title: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(token, {
      width: 280,
      margin: 2,
      color: { dark: "#14231a", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-5">
      <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
        {title}
      </p>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR de ${title}`} className="size-56" />
      ) : (
        <div className="size-56 animate-pulse rounded bg-stone-100" />
      )}
      <code className="break-all rounded bg-[var(--panel)] px-2 py-1 text-xs text-[var(--muted)]">
        {token}
      </code>
    </div>
  );
}
