USE [EMS_Mnquma]
GO

/****** Object:  Table [dbo].[Asset_BulkUploadJobs]    Script Date: 2026/03/06 17:57:07 ******/
SET ANSI_NULLS ON
GO
CREATE TABLE [dbo].[Asset_BulkUploadJobs](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[Filename] [nvarchar](max) NOT NULL,
	[UserId] [int] NOT NULL,
	[IsDonated] [int] NULL,
	[Activate_Validation] [bit] NOT NULL,
	[Processed] [bit] NOT NULL,
	[Date_Created] [datetime] NOT NULL,
	[Job_Status] [nvarchar](max) NULL,
	[Date_Ran] [datetime] NULL,
	[No_RecordsInserted] [int] NULL,
	[No_RecodsNotValidating] [int] NULL,
	[Total_Records] [int] NULL,
	[ValidationError_Path] [nvarchar](max) NULL,
	[ServiceID] [int] NOT NULL,
	[ProcessDate] [datetime] NULL,
	[RunID] [int] NULL,
	[ContractNumber] [nvarchar](max) NULL,
 CONSTRAINT [PK_Asset_BulkUploadJobs1] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO



