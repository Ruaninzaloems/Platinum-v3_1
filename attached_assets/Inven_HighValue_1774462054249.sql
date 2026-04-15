CREATE TABLE [dbo].[Inven_HighValue](
	[InventoryHighValueId] [int] IDENTITY(1,1) NOT NULL,
	[InventoryID] [int] NULL,
	[TransferRefNumber] [varchar](50) NULL,
	[DateSubmit] [datetime] NULL,
	[RequestedBy] [int] NULL,
	[ToFunctionId] [int] NULL,
	[FromVote] [int] NULL,
	[ToVote] [int] NULL,
	[DateCapture] [datetime] NULL,
	[CaptureId] [int] NULL,
	[DateModified] [datetime] NULL,
	[ModifiedId] [int] NULL,
	[UniqueInventoryReference] [varchar](50) NULL,
	[AssetCategoryID] [int] NULL,
	[AssetClassID] [int] NULL,
 CONSTRAINT [PK_Inven_HighValue] PRIMARY KEY CLUSTERED 
(
	[InventoryHighValueId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


