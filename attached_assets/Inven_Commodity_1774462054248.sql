CREATE TABLE [dbo].[Inven_Commodity](
	[Commodity_ID] [int] IDENTITY(1,1) NOT NULL,
	[CommodityDesc] [varchar](200) NOT NULL,
	[CommodityExtendedDesc] [varchar](500) NULL,
	[StatusID] [int] NOT NULL,
	[CommodityClassificationID] [int] NULL,
	[UnitOfIssueID] [int] NOT NULL,
	[CommodityTypeID] [int] NULL,
	[VatIndicatorID] [int] NOT NULL,
	[CommodityInfoWebsite] [nvarchar](250) NULL,
	[IsAwaitingApproval] [bit] NOT NULL,
	[DateApproved] [datetime] NULL,
	[ApproverID] [int] NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[RejectedReason] [nvarchar](500) NULL,
	[AddMarkup] [bit] NULL,
	[SCOAFundsID] [int] NULL,
	[SCOARegionID] [int] NULL,
	[SCOACostingID] [int] NULL,
	[SCOAProjectID] [int] NULL,
	[MeasureGroupCategoryId] [int] NULL,
	[ScoaItem] [varchar](200) NULL,
	[MarkupPercentage] [decimal](16, 2) NULL,
	[CommodityWAVGchange] [int] NULL,
	[CommodityWeightedAvg] [decimal](16, 2) NULL,
	[CommodityTotalQty] [decimal](14, 4) NULL,
	[RunningTotal] [decimal](16, 2) NULL,
	[StoreID] [int] NULL,
	[CommodityIDUnique] [varchar](10) NULL,
	[CommoditySubTypeID] [int] NULL,
 CONSTRAINT [PK_Inven_Commodity] PRIMARY KEY CLUSTERED 
(
	[Commodity_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Inven_Commodity] ADD  CONSTRAINT [DF_Inven_Commodity_AddMarkup]  DEFAULT ((0)) FOR [AddMarkup]
GO

ALTER TABLE [dbo].[Inven_Commodity] ADD  CONSTRAINT [DF__Inven_Com__Commo__3029AFA6]  DEFAULT (NULL) FOR [CommodityWAVGchange]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_Const_CommodityClassification] FOREIGN KEY([CommodityClassificationID])
REFERENCES [dbo].[Const_CommodityClassification] ([CommodityClassification_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_Const_CommodityClassification]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_Const_CommoditySubType] FOREIGN KEY([CommoditySubTypeID])
REFERENCES [dbo].[Const_CommoditySubType] ([CommoditySubType_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_Const_CommoditySubType]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_Const_CommodityType] FOREIGN KEY([CommodityTypeID])
REFERENCES [dbo].[Const_CommodityType] ([CommodityType_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_Const_CommodityType]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_Const_Status] FOREIGN KEY([StatusID])
REFERENCES [dbo].[Const_Status] ([Status_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_Const_Status]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_Const_UnitOfIssue] FOREIGN KEY([UnitOfIssueID])
REFERENCES [dbo].[Const_UnitOfIssue] ([UnitOfIssue_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_Const_UnitOfIssue]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_Const_VatIndicator] FOREIGN KEY([VatIndicatorID])
REFERENCES [dbo].[Const_VatIndicator] ([VatIndicator_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_Const_VatIndicator]
GO

ALTER TABLE [dbo].[Inven_Commodity]  WITH NOCHECK ADD  CONSTRAINT [FK_Inven_Commodity_User_UserDetail] FOREIGN KEY([ApproverID])
REFERENCES [dbo].[User_UserDetail] ([User_ID])
GO

ALTER TABLE [dbo].[Inven_Commodity] CHECK CONSTRAINT [FK_Inven_Commodity_User_UserDetail]
GO


