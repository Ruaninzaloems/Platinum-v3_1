CREATE TABLE [dbo].[Asset_Register_Transactions](
	[ID] [bigint] IDENTITY(1,1) NOT NULL,
	[AssetRegisterItem_ID] [int] NOT NULL,
	[TransactionTypeID] [int] NOT NULL,
	[TransactionDate] [datetime] NOT NULL,
	[PurchaseAmount] [decimal](18, 8) NOT NULL,
	[ResidualValue] [decimal](18, 8) NOT NULL,
	[CurrentValue] [decimal](18, 8) NOT NULL,
	[UsefulLife] [int] NOT NULL,
	[RemaingUsefulLife] [decimal](18, 8) NOT NULL,
	[DepreciationValue] [decimal](18, 8) NULL,
	[ImpairmentValue] [decimal](18, 8) NULL,
	[RevaluationValue] [decimal](18, 8) NULL,
	[FairValue] [decimal](18, 8) NULL,
	[DisposalValue] [decimal](18, 8) NULL,
	[DisposalLossValue] [decimal](18, 8) NULL,
	[DisposalTotalValue] [decimal](18, 8) NULL,
	[AccumulatedDepreciation] [decimal](18, 8) NOT NULL,
	[AccumulatedImpairment] [decimal](18, 8) NOT NULL,
	[AccumulatedFairValue] [decimal](18, 8) NOT NULL,
	[AccumulatedRevaluation] [decimal](18, 8) NOT NULL,
	[FinancialPeriod] [int] NOT NULL,
	[FinancialYear] [varchar](10) NOT NULL,
	[DocumentType_ID] [int] NULL,
	[GLGUID_ID] [varchar](50) NULL,
	[TransactionSource_ID] [int] NULL,
	[DateModified] [datetime] NOT NULL,
	[Modifier] [int] NOT NULL,
	[ImpairmentReversalValue] [decimal](18, 8) NULL,
	[AccumulatedImpairmentReversal] [decimal](18, 8) NULL,
	[ImpairmentSurplus] [decimal](18, 8) NULL,
	[MovementInRevaluationReserve] [decimal](18, 8) NULL,
	[DepreciationOffset] [decimal](18, 8) NULL,
	[RevaluationReserveImpairment] [decimal](18, 8) NULL,
	[RevaluationReserveImpairmentReversal] [decimal](18, 8) NULL,
	[RevaluationReserveRevaluation] [decimal](18, 8) NULL,
	[RevaluationReserveDisposal] [decimal](18, 8) NULL,
	[DepreciationAdjustment] [decimal](18, 8) NULL,
	[TransferFromValue] [decimal](18, 8) NULL,
	[TransferToValue] [decimal](18, 8) NULL,
	[RefurbDTValue] [decimal](18, 8) NULL,
	[RefurbCTValue] [decimal](18, 8) NULL,
	[RefurbDepreciationValue] [decimal](18, 8) NULL,
	[RefurbRevaluationValue] [decimal](18, 8) NULL,
 CONSTRAINT [PK_Asset_Register_Transactions] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO



