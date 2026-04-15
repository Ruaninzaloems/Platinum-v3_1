CREATE TABLE IF NOT EXISTS "Asset_BulkRefurbJobs" (
    "ID" SERIAL PRIMARY KEY,
    "Filename" VARCHAR(500),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "TotalRecords" INT DEFAULT 0,
    "PostedRecords" INT DEFAULT 0,
    "ErrorRecords" INT DEFAULT 0,
    "UploadedBy" INT DEFAULT 1,
    "UploadedDate" TIMESTAMP DEFAULT NOW(),
    "ApprovedBy" INT,
    "ApprovedDate" TIMESTAMP,
    "RejectionReason" TEXT
);

CREATE TABLE IF NOT EXISTS "Asset_BulkRefurbItems" (
    "ID" SERIAL PRIMARY KEY,
    "JobID" INT NOT NULL REFERENCES "Asset_BulkRefurbJobs"("ID"),
    "RowNumber" INT NOT NULL,
    "AssetRegisterItemID" INT NOT NULL,
    "RefurbDate" DATE NOT NULL,
    "Refurb_DT" DECIMAL(18,2),
    "Refurb_CT" DECIMAL(18,2),
    "Refurb_Depreciation" DECIMAL(18,2),
    "Refurb_Revaluation" DECIMAL(18,2),
    "Refurb_Impairment" DECIMAL(18,2),
    "DebitPlanProjectItemId" INT,
    "CreditPlanProjectItemId" INT,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "ErrorMessage" TEXT,
    "PostedEntityID" INT,
    "DateCreated" TIMESTAMP DEFAULT NOW()
);

ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "Refurb_DT" DECIMAL(18,2);
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "Refurb_CT" DECIMAL(18,2);
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "Refurb_Depreciation" DECIMAL(18,2);
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "Refurb_Revaluation" DECIMAL(18,2);
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "Refurb_Impairment" DECIMAL(18,2);
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "DebitPlanProjectItemId" INT;
ALTER TABLE "Asset_BulkTransactionItems" ADD COLUMN IF NOT EXISTS "CreditPlanProjectItemId" INT;
