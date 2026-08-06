"use client";

import { markWhatsAppOpened } from "@/app/actions/employee-receipts";

export function WhatsAppShareButton({
  receiptId,
  href,
  label = "Enviar por WhatsApp",
}: {
  receiptId: string;
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        void markWhatsAppOpened(receiptId);
      }}
      className="inline-flex rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold hover:bg-[var(--accent-soft)]"
    >
      {label}
    </a>
  );
}
