-- ============================================================
  -- SQL Server Migration Script
  -- Source:  PostgreSQL development database (PSQL)
  -- Target:  SQL Server production database [EMS_Mnquma]
  -- Generated: 2026-03-18
  -- ============================================================
  -- INSTRUCTIONS:
  --   Run against [EMS_Mnquma] database in SQL Server Management Studio.
  --   Script is IDEMPOTENT - safe to run multiple times.
  --   Only ADDS new tables/columns - no existing data is touched.
  -- ============================================================

  USE [EMS_Mnquma];
  GO

  -- ============================================================
-- SECTION 1: NEW TABLES (33 tables)
-- These tables exist in PSQL but NOT in SQL Server
-- ============================================================

-- Table: [dbo].[Asset_BulkRefurbItems]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_BulkRefurbItems' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_BulkRefurbItems] (
    [ID] INT NOT NULL,
    [JobID] INT NOT NULL,
    [RowNumber] INT NOT NULL,
    [AssetRegisterItemID] INT NOT NULL,
    [RefurbDate] DATE NOT NULL,
    [Refurb_DT] DECIMAL(18,2) NULL,
    [Refurb_CT] DECIMAL(18,2) NULL,
    [Refurb_Depreciation] DECIMAL(18,2) NULL,
    [Refurb_Revaluation] DECIMAL(18,2) NULL,
    [Refurb_Impairment] DECIMAL(18,2) NULL,
    [DebitPlanProjectItemId] INT NULL,
    [CreditPlanProjectItemId] INT NULL,
    [Status] NVARCHAR(50) NOT NULL,
    [ErrorMessage] NVARCHAR(MAX) NULL,
    [PostedEntityID] INT NULL,
    [DateCreated] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_BulkRefurbJobs]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_BulkRefurbJobs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_BulkRefurbJobs] (
    [ID] INT NOT NULL,
    [Filename] NVARCHAR(500) NULL,
    [Status] NVARCHAR(50) NOT NULL,
    [TotalRecords] INT NULL,
    [PostedRecords] INT NULL,
    [ErrorRecords] INT NULL,
    [UploadedBy] INT NULL,
    [UploadedDate] DATETIME NULL,
    [ApprovedBy] INT NULL,
    [ApprovedDate] DATETIME NULL,
    [RejectionReason] NVARCHAR(MAX) NULL
  );
END
GO

-- Table: [dbo].[Asset_BulkTransactionItems]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_BulkTransactionItems' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_BulkTransactionItems] (
    [ID] INT NOT NULL,
    [JobID] INT NOT NULL,
    [RowNumber] INT NOT NULL,
    [AssetRegisterItemID] INT NOT NULL,
    [TransactionType] NVARCHAR(50) NOT NULL,
    [TransactionDate] DATE NOT NULL,
    [MarketValue] DECIMAL(18,2) NULL,
    [ValuationModule] INT NULL,
    [DepAdjustment] DECIMAL(18,2) NULL,
    [ImpairmentType] NVARCHAR(50) NULL,
    [RecoverableAmount] DECIMAL(18,2) NULL,
    [ValueInUse] DECIMAL(18,2) NULL,
    [Reason] NVARCHAR(MAX) NULL,
    [DisposalMethod] NVARCHAR(100) NULL,
    [DisposalProceeds] DECIMAL(18,2) NULL,
    [Status] NVARCHAR(50) NOT NULL,
    [ErrorMessage] NVARCHAR(MAX) NULL,
    [PostedEntityID] INT NULL,
    [DateCreated] DATETIME NULL,
    [Refurb_DT] DECIMAL(18,2) NULL,
    [Refurb_CT] DECIMAL(18,2) NULL,
    [Refurb_Depreciation] DECIMAL(18,2) NULL,
    [Refurb_Revaluation] DECIMAL(18,2) NULL,
    [Refurb_Impairment] DECIMAL(18,2) NULL,
    [DebitPlanProjectItemId] INT NULL,
    [CreditPlanProjectItemId] INT NULL
  );
END
GO

-- Table: [dbo].[Asset_BulkTransactionJobs]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_BulkTransactionJobs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_BulkTransactionJobs] (
    [ID] INT NOT NULL,
    [Filename] NVARCHAR(500) NULL,
    [TransactionType] NVARCHAR(50) NOT NULL,
    [Status] NVARCHAR(50) NOT NULL,
    [TotalRecords] INT NULL,
    [PostedRecords] INT NULL,
    [ErrorRecords] INT NULL,
    [UploadedBy] INT NULL,
    [UploadedDate] DATETIME NULL,
    [ApprovedBy] INT NULL,
    [ApprovedDate] DATETIME NULL,
    [RejectionReason] NVARCHAR(MAX) NULL,
    [ValidationErrors] NVARCHAR(MAX) NULL
  );
END
GO

-- Table: [dbo].[Asset_MonthlyApproval]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_MonthlyApproval' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_MonthlyApproval] (
    [MonthlyApproval_ID] INT NOT NULL,
    [Financial_Year] NVARCHAR(20) NULL,
    [Financial_Period] INT NULL,
    [User_Id] INT NULL,
    [IsApproved] BIT NULL,
    [DateCreated] DATETIME NULL,
    [VerifiedRevaluation] BIT NULL,
    [VerifiedImpairment] BIT NULL,
    [VerifiedImpairmentReversal] BIT NULL,
    [VerifiedDisposal] BIT NULL
  );
END
GO

-- Table: [dbo].[Asset_PriorPeriodAdjustment]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_PriorPeriodAdjustment' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_PriorPeriodAdjustment] (
    [PriorPeriodAdjustment_ID] INT NOT NULL,
    [AssetRegisterItem_ID] INT NULL,
    [AdjustmentTypeCode] NVARCHAR(30) NULL,
    [Status] NVARCHAR(50) NULL,
    [TargetFinYear] NVARCHAR(9) NULL,
    [TargetFinPeriod] INT NULL,
    [AdjustmentAmount] DECIMAL(18,2) NULL,
    [NewDepreciationAmount] DECIMAL(18,2) NULL,
    [NewCostAmount] DECIMAL(18,2) NULL,
    [NewImpairmentAmount] DECIMAL(18,2) NULL,
    [NewImpairmentReversalAmount] DECIMAL(18,2) NULL,
    [NewRevaluationAmount] DECIMAL(18,2) NULL,
    [SnapshotCost] DECIMAL(18,2) NULL,
    [SnapshotAccDep] DECIMAL(18,2) NULL,
    [SnapshotAccImp] DECIMAL(18,2) NULL,
    [SnapshotCarryingAmount] DECIMAL(18,2) NULL,
    [SnapshotResidualValue] DECIMAL(18,2) NULL,
    [SnapshotRUL] DECIMAL(18,8) NULL,
    [SnapshotRR] DECIMAL(18,2) NULL,
    [DownstreamImpactCount] INT NULL,
    [DownstreamImpactTypes] NVARCHAR(MAX) NULL,
    [DrPlanProjectItemID] INT NULL,
    [CrPlanProjectItemID] INT NULL,
    [ApprovedBy] INT NULL,
    [ApprovedDate] DATETIME NULL,
    [RejectionReason] NVARCHAR(MAX) NULL,
    [RejectedBy] INT NULL,
    [RejectedDate] DATETIME NULL,
    [Comments] NVARCHAR(MAX) NULL,
    [DateCaptured] DATETIME NULL,
    [CapturerID] INT NULL,
    [DateModified] DATETIME NULL,
    [ModifierID] INT NULL,
    [TransactionDate] DATETIME NULL,
    [DebitAmount] DECIMAL(18,2) NULL,
    [CreditAmount] DECIMAL(18,2) NULL,
    [Narration] NVARCHAR(MAX) NULL
  );
END
GO

-- Table: [dbo].[Asset_PriorYearAdjustment]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_PriorYearAdjustment' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_PriorYearAdjustment] (
    [PriorYearAdjustment_ID] INT NOT NULL,
    [AssetRegisterItem_ID] INT NULL,
    [AdjustmentTypeCode] NVARCHAR(30) NULL,
    [Status] NVARCHAR(50) NULL,
    [EffectiveDate] DATETIME NULL,
    [FinYear] NVARCHAR(9) NULL,
    [NewCostAmount] DECIMAL(18,2) NULL,
    [NewValuationAmount] DECIMAL(18,2) NULL,
    [NewRUL] DECIMAL(18,8) NULL,
    [NewAcquisitionDate] DATETIME NULL,
    [NewResidualValue] DECIMAL(18,2) NULL,
    [ResidualValueEffectiveDate] DATETIME NULL,
    [NewImpairmentAmount] DECIMAL(18,2) NULL,
    [ImpairmentEffectiveDate] DATETIME NULL,
    [DisposalDate] DATETIME NULL,
    [DisposalReason] NVARCHAR(500) NULL,
    [DisposalProceeds] DECIMAL(18,2) NULL,
    [SnapshotCost] DECIMAL(18,2) NULL,
    [SnapshotAccDep] DECIMAL(18,2) NULL,
    [SnapshotAccImp] DECIMAL(18,2) NULL,
    [SnapshotCarryingAmount] DECIMAL(18,2) NULL,
    [SnapshotResidualValue] DECIMAL(18,2) NULL,
    [SnapshotRUL] DECIMAL(18,8) NULL,
    [SnapshotRR] DECIMAL(18,2) NULL,
    [SnapshotEUL] DECIMAL(18,8) NULL,
    [CurrentPeriod_CostDelta] DECIMAL(18,2) NULL,
    [CurrentPeriod_AccDepDelta] DECIMAL(18,2) NULL,
    [CurrentPeriod_AccImpDelta] DECIMAL(18,2) NULL,
    [CurrentPeriod_RRDelta] DECIMAL(18,2) NULL,
    [CurrentPeriod_DepChargeDelta] DECIMAL(18,2) NULL,
    [CompPeriod_CostDelta] DECIMAL(18,2) NULL,
    [CompPeriod_AccDepDelta] DECIMAL(18,2) NULL,
    [CompPeriod_AccImpDelta] DECIMAL(18,2) NULL,
    [CompPeriod_RRDelta] DECIMAL(18,2) NULL,
    [CompPeriod_DepChargeDelta] DECIMAL(18,2) NULL,
    [PriorPeriods_CostDelta] DECIMAL(18,2) NULL,
    [PriorPeriods_AccDepDelta] DECIMAL(18,2) NULL,
    [PriorPeriods_AccImpDelta] DECIMAL(18,2) NULL,
    [PriorPeriods_RRDelta] DECIMAL(18,2) NULL,
    [PriorPeriods_DepChargeDelta] DECIMAL(18,2) NULL,
    [HasResidualValueWarning] BIT NULL,
    [HasImpairmentWarning] BIT NULL,
    [DrPlanProjectItemID] INT NULL,
    [CrPlanProjectItemID] INT NULL,
    [ApprovedBy] INT NULL,
    [ApprovedDate] DATETIME NULL,
    [RejectionReason] NVARCHAR(MAX) NULL,
    [RejectedBy] INT NULL,
    [RejectedDate] DATETIME NULL,
    [Comments] NVARCHAR(MAX) NULL,
    [DateCaptured] DATETIME NULL,
    [CapturerID] INT NULL,
    [DateModified] DATETIME NULL,
    [ModifierID] INT NULL
  );
