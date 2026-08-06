import { notFound } from "next/navigation";
import {
  sendEmployeeReceiptEmail,
  signEmployeeReceipt,
} from "@/app/actions/employee-receipts";
import { SignaturePad } from "@/components/SignaturePad";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { ButtonLink, PageHeader, Panel, SubmitButton } from "@/components/Ui";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  buildWhatsAppShareUrl,
  employeeDisplayName,
  receiptMethodLabel,
} from "@/lib/employee-receipts";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReciboDetallePage({
  params,
}: {
  params: Promise<{ id: string; receiptId: string }>;
}) {
  const { id, receiptId } = await params;
  const receipt = await prisma.employeeReceipt.findFirst({
    where: { id: receiptId, employeeId: id },
    include: {
      employee: true,
      registeredBy: { select: { name: true } },
    },
  });
  if (!receipt) notFound();

  const base = await getAppBaseUrl();
  const publicUrl = `${base}/recibo/${receipt.viewToken}`;
  const employeeName = employeeDisplayName(receipt.employee);
  const waText = `Hola ${receipt.employee.firstName}, te comparto tu recibo de sueldo (${formatCurrency(receipt.amount)}) del ${formatDate(receipt.periodFrom)} al ${formatDate(receipt.periodTo)}: ${publicUrl}`;
  const waHref = buildWhatsAppShareUrl(receipt.employee.phone, waText);

  const signAction = signEmployeeReceipt.bind(null, receipt.id);
  const emailAction = sendEmployeeReceiptEmail.bind(null, receipt.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Recibo ${receipt.id.slice(-8).toUpperCase()}`}
        description={employeeName}
        actions={
          <ButtonLink href={`/empleados/${id}`} variant="ghost">
            Volver a la ficha
          </ButtonLink>
        }
      />

      <Panel className="max-w-2xl space-y-3 text-sm">
        <p>
          <span className="text-[var(--muted)]">Período: </span>
          {formatDate(receipt.periodFrom)} → {formatDate(receipt.periodTo)}
        </p>
        <p>
          <span className="text-[var(--muted)]">Pago: </span>
          {formatDate(receipt.paidAt)} · {receiptMethodLabel(receipt.method)}
        </p>
        <p className="text-lg font-semibold">
          {formatCurrency(receipt.amount)}
        </p>
        {receipt.notes ? (
          <p>
            <span className="text-[var(--muted)]">Notas: </span>
            {receipt.notes}
          </p>
        ) : null}
        <p className="text-xs text-[var(--muted)]">
          Registró {receipt.registeredBy?.name ?? "—"} · Link público:{" "}
          <a href={publicUrl} className="underline" target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </p>
      </Panel>

      <Panel className="max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold">Firma del empleado</h2>
        {receipt.signatureData ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted)]">
              Firmó {receipt.signedName} el {formatDateTime(receipt.signedAt)}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receipt.signatureData}
              alt="Firma"
              className="max-w-xs rounded-md border border-[var(--line)] bg-white"
            />
            <details className="pt-2">
              <summary className="cursor-pointer text-sm font-semibold">
                Volver a firmar
              </summary>
              <div className="mt-3">
                <SignaturePad
                  action={signAction}
                  defaultSignedName={
                    receipt.signedName ?? employeeName.replace(",", "")
                  }
                />
              </div>
            </details>
          </div>
        ) : (
          <SignaturePad
            action={signAction}
            defaultSignedName={`${receipt.employee.firstName} ${receipt.employee.lastName}`}
          />
        )}
      </Panel>

      <Panel className="max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold">Enviar</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          El mail usa Resend. WhatsApp abre la app con el link del recibo (no
          requiere API de Meta).
        </p>
        <div className="flex flex-wrap gap-3">
          <form action={emailAction}>
            <SubmitButton disabled={!receipt.employee.email}>
              {receipt.emailSentAt
                ? "Reenviar por email"
                : "Enviar por email"}
            </SubmitButton>
          </form>
          <WhatsAppShareButton receiptId={receipt.id} href={waHref} />
        </div>
        {!receipt.employee.email ? (
          <p className="mt-2 text-xs text-rose-700">
            Cargá un email en la ficha del empleado para poder enviar el recibo.
          </p>
        ) : null}
        {!receipt.employee.phone ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Sin teléfono: WhatsApp pedirá elegir el contacto a mano.
          </p>
        ) : null}
        {(receipt.emailSentAt || receipt.whatsappOpenedAt) && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            {receipt.emailSentAt
              ? `Email: ${formatDateTime(receipt.emailSentAt)}. `
              : ""}
            {receipt.whatsappOpenedAt
              ? `WhatsApp: ${formatDateTime(receipt.whatsappOpenedAt)}.`
              : ""}
          </p>
        )}
      </Panel>
    </div>
  );
}
