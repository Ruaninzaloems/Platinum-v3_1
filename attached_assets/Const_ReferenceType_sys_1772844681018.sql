CREATE TABLE [dbo].[Const_ReferenceType_sys](
	[ReferenceType_ID] [int] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_ReferenceType_sys] PRIMARY KEY CLUSTERED 
(
	[ReferenceType_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


