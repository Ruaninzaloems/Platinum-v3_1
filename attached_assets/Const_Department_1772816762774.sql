CREATE TABLE [dbo].[Const_Department](
	[Department_ID] [int] IDENTITY(1,1) NOT NULL,
	[DepartmentDesc] [varchar](200) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[DepartmentCode] [varchar](50) NULL,
	[StartDate] [datetime] NULL,
	[EndDate] [datetime] NULL,
	[VatApportionment] [int] NULL,
	[ManagerPositionID] [int] NULL,
	[ManagerStartDate] [datetime] NULL,
	[ManagerEndDate] [datetime] NULL,
	[FinYear] [varchar](9) NULL,
 CONSTRAINT [PK_Const_Department] PRIMARY KEY CLUSTERED 
(
	[Department_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


