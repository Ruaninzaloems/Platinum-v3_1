CREATE TABLE [dbo].[AAAA_ConfigSettings](
	[ConfigSett_ID] [int] IDENTITY(1,1) NOT NULL,
	[KeyName] [varchar](100) NULL,
	[KeyValue] [varchar](500) NULL,
	[KeyDescription] [varchar](500) NULL,
	[Module] [varchar](100) NULL,
	[DateCaptured] [datetime] NULL,
	[CapturerID] [int] NULL,
	[perMuni_SetupRequirements] [bit] NOT NULL,
 CONSTRAINT [PK_AAAA_ConfigSettings] PRIMARY KEY CLUSTERED 
(
	[ConfigSett_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO



