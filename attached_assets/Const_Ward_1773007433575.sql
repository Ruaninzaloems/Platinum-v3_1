CREATE TABLE [dbo].[Const_Ward](
	[Ward_Id] [int] IDENTITY(1,1) NOT NULL,
	[WardDescription] [varchar](1000) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturedID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[WardNumber] [varchar](10) NULL,
	[Councillor] [varchar](50) NULL,
 CONSTRAINT [PK_Const_Ward] PRIMARY KEY CLUSTERED 
(
	[Ward_Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


