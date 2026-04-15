CREATE TABLE [dbo].[Const_SCOA_Structure](
	[ScoaID] [int] IDENTITY(1,1) NOT NULL,
	[ScoaCode] [nvarchar](100) NULL,
	[LevelID] [int] NULL,
	[TableID] [int] NULL,
	[TableName] [nvarchar](50) NULL,
	[PostingLevel] [nvarchar](6) NULL,
	[BreakDownAllowed] [nvarchar](6) NULL,
	[ScoaDesc] [nvarchar](2000) NULL,
	[ScoaShortDesc] [nvarchar](400) NULL,
	[ScoaParentID] [int] NULL,
	[VoteTypeID] [int] NULL,
	[DebitCreditID] [int] NULL,
	[VatIndicatorID] [int] NULL,
	[VatApportionment] [int] NULL,
	[CapitalTimePeriodID] [int] NULL,
	[IsCapexVote] [bit] NULL,
	[IsControlVote] [bit] NULL,
	[ParentID] [int] NULL,
	[NTVatStatus] [nvarchar](100) NULL,
	[NTSCOAFile] [nvarchar](200) NULL,
	[NTScoaLevel] [nvarchar](200) NULL,
	[NTExcelRowNumber] [nvarchar](100) NULL,
	[NTPrinciple] [nvarchar](1000) NULL,
	[NTApplicableTo] [nvarchar](1000) NULL,
	[NTPostingLevelDescription] [nvarchar](1000) NULL,
	[NTScoaID] [uniqueidentifier] NULL,
	[NTParentScoaId] [uniqueidentifier] NULL,
	[DefinitionDescription] [nvarchar](3000) NULL,
	[Enabled] [bit] NOT NULL,
	[Version] [nvarchar](20) NOT NULL,
	[NTGFSCode] [nvarchar](50) NULL,
 CONSTRAINT [PK_Const_SCOA_Structure] PRIMARY KEY CLUSTERED 
(
	[ScoaID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


