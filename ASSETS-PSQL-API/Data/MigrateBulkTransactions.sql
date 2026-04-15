CREATE TABLE IF NOT EXISTS "Asset_BulkTransactionJobs" (
    "ID" SERIAL PRIMARY KEY,
    "Filename" VARCHAR(500),
    "TransactionType" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "TotalRecords" INT DEFAULT 0,
    "PostedRecords" INT DEFAULT 0,
    "ErrorRecords" INT DEFAULT 0,
    "UploadedBy" INT DEFAULT 1,
    "UploadedDate" TIMESTAMP DEFAULT NOW(),
    "ApprovedBy" INT,
    "ApprovedDate" TIMESTAMP,
    "RejectionReason" TEXT,
    "ValidationErrors" TEXT
);

CREATE TABLE IF NOT EXISTS "Asset_BulkTransactionItems" (
    "ID" SERIAL PRIMARY KEY,
    "JobID" INT NOT NULL REFERENCES "Asset_BulkTransactionJobs"("ID"),
    "RowNumber" INT NOT NULL,
    "AssetRegisterItemID" INT NOT NULL,
    "TransactionType" VARCHAR(50) NOT NULL,
    "TransactionDate" DATE NOT NULL,
    "MarketValue" DECIMAL(18,2),
    "ValuationModule" INT,
    "DepAdjustment" DECIMAL(18,2),
    "ImpairmentType" VARCHAR(50),
    "RecoverableAmount" DECIMAL(18,2),
    "ValueInUse" DECIMAL(18,2),
    "Reason" TEXT,
    "DisposalMethod" VARCHAR(100),
    "DisposalProceeds" DECIMAL(18,2),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "ErrorMessage" TEXT,
    "PostedEntityID" INT,
    "DateCreated" TIMESTAMP DEFAULT NOW()
);
