-- Prior Year Adjustments Migration

-- New transaction type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "AssetConfig_TransactionType" WHERE "AssetConfig_TransactionType_ID" = 8) THEN
        INSERT INTO "AssetConfig_TransactionType" ("AssetConfig_TransactionType_ID", "Name", "Enabled", "Default")
        VALUES (8, 'Prior Year Adjustments', 1, 0);
    END IF;
END $$;

-- New document types for each PY sub-type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1010) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1010, 'Cost Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1011) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1011, 'Revaluation Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1012) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1012, 'Acquisition Date Correction');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1013) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1013, 'Residual Value Correction');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1014) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1014, 'Impairment Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1015) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1015, 'Impairment Reversal Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1016) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1016, 'Disposal Adjustment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Const_DocumentType" WHERE "DocumentType_ID" = 1017) THEN
        INSERT INTO "Const_DocumentType" ("DocumentType_ID", "DocumentTypeDesc") VALUES (1017, 'Deemed Cost New Asset');
    END IF;
END $$;

-- New journal transaction type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Const_AssetJournalTransactionType_Sys" WHERE "AssetJournalTransactionType_ID" = 36) THEN
        INSERT INTO "Const_AssetJournalTransactionType_Sys" ("AssetJournalTransactionType_ID", "AssetJournalTransactionDesc", "Const_DocumentTypeID")
        VALUES (36, 'Asset Prior Year Adjustment', 1010);
    END IF;
END $$;

-- Main prior year adjustment table
CREATE TABLE IF NOT EXISTS "Asset_PriorYearAdjustment" (
    "PriorYearAdjustment_ID"        SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID"          INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "AdjustmentTypeCode"            VARCHAR(30),
    "Status"                        VARCHAR(50) DEFAULT 'Pending',
    "EffectiveDate"                 TIMESTAMP,
    "FinYear"                       VARCHAR(9),

    -- Type-specific inputs
    "NewCostAmount"                 NUMERIC(18,2),
    "NewValuationAmount"            NUMERIC(18,2),
    "NewRUL"                        NUMERIC(18,8),
    "NewAcquisitionDate"            TIMESTAMP,
    "NewResidualValue"              NUMERIC(18,2),
    "ResidualValueEffectiveDate"    TIMESTAMP,
    "NewImpairmentAmount"           NUMERIC(18,2),
    "ImpairmentEffectiveDate"       TIMESTAMP,
    "DisposalDate"                  TIMESTAMP,
    "DisposalReason"                VARCHAR(500),
    "DisposalProceeds"              NUMERIC(18,2),

    -- Current values snapshot (at time of capture)
    "SnapshotCost"                  NUMERIC(18,2),
    "SnapshotAccDep"                NUMERIC(18,2),
    "SnapshotAccImp"                NUMERIC(18,2),
    "SnapshotCarryingAmount"        NUMERIC(18,2),
    "SnapshotResidualValue"         NUMERIC(18,2),
    "SnapshotRUL"                   NUMERIC(18,8),
    "SnapshotRR"                    NUMERIC(18,2),
    "SnapshotEUL"                   NUMERIC(18,8),

    -- Period-split calculated amounts (for FS disclosure)
    "CurrentPeriod_CostDelta"       NUMERIC(18,2),
    "CurrentPeriod_AccDepDelta"     NUMERIC(18,2),
    "CurrentPeriod_AccImpDelta"     NUMERIC(18,2),
    "CurrentPeriod_RRDelta"         NUMERIC(18,2),
    "CurrentPeriod_DepChargeDelta"  NUMERIC(18,2),

    "ComparativePeriod_CostDelta"          NUMERIC(18,2),
    "ComparativePeriod_AccDepDelta"        NUMERIC(18,2),
    "ComparativePeriod_AccImpDelta"        NUMERIC(18,2),
    "ComparativePeriod_RRDelta"            NUMERIC(18,2),
    "ComparativePeriod_DepChargeDelta"     NUMERIC(18,2),

    "PriorPeriods_CostDelta"        NUMERIC(18,2),
    "PriorPeriods_AccDepDelta"      NUMERIC(18,2),
    "PriorPeriods_AccImpDelta"      NUMERIC(18,2),
    "PriorPeriods_RRDelta"          NUMERIC(18,2),
    "PriorPeriods_DepChargeDelta"   NUMERIC(18,2),

    -- Warnings
    "HasResidualValueWarning"       BOOLEAN DEFAULT FALSE,
    "HasImpairmentWarning"          BOOLEAN DEFAULT FALSE,

    -- GL legs (optional)
    "DrPlanProjectItemID"           INTEGER,
    "CrPlanProjectItemID"           INTEGER,

    -- Approval
    "ApprovedBy"                    INTEGER,
    "ApprovedDate"                  TIMESTAMP,
    "RejectionReason"               TEXT,
    "RejectedBy"                    INTEGER,
    "RejectedDate"                  TIMESTAMP,
    "Comments"                      TEXT,

    -- Audit
    "DateCaptured"                  TIMESTAMP DEFAULT NOW(),
    "CapturerID"                    INTEGER DEFAULT 1,
    "DateModified"                  TIMESTAMP,
    "ModifierID"                    INTEGER
);

-- Add FK constraint to existing tables (idempotent — skipped if already present)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'Asset_PriorYearAdjustment'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'Asset_PriorYearAdjustment_AssetRegisterItem_ID_fkey'
    ) THEN
        ALTER TABLE "Asset_PriorYearAdjustment"
            ADD CONSTRAINT "Asset_PriorYearAdjustment_AssetRegisterItem_ID_fkey"
            FOREIGN KEY ("AssetRegisterItem_ID") REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID");
    END IF;
END $$;

-- Rename CompPeriod_ columns to ComparativePeriod_ (idempotent — skipped if already renamed)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_PriorYearAdjustment' AND column_name='CompPeriod_CostDelta') THEN
        ALTER TABLE "Asset_PriorYearAdjustment" RENAME COLUMN "CompPeriod_CostDelta" TO "ComparativePeriod_CostDelta";
        ALTER TABLE "Asset_PriorYearAdjustment" RENAME COLUMN "CompPeriod_AccDepDelta" TO "ComparativePeriod_AccDepDelta";
        ALTER TABLE "Asset_PriorYearAdjustment" RENAME COLUMN "CompPeriod_AccImpDelta" TO "ComparativePeriod_AccImpDelta";
        ALTER TABLE "Asset_PriorYearAdjustment" RENAME COLUMN "CompPeriod_RRDelta" TO "ComparativePeriod_RRDelta";
        ALTER TABLE "Asset_PriorYearAdjustment" RENAME COLUMN "CompPeriod_DepChargeDelta" TO "ComparativePeriod_DepChargeDelta";
    END IF;
END $$;

-- Supporting documents table
CREATE TABLE IF NOT EXISTS "Asset_PriorYearAdjustment_Documents" (
    "Document_ID"                   SERIAL PRIMARY KEY,
    "PriorYearAdjustment_ID"        INTEGER REFERENCES "Asset_PriorYearAdjustment"("PriorYearAdjustment_ID"),
    "FileName"                      VARCHAR(500),
    "StoredFileName"                VARCHAR(500),
    "FileSizeBytes"                 INTEGER,
    "ContentType"                   VARCHAR(100),
    "UploadedDate"                  TIMESTAMP DEFAULT NOW(),
    "UploadedBy"                    INTEGER DEFAULT 1
);
