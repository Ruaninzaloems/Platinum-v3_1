-- =============================================================================
-- Platinum Overtime Module — SQL Server Table Creation Script
-- Generated: 2026-04-29
--
-- Run this against your SQL Server database to create all tables required
-- by the Platinum Overtime module.
--
-- SAFE TO RUN MORE THAN ONCE: every CREATE statement is guarded by
-- IF OBJECT_ID(...) IS NULL so existing tables and data are never touched.
--
-- Existing payroll tables (Payroll_Employee, Payroll_Position, etc.) are
-- NOT created here — they already exist in your database and are left alone.
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. Payroll_OvertimeConfig  (singleton — one row enforced by unique lock)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_OvertimeConfig', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_OvertimeConfig (
        Id                              uniqueidentifier  NOT NULL DEFAULT NEWID(),
        AllowOvertimeMultipleApproval   bit               NOT NULL,
        StartDate                       datetime2         NULL,
        CountingPeriodStartDay          int               NOT NULL,
        CountingPeriodEndDay            int               NOT NULL,
        MaximumMonthlyOvertimeHours     decimal(8,2)      NOT NULL,
        ExceptionalMaximumOvertimeHours decimal(8,2)      NOT NULL,
        CreatedAt                       datetime2         NOT NULL,
        UpdatedAt                       datetime2         NOT NULL,
        UpdatedBy                       nvarchar(200)     NULL,
        SingletonLock                   nvarchar(1)       NOT NULL DEFAULT 'X',

        CONSTRAINT PK_Payroll_OvertimeConfig PRIMARY KEY (Id)
    );

    CREATE UNIQUE INDEX IX_Payroll_OvertimeConfig_SingletonLock
        ON Payroll_OvertimeConfig (SingletonLock);

    PRINT 'Created: Payroll_OvertimeConfig';
END
ELSE
    PRINT 'Skipped (exists): Payroll_OvertimeConfig';
GO

-- -------------------------------------------------------------------------
-- 2. Payroll_OvertimeTransaction
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_OvertimeTransaction', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_OvertimeTransaction (
        Id                              uniqueidentifier  NOT NULL DEFAULT NEWID(),
        TransactionNo                   int               NOT NULL IDENTITY(1,1),
        EmployeeId                      nvarchar(64)      NOT NULL,
        EmployeeName                    nvarchar(300)     NOT NULL,
        DepartmentId                    nvarchar(64)      NOT NULL,
        DepartmentName                  nvarchar(300)     NOT NULL,
        PositionId                      nvarchar(64)      NOT NULL,
        OvertimeDate                    datetime2         NOT NULL,
        StartTime                       time              NULL,
        EndTime                         time              NULL,
        Hours                           decimal(8,2)      NOT NULL,
        Amount                          decimal(18,2)     NOT NULL,
        SalaryHeadId                    int               NOT NULL,
        SalaryHeadName                  nvarchar(500)     NOT NULL,
        FormulaSnapshot                 nvarchar(2000)    NOT NULL,
        Reason                          nvarchar(2000)    NULL,
        IsExcess                        bit               NOT NULL,
        HoursAlreadyCapturedThisMonth   decimal(8,2)      NOT NULL,
        Status                          int               NOT NULL,
        -- Status values: 0=Requested, 1=Recommended, 2=ApprovedForPayment,
        --                3=AwaitingPayrollApproval, 4=Processed,
        --                5=Returned, 99=Rejected
        CapturedBy                      nvarchar(200)     NULL,
        CapturedByName                  nvarchar(300)     NULL,
        CurrentAssigneeUserId           nvarchar(64)      NULL,
        RecommenderEmployeeId           nvarchar(64)      NULL,
        RecommenderEmployeeName         nvarchar(300)     NULL,
        ApproverEmployeeId              nvarchar(64)      NULL,
        ApproverEmployeeName            nvarchar(300)     NULL,
        ExcessApproverEmployeeId        nvarchar(64)      NULL,
        ExcessApproverEmployeeName      nvarchar(300)     NULL,
        PayrollApproverEmployeeId       nvarchar(64)      NULL,
        PayrollApproverEmployeeName     nvarchar(300)     NULL,
        PayrollCapturerEmployeeId       nvarchar(64)      NULL,
        PayrollCapturerEmployeeName     nvarchar(300)     NULL,
        CreatedAt                       datetime2         NOT NULL,
        UpdatedAt                       datetime2         NOT NULL,

        CONSTRAINT PK_Payroll_OvertimeTransaction PRIMARY KEY (Id)
    );

    CREATE UNIQUE INDEX IX_Payroll_OvertimeTransaction_TransactionNo
        ON Payroll_OvertimeTransaction (TransactionNo);

    CREATE INDEX IX_Payroll_OvertimeTransaction_Status
        ON Payroll_OvertimeTransaction (Status);

    CREATE INDEX IX_Payroll_OvertimeTransaction_CurrentAssigneeUserId
        ON Payroll_OvertimeTransaction (CurrentAssigneeUserId);

    CREATE INDEX IX_Payroll_OvertimeTransaction_EmployeeId_OvertimeDate
        ON Payroll_OvertimeTransaction (EmployeeId, OvertimeDate);

    PRINT 'Created: Payroll_OvertimeTransaction';
