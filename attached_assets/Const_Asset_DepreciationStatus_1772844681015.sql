CREATE TABLE [dbo].[Const_Asset_DepreciationStatus](
	[Asset_DepreciationStatus_ID] [int] IDENTITY(1,1) NOT NULL,
	[StatusDescription] [varchar](100) NOT NULL,
 CONSTRAINT [PK_Const_Asset_DepreciationStatus] PRIMARY KEY CLUSTERED 
(
	[Asset_DepreciationStatus_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


