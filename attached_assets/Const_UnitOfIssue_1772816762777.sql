CREATE TABLE [dbo].[Const_UnitOfIssue](
	[UnitOfIssue_ID] [int] IDENTITY(1,1) NOT NULL,
	[UnitOfIssueDesc] [varchar](200) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[UOMCode] [varchar](50) NULL,
	[MeasureCategoryCode] [varchar](50) NULL,
	[base] [int] NULL,
	[GroupDefaultUom] [bit] NULL,
	[IsDeleted] [bit] NULL,
 CONSTRAINT [PK_Const_UnitOfIssue] PRIMARY KEY CLUSTERED 
(
	[UnitOfIssue_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


