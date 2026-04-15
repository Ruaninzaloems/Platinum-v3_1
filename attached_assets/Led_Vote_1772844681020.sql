CREATE TABLE [dbo].[Led_Vote](
	[Vote_ID] [int] IDENTITY(1,1) NOT NULL,
	[Vote] [nvarchar](50) NOT NULL,
	[VoteDesc] [nvarchar](max) NULL,
	[VoteStatusID] [int] NULL,
	[FinYear] [nvarchar](9) NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[ModifierID] [int] NULL,
	[DateModified] [datetime] NULL,
	[VatIndicatorID] [int] NULL,
	[VoteTypeID] [int] NULL,
	[ControlVote] [bit] NOT NULL,
	[SCOAItemID] [int] NULL,
	[SCOAItemCode] [nvarchar](50) NULL,
	[IsBrokenDown] [bit] NULL,
	[OldVoteNumber] [nvarchar](100) NULL,
	[Vote1] [nvarchar](50) NULL,
	[OldFms56VoteNumber] [nvarchar](50) NULL,
	[CapitalTimePeriodID] [int] NULL,
	[Parent_Vote_ID] [int] NULL,
	[TakeOnID] [int] NULL,
 CONSTRAINT [PK_Led_Vote] PRIMARY KEY CLUSTERED 
(
	[Vote_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UK_Led_Vote_FinYear_SCOAItemID] UNIQUE NONCLUSTERED 
(
	[FinYear] ASC,
	[SCOAItemID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]


