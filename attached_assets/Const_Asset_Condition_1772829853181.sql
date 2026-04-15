CREATE TABLE [dbo].[Const_Asset_Condition](
	[Asset_Condition_ID] [int] IDENTITY(1,1) NOT NULL,
	[Description] [nvarchar](300) NULL,
	[DateCaptured] [datetime] NULL,
	[CapturerID] [int] NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[Enabled] [bit] NULL,
 CONSTRAINT [PK_Const_Asset_Condition] PRIMARY KEY CLUSTERED 
(
	[Asset_Condition_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


