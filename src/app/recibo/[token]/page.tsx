import { notFound } from "next/navigation";
import { signEmployeeReceiptByToken } from "@/app/actions/employee-receipts";
import { PrintButton } from "@/components/PrintButton";
import { ReceiptDocument } from "@/components/ReceiptDocument";
import { SignaturePad } from "@/components/SignaturePad";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicReciboPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ firmado?: string }>;
}) {
  const { token } = await params;
  const { firmado } = await searchParams;
  const receipt = await prisma.employeeReceipt.findUnique({
    where: { viewToken: token },
    include: { employee: true },
  });
  if (!receipt) notFound();

  const gym = process.env.NEXT_PUBLIC_APP_NAME ?? "GymFlow";
  const signAction = signEmployeeReceiptByToken.bind(null, token);
  const justSigned = firmado === "1";

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8 print:min-h-0 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            {gym}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {receipt.signatureData
              ? "Recibo firmado — podés guardarlo o imprimirlo"
              : "Revisá los datos y firmá abajo"}
          </p>
        </div>
        <PrintButton />
      </div>

      {justSigned ? (
        <p className="no-print mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 print:hidden">
          Firma guardada. Ya podés imprimir o guardar el recibo como PDF.
        </p>
      ) : null}

      <ReceiptDocument
        receipt={receipt}
        employee={receipt.employee}
        gymName={gym}
      />

      {!receipt.signatureData ? (
        <section className="no-print mt-5 rounded-2xl border border-[var(--line)] bg-white p-5 print:hidden">
          <h2 className="mb-1 text-lg font-semibold">Tu firma</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Firmá con el dedo o el mouse. Con eso confirmás haber recibido el
            pago.
          </p>
          <SignaturePad
            action={signAction}
            defaultSignedName={`${receipt.employee.firstName} ${receipt.employee.lastName}`}
            submitLabel="Firmar y confirmar recepción"
          />
        </section>
      ) : (
        <div className="no-print mt-5 flex justify-center print:hidden">
          <PrintButton label="Imprimir o guardar como PDF" />
        </div>
      )}
    </div>
  );
}
