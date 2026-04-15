CREATE TABLE [dbo].[SCM_RequisitionBillOfQuantity](
	[BillOfQuantityId] [int] IDENTITY(1,1) NOT NULL,
	[RequisitionID] [int] NOT NULL,
	[TenderID] [int] NOT NULL,
	[PurchaseItem] [varchar](max) NOT NULL,
	[PurchaseItem2] [varchar](500) NULL,
	[PurchaseItem3] [varchar](500) NULL,
	[UOM] [int] NOT NULL,
	[Quantity] [decimal](16, 4) NOT NULL,
	[RequisitionDetailID] [int] NULL,
	[ProjectID] [int] NULL,
	[SCOAItemID] [int] NULL,
	[PreviousBillOfQuantityId] [int] NULL,
 CONSTRAINT [PK_SCM_RequisitionBillOfQuantity] PRIMARY KEY CLUSTERED 
(
	[BillOfQuantityId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO



