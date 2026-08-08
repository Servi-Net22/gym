"use client";

import { useActionState, useState } from "react";
import {
  CheckboxField,
  Field,
  FormGrid,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/Ui";
import type { ContentFormState } from "@/app/actions/contents";
import {
  CONTENT_GENDERS,
  CONTENT_LEVELS,
  TRAINER_CONTENT_TYPES,
} from "@/lib/content-permissions";

const LEVEL_LABELS: Record<(typeof CONTENT_LEVELS)[number], string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const GENDER_LABELS: Record<(typeof CONTENT_GENDERS)[number], string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  todos: "Todos",
};

const ALL_TYPE_OPTIONS = [
  { value: "aviso", label: "Aviso" },
  { value: "info", label: "Info" },
  { value: "rutina", label: "Rutina" },
  { value: "dieta", label: "Dieta" },
];

export type ContentFormValues = {
  type: string;
  title: string;
  body: string;
  clientId?: string | null;
  published: boolean;
  level?: string | null;
  gender?: string | null;
  daysPerWeek?: number | null;
  videoUrl?: string | null;
  videoTitle?: string | null;
};

const initialState: ContentFormState = {};

export function ContentForm({
  action,
  clients,
  allowedTypes,
  forceBroadcast,
  initial,
  submitLabel,
}: {
  action: (
    prev: ContentFormState,
    formData: FormData,
  ) => Promise<ContentFormState>;
  clients: { id: string; label: string }[];
  allowedTypes: readonly string[];
  forceBroadcast: boolean;
  initial?: ContentFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const typeOptions = ALL_TYPE_OPTIONS.filter((o) =>
    allowedTypes.includes(o.value),
  );
  const defaultType =
    initial?.type && allowedTypes.includes(initial.type)
      ? initial.type
      : (typeOptions[0]?.value ?? "rutina");

  const [type, setType] = useState(defaultType);
  const showPresetFields = (TRAINER_CONTENT_TYPES as readonly string[]).includes(
    type,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormGrid>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">Tipo</span>
          <select
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {forceBroadcast ? (
          <div className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">Destino</span>
            <p className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)]">
              Todos los clientes (plantilla compartida)
            </p>
            <input type="hidden" name="clientId" value="" />
          </div>
        ) : (
          <SelectField
            label="Destino"
            name="clientId"
            allowEmpty
            emptyLabel="Todos los clientes"
            defaultValue={initial?.clientId ?? ""}
            options={clients.map((c) => ({ value: c.id, label: c.label }))}
          />
        )}
      </FormGrid>

      {!forceBroadcast ? (
        <p className="text-xs text-[var(--muted)]">
          Si elegís “Todos los clientes”, se publica para todo el portal.
          Rutinas y dietas con filtros (nivel / género / días) funcionan mejor
          como plantilla compartida.
        </p>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Las rutinas y dietas se comparten con todos los clientes del gym;
          cada uno ve solo las de su nivel y puede filtrar por género y días.
        </p>
      )}

      <Field
        label="Título"
        name="title"
        required
        defaultValue={initial?.title}
      />
      <TextArea
        label="Contenido"
        name="body"
        rows={8}
        required
        defaultValue={initial?.body}
      />

      {showPresetFields ? (
        <>
          <FormGrid>
            <SelectField
              label="Nivel"
              name="level"
              required
              defaultValue={initial?.level ?? "principiante"}
              options={CONTENT_LEVELS.map((v) => ({
                value: v,
                label: LEVEL_LABELS[v],
              }))}
            />
            <SelectField
              label="Género"
              name="gender"
              defaultValue={initial?.gender ?? "todos"}
              options={CONTENT_GENDERS.map((v) => ({
                value: v,
                label: GENDER_LABELS[v],
              }))}
            />
          </FormGrid>
          <FormGrid>
            <Field
              label="Días por semana"
              name="daysPerWeek"
              type="number"
              min="2"
              max="6"
              placeholder="Ej. 3"
              defaultValue={initial?.daysPerWeek ?? ""}
            />
            <Field
              label="Título del video (opcional)"
              name="videoTitle"
              defaultValue={initial?.videoTitle ?? ""}
              placeholder="Ej. Técnica de sentadilla"
            />
          </FormGrid>
          <Field
            label="URL del video (HTTPS)"
            name="videoUrl"
            type="url"
            defaultValue={initial?.videoUrl ?? ""}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-[var(--muted)]">
            YouTube, Vimeo o enlace directo HTTPS. No se suben archivos.
          </p>
        </>
      ) : null}

      <CheckboxField
        label="Publicado"
        name="published"
        defaultChecked={initial?.published ?? true}
      />

      {state.error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {state.error}
        </p>
      ) : null}

      <SubmitButton disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </SubmitButton>
    </form>
  );
}
