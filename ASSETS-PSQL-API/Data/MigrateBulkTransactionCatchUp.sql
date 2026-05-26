ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "CatchUpDep" DECIMAL(18,2);
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "CatchUpDays" INTEGER;