END
ELSE
    PRINT 'Skipped (exists): Payroll_OvertimeTransaction';
GO

-- -------------------------------------------------------------------------
-- 3. Payroll_OvertimeTransactionDocument
--    (documents / attachments uploaded against a transaction)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_OvertimeTransactionDocument', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_OvertimeTransactionDocument (
        Id                      uniqueidentifier  NOT NULL DEFAULT NEWID(),
        OvertimeTransactionId   uniqueidentifier  NOT NULL,
        FileName                nvarchar(500)     NOT NULL,
        ContentType             nvarchar(200)     NOT NULL,
        SizeBytes               bigint            NOT NULL,
        StoragePath             nvarchar(1000)    NOT NULL,
        UploadedBy              nvarchar(200)     NULL,
        UploadedAt              datetime2         NOT NULL,

        CONSTRAINT PK_Payroll_OvertimeTransactionDocument PRIMARY KEY (Id),
        CONSTRAINT FK_OvertimeTransactionDocument_OvertimeTransaction
            FOREIGN KEY (OvertimeTransactionId)
            REFERENCES Payroll_OvertimeTransaction (Id)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_Payroll_OvertimeTransactionDocument_OvertimeTransactionId
        ON Payroll_OvertimeTransactionDocument (OvertimeTransactionId);

    PRINT 'Created: Payroll_OvertimeTransactionDocument';
END
ELSE
    PRINT 'Skipped (exists): Payroll_OvertimeTransactionDocument';
GO

-- -------------------------------------------------------------------------
-- 4. Payroll_OvertimeWorkflowState
--    (audit trail of every status transition on a transaction)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_OvertimeWorkflowState', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_OvertimeWorkflowState (
        Id                      uniqueidentifier  NOT NULL DEFAULT NEWID(),
        OvertimeTransactionId   uniqueidentifier  NOT NULL,
        FromStatus              int               NOT NULL,
        ToStatus                int               NOT NULL,
        ActionedBy              nvarchar(200)     NULL,
        Comments                nvarchar(2000)    NULL,
        ActionedAt              datetime2         NOT NULL,

        CONSTRAINT PK_Payroll_OvertimeWorkflowState PRIMARY KEY (Id),
        CONSTRAINT FK_OvertimeWorkflowState_OvertimeTransaction
            FOREIGN KEY (OvertimeTransactionId)
            REFERENCES Payroll_OvertimeTransaction (Id)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_Payroll_OvertimeWorkflowState_OvertimeTransactionId
        ON Payroll_OvertimeWorkflowState (OvertimeTransactionId);

    PRINT 'Created: Payroll_OvertimeWorkflowState';
END
ELSE
    PRINT 'Skipped (exists): Payroll_OvertimeWorkflowState';
GO

-- -------------------------------------------------------------------------
-- 5. Payroll_OvertimeAuditTrail
--    (general-purpose audit log for configuration changes, etc.)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_OvertimeAuditTrail', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_OvertimeAuditTrail (
        Id          uniqueidentifier  NOT NULL DEFAULT NEWID(),
        EntityName  nvarchar(200)     NOT NULL,
        EntityId    nvarchar(64)      NOT NULL,
        Action      nvarchar(100)     NOT NULL,
        PerformedBy nvarchar(200)     NULL,
        Details     nvarchar(4000)    NULL,
        PerformedAt datetime2         NOT NULL,

        CONSTRAINT PK_Payroll_OvertimeAuditTrail PRIMARY KEY (Id)
    );

    CREATE INDEX IX_Payroll_OvertimeAuditTrail_EntityName_EntityId
        ON Payroll_OvertimeAuditTrail (EntityName, EntityId);

    PRINT 'Created: Payroll_OvertimeAuditTrail';
END
ELSE
    PRINT 'Skipped (exists): Payroll_OvertimeAuditTrail';
GO

