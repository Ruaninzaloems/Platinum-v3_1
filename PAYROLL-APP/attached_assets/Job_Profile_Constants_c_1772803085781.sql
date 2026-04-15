 
CREATE TABLE [dbo].[Const_MajorGroup](
	[MajorGroup_ID] [int] IDENTITY(1,1) NOT NULL,
	[MajorGroupCode] [nvarchar](20) NOT NULL,
	[MajorGroupDesc] [nvarchar](1000) NOT NULL,
	[Enable] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_MajorGroup] PRIMARY KEY CLUSTERED 
(
	[MajorGroup_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Const_MinorGroup]    Script Date: 3/6/2026 3:17:29 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_MinorGroup](
	[MinorGroup_ID] [int] IDENTITY(1,1) NOT NULL,
	[SubMajorGroupID] [int] NOT NULL,
	[MinorGroupCode] [nvarchar](20) NOT NULL,
	[MinorGroupDesc] [nvarchar](1000) NOT NULL,
	[Enable] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_MinorGroup] PRIMARY KEY CLUSTERED 
(
	[MinorGroup_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Const_SubMajorGroup]    Script Date: 3/6/2026 3:17:29 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_SubMajorGroup](
	[SubMajorGroup_ID] [int] IDENTITY(1,1) NOT NULL,
	[MajorGroupID] [int] NOT NULL,
	[SubMajorGroupCode] [nvarchar](20) NOT NULL,
	[SubMajorGroupDesc] [nvarchar](1000) NOT NULL,
	[Enable] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_SubMajorGroup] PRIMARY KEY CLUSTERED 
