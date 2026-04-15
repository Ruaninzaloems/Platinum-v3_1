CREATE TABLE [dbo].[AssetConfig_TransactionType](
	[AssetConfig_TransactionType_ID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](50) NOT NULL,
	[Default] [bit] NULL,
	[Enabled] [bit] NULL,
	[SubType1] [varchar](50) NULL,
	[DRDisplayName11] [varchar](100) NULL,
	[DRDisplayName12] [varchar](100) NULL,
	[DRDisplayName13] [varchar](100) NULL,
	[DRDisplayName14] [varchar](100) NULL,
	[CRDisplayName11] [varchar](100) NULL,
	[SubType2] [varchar](50) NULL,
	[DRDisplayName21] [varchar](100) NULL,
	[DRDisplayName22] [varchar](100) NULL,
	[DRDisplayName23] [varchar](100) NULL,
	[CRDisplayName21] [varchar](100) NULL,
	[CRDisplayName22] [varchar](100) NULL,
	[CreatedByID] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[ModifiedByID] [int] NULL,
	[ModiefiedDate] [datetime] NULL,
	[DRProjectType11] [varchar](50) NULL,
	[DRProjectType12] [varchar](50) NULL,
	[DRProjectType13] [varchar](50) NULL,
	[DRProjectType14] [varchar](50) NULL,
	[DRProjectType21] [varchar](50) NULL,
	[DRProjectType22] [varchar](50) NULL,
	[DRProjectType23] [varchar](50) NULL,
	[CRProjectType11] [varchar](50) NULL,
	[CRProjectType21] [varchar](50) NULL,
	[CRProjectType22] [varchar](50) NULL,
	[DRPositionStatementType11] [varchar](2) NULL,
	[DRPositionStatementType12] [varchar](2) NULL,
	[DRPositionStatementType13] [varchar](2) NULL,
	[DRPositionStatementType14] [varchar](2) NULL,
	[DRPositionStatementType21] [varchar](2) NULL,
	[DRPositionStatementType22] [varchar](2) NULL,
	[DRPositionStatementType23] [varchar](2) NULL,
	[CRPositionStatementType11] [varchar](2) NULL,
	[CRPositionStatementType21] [varchar](2) NULL,
	[CRPositionStatementType22] [varchar](2) NULL,
 CONSTRAINT [PK_AssetConfig_TransactionType] PRIMARY KEY CLUSTERED 
(
	[AssetConfig_TransactionType_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


