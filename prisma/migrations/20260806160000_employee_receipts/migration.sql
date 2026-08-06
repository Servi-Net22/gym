-- CreateEnum
CREATE TYPE "EmployeeReceiptStatus" AS ENUM ('draft', 'signed', 'sent');

-- CreateTable
CREATE TABLE "EmployeeReceipt" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'transferencia',
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "status" "EmployeeReceiptStatus" NOT NULL DEFAULT 'draft',
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedName" TEXT,
    "viewToken" TEXT NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "whatsappOpenedAt" TIMESTAMP(3),
    "registeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeReceipt_viewToken_key" ON "EmployeeReceipt"("viewToken");

-- CreateIndex
CREATE INDEX "EmployeeReceipt_employeeId_paidAt_idx" ON "EmployeeReceipt"("employeeId", "paidAt");

-- AddForeignKey
ALTER TABLE "EmployeeReceipt" ADD CONSTRAINT "EmployeeReceipt_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReceipt" ADD CONSTRAINT "EmployeeReceipt_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployeeReceipt" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "EmployeeReceipt" FROM anon, authenticated;
