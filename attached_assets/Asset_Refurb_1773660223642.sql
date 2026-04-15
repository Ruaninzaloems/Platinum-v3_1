CREATE TABLE [dbo].[Asset_Refurb](
	[Asset_RefurbID] [int] IDENTITY(1,1) NOT NULL,
	[AssetRegisterID] [int] NOT NULL,
	[FinancialPeriod] [int] NOT NULL,
	[FinancialYear] [varchar](10) NOT NULL,
	[RefurbDate] [datetime] NOT NULL,
	[Refurb_DT] [decimal](16, 2) NOT NULL,
	[Refurb_CT] [decimal](16, 2) NOT NULL,
	[Refurb_Depreciation] [decimal](16, 2) NOT NULL,
	[Refurb_Revaluation] [decimal](16, 2) NOT NULL,
	[isApproved] [bit] NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Asset_Refurb] PRIMARY KEY CLUSTERED 
(
	[Asset_RefurbID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


