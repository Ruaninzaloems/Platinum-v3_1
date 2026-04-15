CREATE TABLE [dbo].[Asset_WIP_Register](
	[WIPRegister_ID] [int] IDENTITY(1,1) NOT NULL,
	[AssetRegisterItem_ID] [int] NULL,
	[ProjectNo] [nvarchar](50) NOT NULL,
	[ProjectName] [nvarchar](500) NOT NULL,
	[ProjectStatusID] [int] NOT NULL,
	[ContractID] [int] NULL,
	[ContractStartDate] [datetime] NOT NULL,
	[ContractEndDate] [datetime] NOT NULL,
	[ContractNumber] [nvarchar](50) NULL,
	[FundingTypeID] [int] NOT NULL,
	[DepartmentID] [int] NOT NULL,
	[DivisionID] [int] NOT NULL,
	[CustodianID] [int] NOT NULL,
	[Latitude] [nvarchar](75) NULL,
	[Longitude] [nvarchar](75) NULL,
	[ContractValue] [decimal](18, 2) NULL,
	[WIPOpeningBalance] [decimal](18, 2) NULL,
	[RestatedOpeningBalance] [decimal](18, 2) NULL,
	[Additions] [decimal](18, 2) NULL,
	[TransferOfAssets] [decimal](18, 2) NULL,
	[WriteOff] [decimal](18, 2) NULL,
	[Impairment] [decimal](18, 2) NULL,
	[PriorYearAdjustment] [decimal](18, 2) NULL,
	[WIPClosingBalance] [decimal](18, 2) NULL,
	[FinancialProgress] [decimal](18, 2) NULL,
	[BudgetProjectID] [int] NOT NULL,
	[BudgetProjectItemID] [int] NOT NULL,
	[CompletionDate] [datetime] NULL,
	[IsApproved] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[WIPRegister_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


