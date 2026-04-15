CREATE TABLE [dbo].[Const_PropertyTypeOfUse](
	[PropertyTypeOfUse_ID] [int] IDENTITY(1,1) NOT NULL,
	[Description] [varchar](200) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[ZoneCode] [nvarchar](50) NULL,
 CONSTRAINT [PK_PropertyTypeOfUse] PRIMARY KEY CLUSTERED 
(
	[PropertyTypeOfUse_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


