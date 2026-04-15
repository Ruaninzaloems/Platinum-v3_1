CREATE TABLE [dbo].[Const_DocumentType](
	[DocumentType_ID] [int] IDENTITY(1,1) NOT NULL,
	[DocumentTypeDesc] [nvarchar](50) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[ModifierID] [int] NULL,
	[DateModified] [datetime] NULL,
	[DocumentOrder] [int] NULL,
	[ModuleID] [int] NOT NULL,
 CONSTRAINT [PK_Const_DocumentType] PRIMARY KEY CLUSTERED 
(
	[DocumentType_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO



