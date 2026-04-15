DROP TABLE IF EXISTS "analytics_cache" CASCADE;
DROP TABLE IF EXISTS "Const_ReferenceData_sys" CASCADE;
DROP TABLE IF EXISTS "user_sessions" CASCADE;
DROP TABLE IF EXISTS "wip_projects" CASCADE;
DROP TABLE IF EXISTS "asset_categories" CASCADE;
DROP TABLE IF EXISTS "asset_departments" CASCADE;
DROP TABLE IF EXISTS "asset_locations" CASCADE;
DROP TABLE IF EXISTS "asset_transactions" CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'led_vote_vote_id_seq') THEN
        CREATE SEQUENCE led_vote_vote_id_seq;
        PERFORM setval('led_vote_vote_id_seq', COALESCE((SELECT MAX("Vote_ID") FROM "Led_Vote"), 0) + 1, false);
    END IF;
    IF (SELECT column_default FROM information_schema.columns WHERE table_name = 'Led_Vote' AND column_name = 'Vote_ID') IS NULL THEN
        ALTER TABLE "Led_Vote" ALTER COLUMN "Vote_ID" SET DEFAULT nextval('led_vote_vote_id_seq');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset_Register_Items' AND column_name = 'UsefulLifeYearComponent' AND data_type = 'integer') THEN
        ALTER TABLE "Asset_Register_Items"
            ALTER COLUMN "UsefulLifeYearComponent" TYPE NUMERIC(18,8) USING "UsefulLifeYearComponent"::NUMERIC(18,8),
            ALTER COLUMN "UsefulLifeMonthComponent" TYPE NUMERIC(18,8) USING "UsefulLifeMonthComponent"::NUMERIC(18,8),
            ALTER COLUMN "RemainingUsefulLifeYearComponent" TYPE NUMERIC(18,8) USING "RemainingUsefulLifeYearComponent"::NUMERIC(18,8),
            ALTER COLUMN "RemainingUsefulLifeMonthComponent" TYPE NUMERIC(18,8) USING "RemainingUsefulLifeMonthComponent"::NUMERIC(18,8),
            ALTER COLUMN "RemainingUsefulLifeAtTakeOn" TYPE NUMERIC(18,8) USING "RemainingUsefulLifeAtTakeOn"::NUMERIC(18,8);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset_Register_Items_Approval' AND column_name = 'UsefulLifeYearComponent' AND data_type = 'integer') THEN
        ALTER TABLE "Asset_Register_Items_Approval"
            ALTER COLUMN "UsefulLifeYearComponent" TYPE NUMERIC(18,8) USING "UsefulLifeYearComponent"::NUMERIC(18,8),
            ALTER COLUMN "UsefulLifeMonthComponent" TYPE NUMERIC(18,8) USING "UsefulLifeMonthComponent"::NUMERIC(18,8),
            ALTER COLUMN "RemainingUsefulLifeYearComponent" TYPE NUMERIC(18,8) USING "RemainingUsefulLifeYearComponent"::NUMERIC(18,8),
            ALTER COLUMN "RemainingUsefulLifeMonthComponent" TYPE NUMERIC(18,8) USING "RemainingUsefulLifeMonthComponent"::NUMERIC(18,8),
            ALTER COLUMN "RemainingUsefulLifeAtTakeOn" TYPE NUMERIC(18,8) USING "RemainingUsefulLifeAtTakeOn"::NUMERIC(18,8);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset_Register_Items') THEN
        ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DisposalCarryingAmount";
        ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DisposalSalePrice";
        ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DisposalProfitLoss";
    END IF;
END $$;

DO $$
DECLARE
    keep_id INT;
    fy TEXT;
BEGIN
    FOR fy IN
        SELECT "FinYear" FROM "Asset_DepreciationSchedule"
        GROUP BY "FinYear" HAVING COUNT(*) > 1
    LOOP
        SELECT MIN("DepreciationSchedule_ID") INTO keep_id
        FROM "Asset_DepreciationSchedule" WHERE "FinYear" = fy;

        UPDATE "Asset_DepreciationSchedule_Item"
        SET "DepreciationSchedule_ID" = keep_id, "Asset_DepreciationSchedule_ID" = keep_id
        WHERE "DepreciationSchedule_ID" IN (
            SELECT "DepreciationSchedule_ID" FROM "Asset_DepreciationSchedule"
            WHERE "FinYear" = fy AND "DepreciationSchedule_ID" != keep_id
        );

        UPDATE "Asset_Depreciation"
        SET "Depreciation_ScheduledItemID" = si."DepreciationScheduleItem_ID"
        FROM "Asset_DepreciationSchedule_Item" si
        WHERE "Asset_Depreciation"."Depreciation_ScheduledItemID" IN (
            SELECT "DepreciationScheduleItem_ID" FROM "Asset_DepreciationSchedule_Item"
            WHERE "DepreciationSchedule_ID" = keep_id
        )
        AND si."DepreciationSchedule_ID" = keep_id
        AND si."DepreciationScheduleItem_ID" = "Asset_Depreciation"."Depreciation_ScheduledItemID";

        DELETE FROM "Asset_DepreciationSchedule"
        WHERE "FinYear" = fy AND "DepreciationSchedule_ID" != keep_id;
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_depschedule_finyear_unique
ON "Asset_DepreciationSchedule" ("FinYear");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Const_SCOA_Structure' AND column_name = 'NTVatStatus') THEN
        ALTER TABLE "Const_SCOA_Structure"
            ADD COLUMN "NTVatStatus" VARCHAR(100),
            ADD COLUMN "NTSCOAFile" VARCHAR(200),
            ADD COLUMN "NTScoaLevel" VARCHAR(200),
            ADD COLUMN "NTExcelRowNumber" VARCHAR(100),
            ADD COLUMN "NTPrinciple" VARCHAR(1000),
            ADD COLUMN "NTApplicableTo" VARCHAR(1000),
            ADD COLUMN "NTPostingLevelDescription" VARCHAR(1000),
            ADD COLUMN "NTScoaID" UUID,
            ADD COLUMN "NTParentScoaId" UUID,
            ADD COLUMN "DefinitionDescription" VARCHAR(3000),
            ADD COLUMN "NTGFSCode" VARCHAR(50);
    END IF;
END $$;

ALTER TABLE IF EXISTS "Asset_Refurb" ADD COLUMN IF NOT EXISTS "DebitPlanProjectItemId" INT NULL;
ALTER TABLE IF EXISTS "Asset_Refurb" ADD COLUMN IF NOT EXISTS "CreditPlanProjectItemId" INT NULL;
