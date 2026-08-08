-- CreateEnum
CREATE TYPE "ContentLevel" AS ENUM ('principiante', 'intermedio', 'avanzado');

-- CreateEnum
CREATE TYPE "ContentGender" AS ENUM ('hombre', 'mujer', 'todos');

-- AlterTable
ALTER TABLE "Content" ADD COLUMN "level" "ContentLevel",
ADD COLUMN "gender" "ContentGender" NOT NULL DEFAULT 'todos',
ADD COLUMN "daysPerWeek" INTEGER,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "videoTitle" TEXT;

-- CreateIndex
CREATE INDEX "Content_organizationId_type_idx" ON "Content"("organizationId", "type");