END
GO

-- Table: [dbo].[Asset_PriorYearAdjustment_Documents]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_PriorYearAdjustment_Documents' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_PriorYearAdjustment_Documents] (
    [Document_ID] INT NOT NULL,
    [PriorYearAdjustment_ID] INT NULL,
    [FileName] NVARCHAR(500) NULL,
    [StoredFileName] NVARCHAR(500) NULL,
    [FileSizeBytes] INT NULL,
    [ContentType] NVARCHAR(100) NULL,
    [UploadedDate] DATETIME NULL,
    [UploadedBy] INT NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationAuditTrail]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationAuditTrail' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationAuditTrail] (
    [AuditTrail_ID] INT NOT NULL,
    [VerificationItem_ID] INT NOT NULL,
    [FieldName] NVARCHAR(100) NOT NULL,
    [OldValue] NVARCHAR(MAX) NULL,
    [NewValue] NVARCHAR(MAX) NULL,
    [ChangedByID] INT NULL,
    [ChangedByName] NVARCHAR(200) NULL,
    [ChangedAt] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationPlan]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationPlan' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationPlan] (
    [VerificationPlan_ID] INT NOT NULL,
    [PlanName] NVARCHAR(300) NOT NULL,
    [PlannedStartDate] DATETIME NULL,
    [PlannedEndDate] DATETIME NULL,
    [AssetTypes] NVARCHAR(MAX) NULL,
    [AssetCategories] NVARCHAR(MAX) NULL,
    [Town_ID] INT NULL,
    [Suburb_ID] INT NULL,
    [Building_ID] INT NULL,
    [ScopeOfWork] NVARCHAR(250) NULL,
    [LinkedRegisterId] INT NULL,
    [DashboardURL] NVARCHAR(500) NULL,
    [Status] NVARCHAR(50) NULL,
    [Version] INT NULL,
    [DateCaptured] DATETIME NULL,
    [CapturerID] INT NULL,
    [DateModified] DATETIME NULL,
    [ModifierID] INT NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationPlanApproval]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationPlanApproval' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationPlanApproval] (
    [Approval_ID] INT NOT NULL,
    [VerificationPlan_ID] INT NOT NULL,
    [Version] INT NULL,
    [ApprovedBy] INT NULL,
    [ApprovedByName] NVARCHAR(200) NULL,
    [IsExternal] SMALLINT NULL,
    [ApprovalDate] DATETIME NULL,
    [DocumentId] INT NULL,
    [CreatedAt] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationPlanAuditTrail]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationPlanAuditTrail' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationPlanAuditTrail] (
    [AuditTrail_ID] INT NOT NULL,
    [VerificationPlan_ID] INT NOT NULL,
    [Version] INT NULL,
    [ChangedByID] INT NULL,
    [ChangedByName] NVARCHAR(200) NULL,
    [ChangedAt] DATETIME NULL,
    [ChangesSummary] NVARCHAR(MAX) NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationPlanTeamMember]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationPlanTeamMember' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationPlanTeamMember] (
    [TeamMember_ID] INT NOT NULL,
    [VerificationPlan_ID] INT NOT NULL,
    [Role] NVARCHAR(50) NOT NULL,
    [Employee_ID] INT NULL,
    [EmployeeName] NVARCHAR(200) NULL,
    [IsExternal] SMALLINT NULL,
    [ContactNumber] NVARCHAR(50) NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationRegister]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationRegister' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationRegister] (
    [VerificationRegister_ID] INT NOT NULL,
    [RegisterName] NVARCHAR(300) NOT NULL,
    [RegisterType] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(150) NULL,
    [StartDate] DATETIME NULL,
    [EndDate] DATETIME NULL,
    [DashboardURL] NVARCHAR(500) NULL,
    [TeamMembers] NVARCHAR(MAX) NULL,
    [IsHistory] SMALLINT NULL,
    [DateCaptured] DATETIME NULL,
    [CapturerID] INT NULL,
    [DateModified] DATETIME NULL,
    [ModifierID] INT NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationRegisterItem]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationRegisterItem' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationRegisterItem] (
    [VerificationItem_ID] INT NOT NULL,
    [VerificationRegister_ID] INT NOT NULL,
    [AssetRegisterItem_ID] INT NULL,
    [MunicipalAssetID] NVARCHAR(100) NULL,
    [Description] NVARCHAR(500) NULL,
    [Barcode] NVARCHAR(100) NULL,
    [SerialNumber] NVARCHAR(100) NULL,
    [AssetType_ID] INT NULL,
    [AssetCategory_ID] INT NULL,
    [Asset_SubCategory_ID] INT NULL,
    [AssetClass_ID] INT NULL,
    [Town_ID] INT NULL,
    [MunicipalDepartment_ID] NVARCHAR(250) NULL,
    [Building_ID] INT NULL,
    [FloorID] INT NULL,
    [Room_ID] INT NULL,
    [PurchaseAmount] DECIMAL(18,2) NULL,
    [CarryingAmountClosingBalance] DECIMAL(18,2) NULL,
    [Custodian_ID] INT NULL,
    [AssetCondition_ID] INT NULL,
    [AssetStatus_ID] INT NULL,
    [latitude] NVARCHAR(50) NULL,
    [longitude] NVARCHAR(50) NULL,
    [GPSCoordinates] NVARCHAR(200) NULL,
    [VerificationDate] DATETIME NULL,
    [Temp_VerificationDate] DATETIME NULL,
    [Verification_Flag] NVARCHAR(50) NULL,
    [Verification_Comments] NVARCHAR(500) NULL,
    [Asset_Found] SMALLINT NULL,
    [Keep_on_Register_Dispose] NVARCHAR(50) NULL,
    [Revisit] SMALLINT NULL,
    [Reason_for_Revisit] NVARCHAR(500) NULL,
    [ParentAssetRegisterItem_ID] NVARCHAR(100) NULL,
    [MainAssetDescription] NVARCHAR(500) NULL,
    [MainAssetID] NVARCHAR(100) NULL,
    [OldBarCode] NVARCHAR(100) NULL,
    [ImageRef] NVARCHAR(255) NULL,
    [MeasurementType_ID] INT NULL,
    [InfrastructurOrNonInfrastructure] NVARCHAR(50) NULL,
    [VerificationDoneBy] INT NULL,
    [UoM] INT NULL,
    [Dim1] DECIMAL(18,4) NULL,
    [Dim2] DECIMAL(18,4) NULL,
    [Dim3] DECIMAL(18,4) NULL,
    [Quantity] DECIMAL(18,4) NULL,
    [Diameter] DECIMAL(18,4) NULL,
    [Capacity] DECIMAL(18,4) NULL,
    [ErfNumber] NVARCHAR(100) NULL,
    [ErfSizeM2] DECIMAL(18,4) NULL,
    [PortionNumber] NVARCHAR(100) NULL,
    [UnitNumber] NVARCHAR(100) NULL,
    [RegistrationNumber] NVARCHAR(100) NULL,
    [CustodianIdNumber] NVARCHAR(50) NULL,
    [BasicMunicipalityService] INT NULL,
    [AssetOwnership_ID] INT NULL,
    [DivisionID] INT NULL,
    [Street_ID] INT NULL,
    [Ward_ID] INT NULL,
    [Zoning_ID] INT NULL,
    [Floor_Area] DECIMAL(18,8) NULL,
    [SuburbID] INT NULL,
    [Make] NVARCHAR(100) NULL,
    [Model] NVARCHAR(100) NULL
  );
END
GO

-- Table: [dbo].[Asset_VerificationRegisterTeamMember]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_VerificationRegisterTeamMember' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_VerificationRegisterTeamMember] (
    [RegisterTeamMember_ID] INT NOT NULL,
    [VerificationRegister_ID] INT NOT NULL,
    [Employee_ID] INT NULL,
    [EmployeeName] NVARCHAR(255) NULL,
    [IsExternal] INT NOT NULL
  );
END
GO

-- Table: [dbo].[Asset_WIP_Documents]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_WIP_Documents' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_WIP_Documents] (
    [WIPDocument_ID]    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [WIP_ID]            INT NULL,
    [ContractId]        INT NULL,
    [DocumentType]      NVARCHAR(100) NULL,
    [OriginalFileName]  NVARCHAR(500) NULL,
    [StoredFileName]    NVARCHAR(500) NULL,
    [FilePath]          NVARCHAR(1000) NULL,
    [FileSize]          BIGINT NULL,
    [MimeType]          NVARCHAR(100) NULL,
    [Description]       NVARCHAR(500) NULL,
    [DateCaptured]      DATETIME NULL,
    [CapturerID]        INT NULL
  );
