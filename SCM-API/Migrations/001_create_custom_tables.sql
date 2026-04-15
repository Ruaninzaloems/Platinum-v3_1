IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Const_FinancialYear')
BEGIN
    CREATE TABLE [dbo].[Const_FinancialYear](
        [FinancialYear_ID] [int] IDENTITY(1,1) NOT NULL,
        [FinancialYearName] [nvarchar](100) NULL,
        [IsActive] [bit] NULL,
        CONSTRAINT [PK_Const_FinancialYear] PRIMARY KEY CLUSTERED ([FinancialYear_ID] ASC)
    ) ON [PRIMARY];
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SCM_DemandPlan')
BEGIN
    CREATE TABLE [dbo].[SCM_DemandPlan](
        [DemandPlan_ID] [int] IDENTITY(1,1) NOT NULL,
        [DepartmentID] [int] NULL,
        [FinancialYear] [nvarchar](50) NULL,
        [Description] [nvarchar](500) NULL,
        [StatusID] [int] NULL,
        [Enabled] [bit] NULL,
        [DateCaptured] [datetime] NULL,
        [CapturerID] [int] NULL,
        CONSTRAINT [PK_SCM_DemandPlan] PRIMARY KEY CLUSTERED ([DemandPlan_ID] ASC)
    ) ON [PRIMARY];
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SCM_Document')
BEGIN
    CREATE TABLE [dbo].[SCM_Document](
        [Document_ID] [int] IDENTITY(1,1) NOT NULL,
        [DocumentName] [nvarchar](500) NULL,
        [DocumentPath] [nvarchar](1000) NULL,
        [DocumentType] [nvarchar](100) NULL,
        [EntityType] [nvarchar](100) NULL,
        [EntityId] [int] NULL,
        [Enabled] [bit] NULL,
        [DateCaptured] [datetime] NULL,
        [CapturerID] [int] NULL,
        CONSTRAINT [PK_SCM_Document] PRIMARY KEY CLUSTERED ([Document_ID] ASC)
    ) ON [PRIMARY];
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SCM_OrderDocument')
BEGIN
    CREATE TABLE [dbo].[SCM_OrderDocument](
        [Document_ID] [int] IDENTITY(1,1) NOT NULL,
        [OrderID] [int] NULL,
        [DocumentName] [nvarchar](500) NULL,
        [DocumentPath] [nvarchar](1000) NULL,
        [DocumentDate] [datetime] NULL,
        [Enabled] [bit] NULL,
        [DateCaptured] [datetime] NULL,
        [CapturerID] [int] NULL,
        [ModifierID] [int] NULL,
        [DateModified] [datetime] NULL,
        CONSTRAINT [PK_SCM_OrderDocument] PRIMARY KEY CLUSTERED ([Document_ID] ASC)
    ) ON [PRIMARY];
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SCM_ProcessBoundary')
BEGIN
    CREATE TABLE [dbo].[SCM_ProcessBoundary](
        [ProcessBoundary_ID] [int] IDENTITY(1,1) NOT NULL,
        [Method] [nvarchar](100) NULL,
        [Label] [nvarchar](200) NULL,
        [RangeFrom] [decimal](18,2) NULL,
        [RangeTo] [decimal](18,2) NULL,
        [MinQuotes] [int] NULL,
        [Scoring] [nvarchar](200) NULL,
        [AdvertDays] [int] NULL,
        [Committees] [nvarchar](500) NULL,
        [Enabled] [bit] NULL,
        [Description] [nvarchar](500) NULL,
        [VatInclusive] [bit] NULL,
        [DateCaptured] [datetime] NULL,
        [CapturerID] [int] NULL,
        CONSTRAINT [PK_SCM_ProcessBoundary] PRIMARY KEY CLUSTERED ([ProcessBoundary_ID] ASC)
    ) ON [PRIMARY];
END
GO
