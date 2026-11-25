CREATE TABLE IF NOT EXISTS "SCM_GRNDocuments" (
    "Document_ID"   SERIAL          PRIMARY KEY,
    "DocumentName"  VARCHAR(255)    NULL,
    "DocumentPath"  VARCHAR(200)    NULL,
    "FileType"      VARCHAR(200)    NULL,
    "DateCaptured"  TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CapturerID"    INTEGER         NOT NULL DEFAULT 1,
    "GRN_ID"        INTEGER         NOT NULL
);
