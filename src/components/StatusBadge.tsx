import { cn, isMembershipCurrent } from "@/lib/utils";

export function StatusBadge({
  active,
  endsAt,
}: {
  active?: boolean;
  endsAt?: Date | null;
}) {
  if (active === false) {
    return <Badge tone="neutral">Inactivo</Badge>;
  }

  if (endsAt !== undefined) {
    if (isMembershipCurrent(endsAt)) {
      return <Badge tone="ok">Al día</Badge>;
    }
    return <Badge tone="bad">Vencido</Badge>;
  }

  return <Badge tone="ok">Activo</Badge>;
}

export function AccessBadge({ granted }: { granted: boolean }) {
  return granted ? (
    <Badge tone="ok">Permitido</Badge>
  ) : (
    <Badge tone="bad">Denegado</Badge>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "bad" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
        tone === "ok" && "bg-emerald-100 text-emerald-900",
        tone === "bad" && "bg-rose-100 text-rose-900",
        tone === "neutral" && "bg-stone-200 text-stone-700",
      )}
    >
      {children}
    </span>
  );
}
