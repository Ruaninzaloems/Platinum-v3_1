CREATE TABLE [dbo].[Asset_InvTransfer](
	[InvTransferID] [int] IDENTITY(1,1) NOT NULL,
	[Quantity] [int] NULL,
	[InventoryID] [int] NULL,
	[HighValueID] [int] NULL,
	[Description] [nvarchar](255) NULL,
	[AssetStatus_ID] [int] NULL,
	[AssetCategory_ID] [int] NULL,
	[AssetClass_ID] [int] NULL,
	[AssetCondition_ID] [int] NULL,
	[PurchaseAmount] [decimal](18, 2) NULL,
	[InvoiceDate] [date] NULL,
	[DateCaptured] [datetime] NULL,
	[UsefulLifeMonthComponent] [int] NULL,
 CONSTRAINT [PK_Asset_InvTransfer] PRIMARY KEY CLUSTERED 
(
	[InvTransferID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