(
	[SubMajorGroup_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Const_MajorGroup] ON 
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, N'1', N'MANAGERS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, N'2', N'PROFESSIONALS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, N'3', N'TECHNICIANS and ASSOCIATE PROFESSIONALS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, N'4', N'CLERICAL SUPPORT WORKERS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, N'5', N'SERVICE and SALES WORKERS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, N'6', N'SKILLED AGRICULTURAL, FORESTRY, FISHERY, CRAFT and RELATED TRADES WORKERS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, N'7', N'PLANT and MACHINE OPERATORS and ASSEMBLERS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MajorGroup] ([MajorGroup_ID], [MajorGroupCode], [MajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, N'8', N'ELEMENTARY OCCUPATIONS', 1, CAST(N'2017-08-18T16:08:36.767' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_MajorGroup] OFF
GO
SET IDENTITY_INSERT [dbo].[Const_MinorGroup] ON 
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, 1, N'111', N'Legislators and Senior Officials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, 1, N'112', N'Managing Directors and Chief Executives', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, 2, N'121', N'Business Services and Administration Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, 2, N'122', N'Sales, Marketing and Development Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, 3, N'131', N'Production Managers In Agriculture, Forestry and Fisheries', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, 3, N'132', N'Manufacturing, Mining, Construction and Distribution Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, 3, N'133', N'Information and Communications Technology Service Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, 3, N'134', N'Professional Services Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, 4, N'141', N'Hotel and Restaurant Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (10, 4, N'142', N'Retail and Wholesale Trade Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (11, 4, N'143', N'Other Services Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (12, 5, N'211', N'Physical and Earth Science Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (13, 5, N'212', N'Mathematicians, Actuaries and Statisticians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (14, 5, N'213', N'Life Science Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (15, 5, N'214', N'Engineering Professionals (Excluding Electrotechnology)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (16, 5, N'215', N'Electrotechnology Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (17, 5, N'216', N'Architects, Planners, Surveyors and Designers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (18, 6, N'221', N'Medical Doctors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (19, 6, N'222', N'Nursing and Midwifery Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (20, 6, N'223', N'Traditional and Complementary Medicine Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (21, 6, N'224', N'Paramedical Practitioners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (22, 6, N'225', N'Veterinarians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (23, 6, N'226', N'Other Health Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (24, 7, N'231', N'University and Higher Education Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (25, 7, N'232', N'Vocational Education Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (26, 7, N'233', N'Secondary or Intermediate and Senior Education Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (27, 7, N'234', N'Primary School and Early Childhood Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (28, 7, N'235', N'Other Teaching Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (29, 8, N'241', N'Finance Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (30, 8, N'242', N'Administration Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (31, 8, N'243', N'Sales, Marketing and Public Relations Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (32, 9, N'251', N'Software and Applications Developers and Analysts', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (33, 9, N'252', N'Database and Network Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (34, 10, N'261', N'Legal Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (35, 10, N'262', N'Librarians, Archivists and Curators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (36, 10, N'263', N'Social and Religious Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (37, 10, N'264', N'Authors, Journalists and Linguists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (38, 10, N'265', N'Creative and Performing Artists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (39, 11, N'311', N'Physical and Engineering Science Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (40, 11, N'312', N'Mining, Manufacturing and Construction Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (41, 11, N'313', N'Process Control Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (42, 11, N'314', N'Life Science Technicians and Related Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (43, 11, N'315', N'Ship and Aircraft Controllers and Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (44, 12, N'321', N'Medical and Pharmaceutical Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (45, 12, N'322', N'Nursing Midwifery Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (46, 12, N'323', N'Traditional and Complementary Medicine Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (47, 12, N'324', N'Veterinary Technicians and Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (48, 12, N'325', N'Other Health Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (49, 13, N'331', N'Financial and Mathematical Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (50, 13, N'332', N'Sales and Purchasing Agents and Brokers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (51, 13, N'333', N'Business Services Agents', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (52, 13, N'334', N'Administrative and specialised Secretaries', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (53, 13, N'335', N'Regulatory Government Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (54, 14, N'341', N'Legal, Social and Religious Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (55, 14, N'342', N'Sports and Fitness Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (56, 14, N'343', N'Artistic, Cultural and Culinary Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (57, 15, N'351', N'Information and Communications Technology Operations and User Support Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (58, 15, N'352', N'Telecommunications and Broadcasting Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (59, 16, N'411', N'General Office Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (60, 16, N'412', N'Secretaries (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (61, 16, N'413', N'Keyboard Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (62, 17, N'421', N'Tellers, Money Collectors and Related Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (63, 17, N'422', N'Client Information Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (64, 18, N'431', N'Numerical Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (65, 18, N'432', N'Material-Recording and Transport Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (66, 19, N'441', N'Other Clerical Support Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (67, 20, N'511', N'Travel Attendants, Conductors and Guides', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (68, 20, N'512', N'Cooks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (69, 20, N'513', N'Waiters and Bartenders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (70, 20, N'514', N'Hairdressers, Beauticians and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (71, 20, N'515', N'Building and Housekeeping Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (72, 20, N'516', N'Other Personal Services Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (73, 21, N'521', N'Street and Market Salespersons', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (74, 21, N'522', N'Shop Salespersons', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (75, 21, N'523', N'Cashiers and Ticket Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (76, 21, N'524', N'Other Sales Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (77, 22, N'531', N'Child Care Workers and Teachers'' Aides', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (78, 22, N'532', N'Personal Care Workers In Health Services', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (79, 23, N'541', N'Protective Services Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (80, 23, N'542', N'Commissioned and Non-Commissioned Armed Forces Officers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (81, 24, N'611', N'Market Gardeners and Crop Growers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (82, 24, N'612', N'Market-Oriented Animal Producers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (83, 24, N'613', N'Market-Oriented Mixed Crop and Animal Producers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (84, 25, N'621', N'Market-Oriented Forestry and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (85, 25, N'622', N'Market-Oriented Fishery Workers, Hunters and Trappers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (86, 26, N'631', N'Subsistence Farmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (87, 27, N'641', N'Building Frame and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (88, 27, N'642', N'Building Finishers and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (89, 27, N'643', N'Painters, Building Structure Cleaners and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (90, 28, N'651', N'Sheet and Structural Metal Workers, Moulders and Welders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (91, 28, N'652', N'Blacksmiths, Toolmakers and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (92, 28, N'653', N'Machinery Mechanics and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (93, 29, N'661', N'Handicraft Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (94, 29, N'662', N'Printing Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (95, 30, N'671', N'Electrical Equipment Installers and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (96, 30, N'672', N'Electronics and Telecommunications Installers and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (97, 31, N'681', N'Food Processing and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (98, 31, N'682', N'Wood Treaters, Cabinet Makers and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (99, 31, N'683', N'Garment and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (100, 31, N'684', N'Handicraft Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (101, 32, N'711', N'Mining and Mineral Processing Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (102, 32, N'712', N'Metal Processing and Finishing Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (103, 32, N'713', N'Chemical and Photographic Products Plant and Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (104, 32, N'714', N'Rubber, Plastic and Paper Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (105, 32, N'715', N'Textile, Fur and Leather Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (106, 32, N'716', N'Food and Related Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (107, 32, N'717', N'Wood Processing and Papermaking Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (108, 32, N'718', N'Other Stationary Plant and Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (109, 33, N'721', N'Assemblers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (110, 34, N'731', N'Locomotive Engine Drivers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (111, 34, N'732', N'Car, Van and Motorcycle Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (112, 34, N'733', N'Heavy Truck and Bus Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (113, 34, N'734', N'Mobile Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (114, 34, N'735', N'Ships'' Deck Crews and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (115, 35, N'811', N'Domestic, Hotel and Office Cleaners and Helpers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (116, 35, N'812', N'Vehicle, Window, Laundry and Other Hand Cleaning Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (117, 36, N'821', N'Agricultural, Forestry and Fishery Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (118, 37, N'831', N'Mining and Construction Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (119, 37, N'832', N'Manufacturing Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (120, 37, N'833', N'Transport and Storage Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (121, 38, N'841', N'Food Preparation Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (122, 39, N'851', N'Street and Related Service Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (123, 39, N'852', N'Street Vendors (Excluding Food)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (124, 40, N'861', N'Refuse Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_MinorGroup] ([MinorGroup_ID], [SubMajorGroupID], [MinorGroupCode], [MinorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (125, 40, N'862', N'Other Elementary Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_MinorGroup] OFF
GO
SET IDENTITY_INSERT [dbo].[Const_SubMajorGroup] ON 
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, 1, N'11', N'Chief Executives, Senior Officials and Legislators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, 1, N'12', N'Administrative and Commercial Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, 1, N'13', N'Production and specialised Services Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, 1, N'14', N'Hospitality, Retail and Other Services Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, 2, N'21', N'Physical, Mathematical and Engineering Science Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, 2, N'22', N'Health Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, 2, N'23', N'Teaching Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, 2, N'24', N'Business and Administration Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, 2, N'25', N'Information and Communications Technology Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (10, 2, N'26', N'Legal, Social and Cultural Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (11, 3, N'31', N'Science and Engineering Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (12, 3, N'32', N'Health Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (13, 3, N'33', N'Business and Administration Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (14, 3, N'34', N'Legal, Social, Cultural and Related Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (15, 3, N'35', N'Information and Communications Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (16, 4, N'41', N'General and Keyboard Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (17, 4, N'42', N'Customer Services Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (18, 4, N'43', N'Numerical and Material Recording Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (19, 4, N'44', N'Other Clerical Support Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (20, 5, N'51', N'Personal Service Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (21, 5, N'52', N'Sales Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (22, 5, N'53', N'Personal Care Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (23, 5, N'54', N'Protective Services Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (24, 6, N'61', N'Market-Oriented Skilled Agricultural Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (25, 6, N'62', N'Market-Oriented Skilled Forestry, Fishery and Hunting Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (26, 6, N'63', N'Subsistence Farmers,Fishers, Hunters and Gatherers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (27, 6, N'64', N'Building and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (28, 6, N'65', N'Metal, Machinery and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (29, 6, N'66', N'Handicraft and Printing Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (30, 6, N'67', N'Electrical and Electronics Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (31, 6, N'68', N'Food Processing, Wood Working, Garment and Other Craft and Related Trades Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (32, 7, N'71', N'Stationary Plant and Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (33, 7, N'72', N'Assemblers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (34, 7, N'73', N'Drivers and Mobile Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (35, 8, N'81', N'Cleaners and Helpers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (36, 8, N'82', N'Agricultural, Forestry and Fishery Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (37, 8, N'83', N'Labourers In Mining, Construction, Manufacturing and Transport', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (38, 8, N'84', N'Food Preparation Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (39, 8, N'85', N'Street and Related Sales and Service Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID], [MajorGroupID], [SubMajorGroupCode], [SubMajorGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (40, 8, N'86', N'Refuse Workers and Other Elementary Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_SubMajorGroup] OFF
GO
ALTER TABLE [dbo].[Const_MinorGroup]  WITH NOCHECK ADD  CONSTRAINT [FK_Const_MinorGroup_Const_SubMajorGroup] FOREIGN KEY([SubMajorGroupID])
REFERENCES [dbo].[Const_SubMajorGroup] ([SubMajorGroup_ID])
GO
ALTER TABLE [dbo].[Const_MinorGroup] CHECK CONSTRAINT [FK_Const_MinorGroup_Const_SubMajorGroup]
GO
ALTER TABLE [dbo].[Const_SubMajorGroup]  WITH NOCHECK ADD  CONSTRAINT [FK_Const_SubMajorGroup_Const_MajorGroup] FOREIGN KEY([MajorGroupID])
REFERENCES [dbo].[Const_MajorGroup] ([MajorGroup_ID])
GO
ALTER TABLE [dbo].[Const_SubMajorGroup] CHECK CONSTRAINT [FK_Const_SubMajorGroup_Const_MajorGroup]
GO