END
GO

-- Table: [dbo].[Const_AssetProjectStatus]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Const_AssetProjectStatus' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Const_AssetProjectStatus] (
    [AssetProjectStatus_ID] INT NOT NULL,
    [StatusDesc] NVARCHAR(200) NOT NULL
  );
END
GO

-- Table: [dbo].[Const_Asset_RunStatus]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Const_Asset_RunStatus' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Const_Asset_RunStatus] (
    [RunStatus_ID] INT NOT NULL,
    [RunStatusDesc] NVARCHAR(200) NULL,
    [Enabled] SMALLINT NULL,
    [DateCaptured] DATETIME NULL,
    [CapturerID] INT NULL,
    [DateModified] DATETIME NULL,
    [ModifierID] INT NULL
  );
END
GO

-- Table: [dbo].[Const_Asset_Run_Type]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Const_Asset_Run_Type' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Const_Asset_Run_Type] (
    [RunType_ID] INT NOT NULL,
    [RunTypeDesc] NVARCHAR(200) NULL,
    [Enabled] SMALLINT NULL,
    [DateCaptured] DATETIME NULL,
    [CapturerID] INT NULL,
    [DateModified] DATETIME NULL,
    [ModifierID] INT NULL
  );
END
GO

-- Table: [dbo].[Asset_AiInsights]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_AiInsights' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_AiInsights] (
    [id] INT NOT NULL,
    [insight_type] NVARCHAR(100) NULL,
    [severity] NVARCHAR(50) NULL,
    [title] NVARCHAR(500) NULL,
    [description] NVARCHAR(MAX) NULL,
    [entity_type] NVARCHAR(100) NULL,
    [entity_id] NVARCHAR(100) NULL,
    [is_dismissed] BIT NULL,
    [dismissed_by] INT NULL,
    [dismissed_at] DATETIME NULL,
    [generated_at] DATETIME NULL,
    [message] NVARCHAR(MAX) NULL,
    [recommendation] NVARCHAR(MAX) NULL,
    [confidence_score] INT NULL,
    [legislation_ref] NVARCHAR(200) NULL
  );
END
GO

-- Table: [dbo].[Asset_AuditTrail]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_AuditTrail' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_AuditTrail] (
    [id] INT NOT NULL,
    [user_id] INT NULL,
    [user_name] NVARCHAR(200) NULL,
    [entity_type] NVARCHAR(100) NULL,
    [entity_id] NVARCHAR(100) NULL,
    [action] NVARCHAR(50) NULL,
    [changes] NVARCHAR(MAX) NULL,
    [ip_address] NVARCHAR(50) NULL,
    [timestamp] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_Documents]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Documents' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Documents] (
    [id] INT NOT NULL,
    [entity_type] NVARCHAR(100) NULL,
    [entity_id] NVARCHAR(100) NULL,
    [file_name] NVARCHAR(500) NULL,
    [file_path] NVARCHAR(500) NULL,
    [file_size] BIGINT NULL,
    [mime_type] NVARCHAR(200) NULL,
    [uploaded_by] INT NULL,
    [uploaded_by_name] NVARCHAR(200) NULL,
    [description] NVARCHAR(MAX) NULL,
    [uploaded_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_FleetBookingSchedule]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_FleetBookingSchedule' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_FleetBookingSchedule] (
    [id] INT NOT NULL,
    [vehicle_asset_id] INT NULL,
    [booked_by] INT NULL,
    [booked_by_name] NVARCHAR(200) NULL,
    [booked_for_date] DATETIME NULL,
    [purpose] NVARCHAR(MAX) NULL,
    [status] NVARCHAR(50) NULL,
    [created_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_FleetInspections]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_FleetInspections' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_FleetInspections] (
    [id] INT NOT NULL,
    [vehicle_asset_id] INT NULL,
    [inspection_type] NVARCHAR(100) NULL,
    [trip_request_id] INT NULL,
    [inspector_id] INT NULL,
    [inspector_name] NVARCHAR(200) NULL,
    [checklist_results] NVARCHAR(MAX) NULL,
    [overall_status] NVARCHAR(50) NULL,
    [comments] NVARCHAR(MAX) NULL,
    [inspected_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_ImportBatches]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_ImportBatches' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_ImportBatches] (
    [id] INT NOT NULL,
    [file_name] NVARCHAR(500) NULL,
    [total_rows] INT NULL,
    [valid_rows] INT NULL,
    [error_rows] INT NULL,
    [committed_rows] INT NULL,
    [status] NVARCHAR(50) NULL,
    [errors] NVARCHAR(MAX) NULL,
    [data] NVARCHAR(MAX) NULL,
    [imported_by] INT NULL,
    [imported_by_name] NVARCHAR(200) NULL,
    [imported_at] DATETIME NULL,
    [committed_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_OrganisationSettings]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_OrganisationSettings' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_OrganisationSettings] (
    [id] INT NOT NULL,
    [municipality_name] NVARCHAR(200) NULL,
    [financial_year_start_month] INT NULL,
    [current_period] INT NULL,
    [current_period_month] INT NULL,
    [mscoa_enabled] BIT NULL,
    [measurement_model] NVARCHAR(50) NULL,
    [settings] NVARCHAR(MAX) NULL,
    [updated_at] DATETIME NULL,
    [financial_year] NVARCHAR(20) NULL,
    [approval_method] NVARCHAR(20) NULL
  );
END
GO

-- Table: [dbo].[Asset_TrackingAlerts]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_TrackingAlerts' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_TrackingAlerts] (
    [id] INT NOT NULL,
    [asset_id] INT NULL,
    [zone_id] INT NULL,
    [alert_type] NVARCHAR(100) NULL,
    [message] NVARCHAR(MAX) NULL,
    [acknowledged_by] INT NULL,
    [acknowledged_at] DATETIME NULL,
    [created_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_TrackingZones]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_TrackingZones' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_TrackingZones] (
    [id] INT NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [boundary_polygon] NVARCHAR(MAX) NULL,
    [zone_type] NVARCHAR(100) NULL,
    [is_active] BIT NULL,
    [created_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_TripRequests]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_TripRequests' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_TripRequests] (
    [id] INT NOT NULL,
    [vehicle_asset_id] INT NULL,
    [requestor_id] INT NULL,
    [requestor_name] NVARCHAR(200) NULL,
    [driver_id] INT NULL,
    [driver_name] NVARCHAR(200) NULL,
    [purpose] NVARCHAR(MAX) NULL,
    [destination] NVARCHAR(500) NULL,
    [departure_date] DATETIME NULL,
    [return_date] DATETIME NULL,
    [passengers] INT NULL,
    [mscoa_string] NVARCHAR(200) NULL,
    [status] NVARCHAR(50) NULL,
    [approved_by] INT NULL,
    [created_at] DATETIME NULL,
    [updated_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_WorkflowApprovals]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_WorkflowApprovals' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_WorkflowApprovals] (
    [id] INT NOT NULL,
    [instance_id] INT NULL,
    [step_number] INT NULL,
    [approver_id] INT NULL,
    [approver_name] NVARCHAR(200) NULL,
    [action] NVARCHAR(50) NULL,
    [comments] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_WorkflowDefinitions]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_WorkflowDefinitions' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_WorkflowDefinitions] (
    [id] INT NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [entity_type] NVARCHAR(100) NOT NULL,
    [steps] NVARCHAR(MAX) NULL,
    [is_active] BIT NULL,
    [created_at] DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_WorkflowInstances]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_WorkflowInstances' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_WorkflowInstances] (
    [id] INT NOT NULL,
    [definition_id] INT NULL,
    [entity_type] NVARCHAR(100) NULL,
    [entity_id] NVARCHAR(100) NULL,
    [current_step] INT NULL,
    [status] NVARCHAR(50) NULL,
    [initiated_by] INT NULL,
    [initiated_by_name] NVARCHAR(200) NULL,
    [data] NVARCHAR(MAX) NULL,
    [mssql_reference_id] NVARCHAR(100) NULL,
    [initiated_at] DATETIME NULL,
    [completed_at] DATETIME NULL
  );
END
GO

-- ============================================================
-- SECTION 2: NEW COLUMNS ON EXISTING TABLES
-- These columns exist in PSQL but NOT in SQL Server
-- ============================================================

-- Table: [dbo].[Asset_BulkUploadJobs] (+3 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkUploadJobs]') AND name = 'ApprovedByID')
  ALTER TABLE [dbo].[Asset_BulkUploadJobs] ADD [ApprovedByID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkUploadJobs]') AND name = 'ApprovedDate')
  ALTER TABLE [dbo].[Asset_BulkUploadJobs] ADD [ApprovedDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkUploadJobs]') AND name = 'UploadType')
  ALTER TABLE [dbo].[Asset_BulkUploadJobs] ADD [UploadType] INT NULL;
GO

