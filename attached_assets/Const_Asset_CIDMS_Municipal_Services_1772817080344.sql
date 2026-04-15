CREATE TABLE [dbo].[Const_Asset_CIDMS_Municipal_Services](
	[AssetMunicipalServicesID] [int] IDENTITY(1,1) NOT NULL,
	[AssetMunicipalServicesDesc] [nvarchar](250) NOT NULL,
	[Enabled] [bit] NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[Default] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[AssetMunicipalServicesID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


