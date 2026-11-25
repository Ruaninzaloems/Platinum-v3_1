-- MigrateAssetTypeMeasurementLink.sql
-- Creates and seeds AssetConfig_AssetType_MeasurementType_Link (mirrors SQL Server default data).
-- Idempotent: CREATE TABLE IF NOT EXISTS + ON CONFLICT DO NOTHING on seed rows.

CREATE TABLE IF NOT EXISTS "AssetConfig_AssetType_MeasurementType_Link" (
    "ID"                 SERIAL NOT NULL,
    "AssetType_ID"       INT    NOT NULL,
    "MeasurementType_ID" INT    NOT NULL,
    CONSTRAINT "PK_AssetConfig_AssetType_MeasurementType_Link"
        PRIMARY KEY ("AssetType_ID", "MeasurementType_ID")
);

-- Seed canonical default rows.  Only inserts where both FK targets exist in this DB.
INSERT INTO "AssetConfig_AssetType_MeasurementType_Link" ("AssetType_ID", "MeasurementType_ID")
SELECT v.at_id, v.mt_id
FROM (VALUES
    (1, 1), (1, 3),
    (2, 1), (2, 2), (2, 4),
    (3, 1), (3, 2), (3, 4),
    (4, 1), (4, 2), (4, 4),
    (5, 1), (5, 3)
) AS v(at_id, mt_id)
WHERE EXISTS (SELECT 1 FROM "Const_AssetType_Sys"         WHERE "AssetType_ID"                 = v.at_id)
  AND EXISTS (SELECT 1 FROM "AssetConfig_MeasurementType" WHERE "AssetConfig_MeasurementType_ID" = v.mt_id)
ON CONFLICT DO NOTHING;
