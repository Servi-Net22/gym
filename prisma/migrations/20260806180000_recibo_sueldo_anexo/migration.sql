-- AlterTable Employee: datos laborales para recibo estilo anexo
ALTER TABLE "Employee" ADD COLUMN "cuil" TEXT;
ALTER TABLE "Employee" ADD COLUMN "legajo" TEXT;
ALTER TABLE "Employee" ADD COLUMN "categoriaLaboral" TEXT;

-- AlterTable EmployeeReceipt: bruto, quincena y líneas JSON
ALTER TABLE "EmployeeReceipt" ADD COLUMN "sueldoBruto" DOUBLE PRECISION;
ALTER TABLE "EmployeeReceipt" ADD COLUMN "quincena" INTEGER;
ALTER TABLE "EmployeeReceipt" ADD COLUMN "employerLines" JSONB;
ALTER TABLE "EmployeeReceipt" ADD COLUMN "employeeLines" JSONB;

-- Recibos previos: el monto guardado se trataba como neto; usamos ese valor como bruto aproximado
UPDATE "EmployeeReceipt" SET "sueldoBruto" = "amount" WHERE "sueldoBruto" IS NULL;
ALTER TABLE "EmployeeReceipt" ALTER COLUMN "sueldoBruto" SET NOT NULL;