-- -------------------------------------------------------------------------
-- 6. Payroll_PositionApprovalConfig
--    (one row per position — stores approval role flags)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_PositionApprovalConfig', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_PositionApprovalConfig (
        Id                                  uniqueidentifier  NOT NULL DEFAULT NEWID(),
        PositionId                          nvarchar(64)      NOT NULL,
        PositionDescription                 nvarchar(500)     NOT NULL,
        IsOvertimeRecommender               bit               NOT NULL,
        IsOvertimeApprover                  bit               NOT NULL,
        IsDepartmentExcessOvertimeApprover  bit               NOT NULL,
        CreatedAt                           datetime2         NOT NULL,
        UpdatedAt                           datetime2         NOT NULL,
        UpdatedBy                           nvarchar(200)     NULL,

        CONSTRAINT PK_Payroll_PositionApprovalConfig PRIMARY KEY (Id)
    );

    CREATE UNIQUE INDEX IX_Payroll_PositionApprovalConfig_PositionId
        ON Payroll_PositionApprovalConfig (PositionId);

    PRINT 'Created: Payroll_PositionApprovalConfig';
END
ELSE
    PRINT 'Skipped (exists): Payroll_PositionApprovalConfig';
GO

-- -------------------------------------------------------------------------
-- 7. Payroll_PositionReportingRelationship
--    (which position(s) a configured position reports to for approval)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_PositionReportingRelationship', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_PositionReportingRelationship (
        Id                          uniqueidentifier  NOT NULL DEFAULT NEWID(),
        PositionApprovalConfigId    uniqueidentifier  NOT NULL,
        ReportsToPositionId         nvarchar(64)      NOT NULL,
        ReportsToPositionDescription nvarchar(500)    NOT NULL,
        StartDate                   datetime2         NOT NULL,
        EndDate                     datetime2         NULL,
        CreatedAt                   datetime2         NOT NULL,
        UpdatedAt                   datetime2         NOT NULL,

        CONSTRAINT PK_Payroll_PositionReportingRelationship PRIMARY KEY (Id),
        CONSTRAINT FK_PositionReportingRelationship_PositionApprovalConfig
            FOREIGN KEY (PositionApprovalConfigId)
            REFERENCES Payroll_PositionApprovalConfig (Id)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_Payroll_PositionReportingRelationship_PositionApprovalConfigId
        ON Payroll_PositionReportingRelationship (PositionApprovalConfigId);

    PRINT 'Created: Payroll_PositionReportingRelationship';
END
ELSE
    PRINT 'Skipped (exists): Payroll_PositionReportingRelationship';
GO

-- -------------------------------------------------------------------------
-- 8. Payroll_TemporaryActingAppointment
--    (employee acting in a position for a date range)
-- -------------------------------------------------------------------------
IF OBJECT_ID(N'Payroll_TemporaryActingAppointment', N'U') IS NULL
BEGIN
    CREATE TABLE Payroll_TemporaryActingAppointment (
        Id                          uniqueidentifier  NOT NULL DEFAULT NEWID(),
        PositionApprovalConfigId    uniqueidentifier  NOT NULL,
        ActingEmployeeId            nvarchar(64)      NOT NULL,
        ActingEmployeeName          nvarchar(300)     NOT NULL,
        ActingInPositionId          nvarchar(64)      NOT NULL,
        ActingInPositionDescription nvarchar(500)     NOT NULL,
        StartDate                   datetime2         NOT NULL,
        EndDate                     datetime2         NOT NULL,
        CreatedAt                   datetime2         NOT NULL,
        UpdatedAt                   datetime2         NOT NULL,

        CONSTRAINT PK_Payroll_TemporaryActingAppointment PRIMARY KEY (Id),
        CONSTRAINT FK_TemporaryActingAppointment_PositionApprovalConfig
            FOREIGN KEY (PositionApprovalConfigId)
            REFERENCES Payroll_PositionApprovalConfig (Id)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_Payroll_TemporaryActingAppointment_PositionApprovalConfigId
        ON Payroll_TemporaryActingAppointment (PositionApprovalConfigId);

    PRINT 'Created: Payroll_TemporaryActingAppointment';
END
ELSE
    PRINT 'Skipped (exists): Payroll_TemporaryActingAppointment';
GO

-- =============================================================================
-- Done.
-- The following permissions / roles are assumed to already exist in your
-- environment and are NOT created by this script:
--   Sys_RolePermission, User_UserDetail, User_UserRoles,
--   AAAA_ConfigSettings, Const_Cycle, Const_Department, Const_Division,
--   Payroll_CyclePeriodDetails — these pre-existed and are read-only here.
-- =============================================================================
PRINT '=== Platinum Overtime table creation complete ===';
GO
