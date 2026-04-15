CREATE TABLE [dbo].[Inven_HighValueLineItem](
	[Inven_HighValueItemId] [int] IDENTITY(1,1) NOT NULL,
	[Inven_HighValueId] [int] NULL,
	[InventoryId] [int] NULL,
	[Quantity] [decimal](14, 4) NULL,
	[UnitCost] [decimal](18, 2) NULL,
	[BinNumber] [int] NULL,
	[ValueofTransfer] [decimal](18, 2) NULL,
	[IsApproved] [bit] NULL,
	[DateCaptured] [datetime] NULL,
	[CapturedId] [int] NULL,
	[DateModified] [datetime] NULL,
	[ModifiedId] [int] NULL,
	[Processed] [bit] NULL,
	[UomId] [int] NULL,
	[DateApproved] [datetime] NULL,
	[ApprovedId] [int] NULL,
	[ProjectID] [int] NULL,
	[ProjectItemID] [int] NULL,
 CONSTRAINT [PK_Inven_HighValueItemId] PRIMARY KEY CLUSTERED 
(
	[Inven_HighValueItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


