-- CreateTable
CREATE TABLE "ContentDismiss" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentDismiss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentDismiss_clientId_idx" ON "ContentDismiss"("clientId");

-- CreateIndex
CREATE INDEX "ContentDismiss_organizationId_idx" ON "ContentDismiss"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentDismiss_contentId_clientId_key" ON "ContentDismiss"("contentId", "clientId");

-- AddForeignKey
ALTER TABLE "ContentDismiss" ADD CONSTRAINT "ContentDismiss_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDismiss" ADD CONSTRAINT "ContentDismiss_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDismiss" ADD CONSTRAINT "ContentDismiss_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lock down PostgREST (same pattern as other tables)
ALTER TABLE "ContentDismiss" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "ContentDismiss" FROM anon, authenticated;
