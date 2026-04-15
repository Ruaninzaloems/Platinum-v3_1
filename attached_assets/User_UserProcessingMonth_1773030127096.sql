CREATE TABLE [dbo].[User_UserProcessingMonth](
	[UserProcessingMonth_ID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[ProcessingMonth] [int] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[DateModified] [datetime] NULL,
 CONSTRAINT [PK_User_UserProcessingMonth] PRIMARY KEY CLUSTERED 
(
	[UserProcessingMonth_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


