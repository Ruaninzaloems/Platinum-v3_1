CREATE TABLE [dbo].[AssetConfig_FinancialStatus](
	[FinStatusID] [int] IDENTITY(1,1) NOT NULL,
	[FinancialStatusDesc] [varchar](50) NOT NULL,
	[Default] [bit] NULL,
	[Enabled] [bit] NULL,
	[CreatedByID] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[ModifiedByID] [int] NULL,
	[ModiefiedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetConfig_FinancialStatus] PRIMARY KEY CLUSTERED 
(
	[FinStatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


