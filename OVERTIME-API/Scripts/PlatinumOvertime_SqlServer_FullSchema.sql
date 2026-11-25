-- =============================================================================
-- Platinum Overtime — SQL Server complete schema
-- Source of truth: EF model snapshot + domain model + OvertimeCaptureSchemaUpgrader
--
-- This script creates the 9 tables owned by the Platinum Overtime application.
-- It does NOT touch any existing Payroll tables (Employee, Position, etc.).
--
-- Safe to run on a blank database. If the tables already exist they will not
-- be recreated — every CREATE TABLE is guarded with IF NOT EXISTS.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_OvertimeAuditTrail
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_OvertimeAuditTrail')
CREATE TABLE [Payroll_OvertimeAuditTrail] (
    [Id]          UNIQUEIDENTIFIER NOT NULL
                      CONSTRAINT [PK_Payroll_OvertimeAuditTrail] PRIMARY KEY,
    [EntityName]  NVARCHAR(200)    NOT NULL,
    [EntityId]    NVARCHAR(64)     NOT NULL,
    [Action]      NVARCHAR(100)    NOT NULL,
    [PerformedBy] NVARCHAR(200)    NULL,
    [Details]     NVARCHAR(4000)   NULL,
    [PerformedAt] DATETIME2        NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_OvertimeConfig  (singleton row enforced by unique index on SingletonLock)
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_OvertimeConfig')
CREATE TABLE [Payroll_OvertimeConfig] (
    [Id]                               UNIQUEIDENTIFIER NOT NULL
                                           CONSTRAINT [PK_Payroll_OvertimeConfig] PRIMARY KEY,
    [AllowOvertimeMultipleApproval]    BIT              NOT NULL,
    [StartDate]                        DATETIME2        NULL,
    [CountingPeriodStartDay]           INT              NOT NULL,
    [CountingPeriodEndDay]             INT              NOT NULL,
    [MaximumMonthlyOvertimeHours]      DECIMAL(8,2)     NOT NULL,
    [ExceptionalMaximumOvertimeHours]  DECIMAL(8,2)     NOT NULL,
    [OverridePositionId]               NVARCHAR(64)     NULL,
    [OverridePositionDescription]      NVARCHAR(500)    NULL,
    [CreatedAt]                        DATETIME2        NOT NULL,
    [UpdatedAt]                        DATETIME2        NOT NULL,
    [UpdatedBy]                        NVARCHAR(200)    NULL,
    [SingletonLock]                    NVARCHAR(1)      NOT NULL
                                           CONSTRAINT [DF_Payroll_OvertimeConfig_SingletonLock] DEFAULT 'X'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_PositionApprovalConfig
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_PositionApprovalConfig')
CREATE TABLE [Payroll_PositionApprovalConfig] (
    [Id]                                UNIQUEIDENTIFIER NOT NULL
                                            CONSTRAINT [PK_Payroll_PositionApprovalConfig] PRIMARY KEY,
    [PositionId]                        NVARCHAR(64)     NOT NULL,
    [PositionDescription]               NVARCHAR(500)    NOT NULL,
    [IsOvertimeRecommender]             BIT              NOT NULL,
    [IsOvertimeApprover]                BIT              NOT NULL,
    [IsDepartmentExcessOvertimeApprover] BIT             NOT NULL,
    [CreatedAt]                         DATETIME2        NOT NULL,
    [UpdatedAt]                         DATETIME2        NOT NULL,
    [UpdatedBy]                         NVARCHAR(200)    NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_OvertimeTransaction  (main header table for every overtime request)
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_OvertimeTransaction')
CREATE TABLE [Payroll_OvertimeTransaction] (
    -- Primary key
    [Id]                              UNIQUEIDENTIFIER NOT NULL
                                          CONSTRAINT [PK_Payroll_OvertimeTransaction] PRIMARY KEY,

    -- Auto-incrementing display number (maps to Payroll_EmployeeOvertime.LinkId on payroll post)
    [TransactionNo]                   INT              NOT NULL IDENTITY(1,1),

    -- Employee / position snapshot
    [EmployeeId]                      NVARCHAR(64)     NOT NULL,
    [EmployeeName]                    NVARCHAR(300)    NOT NULL,
    [DepartmentId]                    NVARCHAR(64)     NOT NULL,
    [DepartmentName]                  NVARCHAR(300)    NOT NULL,
    [DivisionName]                    NVARCHAR(500)    NULL,      -- upgrader column; NULL for pre-existing rows
    [PositionId]                      NVARCHAR(64)     NOT NULL,

    -- Legacy payroll classification IDs (optional; snapshotted from Const_* tables)
    [LegacyDepartmentId]              INT              NULL,
    [LegacyDepartmentName]            NVARCHAR(500)    NULL,
    [LegacyDivisionId]                INT              NULL,
    [LegacyDivisionName]              NVARCHAR(500)    NULL,

    -- Overtime period
    [OvertimeDate]                    DATETIME2        NOT NULL,
    [StartTime]                       TIME             NULL,
    [EndTime]                         TIME             NULL,
    [Hours]                           DECIMAL(8,2)     NOT NULL,
    [Reason]                          NVARCHAR(2000)   NULL,

    -- Salary head + amount (all snapshotted at create time)
    [SalaryHeadId]                    INT              NOT NULL,
    [SalaryHeadName]                  NVARCHAR(500)    NOT NULL,
    [FormulaSnapshot]                 NVARCHAR(2000)   NOT NULL,
    [FormulaWithValuesSnapshot]       NVARCHAR(2000)   NULL,      -- upgrader column; NULL for pre-existing rows
    [Amount]                          DECIMAL(18,2)    NOT NULL,

    -- Monthly hours context
    [HoursAlreadyCapturedThisMonth]   DECIMAL(8,2)     NOT NULL,
    [IsExcess]                        BIT              NOT NULL,
    [IsExcessApproved]                BIT              NOT NULL    -- upgrader column
                                          CONSTRAINT [DF_OT_IsExcessApproved]  DEFAULT 0,
    [IsPayrollCaptured]               BIT              NOT NULL    -- upgrader column
                                          CONSTRAINT [DF_OT_IsPayrollCaptured] DEFAULT 0,

    -- Workflow status
    [Status]                          INT              NOT NULL,

    -- Workflow assignee snapshots
    [RecommenderEmployeeId]           NVARCHAR(64)     NULL,
    [RecommenderEmployeeName]         NVARCHAR(300)    NULL,
    [RecommenderChainPositionId]      NVARCHAR(64)     NULL,      -- upgrader column
    [RecommenderChainPositionName]    NVARCHAR(500)    NULL,      -- upgrader column
    [ApproverEmployeeId]              NVARCHAR(64)     NULL,
    [ApproverEmployeeName]            NVARCHAR(300)    NULL,
    [ApproverChainPositionId]         NVARCHAR(64)     NULL,      -- upgrader column
    [ApproverChainPositionName]       NVARCHAR(500)    NULL,      -- upgrader column
    [ExcessApproverEmployeeId]        NVARCHAR(64)     NULL,
    [ExcessApproverEmployeeName]      NVARCHAR(300)    NULL,
    [PayrollCapturerEmployeeId]       NVARCHAR(64)     NULL,
    [PayrollCapturerEmployeeName]     NVARCHAR(300)    NULL,
    [PayrollApproverEmployeeId]       NVARCHAR(64)     NULL,
    [PayrollApproverEmployeeName]     NVARCHAR(300)    NULL,
    [CurrentAssigneeUserId]           NVARCHAR(64)     NULL,

    -- Capture metadata
    [CapturedBy]                      NVARCHAR(200)    NULL,
    [CapturedByName]                  NVARCHAR(300)    NULL,
    [CreatedAt]                       DATETIME2        NOT NULL,
    [UpdatedAt]                       DATETIME2        NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_OvertimeTransactionDocument
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_OvertimeTransactionDocument')
CREATE TABLE [Payroll_OvertimeTransactionDocument] (
    [Id]                    UNIQUEIDENTIFIER NOT NULL
                                CONSTRAINT [PK_Payroll_OvertimeTransactionDocument] PRIMARY KEY,
    [OvertimeTransactionId] UNIQUEIDENTIFIER NOT NULL,
    [FileName]              NVARCHAR(500)    NOT NULL,
    [ContentType]           NVARCHAR(200)    NOT NULL,
    [SizeBytes]             BIGINT           NOT NULL,
    [StoragePath]           NVARCHAR(1000)   NOT NULL,
    [UploadedBy]            NVARCHAR(200)    NULL,
    [UploadedAt]            DATETIME2        NOT NULL,
    CONSTRAINT [FK_Payroll_OvertimeTransactionDocument_Transaction]
        FOREIGN KEY ([OvertimeTransactionId])
        REFERENCES [Payroll_OvertimeTransaction] ([Id])
        ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_OvertimeWorkflowState  (one row per status transition)
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_OvertimeWorkflowState')
CREATE TABLE [Payroll_OvertimeWorkflowState] (
    [Id]                    UNIQUEIDENTIFIER NOT NULL
                                CONSTRAINT [PK_Payroll_OvertimeWorkflowState] PRIMARY KEY,
    [OvertimeTransactionId] UNIQUEIDENTIFIER NOT NULL,
    [FromStatus]            INT              NOT NULL,
    [ToStatus]              INT              NOT NULL,
    [ActionedBy]            NVARCHAR(200)    NULL,
    [Comments]              NVARCHAR(2000)   NULL,
    [ChainPositionNote]     NVARCHAR(200)    NULL,
    [ActionedAt]            DATETIME2        NOT NULL,
    CONSTRAINT [FK_Payroll_OvertimeWorkflowState_Transaction]
        FOREIGN KEY ([OvertimeTransactionId])
        REFERENCES [Payroll_OvertimeTransaction] ([Id])
        ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_PositionReportingRelationship
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_PositionReportingRelationship')
CREATE TABLE [Payroll_PositionReportingRelationship] (
    [Id]                          UNIQUEIDENTIFIER NOT NULL
                                      CONSTRAINT [PK_Payroll_PositionReportingRelationship] PRIMARY KEY,
    [PositionApprovalConfigId]    UNIQUEIDENTIFIER NOT NULL,
    [ReportsToPositionId]         NVARCHAR(64)     NOT NULL,
    [ReportsToPositionDescription] NVARCHAR(500)   NOT NULL,
    [StartDate]                   DATETIME2        NOT NULL,
    [EndDate]                     DATETIME2        NULL,
    [CreatedAt]                   DATETIME2        NOT NULL,
    [UpdatedAt]                   DATETIME2        NOT NULL,
    CONSTRAINT [FK_Payroll_PositionReportingRelationship_Config]
        FOREIGN KEY ([PositionApprovalConfigId])
        REFERENCES [Payroll_PositionApprovalConfig] ([Id])
        ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payroll_TemporaryActingAppointment
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payroll_TemporaryActingAppointment')
CREATE TABLE [Payroll_TemporaryActingAppointment] (
    [Id]                          UNIQUEIDENTIFIER NOT NULL
                                      CONSTRAINT [PK_Payroll_TemporaryActingAppointment] PRIMARY KEY,
    [PositionApprovalConfigId]    UNIQUEIDENTIFIER NOT NULL,
    [ActingEmployeeId]            NVARCHAR(64)     NOT NULL,
    [ActingEmployeeName]          NVARCHAR(300)    NOT NULL,
    [ActingInPositionId]          NVARCHAR(64)     NOT NULL,
    [ActingInPositionDescription] NVARCHAR(500)    NOT NULL,
    [StartDate]                   DATETIME2        NOT NULL,
    [EndDate]                     DATETIME2        NOT NULL,
    [CreatedAt]                   DATETIME2        NOT NULL,
    [UpdatedAt]                   DATETIME2        NOT NULL,
    CONSTRAINT [FK_Payroll_TemporaryActingAppointment_Config]
        FOREIGN KEY ([PositionApprovalConfigId])
        REFERENCES [Payroll_PositionApprovalConfig] ([Id])
        ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DataProtectionKeys  (ASP.NET Core data-protection key storage)
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DataProtectionKeys')
CREATE TABLE [DataProtectionKeys] (
    [Id]           INT           NOT NULL IDENTITY(1,1)
                       CONSTRAINT [PK_DataProtectionKeys] PRIMARY KEY,
    [FriendlyName] NVARCHAR(MAX) NULL,
    [Xml]          NVARCHAR(MAX) NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeAuditTrail_EntityName_EntityId'
               AND object_id = OBJECT_ID('Payroll_OvertimeAuditTrail'))
    CREATE INDEX [IX_Payroll_OvertimeAuditTrail_EntityName_EntityId]
        ON [Payroll_OvertimeAuditTrail] ([EntityName], [EntityId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeConfig_SingletonLock'
               AND object_id = OBJECT_ID('Payroll_OvertimeConfig'))
    CREATE UNIQUE INDEX [IX_Payroll_OvertimeConfig_SingletonLock]
        ON [Payroll_OvertimeConfig] ([SingletonLock]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeTransaction_EmployeeId_OvertimeDate'
               AND object_id = OBJECT_ID('Payroll_OvertimeTransaction'))
    CREATE INDEX [IX_Payroll_OvertimeTransaction_EmployeeId_OvertimeDate]
        ON [Payroll_OvertimeTransaction] ([EmployeeId], [OvertimeDate]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeTransaction_Status'
               AND object_id = OBJECT_ID('Payroll_OvertimeTransaction'))
    CREATE INDEX [IX_Payroll_OvertimeTransaction_Status]
        ON [Payroll_OvertimeTransaction] ([Status]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeTransaction_TransactionNo'
               AND object_id = OBJECT_ID('Payroll_OvertimeTransaction'))
    CREATE UNIQUE INDEX [IX_Payroll_OvertimeTransaction_TransactionNo]
        ON [Payroll_OvertimeTransaction] ([TransactionNo]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeTransaction_CurrentAssigneeUserId'
               AND object_id = OBJECT_ID('Payroll_OvertimeTransaction'))
    CREATE INDEX [IX_Payroll_OvertimeTransaction_CurrentAssigneeUserId]
        ON [Payroll_OvertimeTransaction] ([CurrentAssigneeUserId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeTransactionDocument_OvertimeTransactionId'
               AND object_id = OBJECT_ID('Payroll_OvertimeTransactionDocument'))
    CREATE INDEX [IX_Payroll_OvertimeTransactionDocument_OvertimeTransactionId]
        ON [Payroll_OvertimeTransactionDocument] ([OvertimeTransactionId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_OvertimeWorkflowState_OvertimeTransactionId'
               AND object_id = OBJECT_ID('Payroll_OvertimeWorkflowState'))
    CREATE INDEX [IX_Payroll_OvertimeWorkflowState_OvertimeTransactionId]
        ON [Payroll_OvertimeWorkflowState] ([OvertimeTransactionId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_PositionApprovalConfig_PositionId'
               AND object_id = OBJECT_ID('Payroll_PositionApprovalConfig'))
    CREATE UNIQUE INDEX [IX_Payroll_PositionApprovalConfig_PositionId]
        ON [Payroll_PositionApprovalConfig] ([PositionId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'AK_Payroll_PositionApprovalConfig_Id_PositionId'
               AND object_id = OBJECT_ID('Payroll_PositionApprovalConfig'))
    CREATE UNIQUE INDEX [AK_Payroll_PositionApprovalConfig_Id_PositionId]
        ON [Payroll_PositionApprovalConfig] ([Id], [PositionId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_PositionReportingRelationship_PositionApprovalConfigId'
               AND object_id = OBJECT_ID('Payroll_PositionReportingRelationship'))
    CREATE INDEX [IX_Payroll_PositionReportingRelationship_PositionApprovalConfigId]
        ON [Payroll_PositionReportingRelationship] ([PositionApprovalConfigId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payroll_TemporaryActingAppointment_PositionApprovalConfigId'
               AND object_id = OBJECT_ID('Payroll_TemporaryActingAppointment'))
    CREATE INDEX [IX_Payroll_TemporaryActingAppointment_PositionApprovalConfigId]
        ON [Payroll_TemporaryActingAppointment] ([PositionApprovalConfigId]);

-- =============================================================================
-- COMPOSITE FK CONSTRAINT  (acting appointment position-match invariant)
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TAA_ConfigId_ActingInPositionId')
    ALTER TABLE [Payroll_TemporaryActingAppointment]
        ADD CONSTRAINT [FK_TAA_ConfigId_ActingInPositionId]
        FOREIGN KEY ([PositionApprovalConfigId], [ActingInPositionId])
        REFERENCES [Payroll_PositionApprovalConfig] ([Id], [PositionId])
        ON DELETE NO ACTION;

-- =============================================================================
-- EF MIGRATIONS HISTORY
-- Tells EF that all migrations have already been applied so it won't try to
-- re-run them on first startup.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = '__EFMigrationsHistory')
CREATE TABLE [__EFMigrationsHistory] (
    [MigrationId]    NVARCHAR(150) NOT NULL
                         CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY,
    [ProductVersion] NVARCHAR(32)  NOT NULL
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
SELECT v.[MigrationId], v.[ProductVersion]
FROM (VALUES
    ('20260421134358_InitialCreate',                   '10.0.6'),
    ('20260423201808_AddOvertimeCaptureFields',         '10.0.6'),
    ('20260426120001_AddCapturedByName',                '10.0.6'),
    ('20260428120001_DropCyclePeriodColumns',            '10.0.6'),
    ('20260428130001_RenameTablesWithPayrollPrefix',     '10.0.6'),
    ('20260430120001_AddTransactionNo',                  '10.0.6'),
    ('20260609120001_FixActingAppointmentConfigFk',      '10.0.6'),
    ('20260730120001_AddWorkflowStateChainPositionNote', '10.0.6')
) AS v([MigrationId], [ProductVersion])
WHERE NOT EXISTS (
    SELECT 1 FROM [__EFMigrationsHistory] h
    WHERE h.[MigrationId] = v.[MigrationId]
);
