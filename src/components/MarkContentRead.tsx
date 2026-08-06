"use client";

import { useEffect, useRef } from "react";
import { markContentReadAction } from "@/app/actions/client-portal";

/** Marca el contenido como leído al abrir la pantalla (sin mutar en el render del servidor). */
export function MarkContentRead({
  contentId,
  unread,
}: {
  contentId: string;
  unread: boolean;
}) {
  const started = useRef(false);

  useEffect(() => {
    if (!unread || started.current) return;
    started.current = true;
    void markContentReadAction(contentId);
  }, [contentId, unread]);

  return null;
}