-- Table: [dbo].[Asset_BulkValidation] (+33 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Diameter')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Diameter] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Capacity')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Capacity] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Street')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Street] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'StandNumber')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [StandNumber] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Floor')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Floor] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Room')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Room] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Zone')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Zone] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'Region')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [Region] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'GISFeatureID')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [GISFeatureID] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'FundingSource')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [FundingSource] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'FundType')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [FundType] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'PurchaseAmountFinanceCharges')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [PurchaseAmountFinanceCharges] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'PurchaseAmountMovement')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [PurchaseAmountMovement] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'AccumulatedDepreciationMovement')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [AccumulatedDepreciationMovement] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'AccumulatedImpairmentMovement')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [AccumulatedImpairmentMovement] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DepreciationPerMonth')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DepreciationPerMonth] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'FairValue')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [FairValue] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DisposalCarryingAmount')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DisposalCarryingAmount] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DisposalSalePrice')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DisposalSalePrice] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DisposalProfitLoss')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DisposalProfitLoss] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DonorConditions')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DonorConditions] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'RevaluationOpeningBalance')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [RevaluationOpeningBalance] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'MovementInRevaluationReserve')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [MovementInRevaluationReserve] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'TransferDate')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [TransferDate] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'TransferFromMunicipality')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [TransferFromMunicipality] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DepreciationOffset')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DepreciationOffset] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'DeemedCost')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [DeemedCost] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'TransferToMunicipality')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [TransferToMunicipality] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'TransferNatureOfTransfer')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [TransferNatureOfTransfer] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_BulkValidation]') AND name = 'TransferReasonOfTransfer')
  ALTER TABLE [dbo].[Asset_BulkValidation] ADD [TransferReasonOfTransfer] NVARCHAR(100) NULL;
GO

-- Table: [dbo].[Asset_Depreciation] (+7 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Depreciation]') AND name = 'DepreciationDate')
  ALTER TABLE [dbo].[Asset_Depreciation] ADD [DepreciationDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Depreciation]') AND name = 'CarryingAmount')
  ALTER TABLE [dbo].[Asset_Depreciation] ADD [CarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Depreciation]') AND name = 'RunType_ID')
  ALTER TABLE [dbo].[Asset_Depreciation] ADD [RunType_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Depreciation]') AND name = 'RunStatus_ID')
  ALTER TABLE [dbo].[Asset_Depreciation] ADD [RunStatus_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Depreciation]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_Depreciation] ADD [FinYear] NVARCHAR(9) NULL;
GO

-- Table: [dbo].[Asset_DepreciationApproval] (+8 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationApproval]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_DepreciationApproval] ADD [FinYear] NVARCHAR(9) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationApproval]') AND name = 'MonthID')
  ALTER TABLE [dbo].[Asset_DepreciationApproval] ADD [MonthID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationApproval]') AND name = 'ApprovalTypeID')
  ALTER TABLE [dbo].[Asset_DepreciationApproval] ADD [ApprovalTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationApproval]') AND name = 'ApprovalDate')
  ALTER TABLE [dbo].[Asset_DepreciationApproval] ADD [ApprovalDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationApproval]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_DepreciationApproval] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationApproval]') AND name = 'Comments')
  ALTER TABLE [dbo].[Asset_DepreciationApproval] ADD [Comments] NVARCHAR(MAX) NULL;
GO

-- Table: [dbo].[Asset_DepreciationSchedule] (+10 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'RunDate')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [RunDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'RunType_ID')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [RunType_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'RunStatus_ID')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [RunStatus_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'TotalAssets')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [TotalAssets] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'TotalDepreciation')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [TotalDepreciation] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'DateCaptured')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [DateCaptured] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'DateModified')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [DateModified] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'ModifierID')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [ModifierID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'ScheduledDate')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [ScheduledDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule]') AND name = 'StatusID')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule] ADD [StatusID] INT NULL;
GO

-- Table: [dbo].[Asset_DepreciationSchedule_Item] (+14 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule_Item]') AND name = 'AssetRegisterItem_ID')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule_Item] ADD [AssetRegisterItem_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule_Item]') AND name = 'DepreciationAmount')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule_Item] ADD [DepreciationAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule_Item]') AND name = 'AccumulatedDepreciation')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule_Item] ADD [AccumulatedDepreciation] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule_Item]') AND name = 'CarryingAmount')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule_Item] ADD [CarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule_Item]') AND name = 'TotalAssets')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule_Item] ADD [TotalAssets] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_DepreciationSchedule_Item]') AND name = 'TotalDepreciation')
  ALTER TABLE [dbo].[Asset_DepreciationSchedule_Item] ADD [TotalDepreciation] DECIMAL(18,2) NULL;
GO

-- Table: [dbo].[Asset_Disposal] (+11 columns)
-- AssetDisposalMethodID is NOT NULL in FullDB but the API allows null (no method selected yet); relax constraint
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'AssetDisposalMethodID' AND is_nullable = 0)
  ALTER TABLE [dbo].[Asset_Disposal] ALTER COLUMN [AssetDisposalMethodID] INT NULL;
GO
-- Ensure TotalDisposalValue exists (older schemas may only have SalePrice)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'TotalDisposalValue')
BEGIN
  ALTER TABLE [dbo].[Asset_Disposal] ADD [TotalDisposalValue] DECIMAL(16,2) NULL;
  IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'SalePrice')
    UPDATE [dbo].[Asset_Disposal] SET [TotalDisposalValue] = [SalePrice] WHERE [TotalDisposalValue] IS NULL;
END
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'CarryingAmount')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [CarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [FinYear] NVARCHAR(9) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'Approved')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [Approved] SMALLINT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'ApprovedDate')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [ApprovedDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'ApprovedBy')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [ApprovedBy] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'RejectedBy')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [RejectedBy] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'RejectedDate')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [RejectedDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal]') AND name = 'RejectionReason')
  ALTER TABLE [dbo].[Asset_Disposal] ADD [RejectionReason] NVARCHAR(MAX) NULL;
GO

-- Table: [dbo].[Asset_Disposal_Approval] (+6 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal_Approval]') AND name = 'AssetDisposal_ID')
  ALTER TABLE [dbo].[Asset_Disposal_Approval] ADD [AssetDisposal_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal_Approval]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_Disposal_Approval] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Disposal_Approval]') AND name = 'Comments')
  ALTER TABLE [dbo].[Asset_Disposal_Approval] ADD [Comments] NVARCHAR(MAX) NULL;
GO

-- Table: [dbo].[Asset_FairValue] (+4 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValue]') AND name = 'PreviousCarryingAmount')
  ALTER TABLE [dbo].[Asset_FairValue] ADD [PreviousCarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValue]') AND name = 'GainLoss')
  ALTER TABLE [dbo].[Asset_FairValue] ADD [GainLoss] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValue]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_FairValue] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValue]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_FairValue] ADD [FinYear] NVARCHAR(9) NULL;
GO

-- Table: [dbo].[Asset_FairValueApproval] (+5 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValueApproval]') AND name = 'RegistrationItemFairValue_Id')
  ALTER TABLE [dbo].[Asset_FairValueApproval] ADD [RegistrationItemFairValue_Id] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValueApproval]') AND name = 'ApprovalDate')
  ALTER TABLE [dbo].[Asset_FairValueApproval] ADD [ApprovalDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValueApproval]') AND name = 'ApprovedByID')
  ALTER TABLE [dbo].[Asset_FairValueApproval] ADD [ApprovedByID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValueApproval]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_FairValueApproval] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FairValueApproval]') AND name = 'Comments')
  ALTER TABLE [dbo].[Asset_FairValueApproval] ADD [Comments] NVARCHAR(MAX) NULL;
GO

-- Table: [dbo].[Asset_FundingSource] (+8 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FundingSource]') AND name = 'FundingSourceCode')
  ALTER TABLE [dbo].[Asset_FundingSource] ADD [FundingSourceCode] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FundingSource]') AND name = 'Enabled')
  ALTER TABLE [dbo].[Asset_FundingSource] ADD [Enabled] SMALLINT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FundingSource]') AND name = 'DateModified')
  ALTER TABLE [dbo].[Asset_FundingSource] ADD [DateModified] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FundingSource]') AND name = 'ModifierID')
  ALTER TABLE [dbo].[Asset_FundingSource] ADD [ModifierID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_FundingSource]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_FundingSource] ADD [FinYear] NVARCHAR(9) NULL;
GO

-- Table: [dbo].[Asset_Impairment] (+14 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'ImpairmentAmount')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [ImpairmentAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'PreviousCarryingAmount')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [PreviousCarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'NewCarryingAmount')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [NewCarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [FinYear] NVARCHAR(9) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'RemainingUsefulLife')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [RemainingUsefulLife] DECIMAL(18,8) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'CatchUpDepreciation')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [CatchUpDepreciation] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'CatchUpDays')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [CatchUpDays] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'RejectedBy')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [RejectedBy] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'RejectedDate')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [RejectedDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Impairment]') AND name = 'RejectionReason')
  ALTER TABLE [dbo].[Asset_Impairment] ADD [RejectionReason] NVARCHAR(MAX) NULL;
GO

-- Table: [dbo].[Asset_ImpairmentPostings] (+6 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_ImpairmentPostings]') AND name = 'PostingDate')
  ALTER TABLE [dbo].[Asset_ImpairmentPostings] ADD [PostingDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_ImpairmentPostings]') AND name = 'PostedByID')
  ALTER TABLE [dbo].[Asset_ImpairmentPostings] ADD [PostedByID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_ImpairmentPostings]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_ImpairmentPostings] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_ImpairmentPostings]') AND name = 'DateCaptured')
  ALTER TABLE [dbo].[Asset_ImpairmentPostings] ADD [DateCaptured] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_ImpairmentPostings]') AND name = 'CapturerID')
  ALTER TABLE [dbo].[Asset_ImpairmentPostings] ADD [CapturerID] INT NULL;
GO

-- Table: [dbo].[Asset_MaintenanceWorkOrder] (+1 column)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_MaintenanceWorkOrder]') AND name = 'RequestID')
  ALTER TABLE [dbo].[Asset_MaintenanceWorkOrder] ADD [RequestID] INT NOT NULL DEFAULT 0;
GO

-- Table: [dbo].[Asset_Refurb] (+3 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Refurb]') AND name = 'DebitPlanProjectItemId')
  ALTER TABLE [dbo].[Asset_Refurb] ADD [DebitPlanProjectItemId] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Refurb]') AND name = 'CreditPlanProjectItemId')
  ALTER TABLE [dbo].[Asset_Refurb] ADD [CreditPlanProjectItemId] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Refurb]') AND name = 'Refurb_Impairment')
  ALTER TABLE [dbo].[Asset_Refurb] ADD [Refurb_Impairment] DECIMAL(16,2) NOT NULL DEFAULT 0;
