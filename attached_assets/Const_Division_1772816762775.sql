CREATE TABLE [dbo].[Const_Division](
	[Division_ID] [int] IDENTITY(1,1) NOT NULL,
	[DivisionDesc] [varchar](200) NOT NULL,
	[DivisionCode] [varchar](50) NULL,
	[DepartmentID] [int] NOT NULL,
	[DivisionParentID] [int] NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
	[SCOAFunctionID] [int] NULL,
	[HRPayrollSCOAFundID] [int] NULL,
	[StartDate] [datetime] NULL,
	[EndDate] [datetime] NULL,
	[RegionID] [int] NULL,
	[ProjectID] [int] NULL,
	[ManagerPositionID] [int] NULL,
	[ManagerStartDate] [datetime] NULL,
	[ManagerEndDate] [datetime] NULL,
	[ConditionOfServiceID] [int] NULL,
	[DirectorateLevel] [bit] NULL,
	[FinYear] [varchar](9) NULL,
 CONSTRAINT [PK_Const_Division] PRIMARY KEY CLUSTERED 
(
	[Division_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


