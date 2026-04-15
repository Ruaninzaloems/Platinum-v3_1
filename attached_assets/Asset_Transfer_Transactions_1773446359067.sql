CREATE TABLE [dbo].[Asset_Transfer_Transactions](
	[AssetTransfer_ID] [int] IDENTITY(1,1) NOT NULL,
	[AssetItemID] [int] NOT NULL,
	[TransferDate] [datetime] NOT NULL,
	[TransferValue] [decimal](18, 2) NULL,
	[Run_ID] [int] NULL,
	[Component_ID] [int] NULL,
	[DebitPlanProjectItemID] [int] NULL,
	[CreditPlanProjectItemID] [int] NULL,
	[MainAssetID] [int] NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[IsApproved] [bit] NULL,
 CONSTRAINT [PK_Transfer_Transactions] PRIMARY KEY CLUSTERED 
(
	[AssetTransfer_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


