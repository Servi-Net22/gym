import { notFound } from "next/navigation";
import {
  sendEmployeeReceiptEmail,
  signEmployeeReceipt,
} from "@/app/actions/employee-receipts";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { PrintButton } from "@/components/PrintButton";
import { ReceiptDocument } from "@/components/ReceiptDocument";
import { SignaturePad } from "@/components/SignaturePad";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { ButtonLink, PageHeader, Panel, SubmitButton } from "@/components/Ui";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  buildReceiptWhatsAppText,
  buildWhatsAppShareUrl,
  employeeDisplayName,
} from "@/lib/employee-receipts";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

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
  const signed = Boolean(receipt.signatureData);
  const waText = buildReceiptWhatsAppText({
    firstName: receipt.employee.firstName,
    amount: receipt.amount,
    periodFrom: receipt.periodFrom,
    periodTo: receipt.periodTo,
    receiptUrl: publicUrl,
    signed,
  });
  const waHref = buildWhatsAppShareUrl(receipt.employee.phone, waText);

  const signAction = signEmployeeReceipt.bind(null, receipt.id);
  const emailAction = sendEmployeeReceiptEmail.bind(null, receipt.id);
  const gym = process.env.NEXT_PUBLIC_APP_NAME ?? "GymFlow";

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="no-print space-y-6 print:hidden">
        <PageHeader
          title={`Recibo ${receipt.id.slice(-8).toUpperCase()}`}
          description={employeeName}
          actions={
            <ButtonLink href={`/empleados/${id}`} variant="ghost">
              Volver a la ficha
            </ButtonLink>
          }
        />

        <Panel className="max-w-2xl space-y-3">
          <p className="text-sm text-[var(--muted)]">
            1) Firmá acá o enviá el link al empleado · 2) Enviá por email o
            WhatsApp · 3) Queda en el historial de la ficha.
          </p>
          <p className="text-xs text-[var(--muted)]">
            Registró {receipt.registeredBy?.name ?? "—"}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
            >
              Abrir link del empleado
            </a>
            <CopyLinkButton url={publicUrl} />
            <PrintButton label="Imprimir vista" />
          </div>
        </Panel>
      </div>

      <div className="max-w-2xl print:max-w-none">
        <ReceiptDocument
          receipt={receipt}
          employee={receipt.employee}
          gymName={gym}
        />
      </div>

      <div className="no-print space-y-6 print:hidden">
        <Panel className="max-w-2xl">
          <h2 className="mb-1 text-lg font-semibold">Firma</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Podés firmar acá (en recepción) o mandarle el link para que firme en
            su celular.
          </p>
          {signed ? (
            <div className="space-y-2">
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Firmado por {receipt.signedName} el{" "}
                {formatDateTime(receipt.signedAt)}
              </p>
              <details className="pt-1">
                <summary className="cursor-pointer text-sm font-semibold">
                  Volver a firmar
                </summary>
                <div className="mt-3">
                  <SignaturePad
                    action={signAction}
                    defaultSignedName={
                      receipt.signedName ??
                      `${receipt.employee.firstName} ${receipt.employee.lastName}`
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
          <h2 className="mb-1 text-lg font-semibold">Enviar al empleado</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            {signed
              ? "El mensaje incluye el recibo firmado y el link para verlo/imprimirlo."
              : "El mensaje pide al empleado que abra el link y firme en pantalla."}
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={emailAction}>
              <SubmitButton disabled={!receipt.employee.email}>
                {receipt.emailSentAt
                  ? signed
                    ? "Reenviar recibo por email"
                    : "Reenviar pedido de firma"
                  : signed
                    ? "Enviar recibo por email"
                    : "Enviar para firmar (email)"}
              </SubmitButton>
            </form>
            <WhatsAppShareButton
              receiptId={receipt.id}
              href={waHref}
              label={
                signed ? "Enviar por WhatsApp" : "WhatsApp: pedir firma"
              }
            />
          </div>
          {!receipt.employee.email ? (
            <p className="mt-2 text-xs text-rose-700">
              Cargá un email en la ficha del empleado para poder enviar el
              recibo.
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
    </div>
  );
}
