-- Asset_Register_Item_Approval: staging table for new acquisitions and asset edits
-- pending approval before they are written to Asset_Register_Items.
-- AssetRegisterItem_ID FK is added separately (named, idempotent) so the
-- migration is safe on both fresh installs and pre-existing tables.
CREATE TABLE IF NOT EXISTS "Asset_Register_Item_Approval" (
    "Approval_ID"            SERIAL       PRIMARY KEY,
    "ApprovalType"           VARCHAR(20)  NOT NULL,
    "AcquisitionSubType"     VARCHAR(20)  NULL,
    "AssetRegisterItem_ID"   INTEGER      NULL,
    "SCMTransfer_ID"         INTEGER      NULL,
    "InvTransfer_ID"         INTEGER      NULL,
    "Status"                 VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    "AssetData"              JSONB        NOT NULL,
    "ChangeSummary"          JSONB        NULL,
    "SubmittedBy"            INTEGER      NOT NULL DEFAULT 1,
    "SubmittedDate"          TIMESTAMP    NOT NULL DEFAULT NOW(),
    "ApprovedBy"             INTEGER      NULL,
    "ApprovedDate"           TIMESTAMP    NULL,
    "RejectedBy"             INTEGER      NULL,
    "RejectedDate"           TIMESTAMP    NULL,
    "RejectionReason"        TEXT         NULL
);

-- Add named FK constraint idempotently (covers both fresh and pre-existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_aria_asset_register_item'
    ) THEN
        ALTER TABLE "Asset_Register_Item_Approval"
        ADD CONSTRAINT "fk_aria_asset_register_item"
        FOREIGN KEY ("AssetRegisterItem_ID")
        REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID");
    END IF;
END $$;
