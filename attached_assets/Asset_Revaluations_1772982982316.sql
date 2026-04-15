CREATE TABLE [dbo].[Asset_Revaluations](
	[Asset_RevaluationsID] [int] IDENTITY(1,1) NOT NULL,
	[AssetRegisterID] [int] NOT NULL,
	[Revaluation] [int] NOT NULL,
	[Asset] [int] NOT NULL,
	[Profit] [int] NOT NULL,
	[RevalModel] [int] NOT NULL,
	[RevalautionAmt] [decimal](18, 8) NOT NULL,
	[RevalutionDate] [datetime] NOT NULL,
	[UserID] [int] NOT NULL,
	[DiffDepAcc] [decimal](18, 8) NOT NULL,
	[DiffBook] [decimal](18, 8) NOT NULL,
	[ProjectDR] [int] NOT NULL,
	[ProjectItemDR] [int] NOT NULL,
	[ProjectCR] [int] NOT NULL,
	[ProjectItemCR] [int] NOT NULL,
	[PostDateTime] [datetime] NULL,
	[SCOAItemDR] [int] NULL,
	[SCOAItemCR] [int] NULL,
	[FilePath] [varchar](255) NULL,
	[FileName] [varchar](255) NULL,
	[SurplusAmount] [decimal](18, 8) NULL,
	[DepreciationAdjustment] [decimal](18, 8) NULL,
	[Approved] [bit] NULL,
	[ApprovedBy] [int] NULL,
	[ApprovedDate] [datetime] NULL,
 CONSTRAINT [PK_Asset_Revaluations] PRIMARY KEY CLUSTERED 
(
	[Asset_RevaluationsID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


