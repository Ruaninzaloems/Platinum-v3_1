CREATE TABLE [dbo].[Const_AssetJournalTransactionType_Sys](
	[AssetJournalTransactionType_ID] [int] IDENTITY(1,1) NOT NULL,
	[AssetJournalTransactionDesc] [varchar](200) NOT NULL,
	[Const_DocumentTypeID] [int] NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL
) ON [PRIMARY]
GO



