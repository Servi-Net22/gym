-- CreateTable
CREATE TABLE "ContentRead" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentRead_clientId_idx" ON "ContentRead"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRead_contentId_clientId_key" ON "ContentRead"("contentId", "clientId");

-- AddForeignKey
ALTER TABLE "ContentRead" ADD CONSTRAINT "ContentRead_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRead" ADD CONSTRAINT "ContentRead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lock down PostgREST (same pattern as other tables)
ALTER TABLE "ContentRead" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "ContentRead" FROM anon, authenticated;
