CREATE TABLE [dbo].[Const_Floor](
	[Floor_ID] [int] IDENTITY(1,1) NOT NULL,
	[FloorDesc] [nvarchar](50) NOT NULL,
	[BuildingID] [int] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[Enabled] [bit] NULL,
 CONSTRAINT [PK_Const_Floor] PRIMARY KEY CLUSTERED 
(
	[Floor_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


