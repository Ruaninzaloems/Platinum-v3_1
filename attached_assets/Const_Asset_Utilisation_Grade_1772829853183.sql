CREATE TABLE [dbo].[Const_Asset_Utilisation_Grade](
	[AssetUtilisationGradeID] [int] IDENTITY(1,1) NOT NULL,
	[AssetUtilisationGradeDesc] [nvarchar](250) NOT NULL,
	[Enabled] [bit] NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[Default] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[AssetUtilisationGradeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


