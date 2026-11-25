-- Task #133: Work Order Spec — full schema migration (idempotent, IF NOT EXISTS guards)
-- This patch runs BEFORE Schema.sql on fresh installs, so:
--   - No inline FK REFERENCES to tables defined only in Schema.sql
--   - FK constraints added later via DO $$ ... EXCEPTION blocks (safe to skip if table absent)

-- ─── Lookup: Work Order Status ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Const_WorkOrderStatus" (
    "WorkOrderStatusID"   SERIAL PRIMARY KEY,
    "WorkOrderStatusDesc" VARCHAR(50) NOT NULL,
    "SortOrder"           INTEGER NOT NULL DEFAULT 0,
    "Enabled"             BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO "Const_WorkOrderStatus" ("WorkOrderStatusID", "WorkOrderStatusDesc", "SortOrder")
VALUES
    (1, 'Draft',       1),
    (2, 'Submitted',   2),
    (3, 'Approved',    3),
    (4, 'Scheduled',   4),
    (5, 'In Progress', 5),
    (6, 'Completed',   6),
    (7, 'Closed',      7),
    (8, 'Cancelled',   8)
ON CONFLICT ("WorkOrderStatusID") DO NOTHING;

-- ─── Lookup: Work Order Type ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Const_WorkOrderType" (
    "WorkOrderTypeID"   SERIAL PRIMARY KEY,
    "WorkOrderTypeDesc" VARCHAR(100) NOT NULL,
    "IsCapex"           BOOLEAN NOT NULL DEFAULT FALSE,
    "SortOrder"         INTEGER NOT NULL DEFAULT 0,
    "Enabled"           BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO "Const_WorkOrderType" ("WorkOrderTypeID", "WorkOrderTypeDesc", "IsCapex", "SortOrder")
VALUES
    (1, 'Preventative', FALSE, 1),
    (2, 'Corrective',   FALSE, 2),
    (3, 'Emergency',    FALSE, 3),
    (4, 'Inspection',   FALSE, 4),
    (5, 'Renewal',      TRUE,  5)
ON CONFLICT ("WorkOrderTypeID") DO NOTHING;

-- ─── New tables ───────────────────────────────────────────────────────────────
-- NOTE: No inline FK REFERENCES to Asset_MaintenanceWorkOrder (lives in Schema.sql).
-- FK constraints are wired in the deferred DO block at the bottom.

CREATE TABLE IF NOT EXISTS "Asset_MaintenanceWorkOrderAssignment" (
    "AssignmentId"           SERIAL PRIMARY KEY,
    "MaintenanceWorksOrderID" INTEGER NOT NULL,
    "EmployeeId"             INTEGER,
    "VendorId"               INTEGER,
    "VendorName"             VARCHAR(200),
    "Role"                   VARCHAR(100),
    "HoursAssigned"          DECIMAL(10,2),
    "HoursWorked"            DECIMAL(10,2),
    "ContractReference"      VARCHAR(200),
    "CreatedAt"              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_MaintenanceWorkOrderApproval" (
    "ApprovalId"              SERIAL PRIMARY KEY,
    "MaintenanceWorksOrderID" INTEGER NOT NULL,
    "ApprovalLevel"           INTEGER NOT NULL DEFAULT 1,
    "ApprovedById"            INTEGER,
    "ApprovalStatus"          VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ApprovalDate"            TIMESTAMP,
    "Comments"                TEXT,
    "CreatedAt"               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_MaintenanceWorkOrderAuditTrail" (
    "AuditId"                 SERIAL PRIMARY KEY,
    "MaintenanceWorksOrderID" INTEGER NOT NULL,
    "Action"                  VARCHAR(50) NOT NULL,
    "FieldName"               VARCHAR(100),
    "OldValue"                TEXT,
    "NewValue"                TEXT,
    "ChangedById"             INTEGER,
    "ChangedAt"               TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── New header columns on Asset_MaintenanceWorkOrder ────────────────────────
-- Guard each column with IF NOT EXISTS (table may exist from Schema.sql).
-- Entire block is wrapped so it can silently skip on a fresh install where table doesn't exist yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Asset_MaintenanceWorkOrder') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='Priority') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "Priority" VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='PlannedStartDate') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "PlannedStartDate" TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='PlannedEndDate') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "PlannedEndDate" TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='ActualStartDate') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "ActualStartDate" TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='ActualEndDate') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "ActualEndDate" TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='RiskLevel') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "RiskLevel" VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='SafetyRequirements') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "SafetyRequirements" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='EnvironmentalImpact') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "EnvironmentalImpact" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CompletionNotes') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "CompletionNotes" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='RootCause') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "RootCause" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='Recommendations') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "Recommendations" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='FollowUpRequired') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "FollowUpRequired" BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='RequestedById') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "RequestedById" INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CompletedById') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "CompletedById" INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='FundingSegment') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "FundingSegment" VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CostCentre') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "CostCentre" VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='WorkOrderNumber') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "WorkOrderNumber" VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='Asset_MaintenanceWorkOrder' AND indexname='uix_workorder_number') THEN
      CREATE UNIQUE INDEX uix_workorder_number ON "Asset_MaintenanceWorkOrder" ("WorkOrderNumber") WHERE "WorkOrderNumber" IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CancelledReason') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "CancelledReason" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='ActualCost') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "ActualCost" DECIMAL(18,2);
    END IF;

  END IF;
END $$;

-- ─── New detail columns on Asset_MaintenanceWorkOrderDetails ─────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Asset_MaintenanceWorkOrderDetails') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrderDetails' AND column_name='Description') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrderDetails" ADD COLUMN "Description" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrderDetails' AND column_name='UnitCost') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrderDetails" ADD COLUMN "UnitCost" DECIMAL(18,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrderDetails' AND column_name='AssetComponentId') THEN
      ALTER TABLE "Asset_MaintenanceWorkOrderDetails" ADD COLUMN "AssetComponentId" INTEGER;
    END IF;

  END IF;
END $$;

-- ─── Deferred FK constraints ─────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER TABLE "Asset_MaintenanceWorkOrderAssignment"
      ADD CONSTRAINT fk_wo_assignment_workorder
      FOREIGN KEY ("MaintenanceWorksOrderID") REFERENCES "Asset_MaintenanceWorkOrder"("MaintenanceWorksOrderID");
  EXCEPTION WHEN duplicate_object THEN NULL;
            WHEN undefined_table  THEN NULL;
  END;

  BEGIN
    ALTER TABLE "Asset_MaintenanceWorkOrderApproval"
      ADD CONSTRAINT fk_wo_approval_workorder
      FOREIGN KEY ("MaintenanceWorksOrderID") REFERENCES "Asset_MaintenanceWorkOrder"("MaintenanceWorksOrderID");
  EXCEPTION WHEN duplicate_object THEN NULL;
            WHEN undefined_table  THEN NULL;
  END;

  BEGIN
    ALTER TABLE "Asset_MaintenanceWorkOrderAuditTrail"
      ADD CONSTRAINT fk_wo_audit_workorder
      FOREIGN KEY ("MaintenanceWorksOrderID") REFERENCES "Asset_MaintenanceWorkOrder"("MaintenanceWorksOrderID");
  EXCEPTION WHEN duplicate_object THEN NULL;
            WHEN undefined_table  THEN NULL;
  END;
END $$;
