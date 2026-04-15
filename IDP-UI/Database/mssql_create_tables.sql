-- ============================================================================
-- Platinum ERP - IDP Management Module
-- MS SQL Server DDL Script (SQL Server 2016+)
-- Creates all 19 tables with constraints, foreign keys, and defaults
-- CreatedBy / ModifiedBy columns reference User_UserDetail.User_ID (INT)
-- Table names prefixed with tbl_
-- ============================================================================

-- ============================================================================
-- 1. tbl_idp_cycles_ef (Parent - no FK dependencies)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_cycles_ef')
CREATE TABLE [dbo].[tbl_idp_cycles_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [Name]               NVARCHAR(200)    NOT NULL,
    [StartYear]          INT              NOT NULL,
    [EndYear]            INT              NOT NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Draft',
    [RevisionNumber]     INT              NOT NULL DEFAULT 1,
    [MunicipalityName]   NVARCHAR(300)    NOT NULL DEFAULT N'',
    [Description]        NVARCHAR(MAX)    NULL,
    [IsLocked]           BIT              NOT NULL DEFAULT 0,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_cycles_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_cycles_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_cycles_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 2. tbl_idp_process_phases_ef (FK -> tbl_idp_cycles_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_process_phases_ef')
CREATE TABLE [dbo].[tbl_idp_process_phases_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [Name]               NVARCHAR(200)    NOT NULL,
    [Description]        NVARCHAR(MAX)    NULL,
    [OrderIndex]         INT              NOT NULL DEFAULT 0,
    [Owner]              NVARCHAR(200)    NULL,
    [StartDate]          DATETIME2        NULL,
    [EndDate]            DATETIME2        NULL,
    [Progress]           INT              NOT NULL DEFAULT 0,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Not Started',
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_process_phases_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_process_phases_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_process_phases_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_process_phases_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 3. tbl_idp_milestones_ef (FK -> tbl_idp_process_phases_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_milestones_ef')
CREATE TABLE [dbo].[tbl_idp_milestones_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [PhaseId]            INT              NOT NULL,
    [CycleId]            INT              NOT NULL,
    [Title]              NVARCHAR(300)    NOT NULL,
    [Description]        NVARCHAR(MAX)    NULL,
    [AssignedTo]         NVARCHAR(200)    NULL,
    [DueDate]            DATETIME2        NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Not Started',
    [Progress]           INT              NOT NULL DEFAULT 0,
    [IsMandatory]        BIT              NOT NULL DEFAULT 0,
    [EvidenceUrl]        NVARCHAR(MAX)    NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_milestones_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_milestones_ef_PhaseId] FOREIGN KEY ([PhaseId])
        REFERENCES [dbo].[tbl_idp_process_phases_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_milestones_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_milestones_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 4. tbl_idp_strategic_objectives_ef (FK -> tbl_idp_cycles_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_strategic_objectives_ef')
CREATE TABLE [dbo].[tbl_idp_strategic_objectives_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [Code]               NVARCHAR(50)     NOT NULL,
    [Description]        NVARCHAR(MAX)    NOT NULL,
    [AlignmentTags]      NVARCHAR(MAX)    NULL,
    [NdpAlignment]       NVARCHAR(MAX)    NULL,
    [ProvincialAlignment] NVARCHAR(MAX)   NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Active',
    CONSTRAINT [PK_tbl_idp_strategic_objectives_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_strategic_objectives_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_strategic_objectives_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_strategic_objectives_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 5. tbl_idp_projects_ef (FK -> tbl_idp_cycles_ef, tbl_idp_strategic_objectives_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_projects_ef')
CREATE TABLE [dbo].[tbl_idp_projects_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [ObjectiveId]        INT              NULL,
    [Name]               NVARCHAR(300)    NOT NULL,
    [Description]        NVARCHAR(MAX)    NULL,
    [Classification]     NVARCHAR(50)     NOT NULL DEFAULT N'Operational',
    [Department]         NVARCHAR(200)    NOT NULL,
    [Ward]               NVARCHAR(100)    NULL,
    [Region]             NVARCHAR(200)    NULL,
    [Priority]           NVARCHAR(50)     NOT NULL DEFAULT N'Medium',
    [PriorityRanking]    INT              NOT NULL DEFAULT 0,
    [OverrideRank]       INT              NULL,
    [BudgetAmount]       DECIMAL(15,2)    NULL,
    [FundingSource]      NVARCHAR(200)    NULL,
    [FundingSourceSummary] NVARCHAR(MAX)  NULL,
    [MscoaProjectSegment] NVARCHAR(100)  NULL,
    [MscoaFundSegment]   NVARCHAR(100)   NULL,
    [MscoaRegionSegment] NVARCHAR(100)   NULL,
    [StartDate]          DATETIME2        NULL,
    [EndDate]            DATETIME2        NULL,
    [Latitude]           FLOAT            NULL,
    [Longitude]          FLOAT            NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Planned',
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_projects_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_projects_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_projects_ef_ObjectiveId] FOREIGN KEY ([ObjectiveId])
        REFERENCES [dbo].[tbl_idp_strategic_objectives_ef] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_projects_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_projects_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 6. tbl_idp_project_indicators_ef (FK -> tbl_idp_projects_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_project_indicators_ef')
CREATE TABLE [dbo].[tbl_idp_project_indicators_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [ProjectId]          INT              NOT NULL,
    [Name]               NVARCHAR(300)    NOT NULL,
    [Baseline]           NVARCHAR(200)    NULL,
    [TargetY1]           NVARCHAR(200)    NULL,
    [TargetY2]           NVARCHAR(200)    NULL,
    [TargetY3]           NVARCHAR(200)    NULL,
    [TargetY4]           NVARCHAR(200)    NULL,
    [TargetY5]           NVARCHAR(200)    NULL,
    [ResponsibleOfficial] NVARCHAR(200)   NULL,
    [EvidenceLink]       NVARCHAR(MAX)    NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Active',
    CONSTRAINT [PK_tbl_idp_project_indicators_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_project_indicators_ef_ProjectId] FOREIGN KEY ([ProjectId])
        REFERENCES [dbo].[tbl_idp_projects_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_project_indicators_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_project_indicators_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 7. tbl_idp_public_comments_ef (FK -> tbl_idp_cycles_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_public_comments_ef')
CREATE TABLE [dbo].[tbl_idp_public_comments_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [SourceChannel]      NVARCHAR(100)    NOT NULL,
    [Ward]               NVARCHAR(100)    NULL,
    [Region]             NVARCHAR(200)    NULL,
    [Category]           NVARCHAR(100)    NULL,
    [CommentText]        NVARCHAR(MAX)    NOT NULL,
    [LinkedProjectId]    INT              NULL,
    [LinkedObjectiveId]  INT              NULL,
    [SubmitterName]      NVARCHAR(200)    NULL,
    [SubmissionDate]     DATETIME2        NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Received',
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_public_comments_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_public_comments_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_public_comments_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_public_comments_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 8. tbl_idp_comment_responses_ef (FK -> tbl_idp_public_comments_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_comment_responses_ef')
CREATE TABLE [dbo].[tbl_idp_comment_responses_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CommentId]          INT              NOT NULL,
    [ResponseText]       NVARCHAR(MAX)    NOT NULL,
    [ResponsibleOfficial] NVARCHAR(200)   NULL,
    [ResponseDate]       DATETIME2        NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_comment_responses_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_comment_responses_ef_CommentId] FOREIGN KEY ([CommentId])
        REFERENCES [dbo].[tbl_idp_public_comments_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_comment_responses_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_comment_responses_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 9. tbl_idp_document_versions_ef (FK -> tbl_idp_cycles_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_document_versions_ef')
CREATE TABLE [dbo].[tbl_idp_document_versions_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [VersionNumber]      INT              NOT NULL DEFAULT 1,
    [VersionType]        NVARCHAR(50)     NOT NULL DEFAULT N'Draft',
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Draft',
    [ContentJson]        NVARCHAR(MAX)    NULL,
    [ResolutionNumber]   NVARCHAR(MAX)    NULL,
    [ResolutionDate]     DATETIME2        NULL,
    [CouncilMeetingRef]  NVARCHAR(MAX)    NULL,
    [IsLocked]           BIT              NOT NULL DEFAULT 0,
    [LockedDate]         DATETIME2        NULL,
    [LockedBy]           INT              NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_document_versions_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_document_versions_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_document_versions_ef_LockedBy] FOREIGN KEY ([LockedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_document_versions_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_document_versions_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 10. tbl_idp_workflow_tasks_ef (FK -> tbl_idp_document_versions_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_workflow_tasks_ef')
CREATE TABLE [dbo].[tbl_idp_workflow_tasks_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [DocumentVersionId]  INT              NULL,
    [TaskType]           NVARCHAR(100)    NOT NULL,
    [AssignedRole]       NVARCHAR(100)    NULL,
    [AssignedTo]         NVARCHAR(200)    NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Pending',
    [Comments]           NVARCHAR(MAX)    NULL,
    [Sequence]           INT              NOT NULL DEFAULT 0,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [CompletedBy]        INT              NULL,
    [CompletedDate]      DATETIME2        NULL,
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_idp_workflow_tasks_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_workflow_tasks_ef_DocumentVersionId] FOREIGN KEY ([DocumentVersionId])
        REFERENCES [dbo].[tbl_idp_document_versions_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_workflow_tasks_ef_CompletedBy] FOREIGN KEY ([CompletedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_workflow_tasks_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_workflow_tasks_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 11. tbl_idp_submission_logs_ef (FK -> tbl_idp_cycles_ef, tbl_idp_document_versions_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_submission_logs_ef')
CREATE TABLE [dbo].[tbl_idp_submission_logs_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [CycleId]            INT              NOT NULL,
    [DocumentVersionId]  INT              NULL,
    [SubmissionType]     NVARCHAR(100)    NOT NULL DEFAULT N'GoMuni',
    [ReferenceNumber]    NVARCHAR(200)    NULL,
    [SubmissionDate]     DATETIME2        NULL,
    [ValidationStatus]   NVARCHAR(50)     NOT NULL DEFAULT N'Pending',
    [ValidationFeedback] NVARCHAR(MAX)    NULL,
    [AdoptedIdpFileName] NVARCHAR(MAX)    NULL,
    [CouncilResolutionFileName] NVARCHAR(MAX) NULL,
    [MinutesFileName]    NVARCHAR(MAX)    NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Draft',
    CONSTRAINT [PK_tbl_idp_submission_logs_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_submission_logs_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_idp_submission_logs_ef_DocumentVersionId] FOREIGN KEY ([DocumentVersionId])
        REFERENCES [dbo].[tbl_idp_document_versions_ef] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_submission_logs_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_submission_logs_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 12. tbl_idp_audit_logs_ef (No table FK dependencies)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_idp_audit_logs_ef')
CREATE TABLE [dbo].[tbl_idp_audit_logs_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [EntityType]         NVARCHAR(100)    NOT NULL,
    [EntityId]           INT              NOT NULL,
    [Action]             NVARCHAR(100)    NOT NULL,
    [OldValue]           NVARCHAR(MAX)    NULL,
    [NewValue]           NVARCHAR(MAX)    NULL,
    [PerformedBy]        INT              NULL,
    [PerformedDate]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IpAddress]          NVARCHAR(50)     NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Active',
    CONSTRAINT [PK_tbl_idp_audit_logs_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_idp_audit_logs_ef_PerformedBy] FOREIGN KEY ([PerformedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_audit_logs_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_idp_audit_logs_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 13. tbl_mscoa_segments_ef (No FK dependencies)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_mscoa_segments_ef')
CREATE TABLE [dbo].[tbl_mscoa_segments_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [SegmentType]        NVARCHAR(50)     NOT NULL,
    [Code]               NVARCHAR(50)     NOT NULL,
    [Description]        NVARCHAR(300)    NOT NULL,
    [Level]              INT              NOT NULL DEFAULT 1,
    [ParentCode]         NVARCHAR(50)     NULL,
    [IsPostingLevel]     BIT              NOT NULL DEFAULT 0,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Active',
    CONSTRAINT [PK_tbl_mscoa_segments_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_mscoa_segments_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_mscoa_segments_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 14. tbl_project_objective_links_ef (FK -> tbl_idp_projects_ef, tbl_idp_strategic_objectives_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_project_objective_links_ef')
CREATE TABLE [dbo].[tbl_project_objective_links_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [ProjectId]          INT              NOT NULL,
    [ObjectiveId]        INT              NOT NULL,
    [Percentage]         DECIMAL(5,2)     NOT NULL DEFAULT 0,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_project_objective_links_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_project_objective_links_ef_ProjectId] FOREIGN KEY ([ProjectId])
        REFERENCES [dbo].[tbl_idp_projects_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_project_objective_links_ef_ObjectiveId] FOREIGN KEY ([ObjectiveId])
        REFERENCES [dbo].[tbl_idp_strategic_objectives_ef] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_project_objective_links_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_project_objective_links_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 15. tbl_priority_frameworks_ef (FK -> tbl_idp_cycles_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_priority_frameworks_ef')
CREATE TABLE [dbo].[tbl_priority_frameworks_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [Name]               NVARCHAR(300)    NOT NULL,
    [Version]            INT              NOT NULL DEFAULT 1,
    [CycleId]            INT              NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT N'Draft',
    [HumanWeight]        DECIMAL(5,2)     NOT NULL DEFAULT 80.00,
    [AiWeight]           DECIMAL(5,2)     NOT NULL DEFAULT 20.00,
    [AiMode]             NVARCHAR(50)     NOT NULL DEFAULT N'Disabled',
    [ScaleMin]           INT              NOT NULL DEFAULT 0,
    [ScaleMax]           INT              NOT NULL DEFAULT 5,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_priority_frameworks_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_priority_frameworks_ef_CycleId] FOREIGN KEY ([CycleId])
        REFERENCES [dbo].[tbl_idp_cycles_ef] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_tbl_priority_frameworks_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_frameworks_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 16. tbl_priority_criteria_ef (FK -> tbl_priority_frameworks_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_priority_criteria_ef')
CREATE TABLE [dbo].[tbl_priority_criteria_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [FrameworkId]        INT              NOT NULL,
    [Code]               NVARCHAR(100)    NOT NULL,
    [Name]               NVARCHAR(300)    NOT NULL,
    [Description]        NVARCHAR(MAX)    NULL,
    [Category]           NVARCHAR(100)    NOT NULL DEFAULT N'Strategic',
    [Weight]             DECIMAL(5,2)     NOT NULL DEFAULT 0,
    [IsActive]           BIT              NOT NULL DEFAULT 1,
    [SortOrder]          INT              NOT NULL DEFAULT 0,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_priority_criteria_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_priority_criteria_ef_FrameworkId] FOREIGN KEY ([FrameworkId])
        REFERENCES [dbo].[tbl_priority_frameworks_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_priority_criteria_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_criteria_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 17. tbl_priority_scoring_scales_ef (FK -> tbl_priority_frameworks_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_priority_scoring_scales_ef')
CREATE TABLE [dbo].[tbl_priority_scoring_scales_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [FrameworkId]        INT              NOT NULL,
    [ScoreValue]         INT              NOT NULL DEFAULT 0,
    [Label]              NVARCHAR(200)    NOT NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_priority_scoring_scales_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_priority_scoring_scales_ef_FrameworkId] FOREIGN KEY ([FrameworkId])
        REFERENCES [dbo].[tbl_priority_frameworks_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_priority_scoring_scales_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_scoring_scales_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 18. tbl_priority_project_scores_ef (FK -> tbl_priority_frameworks_ef, tbl_idp_projects_ef, tbl_priority_criteria_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_priority_project_scores_ef')
CREATE TABLE [dbo].[tbl_priority_project_scores_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [FrameworkId]        INT              NOT NULL,
    [ProjectId]          INT              NOT NULL,
    [CriteriaId]         INT              NOT NULL,
    [HumanScore]         INT              NULL,
    [AiScore]            INT              NULL,
    [BlendedScore]       DECIMAL(7,2)     NOT NULL DEFAULT 0,
    [Comments]           NVARCHAR(MAX)    NULL,
    [ScoredBy]           INT              NULL,
    [ScoredDate]         DATETIME2        NULL,
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_priority_project_scores_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_priority_project_scores_ef_FrameworkId] FOREIGN KEY ([FrameworkId])
        REFERENCES [dbo].[tbl_priority_frameworks_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_priority_project_scores_ef_ProjectId] FOREIGN KEY ([ProjectId])
        REFERENCES [dbo].[tbl_idp_projects_ef] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_project_scores_ef_CriteriaId] FOREIGN KEY ([CriteriaId])
        REFERENCES [dbo].[tbl_priority_criteria_ef] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_project_scores_ef_ScoredBy] FOREIGN KEY ([ScoredBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_project_scores_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_project_scores_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 19. tbl_priority_framework_audits_ef (FK -> tbl_priority_frameworks_ef)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_priority_framework_audits_ef')
CREATE TABLE [dbo].[tbl_priority_framework_audits_ef] (
    [Id]                 INT IDENTITY(1,1) NOT NULL,
    [FrameworkId]        INT              NOT NULL,
    [ChangeType]         NVARCHAR(100)    NOT NULL,
    [FieldName]          NVARCHAR(200)    NULL,
    [OldValue]           NVARCHAR(MAX)    NULL,
    [NewValue]           NVARCHAR(MAX)    NULL,
    [ChangedBy]          INT              NULL,
    [ChangedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [CreatedBy]          INT              NULL,
    [CreatedDate]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]         INT              NULL,
    [ModifiedDate]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [VersionNo]          INT              NOT NULL DEFAULT 1,
    CONSTRAINT [PK_tbl_priority_framework_audits_ef] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_tbl_priority_framework_audits_ef_FrameworkId] FOREIGN KEY ([FrameworkId])
        REFERENCES [dbo].[tbl_priority_frameworks_ef] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tbl_priority_framework_audits_ef_ChangedBy] FOREIGN KEY ([ChangedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_framework_audits_ef_CreatedBy] FOREIGN KEY ([CreatedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_tbl_priority_framework_audits_ef_ModifiedBy] FOREIGN KEY ([ModifiedBy])
        REFERENCES [dbo].[User_UserDetail] ([User_ID]) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
