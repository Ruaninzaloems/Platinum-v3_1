-- Task #124: Align GL_Outbox & GL_Outbox_Lines to SQL Server supplied structure
-- Run once against the live database. All steps are idempotent-safe via DO blocks.

DO $$
BEGIN

-- ============================================================
-- STEP 1: Drop FK that pins GL_Outbox_Lines.GL_Outbox_ID
-- ============================================================
IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'GL_Outbox_Lines_GL_Outbox_ID_fkey'
) THEN
    ALTER TABLE "GL_Outbox_Lines" DROP CONSTRAINT "GL_Outbox_Lines_GL_Outbox_ID_fkey";
END IF;

-- ============================================================
-- STEP 2: Rename PK column GL_Outbox.GL_Outbox_ID → OutboxId
-- ============================================================
IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GL_Outbox' AND column_name = 'GL_Outbox_ID'
) THEN
    ALTER TABLE "GL_Outbox" RENAME COLUMN "GL_Outbox_ID" TO "OutboxId";
END IF;

-- ============================================================
-- STEP 3: Rename GL_Outbox_Lines PK and FK columns
-- ============================================================
IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'GL_Outbox_Line_ID'
) THEN
    ALTER TABLE "GL_Outbox_Lines" RENAME COLUMN "GL_Outbox_Line_ID" TO "LineId";
END IF;

IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'GL_Outbox_ID'
) THEN
    ALTER TABLE "GL_Outbox_Lines" RENAME COLUMN "GL_Outbox_ID" TO "OutboxId";
END IF;

-- ============================================================
-- STEP 4: Drop extra columns from GL_Outbox
-- ============================================================
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'SourceDocumentId') THEN
    ALTER TABLE "GL_Outbox" DROP COLUMN "SourceDocumentId";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'PostingDate') THEN
    ALTER TABLE "GL_Outbox" DROP COLUMN "PostingDate";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'FinancialYear') THEN
    ALTER TABLE "GL_Outbox" DROP COLUMN "FinancialYear";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'FinancialPeriod') THEN
    ALTER TABLE "GL_Outbox" DROP COLUMN "FinancialPeriod";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'CapturerId') THEN
    ALTER TABLE "GL_Outbox" DROP COLUMN "CapturerId";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'ProcessedAt') THEN
    ALTER TABLE "GL_Outbox" DROP COLUMN "ProcessedAt";
END IF;

-- ============================================================
-- STEP 5: Adjust GL_Outbox remaining columns
-- ============================================================
ALTER TABLE "GL_Outbox" ALTER COLUMN "EventType" TYPE VARCHAR(100);

UPDATE "GL_Outbox" SET "DocumentNumber" = '' WHERE "DocumentNumber" IS NULL;
ALTER TABLE "GL_Outbox" ALTER COLUMN "DocumentNumber" SET NOT NULL;
ALTER TABLE "GL_Outbox" ALTER COLUMN "DocumentNumber" SET DEFAULT '';

-- Rename ErrorMessage → LastError
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'ErrorMessage') THEN
    ALTER TABLE "GL_Outbox" RENAME COLUMN "ErrorMessage" TO "LastError";
END IF;
ALTER TABLE "GL_Outbox" ALTER COLUMN "LastError" TYPE VARCHAR(500);

-- Add new columns
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'DispatchedAt') THEN
    ALTER TABLE "GL_Outbox" ADD COLUMN "DispatchedAt" TIMESTAMPTZ;
END IF;
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'GLBatchId') THEN
    ALTER TABLE "GL_Outbox" ADD COLUMN "GLBatchId" UUID;
END IF;
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox' AND column_name = 'AcknowledgedAt') THEN
    ALTER TABLE "GL_Outbox" ADD COLUMN "AcknowledgedAt" TIMESTAMPTZ;
END IF;

-- ============================================================
-- STEP 6: Drop extra columns from GL_Outbox_Lines
-- ============================================================
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'VoteId') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "VoteId";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'DocumentNumber') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "DocumentNumber";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'SCOAFundsID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "SCOAFundsID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'SCOARegionID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "SCOARegionID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'SCOACostingID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "SCOACostingID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'SCOAProjectID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "SCOAProjectID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'SCOAFunctionID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "SCOAFunctionID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'SCOAItemID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "SCOAItemID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'DivisionID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "DivisionID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'ProjectID') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "ProjectID";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'AssetLinkId') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "AssetLinkId";
END IF;
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GL_Outbox_Lines' AND column_name = 'CreatedAt') THEN
    ALTER TABLE "GL_Outbox_Lines" DROP COLUMN "CreatedAt";
END IF;

-- ============================================================
-- STEP 7: Adjust GL_Outbox_Lines remaining columns
-- ============================================================
UPDATE "GL_Outbox_Lines" SET "Debit" = 0 WHERE "Debit" IS NULL;
UPDATE "GL_Outbox_Lines" SET "Credit" = 0 WHERE "Credit" IS NULL;
UPDATE "GL_Outbox_Lines" SET "ProcessingMonth" = 0 WHERE "ProcessingMonth" IS NULL;
UPDATE "GL_Outbox_Lines" SET "FinYear" = '' WHERE "FinYear" IS NULL;
UPDATE "GL_Outbox_Lines" SET "PlanProjectItemID" = 0 WHERE "PlanProjectItemID" IS NULL;

ALTER TABLE "GL_Outbox_Lines"
    ALTER COLUMN "Debit" SET NOT NULL,
    ALTER COLUMN "Debit" SET DEFAULT 0,
    ALTER COLUMN "Credit" SET NOT NULL,
    ALTER COLUMN "Credit" SET DEFAULT 0,
    ALTER COLUMN "ProcessingMonth" SET NOT NULL,
    ALTER COLUMN "FinYear" SET NOT NULL,
    ALTER COLUMN "PlanProjectItemID" SET NOT NULL,
    ALTER COLUMN "PlanProjectItemID" SET DEFAULT 0,
    ALTER COLUMN "VATRate" TYPE NUMERIC(5,2),
    ALTER COLUMN "VATRate" DROP NOT NULL;

-- ============================================================
-- STEP 8: Recreate FK constraint with new column name
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'GL_Outbox_Lines_OutboxId_fkey'
) THEN
    ALTER TABLE "GL_Outbox_Lines"
        ADD CONSTRAINT "GL_Outbox_Lines_OutboxId_fkey"
        FOREIGN KEY ("OutboxId") REFERENCES "GL_Outbox"("OutboxId");
END IF;

END $$;
