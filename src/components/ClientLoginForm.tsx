"use client";

import { useActionState } from "react";
import {
  clientLoginAction,
  type ClientLoginState,
} from "@/app/actions/client-portal";

const initial: ClientLoginState = {};

export function ClientLoginForm() {
  const [state, action, pending] = useActionState(clientLoginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">DNI / Documento</span>
        <input
          name="documentId"
          required
          inputMode="numeric"
          autoComplete="username"
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">PIN de acceso</span>
        <input
          name="pin"
          type="password"
          required
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={8}
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Entrar a mi app"}
      </button>
    </form>
  );
}
