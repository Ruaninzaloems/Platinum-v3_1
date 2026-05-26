-- Task #127: Planned Maintenance DB schema
-- Run as Patch 6 in ApplyPatchMigrationsAsync (idempotent via IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- Lookup tables also exist in Schema.sql (created there for fresh installs); patch is the safety net for
-- existing environments running SKIP_DB_INIT=true.

-- Lookup: Maintenance Types
CREATE TABLE IF NOT EXISTS "Const_Maint_Type" (
    "MaintTypeID"   SERIAL PRIMARY KEY,
    "MaintTypeDesc" VARCHAR(100) NOT NULL,
    "IsCapex"       BOOLEAN NOT NULL DEFAULT FALSE,
    "Enabled"       BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder"     INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "Const_Maint_Type" ("MaintTypeID", "MaintTypeDesc", "IsCapex", "SortOrder")
VALUES
    (1, 'Preventative', FALSE, 1),
    (2, 'Corrective',   FALSE, 2),
    (3, 'Predictive',   FALSE, 3),
    (4, 'Emergency',    FALSE, 4),
    (5, 'Renewal',      TRUE,  5)
ON CONFLICT ("MaintTypeID") DO NOTHING;

-- Lookup: Maintenance Frequencies
CREATE TABLE IF NOT EXISTS "Const_Maint_Frequency" (
    "FrequencyID"   SERIAL PRIMARY KEY,
    "FrequencyDesc" VARCHAR(50) NOT NULL,
    "IntervalDays"  INTEGER NOT NULL,
    "Enabled"       BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder"     INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "Const_Maint_Frequency" ("FrequencyID", "FrequencyDesc", "IntervalDays", "SortOrder")
VALUES
    (1,  'Daily',     1,    1),
    (2,  'Weekly',    7,    2),
    (3,  'Monthly',   30,   3),
    (4,  'Quarterly', 91,   4),
    (5,  'Bi-Annual', 182,  5),
    (6,  'Annual',    365,  6),
    (7,  '2-Year',    730,  7),
    (8,  '3-Year',    1095, 8),
    (9,  '5-Year',    1825, 9),
    (10, '10-Year',   3650, 10)
ON CONFLICT ("FrequencyID") DO NOTHING;

-- Core: Planned Maintenance Plans (one plan per asset/type combination)
-- NOTE: AssetRegisterItemID and PlanProjectItemID have NO inline REFERENCES here because
-- this patch runs BEFORE Schema.sql on fresh installs and those tables may not exist yet.
-- The FK constraints are added safely via the DO blocks below.
CREATE TABLE IF NOT EXISTS "Planned_Maint_Plan" (
    "PlanID"               SERIAL PRIMARY KEY,
    "AssetRegisterItemID"  INTEGER,
    "MaintenanceTypeID"    INTEGER NOT NULL REFERENCES "Const_Maint_Type"("MaintTypeID"),
    "FrequencyID"          INTEGER NOT NULL REFERENCES "Const_Maint_Frequency"("FrequencyID"),
    "PlanName"             VARCHAR(200) NOT NULL,
    "Description"          VARCHAR(1000),
    "EstimatedCost"        NUMERIC(18,2),
    "PlanProjectItemID"    INTEGER,
    "IsActive"             BOOLEAN NOT NULL DEFAULT TRUE,
    "StartDate"            DATE NOT NULL DEFAULT CURRENT_DATE,
    "CreatedDate"          TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedBy"            INTEGER NOT NULL DEFAULT 1,
    "ModifiedDate"         TIMESTAMP,
    "ModifiedBy"           INTEGER
);

-- Core: Activities within a plan
CREATE TABLE IF NOT EXISTS "Planned_Maint_Activity" (
    "ActivityID"          SERIAL PRIMARY KEY,
    "PlanID"              INTEGER NOT NULL REFERENCES "Planned_Maint_Plan"("PlanID") ON DELETE CASCADE,
    "ActivityName"        VARCHAR(200) NOT NULL,
    "ActivityDescription" VARCHAR(1000),
    "EstimatedDuration"   VARCHAR(50),
    "SortOrder"           INTEGER NOT NULL DEFAULT 0
);

-- Core: Generated schedule instances
CREATE TABLE IF NOT EXISTS "Planned_Maint_Schedule" (
    "ScheduleID"    SERIAL PRIMARY KEY,
    "PlanID"        INTEGER NOT NULL REFERENCES "Planned_Maint_Plan"("PlanID") ON DELETE CASCADE,
    "ScheduledDate" DATE NOT NULL,
    "Status"        VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    "ActualDate"    DATE,
    "ActualCost"    NUMERIC(18,2),
    "Notes"         VARCHAR(1000),
    "CompletedBy"   INTEGER,
    "CreatedDate"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Patch: Enforce NOT NULL on MaintenanceTypeID and FrequencyID for existing installations
-- (table may have been created without NOT NULL if patch ran before this version)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='Planned_Maint_Plan' AND column_name='MaintenanceTypeID' AND is_nullable='YES') THEN
        ALTER TABLE "Planned_Maint_Plan" ALTER COLUMN "MaintenanceTypeID" SET NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='Planned_Maint_Plan' AND column_name='FrequencyID' AND is_nullable='YES') THEN
        ALTER TABLE "Planned_Maint_Plan" ALTER COLUMN "FrequencyID" SET NOT NULL;
    END IF;
END$$;

-- Patch: Add missing FK constraints to Planned_Maint_Plan for existing installations
-- (table may have been created without FKs if patch ran before this version)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Planned_Maint_Plan_AssetRegisterItemID_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset_Register_Items') THEN
            ALTER TABLE "Planned_Maint_Plan"
                ADD CONSTRAINT "Planned_Maint_Plan_AssetRegisterItemID_fkey"
                FOREIGN KEY ("AssetRegisterItemID") REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID");
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Planned_Maint_Plan_PlanProjectItemID_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Plan_ProjectItem') THEN
            ALTER TABLE "Planned_Maint_Plan"
                ADD CONSTRAINT "Planned_Maint_Plan_PlanProjectItemID_fkey"
                FOREIGN KEY ("PlanProjectItemID") REFERENCES "Plan_ProjectItem"("PlanProjectItem_ID");
        END IF;
    END IF;
END$$;

-- Patch: Add nullable PlannedScheduleID FK to Asset_MaintenanceWorkOrder
-- Wrapped in DO block because Asset_MaintenanceWorkOrder is created by Schema.sql which
-- runs AFTER this patch on fresh installs.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset_MaintenanceWorkOrder') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'Asset_MaintenanceWorkOrder' AND column_name = 'PlannedScheduleID') THEN
            ALTER TABLE "Asset_MaintenanceWorkOrder"
                ADD COLUMN "PlannedScheduleID" INTEGER REFERENCES "Planned_Maint_Schedule"("ScheduleID");
        END IF;
    END IF;
END$$;

-- Patch: Make RequestID nullable on Asset_MaintenanceWorkOrder so planned work orders
-- (with no parent maintenance request) can be inserted.
-- The FK constraint itself is PRESERVED — non-NULL values must still reference a valid request.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset_MaintenanceWorkOrder') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Asset_MaintenanceWorkOrder' AND column_name = 'RequestID' AND is_nullable = 'NO') THEN
            ALTER TABLE "Asset_MaintenanceWorkOrder" ALTER COLUMN "RequestID" DROP NOT NULL;
        END IF;
    END IF;
END$$;

-- Task #130: Multi-asset plans — junction table
-- AssetRegisterItemID on Planned_Maint_Plan is kept NULLABLE (legacy single-asset plans).
-- New rows in Planned_Maint_Plan_Asset represent the multi-asset associations.
CREATE TABLE IF NOT EXISTS "Planned_Maint_Plan_Asset" (
    "PlanAssetID"          SERIAL PRIMARY KEY,
    "PlanID"               INTEGER NOT NULL REFERENCES "Planned_Maint_Plan"("PlanID") ON DELETE CASCADE,
    "AssetRegisterItemID"  INTEGER NOT NULL,
    "SortOrder"            INTEGER NOT NULL DEFAULT 0
);

-- Unique index: each asset can only appear once per plan
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_plan_asset_plan_asset') THEN
        CREATE UNIQUE INDEX ix_plan_asset_plan_asset
            ON "Planned_Maint_Plan_Asset"("PlanID", "AssetRegisterItemID");
    END IF;
END$$;

-- FK constraint on Planned_Maint_Plan_Asset.AssetRegisterItemID
-- Wrapped in DO block because Asset_Register_Items is created by Schema.sql which runs AFTER this patch on fresh installs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Planned_Maint_Plan_Asset_AssetRegisterItemID_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset_Register_Items') THEN
            ALTER TABLE "Planned_Maint_Plan_Asset"
                ADD CONSTRAINT "Planned_Maint_Plan_Asset_AssetRegisterItemID_fkey"
                FOREIGN KEY ("AssetRegisterItemID") REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID");
        END IF;
    END IF;
END$$;

-- Migrate existing single-asset plans into the junction table
-- Only migrate rows where the referenced asset actually exists (FK safety)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset_Register_Items') THEN
        INSERT INTO "Planned_Maint_Plan_Asset" ("PlanID", "AssetRegisterItemID", "SortOrder")
        SELECT p."PlanID", p."AssetRegisterItemID", 0
        FROM "Planned_Maint_Plan" p
        WHERE p."AssetRegisterItemID" IS NOT NULL
          AND EXISTS (SELECT 1 FROM "Asset_Register_Items" ar
                      WHERE ar."AssetRegisterItem_ID" = p."AssetRegisterItemID")
        ON CONFLICT ("PlanID", "AssetRegisterItemID") DO NOTHING;
    END IF;
END$$;
