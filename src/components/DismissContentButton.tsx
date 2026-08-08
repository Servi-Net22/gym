import { dismissContentAction } from "@/app/actions/client-portal";

/** Quitar info/aviso ya leído del listado del cliente. */
export function DismissContentButton({
  contentId,
  label = "Quitar",
  className,
}: {
  contentId: string;
  label?: string;
  className?: string;
}) {
  return (
    <form action={dismissContentAction.bind(null, contentId)}>
      <button
        type="submit"
        className={
          className ??
          "rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
        }
      >
        {label}
      </button>
    </form>
  );
}
