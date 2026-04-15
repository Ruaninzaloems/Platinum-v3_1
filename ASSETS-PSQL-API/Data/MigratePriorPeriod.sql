-- Prior Period Adjustments Migration

-- New transaction type (ID=9)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "AssetConfig_TransactionType" WHERE "AssetConfig_TransactionType_ID" = 9) THEN
        INSERT INTO "AssetConfig_TransactionType" ("AssetConfig_TransactionType_ID", "Name", "Enabled", "Default")
        VALUES (9, 'Prior Period Adjustments', 1, 0);
    END IF;
END $$;

-- New document types for PPA sub-types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1020) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1020, 'PPA Depreciation Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1021) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1021, 'PPA Cost Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1022) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1022, 'PPA Impairment Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1023) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1023, 'PPA Impairment Reversal Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1024) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1024, 'PPA Revaluation Adjustment');
    END IF;
END $$;

-- New journal transaction type (ID=37)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Const_AssetJournalTransactionType_Sys" WHERE "AssetJournalTransactionType_ID" = 37) THEN
        INSERT INTO "Const_AssetJournalTransactionType_Sys" ("AssetJournalTransactionType_ID", "AssetJournalTransactionDesc", "Const_DocumentTypeID")
        VALUES (37, 'Asset Prior Period Adjustment', 1020);
    END IF;
END $$;

-- Main prior period adjustment table
CREATE TABLE IF NOT EXISTS "Asset_PriorPeriodAdjustment" (
    "PriorPeriodAdjustment_ID"      SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID"          INTEGER,
    "AdjustmentTypeCode"            VARCHAR(30),
    "Status"                        VARCHAR(50) DEFAULT 'Pending',
    "TargetFinYear"                 VARCHAR(9),
    "TargetFinPeriod"               INTEGER,

    "TransactionDate"               TIMESTAMP,
    "DebitAmount"                    NUMERIC(18,2),
    "CreditAmount"                  NUMERIC(18,2),
    "Narration"                     TEXT,

    "AdjustmentAmount"              NUMERIC(18,2),
    "NewDepreciationAmount"         NUMERIC(18,2),
    "NewCostAmount"                 NUMERIC(18,2),
    "NewImpairmentAmount"           NUMERIC(18,2),
    "NewImpairmentReversalAmount"   NUMERIC(18,2),
    "NewRevaluationAmount"          NUMERIC(18,2),

    "SnapshotCost"                  NUMERIC(18,2),
    "SnapshotAccDep"                NUMERIC(18,2),
    "SnapshotAccImp"                NUMERIC(18,2),
    "SnapshotCarryingAmount"        NUMERIC(18,2),
    "SnapshotResidualValue"         NUMERIC(18,2),
    "SnapshotRUL"                   NUMERIC(18,8),
    "SnapshotRR"                    NUMERIC(18,2),

    "DownstreamImpactCount"         INTEGER DEFAULT 0,
    "DownstreamImpactTypes"         TEXT,

    "DrPlanProjectItemID"           INTEGER,
    "CrPlanProjectItemID"           INTEGER,

    "ApprovedBy"                    INTEGER,
    "ApprovedDate"                  TIMESTAMP,
    "RejectionReason"               TEXT,
    "RejectedBy"                    INTEGER,
    "RejectedDate"                  TIMESTAMP,
    "Comments"                      TEXT,

    "DateCaptured"                  TIMESTAMP DEFAULT NOW(),
    "CapturerID"                    INTEGER DEFAULT 1,
    "DateModified"                  TIMESTAMP,
    "ModifierID"                    INTEGER
);

-- Add new columns if they don't exist (for existing installations)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset_PriorPeriodAdjustment' AND column_name = 'TransactionDate') THEN
        ALTER TABLE "Asset_PriorPeriodAdjustment" ADD COLUMN "TransactionDate" TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset_PriorPeriodAdjustment' AND column_name = 'DebitAmount') THEN
        ALTER TABLE "Asset_PriorPeriodAdjustment" ADD COLUMN "DebitAmount" NUMERIC(18,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset_PriorPeriodAdjustment' AND column_name = 'CreditAmount') THEN
        ALTER TABLE "Asset_PriorPeriodAdjustment" ADD COLUMN "CreditAmount" NUMERIC(18,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset_PriorPeriodAdjustment' AND column_name = 'Narration') THEN
        ALTER TABLE "Asset_PriorPeriodAdjustment" ADD COLUMN "Narration" TEXT;
    END IF;
END $$;
