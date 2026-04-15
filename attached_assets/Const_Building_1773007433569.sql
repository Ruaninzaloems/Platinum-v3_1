CREATE TABLE [dbo].[Const_Building](
	[Building_ID] [int] IDENTITY(1,1) NOT NULL,
	[BuildingDesc] [nvarchar](100) NOT NULL,
	[StreetID] [int] NOT NULL,
	[Longitude] [nvarchar](50) NULL,
	[Latitude] [nvarchar](50) NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[Enabled] [bit] NULL,
	[StreetNumber] [nvarchar](100) NULL,
 CONSTRAINT [PK_Const_Building] PRIMARY KEY CLUSTERED 
(
	[Building_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


