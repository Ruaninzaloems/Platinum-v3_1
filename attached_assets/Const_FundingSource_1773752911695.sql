CREATE TABLE [dbo].[Const_FundingSource](
	[FundingSource_ID] [int] IDENTITY(1,1) NOT NULL,
	[FundingSourceDesc] [nvarchar](200) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[FinYear] [nvarchar](9) NULL,
	[PreviousReferenceId] [int] NULL,
 CONSTRAINT [PK_Const_FundingSource] PRIMARY KEY CLUSTERED 
(
	[FundingSource_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