GO

-- Table: [dbo].[Asset_Register_Items] (+8 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'DateModified')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [DateModified] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'InvoiceNo')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [InvoiceNo] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'DisposalDocNo')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [DisposalDocNo] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'PaymentNo')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [PaymentNo] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'FundingDescription')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [FundingDescription] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'LocationDescription')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [LocationDescription] NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'RoomResponsiblePerson')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [RoomResponsiblePerson] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items]') AND name = 'ITHardwareResponsiblePerson')
  ALTER TABLE [dbo].[Asset_Register_Items] ADD [ITHardwareResponsiblePerson] NVARCHAR(100) NULL;
GO

-- Table: [dbo].[Asset_Register_Items_Upload] (+57 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Description')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Description] NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'ParentAssetRegisterItem_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [ParentAssetRegisterItem_ID] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Financial_Status_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Financial_Status_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AssetType_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AssetType_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AssetCategory_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AssetCategory_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Asset_SubCategory_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Asset_SubCategory_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AssetClass_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AssetClass_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'MeasurementType_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [MeasurementType_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AssetStatus_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AssetStatus_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Remaining_Useful_Life_Year')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Remaining_Useful_Life_Year] DECIMAL(18,8) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'RemainingUsefulLife')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [RemainingUsefulLife] DECIMAL(18,8) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AssetCondition_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AssetCondition_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Diameter')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Diameter] DECIMAL(18,4) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Capacity')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Capacity] DECIMAL(18,4) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'ErfNumber')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [ErfNumber] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Custodian_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Custodian_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'MunicipalDepartment_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [MunicipalDepartment_ID] NVARCHAR(250) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Street')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Street] NVARCHAR(250) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'StandNumber')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [StandNumber] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Floor')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Floor] NVARCHAR(250) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Room')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Room] NVARCHAR(250) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Zone')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Zone] NVARCHAR(250) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Region')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Region] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'GISFeatureID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [GISFeatureID] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'latitude')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [latitude] DECIMAL(18,8) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'FundingSource')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [FundingSource] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'PurchaseAmount')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [PurchaseAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'PurchaseAmountFinanceCharges')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [PurchaseAmountFinanceCharges] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'PurchaseAmountMovement')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [PurchaseAmountMovement] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AccumulatedDepreciationClosingBalance')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AccumulatedDepreciationClosingBalance] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AccumulatedImpairmentClosingBalance')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AccumulatedImpairmentClosingBalance] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DepreciationPerMonth')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DepreciationPerMonth] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'FairValue')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [FairValue] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DisposalCarryingAmount')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DisposalCarryingAmount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DisposalSalePrice')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DisposalSalePrice] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DisposalProfitLoss')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DisposalProfitLoss] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'CarryingAmountClosingBalance')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [CarryingAmountClosingBalance] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'PurchaseAmount_Cost2')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [PurchaseAmount_Cost2] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'AccumulatedImpairmentMovement2')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [AccumulatedImpairmentMovement2] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DonorName')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DonorName] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DonorDate')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DonorDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DonorConditions')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DonorConditions] NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'CIDMSSubComponentTypeID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [CIDMSSubComponentTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'VerificationDate')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [VerificationDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DateOfDisposal')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DateOfDisposal] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Impairment_Date')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Impairment_Date] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'TransferDate')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [TransferDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'TransferFromMunicipality')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [TransferFromMunicipality] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'TransferToMunicipality')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [TransferToMunicipality] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'TransferNatureOfTransfer')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [TransferNatureOfTransfer] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'TransferReasonOfTransfer')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [TransferReasonOfTransfer] NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [FinYear] NVARCHAR(9) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'DateCaptured')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [DateCaptured] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'Capturer_ID')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [Capturer_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'RevaluationClosingBalance')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [RevaluationClosingBalance] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'RevaluationReserve')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [RevaluationReserve] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Items_Upload]') AND name = 'CurrentReplacementCostCRC')
  ALTER TABLE [dbo].[Asset_Register_Items_Upload] ADD [CurrentReplacementCostCRC] NVARCHAR(100) NULL;
GO

-- Table: [dbo].[Asset_Register_Transactions] (+1 column)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Register_Transactions]') AND name = 'RefurbImpairmentValue')
  ALTER TABLE [dbo].[Asset_Register_Transactions] ADD [RefurbImpairmentValue] DECIMAL(18,8) NULL;
GO

-- Table: [dbo].[Asset_Revaluations]
-- Legacy NOT NULL columns (Revaluation, Asset, Profit, RevalModel, UserID, DiffDepAcc,
-- DiffBook, ProjectDR, ProjectItemDR, ProjectCR, ProjectItemCR) are kept NOT NULL.
-- RevaluationDynamicRepository.CreateAsync now provides 0 values for all of them.
-- Date field: repository uses existing [RevalutionDate] (FullDB column); no new column needed.
-- New columns required by RevaluationDynamicRepository (not in original FullDB schema):
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'FairValue')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [FairValue] DECIMAL(18,8) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [FinYear] NVARCHAR(9) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'FinancialPeriod')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [FinancialPeriod] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'RevaluationModel_ID')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [RevaluationModel_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'IsApproved')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [IsApproved] BIT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'DateCaptured')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [DateCaptured] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'CapturerID')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [CapturerID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'DateModified')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [DateModified] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'RejectedBy')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [RejectedBy] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'RejectedDate')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [RejectedDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Revaluations]') AND name = 'RejectionReason')
  ALTER TABLE [dbo].[Asset_Revaluations] ADD [RejectionReason] NVARCHAR(MAX) NULL;
GO

-- Table: [dbo].[Asset_Transaction_Summary] (+6 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_Transaction_Summary]') AND name = 'RefurbImpairmentValue')
  ALTER TABLE [dbo].[Asset_Transaction_Summary] ADD [RefurbImpairmentValue] DECIMAL(18,2) NULL;
GO

-- Table: [dbo].[Asset_WIPApprovalItems] (+8 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIPApprovalItems]') AND name = 'WIPRegister_ID')
  ALTER TABLE [dbo].[Asset_WIPApprovalItems] ADD [WIPRegister_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIPApprovalItems]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_WIPApprovalItems] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIPApprovalItems]') AND name = 'Comments')
  ALTER TABLE [dbo].[Asset_WIPApprovalItems] ADD [Comments] NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIPApprovalItems]') AND name = 'DateModified')
  ALTER TABLE [dbo].[Asset_WIPApprovalItems] ADD [DateModified] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIPApprovalItems]') AND name = 'ModifierID')
  ALTER TABLE [dbo].[Asset_WIPApprovalItems] ADD [ModifierID] INT NULL;
GO

-- Table: [dbo].[Asset_WIP_Register] (+18 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'StartDate')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [StartDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'ExpectedEndDate')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [ExpectedEndDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'TotalBudget')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [TotalBudget] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'TotalExpenditure')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [TotalExpenditure] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'AssetType_ID')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [AssetType_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'AssetCategory_ID')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [AssetCategory_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'FinYear')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [FinYear] NVARCHAR(9) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'ProjectComplete')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [ProjectComplete] SMALLINT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'UnbundlingStatus')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [UnbundlingStatus] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'UnbundlingComment')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [UnbundlingComment] NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'ApproverID')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [ApproverID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'UnbundlingApprovedDate')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [UnbundlingApprovedDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'ActualSurvey')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [ActualSurvey] NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'MainAssetDescription')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [MainAssetDescription] NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register]') AND name = 'ScmContractID')
  ALTER TABLE [dbo].[Asset_WIP_Register] ADD [ScmContractID] INT NULL;
GO

-- Table: [dbo].[Asset_WIP_Register_Details] (+4 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Details]') AND name = 'Description')
  ALTER TABLE [dbo].[Asset_WIP_Register_Details] ADD [Description] NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Details]') AND name = 'TransactionDate')
  ALTER TABLE [dbo].[Asset_WIP_Register_Details] ADD [TransactionDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Details]') AND name = 'ReferenceNumber')
  ALTER TABLE [dbo].[Asset_WIP_Register_Details] ADD [ReferenceNumber] NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Details]') AND name = 'ScmInvoiceDetailId')
  ALTER TABLE [dbo].[Asset_WIP_Register_Details] ADD [ScmInvoiceDetailId] INT NULL;
GO

-- Table: [dbo].[Asset_WIP_Register_Funding] (+4 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Funding]') AND name = 'WIPRegisterFunding_ID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Funding] ADD [WIPRegisterFunding_ID] INT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Funding]') AND name = 'FundingType_ID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Funding] ADD [FundingType_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Funding]') AND name = 'Amount')
  ALTER TABLE [dbo].[Asset_WIP_Register_Funding] ADD [Amount] DECIMAL(18,2) NULL;
GO

-- Table: [dbo].[Asset_WIP_Register_Items] (+24 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'WIPRegister_ID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [WIPRegister_ID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'Description')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [Description] NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'Amount')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [Amount] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'TransferDate')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [TransferDate] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'Status')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [Status] NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'IsAssetItem')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [IsAssetItem] SMALLINT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'AssetDescription')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [AssetDescription] NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'Rate')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [Rate] DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'Quantity')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [Quantity] DECIMAL(18,8) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSAccountingGroupID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSAccountingGroupID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSAccountingSubGroupID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSAccountingSubGroupID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSClassID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSClassID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSGroupTypeID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSGroupTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSAssetTypeID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSAssetTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSComponentTypeID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSComponentTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'CIDMSSubComponentTypeID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [CIDMSSubComponentTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'AssetTypeID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [AssetTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'AssetCategoryID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [AssetCategoryID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'AssetSubCategoryID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [AssetSubCategoryID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'MeasurementTypeID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [MeasurementTypeID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'AssetStatusID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [AssetStatusID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'BudgetProjectID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [BudgetProjectID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'BudgetProjectItemID')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [BudgetProjectItemID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Register_Items]') AND name = 'BoqGroupId')
  ALTER TABLE [dbo].[Asset_WIP_Register_Items] ADD [BoqGroupId] INT NULL;
GO

-- Table: [dbo].[Cons_Vendor] (+1 column)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Cons_Vendor]') AND name = 'Enabled')
  ALTER TABLE [dbo].[Cons_Vendor] ADD [Enabled] SMALLINT NULL;
GO

-- Table: [dbo].[Const_AssetDisposalMethod] (+1 column)

-- Table: [dbo].[Const_Asset_Calculation_Type] (+1 column)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_Calculation_Type]') AND name = 'Enabled')
  ALTER TABLE [dbo].[Const_Asset_Calculation_Type] ADD [Enabled] SMALLINT NULL;
GO

-- Table: [dbo].[Const_Asset_ComponentType] (+1 column)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_ComponentType]') AND name = 'Default')
  ALTER TABLE [dbo].[Const_Asset_ComponentType] ADD [Default] SMALLINT NULL;
GO

-- Table: [dbo].[Const_Asset_Depreciation_Approval_Type] (+5 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_Depreciation_Approval_Type]') AND name = 'Enabled')
  ALTER TABLE [dbo].[Const_Asset_Depreciation_Approval_Type] ADD [Enabled] SMALLINT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_Depreciation_Approval_Type]') AND name = 'DateCaptured')
  ALTER TABLE [dbo].[Const_Asset_Depreciation_Approval_Type] ADD [DateCaptured] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_Depreciation_Approval_Type]') AND name = 'CapturerID')
  ALTER TABLE [dbo].[Const_Asset_Depreciation_Approval_Type] ADD [CapturerID] INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_Depreciation_Approval_Type]') AND name = 'DateModified')
  ALTER TABLE [dbo].[Const_Asset_Depreciation_Approval_Type] ADD [DateModified] DATETIME NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Const_Asset_Depreciation_Approval_Type]') AND name = 'ModifierID')
  ALTER TABLE [dbo].[Const_Asset_Depreciation_Approval_Type] ADD [ModifierID] INT NULL;
GO

-- ============================================================
-- ADDITIONAL TABLES: required by ASSETS-API controllers
-- (not present in live SQL Server FullDB with compatible schema)
-- ============================================================

-- Table: [dbo].[Asset_MaintenanceWorksOrder]
-- (FullDB has Asset_MaintenanceWorkOrder with incompatible GL-based schema;
--  this table supports the maintenance request workflow)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_MaintenanceWorksOrder' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_MaintenanceWorksOrder] (
    [MaintenanceWorksOrderID] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [RequestID]               INT NULL,
    [OrderDate]               DATETIME NULL,
    [OrderDescription]        NVARCHAR(500) NULL,
    [TotalOrderValue]         DECIMAL(18,2) NULL,
    [IsApproved]              BIT NOT NULL DEFAULT 0,
    [DateCaptured]            DATETIME NULL,
    [CapturerID]              INT NULL,
    [DateModified]            DATETIME NULL,
    [ModifierID]              INT NULL
  );
END
GO

-- Table: [dbo].[Asset_Config_mSCOA]
-- (FullDB AssetConfig_mSCOA has TypeID/CategoryID columns incompatible with this controller)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Config_mSCOA' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Config_mSCOA] (
    [AssetConfig_mSCOA_ID]  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetType_ID]          INT NULL,
    [AssetCategory_ID]      INT NULL,
    [Asset_SubCategory_ID]  INT NULL,
    [MeasurementType_ID]    INT NULL,
    [FinYear]               NVARCHAR(9) NULL,
    [DateCaptured]          DATETIME NULL,
    [CapturerID]            INT NULL
  );
END
GO

-- Table: [dbo].[Asset_Config_TransactionTypes]
-- (FullDB AssetConfig_TransactionType has Name/SubType columns incompatible with this controller)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Config_TransactionTypes' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Config_TransactionTypes] (
    [TransactionTypeID]     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetConfig_mSCOA_ID]  INT NULL,
    [TransactionType]       NVARCHAR(200) NULL,
    [Description]           NVARCHAR(500) NULL
  );
END
GO

-- Table: [dbo].[Asset_Fleet_Trip]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Fleet_Trip' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Fleet_Trip] (
    [TripID]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetRegisterItem_ID]  INT NULL,
    [TripDate]              DATETIME NULL,
    [Driver]                NVARCHAR(200) NULL,
    [StartOdometer]         DECIMAL(18,2) NULL,
    [EndOdometer]           DECIMAL(18,2) NULL,
    [Purpose]               NVARCHAR(500) NULL,
    [Notes]                 NVARCHAR(1000) NULL,
    [DateCaptured]          DATETIME NULL,
    [CapturerID]            INT NULL,
    [DateModified]          DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_Fleet_Inspection]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Fleet_Inspection' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Fleet_Inspection] (
    [InspectionID]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetRegisterItem_ID]  INT NULL,
    [InspectionDate]        DATETIME NULL,
    [InspectorName]         NVARCHAR(200) NULL,
    [OverallCondition]      NVARCHAR(100) NULL,
    [Notes]                 NVARCHAR(1000) NULL,
    [DateCaptured]          DATETIME NULL,
    [CapturerID]            INT NULL
  );
END
GO

-- Table: [dbo].[Asset_Fleet_Booking]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Fleet_Booking' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Fleet_Booking] (
    [BookingID]             INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetRegisterItem_ID]  INT NULL,
    [BookingDate]           DATETIME NULL,
    [StartDate]             DATETIME NULL,
    [EndDate]               DATETIME NULL,
    [BookedBy]              NVARCHAR(200) NULL,
    [Purpose]               NVARCHAR(500) NULL,
    [Status]                NVARCHAR(50) NULL,
    [DateCaptured]          DATETIME NULL,
    [CapturerID]            INT NULL
  );
END
GO

-- Table: [dbo].[Asset_Tracking_Zone]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Tracking_Zone' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Tracking_Zone] (
    [ZoneID]        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ZoneName]      NVARCHAR(200) NULL,
    [Description]   NVARCHAR(500) NULL,
    [DateCaptured]  DATETIME NULL,
    [CapturerID]    INT NULL
  );
END
GO

-- Table: [dbo].[Asset_Tracking_Alert]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_Tracking_Alert' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_Tracking_Alert] (
    [AlertID]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetRegisterItem_ID]  INT NULL,
    [AlertType]             NVARCHAR(100) NULL,
    [AlertMessage]          NVARCHAR(500) NULL,
    [Status]                NVARCHAR(50) NULL,
    [DismissedAt]           DATETIME NULL,
    [DateCaptured]          DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_WIP_Transfers]
-- (FullDB Asset_Transfer_Transactions has incompatible GL journal schema)
-- Rename legacy WIP_ID column to WIPRegister_ID if it exists from a prior migration run
-- Guard: only rename if WIP_ID exists AND WIPRegister_ID does not yet exist
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Transfers]') AND name = 'WIP_ID')
   AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Transfers]') AND name = 'WIPRegister_ID')
BEGIN
  EXEC sp_rename '[dbo].[Asset_WIP_Transfers].[WIP_ID]', 'WIPRegister_ID', 'COLUMN';
END
GO
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_WIP_Transfers' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Transfers]') AND name = 'FromDepartment')
    ALTER TABLE [dbo].[Asset_WIP_Transfers] ADD [FromDepartment] NVARCHAR(200) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Transfers]') AND name = 'ToDepartment')
    ALTER TABLE [dbo].[Asset_WIP_Transfers] ADD [ToDepartment] NVARCHAR(200) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Asset_WIP_Transfers]') AND name = 'Reason')
    ALTER TABLE [dbo].[Asset_WIP_Transfers] ADD [Reason] NVARCHAR(500) NULL;
END
GO
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_WIP_Transfers' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_WIP_Transfers] (
    [WIPTransfer_ID]        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [WIPRegister_ID]        INT NULL,
    [AssetRegisterItem_ID]  INT NULL,
    [TransferDate]          DATETIME NULL,
    [TransferAmount]        DECIMAL(18,2) NULL,
    [FromDepartment]        NVARCHAR(200) NULL,
    [ToDepartment]          NVARCHAR(200) NULL,
    [Reason]                NVARCHAR(500) NULL,
    [FinYear]               NVARCHAR(9) NULL,
    [FinancialPeriod]       INT NULL,
    [Status]                NVARCHAR(50) NULL,
    [ApprovedBy]            INT NULL,
    [ApprovedDate]          DATETIME NULL,
    [RejectedBy]            INT NULL,
    [RejectedDate]          DATETIME NULL,
    [RejectionReason]       NVARCHAR(500) NULL,
    [DateCaptured]          DATETIME NULL,
    [CapturerID]            INT NULL,
    [DateModified]          DATETIME NULL
  );
END
GO

