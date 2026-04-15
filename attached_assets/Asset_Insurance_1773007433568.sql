CREATE TABLE [dbo].[Asset_Insurance](
	[AssetInsurance_ID] [int] IDENTITY(1,1) NOT NULL,
	[Asset_ItemID] [int] NOT NULL,
	[PolicyNumber] [nvarchar](150) NOT NULL,
	[PolicyDescription] [nvarchar](300) NULL,
	[AssuredDate] [datetime] NULL,
	[InsuredValue] [decimal](16, 2) NULL,
	[Insurer] [nvarchar](200) NULL,
	[InsuranceCompany] [nvarchar](200) NULL,
	[TelNo] [nvarchar](50) NULL,
	[FaxNo] [nvarchar](50) NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[InsuranceDocument] [varbinary](max) NULL,
	[DocumentDescription] [nvarchar](300) NULL,
	[PremiumMonthly] [decimal](18, 2) NULL,
	[InsuredPeriod] [int] NULL,
	[ContentType] [nvarchar](50) NULL,
	[Notes] [nvarchar](500) NULL,
 CONSTRAINT [PK_Asset_Insurance] PRIMARY KEY CLUSTERED 
(
	[AssetInsurance_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO


