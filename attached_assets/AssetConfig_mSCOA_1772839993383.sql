CREATE TABLE [dbo].[AssetConfig_mSCOA](
	[AssetConfig_mSCOA_ID] [int] IDENTITY(1,1) NOT NULL,
	[FinYear] [varchar](9) NOT NULL,
	[TypeID] [int] NULL,
	[CategoryID] [int] NULL,
	[SubCategoryID] [int] NULL,
	[MeasurementTypeID] [int] NULL,
	[StatusID] [int] NULL,
	[Default] [bit] NULL,
	[Enabled] [bit] NULL,
	[UpLoadFile] [varchar](255) NULL,
	[CreatedByID] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[ModifiedByID] [int] NULL,
	[ModiefiedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetConfig_mSCOA] PRIMARY KEY CLUSTERED 
(
	[AssetConfig_mSCOA_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