-- Table: [dbo].[Asset_AutomatedJobLog]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Asset_AutomatedJobLog' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE [dbo].[Asset_AutomatedJobLog] (
    [job_log_id]    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [job_name]      NVARCHAR(200) NULL,
    [status]        NVARCHAR(50) NULL,
    [message]       NVARCHAR(MAX) NULL,
    [duration_ms]   INT NULL,
    [ran_at]        DATETIME NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================
  -- END OF MIGRATION SCRIPT (SECTIONS A & B)
  -- Summary: 33 new tables created, 30 tables altered
  --          + 11 additional tables added for ASSETS-API controller support
  -- ============================================================

  -- ================================================================
  -- SECTION C: LEGACY DATA BACKFILL
  -- Populates new columns for existing (pre-migration) records.
  -- All statements are idempotent (WHERE [NewCol] IS NULL guard).
  -- Safe: no data loss; NULL acceptable where source is unknown.
  -- Run AFTER Section A & B (all ALTER TABLE blocks).
  -- ================================================================

  -- ------------------------------------------------------------------
  -- C1: Asset_Depreciation
  -- Populate: DepreciationDate, FinYear, CarryingAmount
  -- (RunType_ID, RunStatus_ID are left NULL — cannot derive from legacy)
  -- ------------------------------------------------------------------
  UPDATE d
  SET d.[DepreciationDate]  = COALESCE(si.[ScheduledDate], d.[DateCaptured]),
      d.[FinYear]           = s.[FinYear],
      d.[CarryingAmount]    = d.[CarryingAmountClosingBalance]
  FROM [Asset_Depreciation] d
  JOIN [Asset_DepreciationSchedule_Item] si
    ON si.[Asset_DepreciationSchedule_Item_ID] = d.[Depreciation_ScheduledItemID]
  JOIN [Asset_DepreciationSchedule] s
    ON s.[Asset_DepreciationSchedule_ID] = si.[Asset_DepreciationSchedule_ID]
  WHERE d.[DepreciationDate] IS NULL
    AND d.[Depreciation_ScheduledItemID] IS NOT NULL;
  GO

  -- Fallback: records not linked to a schedule item
  UPDATE [Asset_Depreciation]
  SET [DepreciationDate] = [DateCaptured],
      [CarryingAmount]   = [CarryingAmountClosingBalance]
  WHERE [DepreciationDate] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C2: Asset_DepreciationSchedule_Item
  -- Populate: TotalAssets, TotalDepreciation, DepreciationAmount,
  --           AccumulatedDepreciation, CarryingAmount, AssetRegisterItem_ID
  -- ------------------------------------------------------------------
  UPDATE si
  SET si.[TotalAssets]             = t.[Cnt],
      si.[TotalDepreciation]       = t.[SumDep],
      si.[DepreciationAmount]      = t.[SumDep],
      si.[AccumulatedDepreciation] = t.[SumAcc],
      si.[CarryingAmount]          = t.[SumCarry]
  FROM [Asset_DepreciationSchedule_Item] si
  JOIN (
      SELECT [Depreciation_ScheduledItemID],
             COUNT(*)                              AS [Cnt],
             SUM([DepreciationValue])              AS [SumDep],
             SUM([AccumulatedDepreciation])        AS [SumAcc],
             SUM([CarryingAmountClosingBalance])   AS [SumCarry]
      FROM [Asset_Depreciation]
      WHERE [Depreciation_ScheduledItemID] IS NOT NULL
      GROUP BY [Depreciation_ScheduledItemID]
  ) t ON t.[Depreciation_ScheduledItemID] = si.[Asset_DepreciationSchedule_Item_ID]
  WHERE si.[TotalAssets] IS NULL;
  GO

  -- AssetRegisterItem_ID: only where exactly 1 asset linked (individual run item)
  UPDATE si
  SET si.[AssetRegisterItem_ID] = d.[AssetRegisterItem_ID]
  FROM [Asset_DepreciationSchedule_Item] si
  JOIN [Asset_Depreciation] d
    ON d.[Depreciation_ScheduledItemID] = si.[Asset_DepreciationSchedule_Item_ID]
  WHERE si.[TotalAssets] = 1
    AND si.[AssetRegisterItem_ID] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C3: Asset_DepreciationSchedule (year-level rollup)
  -- Populate: StatusID from existing approval flags
  -- (RunDate, RunType_ID, TotalAssets, TotalDepreciation, ScheduledDate
  --  are populated from schedule items where available)
  -- ------------------------------------------------------------------
  UPDATE s
  SET s.[TotalAssets]       = t.[TotalAssets],
      s.[TotalDepreciation] = t.[TotalDep],
      s.[StatusID]          = CASE
          WHEN s.[IsApproved]=1      THEN 2  -- Approved
          WHEN s.[IsDeclined]=1      THEN 3  -- Declined
          WHEN s.[PendingApproval]=1 THEN 4  -- Pending
          ELSE 1                             -- Active/Draft
      END
  FROM [Asset_DepreciationSchedule] s
  LEFT JOIN (
      SELECT [Asset_DepreciationSchedule_ID],
             SUM([TotalAssets])      AS [TotalAssets],
             SUM([TotalDepreciation]) AS [TotalDep]
      FROM [Asset_DepreciationSchedule_Item]
      WHERE [TotalAssets] IS NOT NULL
      GROUP BY [Asset_DepreciationSchedule_ID]
  ) t ON t.[Asset_DepreciationSchedule_ID] = s.[Asset_DepreciationSchedule_ID]
  WHERE s.[StatusID] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C4: Asset_DepreciationApproval
  -- Populate: Status, FinYear (from DepreciationDate)
  -- (FinYear cannot be derived from schedule FK — not available on legacy)
  -- ------------------------------------------------------------------
  UPDATE [Asset_DepreciationApproval]
  SET [Status] = CASE
          WHEN [IsApproved]=1      THEN 'Approved'
          WHEN [IsDeclined]=1      THEN 'Declined'
          WHEN [PendingApproval]=1 THEN 'Pending'
          ELSE 'Active'
      END,
      [FinYear] = CASE
          WHEN [DepreciationDate] IS NOT NULL AND MONTH([DepreciationDate]) >= 7
          THEN CAST(YEAR([DepreciationDate]) AS NVARCHAR(4)) + '/'
               + CAST(YEAR([DepreciationDate])+1 AS NVARCHAR(4))
          WHEN [DepreciationDate] IS NOT NULL
          THEN CAST(YEAR([DepreciationDate])-1 AS NVARCHAR(4)) + '/'
               + CAST(YEAR([DepreciationDate]) AS NVARCHAR(4))
          ELSE NULL
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C5: Asset_Disposal
  -- Populate: Status, Approved, ApprovedDate, ApprovedBy, FinYear, CarryingAmount
  -- Note: Asset_Disposal.AssetItemID → Asset_Register_Items.AssetRegisterItem_ID
  -- ------------------------------------------------------------------
  UPDATE ad
  SET ad.[Status]        = 'Approved',
      ad.[Approved]      = 1,
      ad.[ApprovedDate]  = COALESCE(ad.[DateModified], ad.[DateCaptured]),
      ad.[ApprovedBy]    = ad.[CapturerID],
      ad.[CarryingAmount]= ari.[CarryingAmountClosingBalance],
      ad.[FinYear]       = CASE
          WHEN MONTH(ad.[DisposalDate]) >= 7
          THEN CAST(YEAR(ad.[DisposalDate]) AS NVARCHAR(4)) + '/'
               + CAST(YEAR(ad.[DisposalDate])+1 AS NVARCHAR(4))
          ELSE CAST(YEAR(ad.[DisposalDate])-1 AS NVARCHAR(4)) + '/'
               + CAST(YEAR(ad.[DisposalDate]) AS NVARCHAR(4))
      END
  FROM [Asset_Disposal] ad
  JOIN [Asset_Register_Items] ari
    ON ari.[AssetRegisterItem_ID] = ad.[AssetItemID]
  WHERE ad.[Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C6: Asset_Disposal_Approval
  -- Populate: Status
  -- Note: column is [IsApprove] (not IsApproved) — no IsDeclined column
  -- ------------------------------------------------------------------
  UPDATE [Asset_Disposal_Approval]
  SET [Status] = CASE
          WHEN [IsApprove]=1 THEN 'Approved'
          ELSE 'Pending'
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C7: Asset_FairValue
  -- Populate: Status, FinYear
  -- ------------------------------------------------------------------
  UPDATE [Asset_FairValue]
  SET [Status]  = 'Approved',
      [FinYear] = CASE
          WHEN [FairValueDate] IS NOT NULL AND MONTH([FairValueDate]) >= 7
          THEN CAST(YEAR([FairValueDate]) AS NVARCHAR(4)) + '/'
               + CAST(YEAR([FairValueDate])+1 AS NVARCHAR(4))
          WHEN [FairValueDate] IS NOT NULL
          THEN CAST(YEAR([FairValueDate])-1 AS NVARCHAR(4)) + '/'
               + CAST(YEAR([FairValueDate]) AS NVARCHAR(4))
          ELSE NULL
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C8: Asset_FairValueApproval
  -- Populate: Status
  -- (Table rows represent approvals; ApprovedDate IS the approval indicator)
  -- ------------------------------------------------------------------
  UPDATE [Asset_FairValueApproval]
  SET [Status] = CASE
          WHEN [ApprovedDate] IS NOT NULL THEN 'Approved'
          ELSE 'Pending'
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C9: Asset_FundingSource
  -- Populate: Enabled (default active for all legacy records)
  -- ------------------------------------------------------------------
  UPDATE [Asset_FundingSource]
  SET [Enabled] = 1
  WHERE [Enabled] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C10: Asset_Impairment
  -- Populate: Status, FinYear, ImpairmentAmount, PreviousCarryingAmount,
  --           NewCarryingAmount
  -- ------------------------------------------------------------------
  UPDATE i
  SET i.[Status] = CASE
          WHEN i.[Approved]=1    THEN 'Approved'
          WHEN i.[IsRejected]=1  THEN 'Rejected'
          ELSE 'Pending'
      END,
      i.[FinYear] = CASE
          WHEN i.[ImpairmentDate] IS NOT NULL AND MONTH(i.[ImpairmentDate]) >= 7
          THEN CAST(YEAR(i.[ImpairmentDate]) AS NVARCHAR(4)) + '/'
               + CAST(YEAR(i.[ImpairmentDate])+1 AS NVARCHAR(4))
          WHEN i.[ImpairmentDate] IS NOT NULL
          THEN CAST(YEAR(i.[ImpairmentDate])-1 AS NVARCHAR(4)) + '/'
               + CAST(YEAR(i.[ImpairmentDate]) AS NVARCHAR(4))
          ELSE NULL
      END,
      i.[ImpairmentAmount]       = p.[ImpairmentLostAmt],
      i.[PreviousCarryingAmount] = p.[CarryingValue],
      i.[NewCarryingAmount]      = p.[NewCarryingValue]
  FROM [Asset_Impairment] i
  LEFT JOIN [Asset_ImpairmentPostings] p
    ON p.[Impairment_ID] = i.[Impairment_ID]
  WHERE i.[Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C11: Asset_ImpairmentPostings
  -- Populate: Status
  -- (No CreatedDate/CapturedBy columns — Status derived from Approved flag)
  -- ------------------------------------------------------------------
  UPDATE [Asset_ImpairmentPostings]
  SET [Status] = CASE
          WHEN [Approved]=1 THEN 'Posted'
          ELSE 'Draft'
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C12: Asset_WIP_Register
  -- Populate: StartDate, ExpectedEndDate, Status, ProjectComplete, FinYear
  -- Note: Only IsApproved flag exists (no Converted/IsDeclined/PendingApproval)
  -- ------------------------------------------------------------------
  UPDATE [Asset_WIP_Register]
  SET [StartDate]       = [ContractStartDate],
      [ExpectedEndDate] = [ContractEndDate],
      [Status]          = CASE
          WHEN [IsApproved]=1 THEN 'Approved'
          ELSE 'Active'
      END,
      [ProjectComplete] = CASE WHEN [IsApproved]=1 THEN 0 ELSE 0 END,
      [FinYear]         = CASE
          WHEN MONTH([ContractStartDate]) >= 7
          THEN CAST(YEAR([ContractStartDate]) AS NVARCHAR(4)) + '/'
               + CAST(YEAR([ContractStartDate])+1 AS NVARCHAR(4))
          ELSE CAST(YEAR([ContractStartDate])-1 AS NVARCHAR(4)) + '/'
               + CAST(YEAR([ContractStartDate]) AS NVARCHAR(4))
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C13: Asset_WIPApprovalItems
  -- Populate: Status
  -- ------------------------------------------------------------------
  UPDATE [Asset_WIPApprovalItems]
  SET [Status] = CASE
          WHEN [IsApproved]=1 THEN 'Approved'
          WHEN [IsDeclined]=1 THEN 'Declined'
          ELSE 'Pending'
      END
  WHERE [Status] IS NULL;
  GO

  -- ------------------------------------------------------------------
  -- C14: Asset_Revaluations
  -- No backfill possible — RejectedBy/RejectedDate/RejectionReason
  -- are future-only fields. NULL is correct for all legacy records.
  -- ------------------------------------------------------------------

  -- ------------------------------------------------------------------
  -- C15: Asset_Register_Items
  -- Populate: InvoiceNo from InvoiceNumber (same concept, shorter alias)
  -- All other new columns: NULL (users populate going forward)
  -- ------------------------------------------------------------------
  UPDATE [Asset_Register_Items]
  SET [InvoiceNo] = [InvoiceNumber]
  WHERE [InvoiceNo] IS NULL AND [InvoiceNumber] IS NOT NULL;
  GO

  -- ------------------------------------------------------------------
  -- C16: Tables with no derivable legacy data
  -- Asset_Register_Transactions.RefurbImpairmentValue  → NULL (legacy)
  -- Asset_WIP_Register_Details new cols                → NULL (legacy)
  -- Asset_WIP_Register_Funding new cols                → NULL (legacy)
  -- Asset_WIP_Register_Items new cols                  → NULL (legacy)
  -- Asset_Register_Items_Upload staging rows            → not in system
  -- (No UPDATE needed — NULL is correct)
  -- ------------------------------------------------------------------

  -- ------------------------------------------------------------------
  -- C17: Backfill Asset_WorkflowInstances for pending transactions
  -- Creates workflow instance records for legacy transactions that
  -- pre-date the workflow system so they appear in the workflow inbox
  -- and stats. Idempotent: skips any transaction that already has a
  -- matching workflow instance (matched by mssql_reference_id).
  --
  -- Asset_WorkflowInstances.id has no IDENTITY/DEFAULT so unique ids
  -- are assigned using MAX(id) + ROW_NUMBER() per batch, separated by
  -- GO so each batch sees the committed ids from the previous batch.
  -- ------------------------------------------------------------------

  -- Step 1: Normalise legacy disposal Status (NULL → 'pending')
  -- The Status column was added by this migration with no backfill;
  -- non-approved, non-rejected legacy records default to 'pending'.
  UPDATE [Asset_Disposal]
  SET    [Status] = 'pending'
  WHERE  [Status]     IS NULL
    AND  ISNULL([Approved], 0) = 0
    AND  [RejectedBy] IS NULL;
  GO

  -- Step 2: Impairments (and reversals) — entity_type = 'impairment'
  -- entity_id = Asset_ItemID (asset FK), mssql_reference_id = Impairment_ID
  ;WITH [PendingImpairments] AS (
    SELECT
      CAST([Asset_ItemID]    AS NVARCHAR(100)) AS [entity_id],
      CAST([Impairment_ID]   AS NVARCHAR(100)) AS [ref_id],
      ROW_NUMBER() OVER (ORDER BY [Impairment_ID])  AS [rn]
    FROM [Asset_Impairment] i
    WHERE (i.[Approved]   IS NULL OR i.[Approved]   = 0)
      AND (i.[IsRejected] IS NULL OR i.[IsRejected] = 0)
      AND NOT EXISTS (
        SELECT 1 FROM [Asset_WorkflowInstances] wi
        WHERE  wi.[entity_type]       = 'impairment'
          AND  wi.[mssql_reference_id] = CAST(i.[Impairment_ID] AS NVARCHAR(100))
      )
  )
  INSERT INTO [Asset_WorkflowInstances]
    ([id], [definition_id], [entity_type], [entity_id], [current_step],
     [status], [initiated_by], [initiated_at], [data], [mssql_reference_id])
  SELECT
    (SELECT ISNULL(MAX([id]), 0) FROM [Asset_WorkflowInstances]) + [rn],
    ISNULL((SELECT TOP 1 [id] FROM [Asset_WorkflowDefinitions]
            WHERE [entity_type] = 'impairment' AND [is_active] = 1), 1),
    'impairment',
    [entity_id],
    1, 'pending', 1, GETDATE(),
    N'{"description":"Legacy impairment backfill"}',
    [ref_id]
  FROM [PendingImpairments];
  GO

  -- Step 3: Disposals — entity_type = 'disposal'
  -- entity_id = AssetItemID (asset FK), mssql_reference_id = AssetDisposal_ID
  ;WITH [PendingDisposals] AS (
    SELECT
      CAST([AssetItemID]      AS NVARCHAR(100)) AS [entity_id],
      CAST([AssetDisposal_ID] AS NVARCHAR(100)) AS [ref_id],
      ROW_NUMBER() OVER (ORDER BY [AssetDisposal_ID]) AS [rn]
    FROM [Asset_Disposal] d
    WHERE d.[Status] IN ('pending', 'submitted')
      AND NOT EXISTS (
        SELECT 1 FROM [Asset_WorkflowInstances] wi
        WHERE  wi.[entity_type]       = 'disposal'
          AND  wi.[mssql_reference_id] = CAST(d.[AssetDisposal_ID] AS NVARCHAR(100))
      )
  )
  INSERT INTO [Asset_WorkflowInstances]
    ([id], [definition_id], [entity_type], [entity_id], [current_step],
     [status], [initiated_by], [initiated_at], [data], [mssql_reference_id])
  SELECT
    (SELECT ISNULL(MAX([id]), 0) FROM [Asset_WorkflowInstances]) + [rn],
    ISNULL((SELECT TOP 1 [id] FROM [Asset_WorkflowDefinitions]
            WHERE [entity_type] = 'disposal' AND [is_active] = 1), 1),
    'disposal',
    [entity_id],
    1, 'pending', 1, GETDATE(),
    N'{"description":"Legacy disposal backfill"}',
    [ref_id]
  FROM [PendingDisposals];
  GO

  -- Step 4: Refurbishments — entity_type = 'refurbishment'
  -- entity_id = AssetRegisterID (asset FK), mssql_reference_id = Asset_RefurbID
  ;WITH [PendingRefurbishments] AS (
    SELECT
      CAST([AssetRegisterID] AS NVARCHAR(100)) AS [entity_id],
      CAST([Asset_RefurbID]  AS NVARCHAR(100)) AS [ref_id],
      ROW_NUMBER() OVER (ORDER BY [Asset_RefurbID]) AS [rn]
    FROM [Asset_Refurb] r
    WHERE r.[isApproved] IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM [Asset_WorkflowInstances] wi
        WHERE  wi.[entity_type]       = 'refurbishment'
          AND  wi.[mssql_reference_id] = CAST(r.[Asset_RefurbID] AS NVARCHAR(100))
      )
  )
  INSERT INTO [Asset_WorkflowInstances]
    ([id], [definition_id], [entity_type], [entity_id], [current_step],
     [status], [initiated_by], [initiated_at], [data], [mssql_reference_id])
  SELECT
    (SELECT ISNULL(MAX([id]), 0) FROM [Asset_WorkflowInstances]) + [rn],
    ISNULL((SELECT TOP 1 [id] FROM [Asset_WorkflowDefinitions]
            WHERE [entity_type] = 'refurbishment' AND [is_active] = 1), 1),
    'refurbishment',
    [entity_id],
    1, 'pending', 1, GETDATE(),
    N'{"description":"Legacy refurbishment backfill"}',
    [ref_id]
  FROM [PendingRefurbishments];
  GO

  -- ================================================================
  -- END OF MIGRATION SCRIPT
  -- ================================================================
  