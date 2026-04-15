USE [EMS_George]
GO
/****** Object:  Table [dbo].[Const_EmploymentCategory_Sys]    Script Date: 3/6/2026 3:06:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_EmploymentCategory_Sys](
	[EmploymentCategory_ID] [int] IDENTITY(1,1) NOT NULL,
	[CategoryCode] [nvarchar](50) NOT NULL,
	[Category] [nvarchar](100) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_EmploymentCategory_Sys] PRIMARY KEY CLUSTERED 
(
	[EmploymentCategory_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Const_EmploymentCode_Sys]    Script Date: 3/6/2026 3:06:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_EmploymentCode_Sys](
	[EmploymentCode_ID] [int] IDENTITY(1,1) NOT NULL,
	[EmploymentCode] [nvarchar](100) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_EmploymentCode_Sys] PRIMARY KEY CLUSTERED 
(
	[EmploymentCode_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Const_Occupations]    Script Date: 3/6/2026 3:06:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_Occupations](
	[Occupations_ID] [int] IDENTITY(1,1) NOT NULL,
	[UnitGroupID] [int] NOT NULL,
	[OccupationsCode] [nvarchar](20) NOT NULL,
	[OccupationsDesc] [nvarchar](1000) NOT NULL,
	[Enable] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_Occupations] PRIMARY KEY CLUSTERED 
(
	[Occupations_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Const_WorkArea_Sys]    Script Date: 3/6/2026 3:06:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_WorkArea_Sys](
	[WorkArea_ID] [int] IDENTITY(1,1) NOT NULL,
	[EmploymentCodeId] [int] NOT NULL,
	[WorkArea] [nvarchar](50) NOT NULL,
	[Enabled] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_WorkArea_Sys] PRIMARY KEY CLUSTERED 
(
	[WorkArea_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Const_EmploymentCategory_Sys] ON 
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, N'SOC 100', N'Legislators', 1, CAST(N'2014-08-21T10:43:41.167' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, N'SOC 100', N'Directors and Corporate Managers', 1, CAST(N'2014-08-21T10:43:56.160' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, N'SOC 200', N'Professionals', 1, CAST(N'2014-08-21T10:44:24.033' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, N'SOC 300', N'Technicians and Trade Workers', 1, CAST(N'2014-08-21T10:44:36.957' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, N'SOC 400', N'Community and Personal Service Workers', 1, CAST(N'2014-08-21T10:44:55.223' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, N'SOC 500', N'Clerical and Administrative Workers', 1, CAST(N'2014-08-21T10:45:19.467' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, N'SOC 700', N'Machine Operators and Drivers', 1, CAST(N'2014-08-21T10:45:54.957' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, N'SOC 800', N'Labourers', 1, CAST(N'2014-08-21T10:46:09.053' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCategory_Sys] ([EmploymentCategory_ID], [CategoryCode], [Category], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, N'', N'Apprentices', 1, CAST(N'2014-08-21T10:46:26.143' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_EmploymentCategory_Sys] OFF
GO
SET IDENTITY_INSERT [dbo].[Const_EmploymentCode_Sys] ON 
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, N'Corporate Services', 1, CAST(N'2014-08-21T11:07:45.200' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, N'HR and Training', 1, CAST(N'2014-08-21T11:07:53.737' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, N'Financial Services', 1, CAST(N'2014-08-21T11:07:56.977' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, N'Community Services', 1, CAST(N'2014-08-21T11:08:12.210' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, N'Environmental Management', 1, CAST(N'2014-08-21T11:08:19.513' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, N'Legal', 1, CAST(N'2014-08-21T11:08:26.560' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, N'Emergency Services', 1, CAST(N'2014-08-21T11:08:34.277' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, N'Community Safety', 1, CAST(N'2014-08-21T11:08:43.757' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, N'Public Transport', 1, CAST(N'2014-08-21T11:09:00.100' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (10, N'Municipal Planning', 1, CAST(N'2014-08-21T11:09:08.233' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (11, N'Housing', 1, CAST(N'2014-08-21T11:09:16.620' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (12, N'Technical Services', 1, CAST(N'2014-08-21T11:09:23.880' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (13, N'Executive Mayor', 1, CAST(N'2014-08-21T14:16:01.233' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (14, N'11131 City/Municipal Manager', 1, CAST(N'2014-08-21T14:16:09.070' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (15, N'11133 General Managers', 1, CAST(N'2014-08-21T14:16:13.700' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (16, N'1211 Corporate Services Managers', 1, CAST(N'2014-08-21T14:16:23.660' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (17, N'1212 Finance Managers', 1, CAST(N'2014-08-21T14:16:24.497' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (18, N'1213 Human Resource Managers', 1, CAST(N'2014-08-21T14:16:25.850' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (19, N'1214 Policy and Planning Managers', 1, CAST(N'2014-08-21T14:16:27.377' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (20, N'1221 Engineering Managers', 1, CAST(N'2014-08-21T14:16:38.060' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (21, N'1222 Construction Managers', 1, CAST(N'2014-08-21T14:16:39.180' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (22, N'1231 ICT Managers', 1, CAST(N'2014-08-21T14:16:45.770' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (23, N'1251 Health, Welfare and Education Service Managers', 1, CAST(N'2014-08-21T14:16:47.403' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (24, N'12922 Commissioned Fire Officer', 1, CAST(N'2014-08-21T14:16:59.950' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (25, N'12923 Commissioned Police Officer (Metro/Traffic Police)', 1, CAST(N'2014-08-21T14:17:01.217' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (26, N'12991 Laboratory Managers', 1, CAST(N'2014-08-21T14:17:11.987' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (27, N'12992 Environment, Parks and Land Care Managers', 1, CAST(N'2014-08-21T14:17:20.010' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (28, N'12993 Sports Administrator or Manager', 1, CAST(N'2014-08-21T14:17:22.937' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (29, N'12994 Arts Administrator or Managers', 1, CAST(N'2014-08-21T14:17:27.533' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (30, N'1491 Sport and Recreation Managers', 1, CAST(N'2014-08-21T14:17:32.717' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (31, N'1492 Customer Services Managers', 1, CAST(N'2014-08-21T14:17:33.807' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (32, N'Mayor', 1, CAST(N'2014-08-21T14:22:23.200' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (33, N'Local Government Legislators (Councillors)', 1, CAST(N'2014-08-21T14:22:32.180' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (34, N'Traditional Leaders & Heads of Villages', 1, CAST(N'2014-08-21T14:22:44.517' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (35, N'Ward Committee Members', 1, CAST(N'2014-08-21T14:22:51.867' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID], [EmploymentCode], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (36, N'Unknown', 1, CAST(N'2014-08-21T11:07:53.737' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_EmploymentCode_Sys] OFF
GO
SET IDENTITY_INSERT [dbo].[Const_Occupations] ON 
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, 1, N'111101', N'Local or Provincial Government Legislator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, 1, N'111102', N'Parliamentarian', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, 2, N'111201', N'Defence Force Senior Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, 2, N'111202', N'General Manager Public Service', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, 2, N'111203', N'Local Authority Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, 2, N'111204', N'Senior Government Official', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, 2, N'111205', N'Senior Police Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, 2, N'111206', N'Ombudsperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, 2, N'111207', N'Senior Government Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (10, 3, N'111301', N'Traditional Leader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (11, 4, N'111401', N'Elected Official', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (12, 4, N'111402', N'Trade Union Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (13, 4, N'111408', N'Political Party Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (14, 5, N'112101', N'Director (Enterprise / Organisation)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (15, 6, N'121101', N'Finance Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (16, 6, N'121102', N'Payroll Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (17, 6, N'121103', N'Credit Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (18, 6, N'121104', N'Internal Audit Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (19, 7, N'121201', N'Human Resource Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (20, 7, N'121202', N'Business Training Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (21, 7, N'121203', N'Compensation and Benefits Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (22, 7, N'121204', N'Recruitment Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (23, 7, N'121205', N'Employee Wellness Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (24, 7, N'121206', N'Health and Safety Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (25, 7, N'121207', N'Personnel Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (26, 8, N'121301', N'Policy and Planning Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (27, 9, N'121901', N'Corporate General Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (28, 9, N'121902', N'Corporate Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (29, 9, N'121903', N'Physical Asset Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (30, 9, N'121904', N'Contract Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (31, 9, N'121905', N'Programme or Project Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (32, 9, N'121906', N'Franchise Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (33, 9, N'121907', N'Labour Recruitment Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (34, 9, N'121908', N'Quality Systems Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (35, 9, N'121909', N'Sustainability Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (36, 9, N'121910', N'Water Asset Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (37, 10, N'122101', N'Sales and Marketing Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (38, 10, N'122102', N'Sales Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (39, 10, N'122103', N'Director of Marketing', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (40, 10, N'122104', N'Interactive and Direct Marketing Strategist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (41, 10, N'122105', N'Customer Service Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (42, 11, N'122201', N'Advertising and Public Relations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (43, 12, N'122301', N'Research and Development Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (44, 13, N'131101', N'Agricultural Farm Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (45, 13, N'131102', N'Forestry Operations Manager ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (46, 13, N'131103', N'Forestry Operations Supervisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (47, 14, N'131201', N'Aquaculture Farm Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (48, 15, N'132101', N'Manufacturer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (49, 15, N'132102', N'Manufacturing Operations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (50, 15, N'132104', N'Engineering Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (51, 15, N'132105', N'Power Generation Operations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (52, 15, N'132106', N'Manufacturing Quality Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (53, 15, N'132107', N'Quality Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (54, 15, N'132108', N'Metrologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (55, 15, N'132109', N'Quality Systems Auditor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (56, 15, N'132110', N'Quality Systems Auditor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (57, 15, N'132111', N'Quality Training Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (58, 16, N'132201', N'Mining Operations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (59, 16, N'132202', N'Mineral Resources Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (60, 16, N'132203', N'Rock Engineering Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (61, 17, N'132301', N'Construction Project Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (62, 17, N'132302', N'Project Builder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (63, 18, N'132401', N'Supply and Distribution Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (64, 18, N'132402', N'Logistics Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (65, 18, N'132403', N'Road Transport Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (66, 18, N'132404', N'Warehouse Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (67, 18, N'132405', N'Fleet Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (68, 18, N'132406', N'Railway Station Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (69, 18, N'132407', N'Airport or Harbour Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (70, 18, N'132408', N'Grain Depot Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (71, 18, N'132409', N'Fuel Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (72, 18, N'132410', N'Maritime Search and Rescue Mission Coordinator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (73, 19, N'133101', N'Chief Information Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (74, 19, N'133102', N'ICT Project Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (75, 19, N'133103', N'Data Management Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (76, 19, N'133104', N'Application Development Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (77, 19, N'133105', N'Information Technology Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (78, 19, N'133106', N'Information Systems Director', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (79, 20, N'134101', N'Child Care Centre Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (80, 21, N'134201', N'Medical Superintendent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (81, 21, N'134202', N'Nursing Clinical Director', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (82, 21, N'134203', N'Primary Health Care Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (83, 21, N'134204', N'Secondary Health Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (84, 21, N'134205', N'Health Service Specialised Clinic Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (85, 21, N'134206', N'Sport Science Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (86, 21, N'134207', N'Community Health Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (87, 22, N'134301', N'Special Care Accommodation Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (88, 23, N'134401', N'Social Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (89, 23, N'134402', N'Community Development Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (90, 23, N'134403', N'Child and Youth Care Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (91, 24, N'134501', N'School Principal', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (92, 24, N'134502', N'FET College Principal', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (93, 24, N'134503', N'Faculty Head', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (94, 24, N'134504', N'District Education Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (95, 24, N'134505', N'Educational Rector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (96, 24, N'134506', N'Educational Registrar', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (97, 24, N'134507', N'Head of Department (Teacher)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (98, 25, N'134601', N'Bank Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (99, 25, N'134602', N'Credit Bureau Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (100, 25, N'134603', N'Financial Markets Business Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (101, 26, N'134701', N'Military Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (102, 26, N'134702', N'Military Commander', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (103, 26, N'134703', N'Military Warrant Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (104, 27, N'134901', N'Environmental Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (105, 27, N'134902', N'Laboratory Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (106, 27, N'134903', N'Small Business Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (107, 27, N'134904', N'Office Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (108, 27, N'134905', N'Judicial Court Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (109, 27, N'134906', N'Practice Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (110, 27, N'134907', N'Archives Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (111, 27, N'134908', N'Library Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (112, 27, N'134909', N'Museum Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (113, 27, N'134911', N'Insurance Policy Administration Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (114, 27, N'134912', N'Commissioned Fire and Rescue Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (115, 27, N'134913', N'Commissioned Police Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (116, 27, N'134914', N'Correctional Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (117, 27, N'134915', N'Non Manufacturing Operations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (118, 27, N'134916', N'Non Manufacturing Operations Foreman', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (119, 27, N'134917', N'Publisher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (120, 27, N'134918', N'Water production and Supply Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (121, 27, N'134919', N'Traffic and Law Enforcement Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (122, 27, N'134920', N'Community Correctional Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (123, 28, N'141101', N'Hotel or Motel Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (124, 28, N'141102', N'Guest House Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (125, 28, N'141103', N'Reception Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (126, 29, N'141201', N'Café (Licensed) or Restaurant Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (127, 29, N'141202', N'Licensed Club Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (128, 29, N'141203', N'Catering Production Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (129, 29, N'141204', N'Reservations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (130, 30, N'142101', N'Importer or Exporter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (131, 30, N'142102', N'Wholesaler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (132, 30, N'142103', N'Retail General Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (133, 30, N'142104', N'Post Office Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (134, 31, N'143101', N'Betting Agency Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (135, 31, N'143102', N'Gaming Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (136, 31, N'143103', N'Cinema or Theatre Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (137, 31, N'143104', N'Arts / Culture Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (138, 31, N'143105', N'Sports Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (139, 31, N'143106', N'Amusement Centre Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (140, 31, N'143107', N'Fitness Centre Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (141, 31, N'143108', N'Facility Centre Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (142, 31, N'143109', N'Club Membership Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (143, 32, N'143901', N'Facilities Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (144, 32, N'143902', N'Cleaning Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (145, 32, N'143903', N'Boarding Kennel or Cattery Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (146, 32, N'143904', N'Security Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (147, 32, N'143905', N'Call or Contact Centre Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (148, 32, N'143906', N'Caravan Park and Camping Ground Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (149, 32, N'143907', N'Dockmaster', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (150, 32, N'143908', N'Travel Accommodation Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (151, 32, N'143909', N'Travel Agency Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (152, 33, N'211101', N'Physicist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (153, 34, N'211201', N'Meteorologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (154, 34, N'211205', N'Climate Change Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (155, 34, N'211206', N'Climate Change Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (156, 35, N'211301', N'Chemist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (157, 35, N'211302', N'Manufacturing Research Chemist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (158, 36, N'211401', N'Geologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (159, 36, N'211402', N'Geophysicist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (160, 36, N'211403', N'Materials Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (161, 36, N'211404', N'Gemologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (162, 36, N'211405', N'Mineralogist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (163, 36, N'211406', N'Hydrologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (164, 36, N'211407', N'Oceanographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (165, 37, N'212101', N'Actuary', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (166, 37, N'212102', N'Mathematician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (167, 37, N'212103', N'Statistician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (168, 38, N'213101', N'Animal Behaviourist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (169, 38, N'213102', N'General Biologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (170, 38, N'213103', N'Anatomist or Physiologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (171, 38, N'213104', N'Biochemist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (172, 38, N'213105', N'Biotechnologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (173, 38, N'213106', N'Botanist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (174, 38, N'213107', N'Marine Biologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (175, 38, N'213108', N'Microbiologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (176, 38, N'213109', N'Zoologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (177, 38, N'213110', N'Medical Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (178, 38, N'213111', N'Pharmaceutical Physician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (179, 39, N'213201', N'Agriculture Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (180, 39, N'213202', N'Agricultural Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (181, 39, N'213203', N'Forest Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (182, 39, N'213204', N'Wine Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (183, 39, N'213205', N'Food and Beverage Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (184, 40, N'213301', N'Conservation Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (185, 40, N'213302', N'Environmental Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (186, 40, N'213304', N'Earth and Soil Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (187, 40, N'213305', N'Air Pollution Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (188, 40, N'213306', N'Water Quality Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (189, 40, N'213307', N'Park Ranger', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (190, 40, N'213308', N'Brownfield Redevelopment Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (191, 40, N'213309', N'Toxicologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (192, 40, N'213310', N'Biodiversity Planner ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (193, 41, N'214101', N'Industrial Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (194, 41, N'214102', N'Industrial Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (195, 41, N'214103', N'Production Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (196, 41, N'214104', N'Production Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (197, 41, N'214105', N'Energy Efficiency Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (198, 41, N'214106', N'Metrologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (199, 42, N'214201', N'Civil Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (200, 42, N'214202', N'Civil Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (201, 43, N'214301', N'Environmental Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (202, 43, N'214302', N'Environmental Impact and Restoration Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (203, 44, N'214401', N'Mechanical Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (204, 44, N'214402', N'Mechanical Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (205, 44, N'214403', N'Aeronautical Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (206, 44, N'214404', N'Aeronautical Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (207, 44, N'214405', N'Naval Architect', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (208, 44, N'214406', N'Marine Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (209, 44, N'214407', N'Defence Industry Armament Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (210, 44, N'214408', N'Defence Industry Armament Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (211, 45, N'214501', N'Chemical Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (212, 45, N'214502', N'Chemical Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (213, 45, N'214503', N'Explosives and Dangerous Goods Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (214, 46, N'214601', N'Mining Engineer ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (215, 46, N'214602', N'Mining Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (216, 46, N'214603', N'Metallurgical Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (217, 46, N'214604', N'Metallurgical Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (218, 46, N'214605', N'Metallurgist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (219, 46, N'214607', N'Petroleum Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (220, 47, N'214901', N'Biomedical Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (221, 47, N'214902', N'Explosive Ordnance Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (222, 47, N'214903', N'Marine Salvage Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (223, 47, N'214904', N'Quantity Surveyor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (224, 47, N'214905', N'Agricultural Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (225, 47, N'214906', N'Agricultural Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (226, 47, N'214907', N'Materials Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (227, 47, N'214908', N'Materials Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (228, 47, N'214909', N'Microsystems Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (229, 48, N'215101', N'Electrical Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (230, 48, N'215102', N'Electrical Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (231, 48, N'215103', N'Energy Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (232, 48, N'215104', N'Energy Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (233, 49, N'215201', N'Electronics Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (234, 49, N'215202', N'Electronics Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (235, 50, N'215301', N'Telecommunications Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (236, 50, N'215302', N'Telecommunications Engineering Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (237, 50, N'215303', N'Telecommunications Network Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (238, 50, N'215304', N'Telecommunications Field Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (239, 51, N'216101', N'Architect', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (240, 52, N'216201', N'Landscape Architect', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (241, 53, N'216301', N'Fashion Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (242, 53, N'216302', N'Industrial Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (243, 53, N'216303', N'Jewellery Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (244, 53, N'216304', N'Footwear Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (245, 54, N'216401', N'Urban and Regional Planner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (246, 54, N'216402', N'Transport Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (247, 54, N'216403', N'Marine Spatial Planner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (248, 55, N'216501', N'Cartographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (249, 55, N'216502', N'Surveyor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (250, 56, N'216601', N'Digital Artist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (251, 56, N'216602', N'Illustrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (252, 56, N'216603', N'Multimedia Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (253, 56, N'216604', N'Web Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (254, 57, N'221101', N'General Medical Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (255, 57, N'221102', N'Resident Medical Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (256, 57, N'221103', N'Public Health Physician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (257, 58, N'221201', N'Anaesthetist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (258, 58, N'221202', N'Cardiologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (259, 58, N'221203', N'Emergency Medicine Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (260, 58, N'221204', N'Obstetrician and Gynaecologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (261, 58, N'221205', N'Ophthalmologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (262, 58, N'221206', N'Paediatrician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (263, 58, N'221207', N'Pathologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (264, 58, N'221208', N'Psychiatrist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (265, 58, N'221209', N'Radiologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (266, 58, N'221210', N'General Medicine Specialist Physician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (267, 58, N'221211', N'Surgeon', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (268, 58, N'221212', N'Forensic Pathologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (269, 58, N'221213', N'Radiation Oncologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (270, 58, N'221214', N'Nuclear Medicine Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (271, 58, N'221215', N'Family Physician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (272, 58, N'221216', N'Neurologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (273, 58, N'221217', N'Clinical Pharmacologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (274, 58, N'221218', N'Medical Geneticist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (275, 58, N'221219', N'Plastic and Reconstructive Surgeon', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (276, 58, N'221220', N'Urologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (277, 58, N'221221', N'Public Health Medicine Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (278, 58, N'221222', N'Public Health Occupational Medicine Specialist ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (279, 58, N'221223', N'Paediatric Surgeon', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (280, 58, N'221224', N'Orthopaedic Surgeon', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (281, 58, N'221225', N'Neurosurgeon', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (282, 58, N'221226', N'Otorhinolaryngologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (283, 58, N'221227', N'Dermatologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (284, 59, N'222101', N'Clinical Nurse Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (285, 59, N'222102', N'Aged Care Registered Nurse', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (286, 59, N'222103', N'Registered Nurse (Child and Family Health)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (287, 59, N'222104', N'Registered Nurse (Community Health)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (288, 59, N'222105', N'Registered Nurse (Critical Care and Emergency)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (289, 59, N'222106', N'Registered Nurse (Developmental Disability)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (290, 59, N'222107', N'Registered Nurse (Disability and Rehabilitation)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (291, 59, N'222108', N'Registered Nurse (Medical)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (292, 59, N'222109', N'Registered Nurse (Medical Practice)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (293, 59, N'222110', N'Registered Nurse (Mental Health)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (294, 59, N'222111', N'Registered Nurse (Operating theatre)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (295, 59, N'222112', N'Registered Nurse (Surgical)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (296, 59, N'222113', N'Paediatrics Nurse', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (297, 59, N'222114', N'Nurse Educator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (298, 59, N'222115', N'Nurse Researcher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (299, 59, N'222116', N'Nurse Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (300, 59, N'222117', N'Midwife', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (301, 60, N'222201', N'Midwife', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (302, 61, N'223101', N'Acupuncturist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (303, 61, N'223102', N'Ayurvedic Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (304, 61, N'223103', N'Homoeopath', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (305, 61, N'223104', N'Naturopath', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (306, 61, N'223105', N'Traditional African Medicine Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (307, 61, N'223106', N'Traditional Chinese Medicine Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (308, 61, N'223107', N'Phytotherapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (309, 62, N'224101', N'Paramedical Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (310, 62, N'224102', N'Sports Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (311, 63, N'225101', N'Veterinarian', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (312, 63, N'225102', N'Veterinary Public Health Professional / Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (313, 63, N'225103', N'Livestock Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (314, 64, N'226101', N'Dental Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (315, 64, N'226102', N'Dentist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (316, 65, N'226201', N'Hospital Pharmacist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (317, 65, N'226202', N'Industrial Pharmacist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (318, 65, N'226203', N'Retail Pharmacist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (319, 65, N'226204', N'Authorised Pharmacist Prescriber', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (320, 66, N'226301', N'Environmental Health Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (321, 66, N'226302', N'Safety, Health, Environment and Quality (SHE&Q) Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (322, 66, N'226303', N'Ergonomist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (323, 66, N'226304', N'Food Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (324, 67, N'226401', N'Physiotherapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (325, 68, N'226501', N'Dietitian', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (326, 68, N'226502', N'Nutritionist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (327, 69, N'226601', N'Audiologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (328, 69, N'226602', N'Speech Pathologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (329, 69, N'226603', N'Speech Therapist and Audiologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (330, 69, N'226604', N'Hearing Aid Acousticians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (331, 70, N'226701', N'Optometrist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (332, 70, N'226702', N'Orthoptist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (333, 71, N'226901', N'Arts Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (334, 71, N'226902', N'Occupational Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (335, 71, N'226903', N'Podiatrist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (336, 71, N'226904', N'Diversional Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (337, 71, N'226905', N'Biokineticist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (338, 71, N'226906', N'Rheumatologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (339, 71, N'226907', N'Dermatologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (340, 72, N'231101', N'University Lecturer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (341, 72, N'231102', N'University Tutor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (342, 73, N'232130', N'TVET Educator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (343, 73, N'232131', N'Adult Education Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (344, 73, N'232132', N'Community College Educator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (345, 74, N'233107', N'Senior Secondary School Teacher (Grades 10-12)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (346, 74, N'233108', N'Junior Secondary School Teacher (Grades 8 - 9)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (347, 75, N'234101', N'Foundational Phase School Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (348, 75, N'234102', N'Senior Primary School Teacher (Grades 4-7)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (349, 76, N'234201', N'Early Childhood Development Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (350, 77, N'235101', N'Education or Training Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (351, 77, N'235102', N'Education or Training Reviewer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (352, 78, N'235201', N'Special Needs Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (353, 79, N'235301', N'Teacher of English To Speakers of Other Languages', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (354, 80, N'235401', N'Private Tuition Music Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (355, 81, N'235501', N'Private Tuition Art Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (356, 81, N'235502', N'Private Tuition Dance Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (357, 81, N'235503', N'Private Tuition Drama Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (358, 82, N'235601', N'ICT Trainer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (359, 83, N'235901', N'Private Tuition Dressmaking Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (360, 83, N'235902', N'Private Tuition Handicrafts Teacher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (361, 83, N'235903', N'School Laboratory Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (362, 83, N'235904', N'Examination Supervisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (363, 84, N'241101', N'General Accountant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (364, 84, N'241102', N'Management Accountant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (365, 84, N'241103', N'Tax Professional', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (366, 84, N'241104', N'External Auditor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (367, 84, N'241106', N'Accountant in Practice', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (368, 84, N'241107', N'Financial Accountant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (369, 84, N'241108', N'Forensic Accountant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (370, 85, N'241201', N'Investment Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (371, 85, N'241202', N'Investment Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (372, 85, N'241203', N'Investment Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (373, 85, N'241204', N'Financial Markets Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (374, 85, N'241205', N'Professional Principal Executive Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (375, 86, N'241301', N'Financial Investment Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (376, 87, N'242101', N'Management Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (377, 87, N'242102', N'Organisation and Methods Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (378, 87, N'242103', N'Business Development Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (379, 88, N'242201', N'Intelligence Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (380, 88, N'242202', N'Policy Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (381, 88, N'242203', N'Company Secretary', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (382, 88, N'242204', N'Corporate Treasurer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (383, 88, N'242207', N'Compliance Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (384, 88, N'242208', N'Organisational Risk Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (385, 88, N'242209', N'Accounting Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (386, 88, N'242210', N'Business Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (387, 88, N'242211', N'Internal Auditor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (388, 88, N'242212', N'Diplomat ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (389, 88, N'242213', N'Regulatory Affairs Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (390, 88, N'242214', N'Intellectual Property Special Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (391, 88, N'242215', N'Fraud Examiner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (392, 89, N'242301', N'Career Development Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (393, 89, N'242302', N'Skills Development Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (394, 89, N'242303', N'Human Resource Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (395, 89, N'242304', N'Industrial Relations Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (396, 89, N'242305', N'Occupational Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (397, 89, N'242306', N'Labour Market Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (398, 89, N'242307', N'Recreation Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (399, 90, N'242401', N'Training and Development Professional', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (400, 90, N'242402', N'Occupational Instructor ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (401, 90, N'242403', N'Assessment Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (402, 90, N'242404', N'Student Support Service Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (403, 91, N'243101', N'Advertising Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (404, 91, N'243102', N'Market Research Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (405, 91, N'243103', N'Marketing Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (406, 91, N'243104', N'Market Campaign Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (407, 91, N'243105', N'Business Development Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (408, 92, N'243201', N'Communication Coordinator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (409, 92, N'243202', N'Communication Strategist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (410, 92, N'243203', N'Corporate Communication Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (411, 92, N'243204', N'Event Producer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (412, 93, N'243301', N'Industrial Products Sales Representative ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (413, 93, N'243302', N'Medical and Pharmaceutical Products Sales Representative ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (414, 93, N'243303', N'Educational Products and Services Sales Representative ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (415, 93, N'243304', N'Printing and Publishing Equipment Sales Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (416, 94, N'243401', N'ICT Account Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (417, 94, N'243402', N'ICT Business Development Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (418, 94, N'243403', N'ICT Sales Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (419, 95, N'251101', N'ICT Systems Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (420, 96, N'251201', N'Software Developer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (421, 96, N'251202', N'Programmer Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (422, 96, N'251203', N'Developer Programmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (423, 97, N'251301', N'Multimedia Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (424, 97, N'251302', N'Web Developer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (425, 98, N'251401', N'Applications Programmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (426, 99, N'251901', N'Computers Quality Assurance Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (427, 100, N'252101', N'Database Designer and Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (428, 101, N'252201', N'Systems Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (429, 102, N'252301', N'Computer Network and Systems Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (430, 102, N'252302', N'Network Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (431, 102, N'252303', N'`Transmission Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (432, 103, N'252901', N'ICT Security Specialist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (433, 103, N'252902', N'Technical ICT Support Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (434, 104, N'261101', N'Attorney', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (435, 104, N'261102', N'Administrative Lawyer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (436, 104, N'261103', N'Patent Attorney', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (437, 104, N'261104', N'Trade Mark Attorney', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (438, 104, N'261105', N'Tribunal Member', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (439, 104, N'261106', N'Advocate', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (440, 104, N'261107', N'Legal Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (441, 105, N'261201', N'Judge', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (442, 105, N'261202', N'Magistrate', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (443, 106, N'261901', N'Adjudicator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (444, 106, N'261902', N'Legislation Facilitator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (445, 106, N'261903', N'Master of The Court', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (446, 106, N'261904', N'Family Court Registrar', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (447, 106, N'261905', N'Notary', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (448, 107, N'262101', N'Archivist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (449, 107, N'262102', N'Gallery or Museum Curator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (450, 107, N'262103', N'Conservator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (451, 108, N'262201', N'Librarian', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (452, 108, N'262202', N'Information Services Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (453, 109, N'263101', N'Economist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (454, 109, N'263102', N'Economic Reasearch Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (455, 109, N'263104', N'Economic Research Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (456, 110, N'263201', N'Anthropologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (457, 110, N'263202', N'Archaeologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (458, 110, N'263203', N'Geographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (459, 110, N'263204', N'Sociologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (460, 110, N'263205', N'Criminologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (461, 110, N'263206', N'Heritage Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (462, 111, N'263301', N'Genealogist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (463, 111, N'263302', N'Historian', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (464, 111, N'263303', N'Prehistorian', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (465, 111, N'263304', N'Political Scientist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (466, 112, N'263401', N'Clinical Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (467, 112, N'263402', N'Educational Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (468, 112, N'263403', N'Organisational Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (469, 112, N'263404', N'Psychotherapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (470, 112, N'263405', N'Research Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (471, 112, N'263406', N'Sport Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (472, 112, N'263407', N'Counselling Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (473, 112, N'263408', N'Community Psychologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (474, 112, N'263409', N'Psychometrician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (475, 113, N'263501', N'Social Counselling Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (476, 113, N'263502', N'Addictions Counsellor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (477, 113, N'263503', N'Marriage and Family Counsellor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (478, 113, N'263504', N'Rehabilitation Counsellor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (479, 113, N'263505', N'Student Counsellor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (480, 113, N'263506', N'Probation Social Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (481, 113, N'263507', N'Adoption Social Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (482, 113, N'263508', N'Child and Youth Care Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (483, 113, N'263509', N'Parole Board Member', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (484, 113, N'263510', N'Employee Wellness Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (485, 113, N'263511', N'Career Councillor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (486, 113, N'263512', N'Community Development Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (487, 114, N'263601', N'Minister of Religion', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (488, 115, N'264101', N'Author', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (489, 115, N'264102', N'Book or Script Editor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (490, 115, N'264103', N'Technical Writer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (491, 116, N'264201', N'Copywriter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (492, 116, N'264202', N' Editor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (493, 116, N'264203', N'Journalist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (494, 116, N'264204', N'Radio Journalist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (495, 116, N'264205', N'Content Presenter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (496, 116, N'264206', N'Critic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (497, 117, N'264301', N'Interpreter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (498, 117, N'264302', N'Translator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (499, 117, N'264303', N'Linguist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (500, 118, N'265101', N'Painter (Visual Arts)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (501, 118, N'265102', N'Potter or Ceramic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (502, 118, N'265103', N'Sculptor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (503, 118, N'265104', N'Ephemeral Artist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (504, 119, N'265201', N'Composer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (505, 119, N'265202', N'Music Director', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (506, 119, N'265203', N'Musician (Instrumental)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (507, 119, N'265204', N'Singer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (508, 119, N'265205', N'Music Researcher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (509, 119, N'265206', N'Music Copyist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (510, 120, N'265301', N'Dancer or Choreographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (511, 121, N'265401', N'Director (Film, Television, Radio or Stage)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (512, 121, N'265402', N'Director of Photography', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (513, 121, N'265403', N'Film and Video Editor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (514, 121, N'265404', N'Program Director (Television or Radio)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (515, 121, N'265405', N'Technical Director', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (516, 121, N'265406', N'Video Producer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (517, 121, N'265407', N'Police Video Unit Manager and Producer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (518, 121, N'265408', N'Casting Director', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (519, 121, N'265409', N'Film and Television Production Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (520, 121, N'265410', N'Radio or Television Programme Organiser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (521, 121, N'265411', N'Location Manager (Film or Television)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (522, 121, N'265412', N'Media Producer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (523, 122, N'265501', N'Actor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (524, 123, N'265601', N'Radio Presenter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (525, 123, N'265602', N'Television Presenter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (526, 124, N'265901', N'Entertainer or Variety Artist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (527, 124, N'265902', N'Hypnotist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (528, 124, N'265903', N'Public Speaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (529, 124, N'265904', N'Community Arts Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (530, 125, N'311101', N'Chemistry Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (531, 125, N'311102', N'Physical Science Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (532, 125, N'311103', N'Fragrance Evaluators/ flavourists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (533, 125, N'311104', N'Radiation Control/ Nuclear Monitoring Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (534, 126, N'311201', N'Civil Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (535, 126, N'311202', N'Surveying or Cartographic Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (536, 126, N'311203', N'Town Planning Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (537, 126, N'311217', N'Water Control Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (538, 127, N'311301', N'Electrical Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (539, 127, N'311302', N'Electric Substation Operations Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (540, 127, N'311303', N'Energy Efficiency Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (541, 128, N'311401', N'Electronic Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (542, 129, N'311501', N'Mechanical Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (543, 129, N'311502', N'Pressure Equipment  Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (544, 129, N'311503', N'Aeronautical Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (545, 130, N'311601', N'Chemical Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (546, 131, N'311701', N'Mining Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (547, 131, N'311702', N'Metallurgical or Materials Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (548, 131, N'311703', N'Non-Destructive Testing Technician  (NDTT)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (549, 131, N'311704', N'Geophysical Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (550, 132, N'311801', N'Draughtsperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (551, 133, N'311901', N'Forensic Technician (Biology, Toxicology)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (552, 133, N'311902', N'Fire Investigator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (553, 133, N'311903', N'Food and Beverage Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (554, 133, N'311904', N'Manufacturing Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (555, 133, N'311905', N'Industrial Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (556, 133, N'311906', N'Environmental Engineering Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (557, 133, N'311910', N'Food Laboratory Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (558, 134, N'312101', N'Mining Production Supervisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (559, 134, N'312102', N'Miner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (560, 134, N'312103', N'Engineering Supervisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (561, 135, N'312201', N'Production / Operations Supervisor (Manufacturing)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (562, 135, N'312202', N'Maintenance Planner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (563, 136, N'312301', N'Building Associate', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (564, 137, N'313102', N'Fossil Power Plant Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (565, 137, N'313103', N'Hydro Power Plant Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (566, 137, N'313104', N'Nuclear Power Plant Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (567, 137, N'313105', N'Wind Turbine Power Plant Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (568, 137, N'313106', N'Concentrated Solar Power (CSP) Plant Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (569, 137, N'313107', N'Geothermal Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (570, 137, N'313108', N'Weatherisation Installers and Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (571, 137, N'313109', N'Solar Photovoltaic Service Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (572, 137, N'313110', N'Wind Turbine Service Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (573, 138, N'313201', N'Water Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (574, 138, N'313202', N'Waste Materials Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (575, 138, N'313203', N'Water Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (576, 138, N'313205', N'Water Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (577, 139, N'313301', N'Chemical Plant Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (578, 140, N'313401', N'Gas or Petroleum Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (579, 141, N'313501', N'Metal Manufacturing Process Control Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (580, 142, N'313901', N'Integrated Manufacturing Line Process Control Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (581, 142, N'313902', N'Wood Processing Control Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (582, 142, N'313903', N'Clothing, Textile and Footwear Manufacturing Process Control Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (583, 142, N'313905', N'Cotton Ginning Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (584, 142, N'313906', N'Fresh Produce Packing Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (585, 142, N'313907', N'Food and Beverage Manufacturing Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (586, 142, N'313908', N'Sugar Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (587, 142, N'313909', N'Miller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (588, 142, N'313910', N'Juice Extraction Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (589, 142, N'313911', N'Grain Handling Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (590, 142, N'313912', N'Mineral Beneficiation Process Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (591, 142, N'313913', N'Chemical Waste Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (592, 142, N'313916', N'Manufacturing Production Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (593, 142, N'313917', N'Pulp and Paper Manufacturing Process Control Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (594, 143, N'314101', N'Life Science Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (595, 143, N'314102', N'Environmental Science Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (596, 144, N'314201', N'Agricultural Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (597, 145, N'314301', N'Forestry Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (598, 145, N'314302', N'Forestry Research Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (599, 146, N'315101', N'Marine Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (600, 147, N'315201', N'Ship''s Master', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (601, 147, N'315202', N'Ship''s Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (602, 147, N'315203', N'Ship''s Surveyor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (603, 147, N'315204', N'Marine Certification & Surveillance Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (604, 147, N'315205', N'Boat Driver / Coxswain', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (605, 147, N'315206', N'Aids to Navigation Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (606, 147, N'315207', N'Aids to Navigation Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (607, 148, N'315301', N'Aircraft Navigator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (608, 148, N'315302', N'Flight Engineer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (609, 148, N'315303', N'Aeroplane Pilot', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (610, 148, N'315304', N'Flying Instructor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (611, 148, N'315305', N'Helicopter Pilot', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (612, 148, N'315306', N'Balloonist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (613, 149, N'315401', N'Traffic Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (614, 150, N'315501', N'Airborne Electronics Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (615, 150, N'315502', N'Airworthiness Surveyor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (616, 151, N'321101', N'Medical Diagnostic Radiographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (617, 151, N'321102', N'Medical Radiation Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (618, 151, N'321103', N'Nuclear Medicine Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (619, 151, N'321104', N'Sonographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (620, 151, N'321105', N'Anaesthetic Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (621, 151, N'321106', N'Cardiac Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (622, 151, N'321107', N'Operating Theatre Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (623, 151, N'321108', N'Audiometrist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (624, 151, N'321109', N'Dialysis Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (625, 151, N'321110', N'Neurophysiological Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (626, 151, N'321111', N'Renal Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (627, 151, N'321112', N'Intensive Care Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (628, 151, N'321113', N'Orthopaedic Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (629, 151, N'321114', N'Health Technical Support Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (630, 151, N'321115', N'Medical Electronic Equipment Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (631, 151, N'321116', N'Electroencephalographic Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (632, 151, N'321117', N'Radiation Laboratory Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (633, 151, N'321118', N'Orthotist or Prosthetist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (634, 151, N'321119', N'Pulmonology Clinical Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (635, 151, N'321120', N'Reproductive Biology Clinical Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (636, 151, N'321121', N'Cardiothoracic Perfusion Clinical Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (637, 151, N'321122', N'Occupational Therapy Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (638, 151, N'321123', N'Orientation and Mobility Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (639, 152, N'321201', N'Medical Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (640, 152, N'321206', N'Medical Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (641, 153, N'321301', N'Pharmacy Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (642, 154, N'321401', N'Clinical Dental Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (643, 154, N'321402', N'Dental Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (644, 154, N'321403', N'Dental Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (645, 154, N'321405', N'Orthotic and Prosthetic Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (646, 154, N'321406', N'Dental Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (647, 155, N'322101', N'Enrolled Nurse', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (648, 155, N'322102', N'Mother Craft Nurse', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (649, 156, N'322201', N'Assistant Midwife', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (650, 157, N'323101', N'Indigenous Heath Worker (Inyanga)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (651, 157, N'323102', N'Ancillary Health Care Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (652, 157, N'323103', N'Therapeutic Massage Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (653, 157, N'323104', N'Therapeutic Massage Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (654, 157, N'323105', N'Therapeutic Aromatherapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (655, 157, N'323106', N'Therapeutic Reflexologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (656, 158, N'324101', N'Veterinary Nurse', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (657, 158, N'324102', N'Veterinary Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (658, 158, N'324103', N'Veterinary Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (659, 159, N'325101', N'Dental Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (660, 159, N'325102', N'Oral Hygienist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (661, 159, N'325103', N'Dental Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (662, 160, N'325201', N'Health Information Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (663, 161, N'325301', N'Health Promotion Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (664, 162, N'325401', N'Dispensing Optician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (665, 163, N'325501', N'Massage Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (666, 163, N'325502', N'Hydrotherapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (667, 163, N'325503', N'Electrotherapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (668, 163, N'325504', N'Physiotherapy Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (669, 164, N'325601', N'Clinical Associate', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (670, 165, N'325701', N'Environmental and Occupational Health Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (671, 165, N'325702', N'Marine Safety Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (672, 165, N'325703', N'Agricultural / Horticultural Produce Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (673, 165, N'325704', N'Aquaculture Produce Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (674, 165, N'325705', N'Safety Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (675, 165, N'325706', N'Ammunition Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (676, 165, N'325707', N'Mine Health and Safety Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (677, 165, N'325708', N'Magazine Master', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (678, 166, N'325801', N'Ambulance Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (679, 166, N'325802', N'Intensive Care Ambulance Paramedic / Ambulance Paramedic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (680, 167, N'325901', N'Chiropractor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (681, 167, N'325902', N'Osteopath', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (682, 168, N'331101', N'Securities Dealer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (683, 168, N'331105', N'Asset Swap Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (684, 168, N'331106', N'Financial Markets Settlement Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (685, 169, N'331201', N'Credit or Loans Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (686, 169, N'331204', N'False Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (687, 169, N'331205', N'Business Banker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (688, 170, N'331301', N'Bookkeeper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (689, 170, N'331302', N'Accounting Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (690, 170, N'331303', N'Tax Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (691, 171, N'331401', N'Statistical and Mathematical Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (692, 172, N'331501', N'Valuer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (693, 172, N'331502', N'Insurance Investigator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (694, 172, N'331503', N'Insurance Loss Adjuster', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (695, 172, N'331504', N'Insurance Risk Surveyor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (696, 172, N'331505', N'Vehicle Damage Quantifier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (697, 173, N'332101', N'Insurance Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (698, 173, N'332102', N'Insurance Broker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (699, 174, N'332201', N'Commercial Sales Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (700, 174, N'332202', N'Sales Representative (Building and Plumbing Supplies)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (701, 174, N'332203', N'Sales Representative (Personal and Household Goods)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (702, 174, N'332204', N'Commercial Services Sales Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (703, 174, N'332205', N'Manufacturers Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (704, 174, N'332206', N'Sales Representative (Photographic Equipment and Supplies)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (705, 174, N'332207', N'Chemical Sales Representative', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (706, 174, N'332208', N'Pharmacy Sales Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (707, 175, N'332301', N'Retail Buyer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (708, 175, N'332302', N'Purchasing Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (709, 176, N'332401', N'Commodities Trader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (710, 176, N'332402', N'Finance Broker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (711, 177, N'333101', N'Clearing and Forwarding Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (712, 178, N'333201', N'Events Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (713, 179, N'333301', N'Recruitment Consultant / Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (714, 179, N'333302', N'Labour Recruitment Consultant: Permanent Employment Agency (PEA)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (715, 179, N'333303', N'Labour Recruitment Consultant: Temporary Employment Services (TES)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (716, 180, N'333401', N'Property Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (717, 180, N'333402', N'Real Estate Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (718, 180, N'333404', N'Real Estate Sales Settlement Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (719, 180, N'333405', N'Real Estate Agency Principal ', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (720, 180, N'333406', N'Property Lease Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (721, 181, N'333901', N'Auctioneer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (722, 181, N'333902', N'Special Services Contracting Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (723, 181, N'333903', N'Sales Representative (Business Services)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (724, 181, N'333904', N'Business Broker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (725, 181, N'333905', N'Supply Chain Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (726, 181, N'333906', N'Stock and Station Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (727, 181, N'333907', N'Property Portfolio and Asset Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (728, 181, N'333908', N'Marketing Coordinator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (729, 181, N'333909', N'Bid Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (730, 181, N'333910', N'Business Support Coordinator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (731, 181, N'333911', N'Physical Asset Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (732, 182, N'334101', N'Office Supervisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (733, 182, N'334102', N'Office Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (734, 182, N'334103', N'Call Centre Team Leader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (735, 183, N'334201', N'Legal Secretary', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (736, 184, N'334301', N'Secretary Bargaining Council', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (737, 184, N'334302', N'Personal Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (738, 185, N'334401', N'Medical Secretary', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (739, 186, N'335101', N'Customs Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (740, 186, N'335102', N'Immigration Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (741, 187, N'335201', N'Taxation Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (742, 188, N'335301', N'Social Security Assessor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (743, 189, N'335401', N'Motor Vehicle Licence Examiner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (744, 189, N'335402', N'Import-export Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (745, 189, N'335403', N'Passport Officer (Issuing)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (746, 190, N'335501', N'Detective', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (747, 191, N'335901', N'Labour Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (748, 191, N'335902', N'Wage Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (749, 191, N'335903', N'Refugee Status Determination Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (750, 191, N'335904', N'Pest Management Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (751, 191, N'335905', N'Water Allocation Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (752, 191, N'335906', N'Environmental Practices Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (753, 191, N'335907', N'Weights and Measures Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (754, 191, N'335908', N'Censorship Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (755, 191, N'335909', N'Price Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (756, 191, N'335910', N'Trade Mark Examiner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (757, 191, N'335911', N'Quarantine Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (758, 191, N'335912', N'Fisheries Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (759, 191, N'335913', N'Building Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (760, 191, N'335914', N'Train Examiner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (761, 191, N'335915', N'Transport Operations Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (762, 191, N'335916', N'Gaming Operations Compliance Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (763, 192, N'341101', N'Conveyancer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (764, 192, N'341102', N'Legal Executive', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (765, 192, N'341103', N'Paralegal', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (766, 192, N'341104', N'Clerk of Court', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (767, 192, N'341105', N'Court Bailiff', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (768, 192, N'341106', N'Court Orderly / Court Registry Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (769, 192, N'341107', N'Law Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (770, 192, N'341108', N'Trust Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (771, 192, N'341109', N'Private Investigator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (772, 192, N'341110', N'Associate Legal Professional', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (773, 192, N'341111', N'Debt Counsellor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (774, 192, N'341112', N'Labour Dispute Enforcement Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (775, 193, N'341201', N'Auxiliary Community Development Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (776, 193, N'341202', N'Disabilities Services Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (777, 193, N'341203', N'Social Auxiliary Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (778, 193, N'341204', N'Auxiliary Child and Youth Care Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (779, 194, N'341301', N'Religious Associate Professional', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (780, 195, N'342101', N'Footballer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (781, 195, N'342102', N'Golfer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (782, 195, N'342103', N'Jockey', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (783, 195, N'342104', N'Cricketer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (784, 195, N'342105', N'Athlete', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (785, 195, N'342106', N'Boxer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (786, 195, N'342107', N'Cyclist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (787, 195, N'342108', N'Racing Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (788, 195, N'342109', N'Surfer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (789, 195, N'342110', N'Swimmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (790, 195, N'342111', N'Tennis Player', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (791, 195, N'342112', N'Wrestler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (792, 195, N'342113', N'Yachtsman', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (793, 195, N'342114', N'Other Sportsperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (794, 196, N'342201', N'Sports Development Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (795, 196, N'342202', N'Sports Umpire', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (796, 196, N'342203', N'Sports Official', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (797, 196, N'342204', N'Sports Coach or Instructor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (798, 197, N'342301', N'Fitness Instructor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (799, 197, N'342302', N'Outdoor Adventure Guide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (800, 197, N'342303', N'Caving Guide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (801, 198, N'343101', N'Photographer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (802, 198, N'343102', N'Air Observer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (803, 199, N'343201', N'Interior Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (804, 199, N'343202', N'Interior Decorator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (805, 199, N'343203', N'Visual Merchandiser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (806, 199, N'343204', N'Set Designer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (807, 200, N'343301', N'Gallery or Museum Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (808, 200, N'343302', N'Library Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (809, 201, N'343401', N'Chef', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (810, 202, N'343901', N'Tattoo Artist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (811, 202, N'343902', N'Light Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (812, 202, N'343903', N'Stage Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (813, 202, N'343904', N'Theatrical Dresser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (814, 202, N'343905', N'Stunt Person', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (815, 202, N'343906', N'Special Effects Person', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (816, 202, N'343907', N'Continuity Person', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (817, 202, N'343908', N'Film Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (818, 202, N'343909', N'Microphone Boom Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (819, 202, N'343910', N'Performing Arts Road Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (820, 203, N'351101', N'Computer Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (821, 204, N'351201', N'ICT Communications Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (822, 205, N'351301', N'Computer Network Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (823, 205, N'351302', N'Geographic Information Systems Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (824, 205, N'351303', N'Marine GIS Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (825, 206, N'351401', N'Web Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (826, 207, N'352101', N'Broadcast Transmitter Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (827, 207, N'352102', N'Camera Operator (Film, Television or Video)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (828, 207, N'352103', N'Sound Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (829, 207, N'352104', N'Television Equipment Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (830, 207, N'352105', N'Radio Station Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (831, 207, N'352106', N'Production Assistant (Film, Television or Radio)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (832, 208, N'352201', N'Telecommunications Technical Officer or Technologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (833, 209, N'411101', N'General Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (834, 209, N'411102', N'Back Office Process Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (835, 209, N'411103', N'Parole Board Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (836, 210, N'412101', N'Secretary (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (837, 211, N'413101', N'Word Processing Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (838, 211, N'413102', N'Machine Shorthand Reporter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (839, 212, N'413201', N'Data Entry Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (840, 213, N'421101', N'Bank Teller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (841, 213, N'421102', N'Bank Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (842, 213, N'421103', N'Currency Exchange Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (843, 213, N'421104', N'Banknote Processor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (844, 213, N'421105', N'Postal Frontline Service Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (845, 214, N'421201', N'Bookmaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (846, 214, N'421202', N'Gaming Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (847, 214, N'421203', N'Betting Agency Counter Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (848, 214, N'421204', N'Bookmaker''s Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (849, 214, N'421205', N'Telephone Betting Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (850, 214, N'421206', N'Bingo Caller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (851, 214, N'421207', N'Lotto Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (852, 215, N'421301', N'Pawnbrokers and Money-lenders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (853, 216, N'421401', N'Debt Collector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (854, 217, N'422101', N'Tourist Information Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (855, 217, N'422102', N'Travel Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (856, 218, N'422201', N'Inbound Contact Centre Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (857, 218, N'422202', N'Outbound Contact Centre Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (858, 218, N'422203', N'Contact Centre Real Time Advisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (859, 218, N'422204', N'Contact Centre Resource Planner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (860, 218, N'422205', N'Contact Centre Forecast Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (861, 218, N'422206', N'Call or Contact Centre Agent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (862, 219, N'422301', N'Switchboard Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (863, 220, N'422401', N'Hotel or Motel Receptionist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (864, 221, N'422501', N'Enquiry Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (865, 222, N'422601', N'Receptionist (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (866, 222, N'422602', N'Medical Receptionist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (867, 223, N'422701', N'Survey Interviewer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (868, 224, N'422901', N'Admissions Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (869, 224, N'422902', N'Ship''s Purser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (870, 225, N'431101', N'Accounts Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (871, 225, N'431102', N'Cost Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (872, 225, N'431103', N'Taxation Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (873, 226, N'431201', N'Insurance Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (874, 226, N'431202', N'Securities Services Administrative Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (875, 226, N'431203', N'Statistical Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (876, 226, N'431204', N'Insurance Claims Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (877, 227, N'431301', N'Payroll Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (878, 228, N'432101', N'Stock Clerk / Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (879, 228, N'432102', N'Dispatching and Receiving Clerk / Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (880, 228, N'432103', N'Order Clerk / Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (881, 228, N'432104', N'Warehouse Administrator / Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (882, 228, N'432105', N'Lampman', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (883, 229, N'432201', N'Production Coordinator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (884, 230, N'432301', N'Transport Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (885, 231, N'441101', N'Library Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (886, 232, N'441201', N'Courier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (887, 232, N'441202', N'Postal Delivery Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (888, 232, N'441203', N'Mail Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (889, 233, N'441301', N'Coding Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (890, 233, N'441302', N'Proof Reader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (891, 234, N'441401', N'Scribe', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (892, 235, N'441501', N'Filing or Registry Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (893, 235, N'441502', N'Office Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (894, 236, N'441601', N'Human Resources Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (895, 236, N'441602', N'Skills Development Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (896, 236, N'441603', N'Compensation and Benefits Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (897, 236, N'441604', N'Labour Relations Case Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (898, 236, N'441605', N'Academic Administrative Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (899, 237, N'441901', N'Classified Advertising Clerk', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (900, 237, N'441902', N'Contract Administrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (901, 237, N'441903', N'Program or Project Administrators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (902, 237, N'441905', N'Account Clerk (Public Relations / Communication)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (903, 238, N'511101', N'Flight Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (904, 238, N'511102', N'Bus Hostess', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (905, 238, N'511103', N'Marine Steward', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (906, 238, N'511104', N'Railway Steward', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (907, 239, N'511201', N'Transport Conductor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (908, 240, N'511301', N'Gallery or Museum Guide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (909, 240, N'511302', N'Tour Guide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (910, 241, N'512101', N'Cook', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (911, 242, N'513101', N'Waiter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (912, 242, N'513102', N'Cafe Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (913, 243, N'513201', N'Bar Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (914, 243, N'513202', N'Barista', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (915, 244, N'514101', N'Hairdresser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (916, 244, N'514102', N'Hair or Beauty Salon Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (917, 245, N'514201', N'Skin Care Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (918, 245, N'514202', N'Body Therapist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (919, 245, N'514203', N'Hair Removal Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (920, 245, N'514204', N'Nail Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (921, 245, N'514205', N'Make Up Artist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (922, 245, N'514206', N'Weight Loss Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (923, 245, N'514207', N'Somatologist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (924, 246, N'515101', N'Hotel Service Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (925, 246, N'515102', N'Housekeeping Service Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (926, 246, N'515103', N'Commercial Housekeeper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (927, 246, N'515104', N'Cleaning Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (928, 247, N'515201', N'Domestic Housekeeper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (929, 247, N'515202', N'Butler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (930, 248, N'515301', N'Caretaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (931, 248, N'515302', N'Amusement, Fitness or Sport Centre Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (932, 249, N'516101', N'Astrologer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (933, 250, N'516201', N'Escort', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (934, 251, N'516301', N'Funeral Director', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (935, 251, N'516302', N'Chapel or Memorial Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (936, 251, N'516303', N'Embalmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (937, 251, N'516304', N'Mortician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (938, 251, N'516305', N'Mortuary Technician / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (939, 251, N'516306', N'Crematorium Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (940, 252, N'516401', N'Animal Attendant / Groomer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (941, 252, N'516402', N'Animal Trainer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (942, 252, N'516403', N'Zookeeper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (943, 252, N'516404', N'Dog Walker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (944, 253, N'516501', N'Driving Instructor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (945, 254, N'516901', N'Refuge Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (946, 254, N'516902', N'Civil Celebrant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (947, 255, N'521101', N'Street Market Vendor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (948, 256, N'521201', N'Street Food Sales Person', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (949, 256, N'521202', N'Cash Van Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (950, 257, N'522101', N'Antique Dealer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (951, 257, N'522102', N'Salon Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (952, 258, N'522201', N'Retail Supervisor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (953, 259, N'522301', N'Sales Assistant (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (954, 259, N'522302', N'Motorised Vehicle or Caravan Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (955, 259, N'522303', N'Automotive Parts Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (956, 259, N'522304', N'ICT Sales Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (957, 260, N'523101', N'Checkout Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (958, 260, N'523102', N'Office Cashier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (959, 260, N'523103', N'Ticket Seller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (960, 261, N'524101', N'Model', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (961, 261, N'524102', N'Event Stylist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (962, 262, N'524201', N'Sales Demonstrator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (963, 263, N'524301', N'Door-to-door Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (964, 264, N'524401', N'Call Centre Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (965, 265, N'524501', N'Service Station Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (966, 266, N'524601', N'Food Service Counter Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (967, 267, N'524901', N'Materials Recycler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (968, 267, N'524902', N'Rental Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (969, 267, N'524903', N'Sales Clerk / Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (970, 267, N'524904', N'Energy Broker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (971, 268, N'531101', N'Child Care Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (972, 268, N'531102', N'Family Day Care Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (973, 268, N'531103', N'Nanny', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (974, 268, N'531104', N'Out of School Hours Care Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (975, 268, N'531105', N'Child or Youth Residential Care Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (976, 268, N'531106', N'Hostel Parent', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (977, 269, N'531201', N'Teachers'' Aide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (978, 269, N'531202', N'Pre-School Aide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (979, 269, N'531203', N'Integration Aide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (980, 271, N'532201', N'Residential Care Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (981, 271, N'532202', N'Aged or Disabled Carer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (982, 271, N'532203', N'Community Health Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (983, 272, N'532901', N'First Aid Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (984, 272, N'532902', N'Hospital Orderly', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (985, 272, N'532903', N'Nursing Support Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (986, 272, N'532904', N'Personal Care Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (987, 272, N'532905', N'Therapy Aide', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (988, 272, N'532906', N'Natural Remedy Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (989, 273, N'541101', N'Fire Fighter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (990, 273, N'541102', N'Hazardous Materials Removal Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (991, 274, N'541201', N'Traffic Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (992, 274, N'541202', N' Non - commissioned Police Official', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (993, 274, N'541203', N'Military Police Official', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (994, 275, N'541301', N'Prison Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (995, 276, N'541401', N'Security Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (996, 276, N'541402', N'Alarm, Security or Surveillance Monitor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (997, 276, N'541403', N'Retail Loss Prevention Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (998, 277, N'541501', N'Intelligence Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (999, 278, N'541901', N'Lifeguard', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1000, 278, N'541902', N'Emergency Service and Rescue Official', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1001, 278, N'541903', N'Parking Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1002, 278, N'541904', N'Armoured Car Escort', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1003, 278, N'541905', N'Crowd Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1004, 278, N'541906', N'Security Consultant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1005, 278, N'541907', N'Disaster Management Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1006, 279, N'542101', N'Naval Combat Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1007, 279, N'542102', N'Naval Combat Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1008, 280, N'542201', N'Special Forces Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1009, 280, N'542202', N'Special Forces Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1010, 280, N'542203', N'Special Forces Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1011, 281, N'542301', N'Infantry Soldier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1012, 281, N'542302', N'Artillery Soldier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1013, 281, N'542303', N'Air Defence Artillery Soldier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1014, 281, N'542304', N'Armour Soldier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1015, 281, N'542305', N'Engineer Soldier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1016, 281, N'542306', N'Signal Soldier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1017, 282, N'542401', N'Combat Medical Support Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1018, 283, N'542501', N'Air Operations Officer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1019, 284, N'611101', N'Agronomy Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1020, 284, N'611102', N'Field Vegetable Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1021, 285, N'611201', N'Arboriculture Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1022, 285, N'611202', N'Horticultural Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1023, 286, N'611301', N'Ornamental Horticultural Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1024, 286, N'611302', N'Landscape Gardener', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1025, 286, N'611303', N'Green Keeper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1026, 286, N'611304', N'Nurseryperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1027, 287, N'611401', N'Mixed Crop Farm Production Manager / Foreman', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1028, 288, N'612101', N'Livestock Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1029, 288, N'612102', N'Dairy Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1030, 289, N'612201', N'Poultry Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1031, 289, N'612202', N'Ratites Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1032, 290, N'612301', N'Insect Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1033, 291, N'612901', N'Avian Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1034, 291, N'612902', N'Game Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1035, 292, N'613101', N'Mixed Crop and Livestock Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1036, 293, N'621101', N'Tree Feller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1037, 293, N'621102', N'Forest and Conservation Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1038, 294, N'622101', N'Aquaculture Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1039, 294, N'622102', N'Mariculture Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1040, 295, N'622201', N'Skipper (Fishing Boat)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1041, 296, N'622301', N'Master Fisher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1042, 297, N'622401', N'Hunter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1043, 298, N'631101', N'Subsistence Crop Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1044, 299, N'631201', N'Subsistence Livestock Farmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1045, 300, N'631301', N'Subsistence Mixed Crop and Livestock Farmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1046, 302, N'641101', N'House Builder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1047, 303, N'641201', N'Bricklayer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1048, 304, N'641301', N'Stonemason', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1049, 304, N'641302', N'Granite Cutter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1050, 304, N'641303', N'Refractory Mason', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1051, 305, N'641401', N'Concreter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1052, 305, N'641402', N'Fibre-cement Moulder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1053, 305, N'641403', N'Civil Engineering Constructor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1054, 306, N'641501', N'Carpenter and Joiner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1055, 306, N'641502', N'Carpenter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1056, 306, N'641503', N'Joiner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1057, 307, N'641901', N'Demolition Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1058, 307, N'641902', N'Scaffolder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1059, 307, N'641903', N'Falseworker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1060, 308, N'642101', N'Roof Tiler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1061, 308, N'642102', N'Roof Plumber', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1062, 308, N'642103', N'Roof Thatcher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1063, 309, N'642201', N'Wall and Floor Tiler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1064, 309, N'642202', N'Floor Finisher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1065, 310, N'642301', N'Fibrous Plasterer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1066, 310, N'642302', N'Plasterer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1067, 311, N'642401', N'Insulation Installer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1068, 312, N'642501', N'Glazier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1069, 313, N'642601', N'Plumber', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1070, 313, N'642602', N'Solar Installer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1071, 313, N'642603', N'Gas Practitioner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1072, 313, N'642604', N'Fire Services Plumber', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1073, 313, N'642605', N'Plumbing Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1074, 313, N'642606', N'Heat Pump Installer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1075, 313, N'642607', N'Pipe Fitter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1076, 314, N'642701', N'Air-conditioning and Refrigeration Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1077, 314, N'642702', N'Refrigeration Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1078, 315, N'643101', N'Painter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1079, 316, N'643201', N'Industrial Spraypainter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1080, 316, N'643202', N'Vehicle Painter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1081, 317, N'643302', N'Chimney Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1082, 318, N'651101', N'Moulder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1083, 319, N'651201', N'Pressure Welder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1084, 319, N'651202', N'Welder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1085, 319, N'651203', N'Fitter-welder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1086, 319, N'651204', N'Gas Cutter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1087, 320, N'651301', N'Sheet Metal Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1088, 320, N'651302', N'Boiler Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1089, 321, N'651401', N'Metal Fabricator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1090, 321, N'651402', N'Structural Steel Erector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1091, 321, N'651403', N'Steel Fixer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1092, 321, N'651404', N'Structural Plater', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1093, 322, N'651501', N'Rigger', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1094, 322, N'651502', N'Cable and Rope Splicer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1095, 323, N'652101', N'Blacksmith', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1096, 323, N'652102', N'Forging Press Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1097, 324, N'652201', N'Toolmaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1098, 324, N'652202', N'Gunsmith', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1099, 324, N'652203', N'Locksmith', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1100, 324, N'652204', N'Patternmaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1101, 324, N'652205', N'Master Toolmaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1102, 324, N'652206', N'Die Sinker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1103, 325, N'652301', N'Metal Machinist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1104, 325, N'652302', N'Fitter and Turner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1105, 326, N'652401', N'Metal Polisher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1106, 326, N'652402', N'Tool Grinder and Sharpener', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1107, 326, N'652403', N'Saw Maker and Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1108, 326, N'652404', N'Grinder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1109, 327, N'653101', N'Automotive Motor Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1110, 327, N'653103', N'Motorcycle Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1111, 327, N'653109', N'Automotive Engine Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1112, 328, N'653201', N'Aircraft Maintenance Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1113, 328, N'653202', N'Aircraft Structures Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1114, 329, N'653301', N'Industrial Machinery Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1115, 329, N'653302', N'Mechanical Equipment Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1116, 329, N'653303', N'Mechanical Fitter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1117, 329, N'653304', N'Diesel Fitter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1118, 329, N'653305', N'Small Engine Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1119, 329, N'653306', N'Diesel Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1120, 329, N'653307', N'Heavy Equipment Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1121, 329, N'653308', N'Tractor Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1122, 329, N'653309', N'Forklift Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1123, 329, N'653310', N'Lubrication Equipment Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1124, 330, N'653401', N'Bicycle Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1125, 330, N'653402', N'Non-motorised Transport Equipment Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1126, 331, N'661101', N'Precision Instrument Maker and Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1127, 331, N'661102', N'Watch and Clock Maker and Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1128, 331, N'661103', N'Scale Fitter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1129, 332, N'661201', N'Musical Instrument Maker or Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1130, 333, N'661301', N'Goldsmith', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1131, 333, N'661302', N'Diamond and Gemstone Setter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1132, 333, N'661303', N'Jewellery Evaluator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1133, 333, N'661304', N'Diamond Sorter and Evaluator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1134, 334, N'661401', N'Potter or Ceramic Artist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1135, 335, N'661501', N'Glass Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1136, 335, N'661502', N'Optical Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1137, 336, N'661601', N'Signwriter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1138, 336, N'661602', N'Engraver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1139, 337, N'661701', N'Basket, Cane and Wicker Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1140, 337, N'661702', N'Carver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1141, 337, N'661703', N'Cane Furniture Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1142, 338, N'661801', N'Textile, Leather and Related Materials Handicraft Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1143, 339, N'661901', N'Metal Toymaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1144, 340, N'662101', N'Electronic Pre-press', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1145, 340, N'662104', N'Electronic Originator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1146, 340, N'662105', N'Gravure Cylinder Preparation Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1147, 340, N'662106', N'Process Engraver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1148, 340, N'662107', N'Printing Plate Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1149, 341, N'662201', N'Printing Machinist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1150, 341, N'662202', N'Small Offset Lithography Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1151, 341, N'662203', N'Screen Printer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1152, 341, N'662204', N'Paper Sheetfed Offset Lithography Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1153, 341, N'662205', N'Metal Sheetfed Offset Lithography Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1154, 341, N'662206', N'Continuous Stationery Printing Machine Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1155, 341, N'662207', N'Monoblock Offset Machine Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1156, 341, N'662208', N'Roll Label Machine Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1157, 341, N'662209', N'Gravure Printing Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1158, 341, N'662210', N'Heatset Rotary Offset Lithography Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1159, 341, N'662211', N'Coldset Rotary Offset Lithographic Printing Technician (Coldset)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1160, 341, N'662212', N'Rotary Printing and Re-reeling Flexographic Machine Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1161, 341, N'662213', N'Rotary Printing and Re-reeling Gravure Machine Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1162, 341, N'662215', N'Stationery Machine Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1163, 341, N'662216', N'Commercial Digital Printer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1164, 342, N'662301', N'Mechanized soft-cover bookbinding technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1165, 342, N'662303', N'Mechanised Bookbinding Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1166, 342, N'662304', N'Craft Bookbinding Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1167, 342, N'662305', N'Mechanised Hard-cover Bookbinding Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1168, 342, N'662307', N'Folding Machine Operator (Paper Products)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1169, 342, N'662308', N'Saddle Stitch Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1170, 342, N'662309', N'Adhesive Binding Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1171, 342, N'662310', N'Book Sewing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1172, 342, N'662311', N'Gathering Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1173, 342, N'662312', N'Commercial Mailing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1174, 342, N'662313', N'Newspaper and Magazine Mailroom Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1175, 342, N'662314', N'Envelope Manufacturing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1176, 342, N'662315', N'Coating Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1177, 342, N'662316', N'Foiling Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1178, 342, N'662317', N'Roll Label Rewind Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1179, 343, N'671101', N'Electrician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1180, 343, N'671102', N'Electrical Installation Inspector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1181, 344, N'671202', N'Millwright', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1182, 344, N'671203', N'Mechatronics Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1183, 344, N'671204', N'Lift Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1184, 344, N'671205', N'Weapon Systems Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1185, 344, N'671206', N'Electrical Equipment Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1186, 344, N'671207', N'Armature Winder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1187, 344, N'671208', N'Transportation Electrician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1188, 345, N'671301', N'Electrical Line Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1189, 345, N'671302', N'Cable Jointer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1190, 346, N'672101', N'Avionics Mechanician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1191, 346, N'672102', N'Radar Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1192, 346, N'672103', N'Business Machine Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1193, 346, N'672104', N'Electronic Equipment Mechanician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1194, 346, N'672105', N'Instrument Mechanician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1195, 346, N'672107', N'Special Class Electrician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1196, 346, N'672108', N'Radiotrician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1197, 347, N'672201', N'Data and Telecommunications Cabler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1198, 347, N'672202', N'Telecommunications Cable Jointer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1199, 347, N'672203', N'Computer Engineering Mechanic / Service Person', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1200, 347, N'672204', N'Telecommunications Line Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1201, 347, N'672205', N'Telecommunications Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1202, 347, N'672206', N'Communications Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1203, 348, N'681101', N'Slaughterer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1204, 348, N'681102', N'Red Meat De-boner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1205, 348, N'681103', N'Butcher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1206, 348, N'681104', N'Fishmonger', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1207, 348, N'681105', N'Poultry Slaughterer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1208, 349, N'681201', N'Confectionary Baker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1209, 349, N'681202', N'Pastry Cook', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1210, 349, N'681203', N'Confectionery Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1211, 350, N'681301', N'Dairyman', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1212, 351, N'681401', N'Fruit or Vegetable Preserver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1213, 351, N'681402', N'Oil Expeller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1214, 351, N'681403', N'Jam Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1215, 352, N'681501', N'Cheese Grader / Tester', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1216, 352, N'681502', N'Food Taster / Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1217, 352, N'681503', N'Tea Taster / Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1218, 352, N'681504', N'Wine Taster / Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1219, 352, N'681505', N'Fruit and Vegetable Grader / Classer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1220, 352, N'681506', N'Livestock Product Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1221, 353, N'681601', N'Cigar Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1222, 353, N'681602', N'Green Tobacco Storage Controller / Manager', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1223, 353, N'681603', N'Tobacco Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1224, 354, N'682101', N'Wood Preparer and Treater', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1225, 354, N'682102', N'Plywood and Veneer Maker and Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1226, 355, N'682201', N'Cabinet Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1227, 355, N'682203', N'Wood Model Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1228, 356, N'682301', N'Furniture Finisher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1229, 356, N'682302', N'Picture Framer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1230, 356, N'682303', N'Wood Machinist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1231, 356, N'682304', N'Wood Turner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1232, 356, N'682305', N'Cooper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1233, 357, N'683101', N'Tailor', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1234, 357, N'683102', N'Furrier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1235, 357, N'683103', N'Hat Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1236, 357, N'683104', N'Wig Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1237, 358, N'683201', N'Clothing, Home Textiles and General Goods Cutter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1238, 358, N'683202', N'Apparel and related pattern maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1239, 359, N'683301', N'Canvas Goods Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1240, 359, N'683302', N'Sail Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1241, 359, N'683303', N'Textile Produce Mender and Embroiderer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1242, 360, N'683401', N'Upholsterer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1243, 360, N'683402', N'Bed Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1244, 361, N'683501', N'Fellmonger', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1245, 361, N'683502', N'Tanner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1246, 361, N'683503', N'Pelt Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1247, 362, N'683601', N'Shoemaker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1248, 363, N'684101', N'Diver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1249, 364, N'684201', N' Mining Blaster', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1250, 364, N'684202', N'Blaster', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1251, 365, N'684301', N'Crop Produce Analyst', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1252, 365, N'684302', N'Tobacco Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1253, 365, N'684303', N'Cotton Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1254, 365, N'684304', N'Wool Classer / Grader', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1255, 365, N'684305', N'Quality Controller (Manufacturing)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1256, 366, N'684401', N'Pest or Weed Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1257, 367, N'684901', N'Textile, Clothing, Footwear and Leather Processing Machine Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1258, 367, N'684902', N'Farrier', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1259, 367, N'684904', N'Panelbeater', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1260, 367, N'684905', N'Vehicle Body Builder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1261, 367, N'684906', N'Vehicle Trimmer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1262, 367, N'684907', N'Boatbuilder and Repairer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1263, 367, N'684908', N'Shipwright', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1264, 367, N'684909', N'Survival Equipment Fitter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1265, 367, N'684910', N'Ammunition Fitter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1266, 367, N'684911', N'Florist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1267, 367, N'684912', N'Photographer''s Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1268, 367, N'684913', N'Melter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1269, 367, N'684914', N'Textile Machine Mechanic', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1270, 368, N'711101', N'Mining Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1271, 368, N'711102', N'Shotcreter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1272, 369, N'711201', N'Mineral Processing Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1273, 369, N'711202', N'Jewellery Processing and Finishing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1274, 369, N'711203', N'Diamond Cutter and Polisher', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1275, 369, N'711204', N'Gemstone Cutter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1276, 369, N'711205', N'Gemstone Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1277, 370, N'711301', N'Driller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1278, 370, N'711302', N'Rock Drill Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1279, 371, N'711401', N'Concrete Products Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1280, 371, N'711402', N'Glass, Clay and Stone Manufacturing Machine Setter and Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1281, 371, N'711403', N'Plaster Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1282, 371, N'711404', N'Cement Production Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1283, 371, N'711405', N'Concrete Batching Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1284, 371, N'711406', N'Industrial Diamond Polishing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1285, 372, N'712101', N'Metal Processing Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1286, 372, N'712102', N'Metal Manufacturing Machine Setter and Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1287, 372, N'712103', N'Abrasive Wheel Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1288, 372, N'712104', N'Brake Lining Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1289, 373, N'712201', N'Electroplater', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1290, 374, N'713101', N'Chemical Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1291, 375, N'713201', N'Photographic Developer and Printer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1292, 376, N'714101', N'Rubber Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1293, 376, N'714102', N'Rubber Manufacturing Machine Setter and Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1294, 377, N'714201', N'Plastic Cablemaking Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1295, 377, N'714202', N'Plastic Compounding and Reclamation Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1296, 377, N'714203', N'Plastics Fabricator or Welder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1297, 377, N'714204', N'Plastics Production Machine Operator (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1298, 377, N'714205', N'Reinforced Plastic and Composite Production Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1299, 377, N'714206', N'Rotational Moulding Operator (Plastics)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1300, 377, N'714207', N'Thermoforming Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1301, 377, N'714208', N'Plastics Manufacturing Machine Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1302, 377, N'714209', N'Reinforced Plastics and Composite Trades Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1303, 378, N'714301', N'Paper Products Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1304, 379, N'715101', N'Fibre Preparation Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1305, 379, N'715102', N'Yarn Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1306, 379, N'715103', N'Man-made Fibre Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1307, 380, N'715201', N'Weaving Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1308, 380, N'715202', N'Warping Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1309, 380, N'715203', N'Braiding Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1310, 380, N'715204', N'Knitting Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1311, 380, N'715205', N'Non-woven Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1312, 380, N'715206', N'Textile Dry Finishing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1313, 381, N'715301', N'Sewing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1314, 381, N'715302', N'Clothing, Textile and Leather Goods Production Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1315, 382, N'715401', N'Textile Wet Process Production Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1316, 383, N'715501', N'Leather Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1317, 384, N'715601', N'Footwear Cutting Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1318, 384, N'715602', N'Footwear Closing Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1319, 384, N'715603', N'Footwear Bottom Stock Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1320, 384, N'715604', N'Footwear Lasting Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1321, 384, N'715605', N'Footwear Finishing Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1322, 385, N'715701', N'Laundry and Dry Cleaning Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1323, 386, N'715901', N'Textile and Footwear Manufacturing Machine Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1324, 387, N'716101', N'Fruit and Vegetable Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1325, 387, N'716102', N'Distillery Process Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1326, 387, N'716103', N'Juice Extraction and Blending Process Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1327, 387, N'716104', N'Dairy Products Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1328, 387, N'716105', N'Bakery and Confectionary Products Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1329, 387, N'716106', N'Sugar Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1330, 387, N'716107', N'Coffee and Tea Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1331, 387, N'716108', N'Seed Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1332, 387, N'716109', N'Milling Process Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1333, 387, N'716110', N'Tobacco Product Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1334, 387, N'716111', N'Meat Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1335, 387, N'716112', N'Seafood Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1336, 387, N'716113', N'Grain Handling Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1337, 387, N'716114', N'Sparkling Soft drink process machine operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1338, 387, N'716115', N'Wine processing machine operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1339, 387, N'716116', N'Cereals, snacks, pasta and condiments machine process operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1340, 387, N'716117', N'Brew house Process Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1341, 387, N'716118', N'Food and Beverage Process Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1342, 388, N'717101', N'Wood and Paper Manufacturing Machine Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1343, 388, N'717102', N'Paper and Pulp Mill Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1344, 389, N'717201', N'Wood Processing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1345, 390, N'718101', N'Clay Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1346, 390, N'718102', N'Glass Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1347, 390, N'718103', N'Glass Process Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1348, 391, N'718201', N'Boiler or Engine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1349, 392, N'718301', N'Labelling Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1350, 392, N'718302', N'Packing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1351, 392, N'718303', N'Filling Line Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1352, 392, N'718304', N'Packaging Manufacturing Machine Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1353, 393, N'718901', N'Silicon Chip Production Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1354, 393, N'718902', N'Cable and Rope Splicing Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1355, 393, N'718903', N'Cable Manufacturing Machine Minder', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1356, 393, N'718904', N'Integrated Manufacturing Line Machine Setter', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1357, 393, N'718905', N'Engineering Production Systems Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1358, 393, N'718906', N'Bulk Materials Handling Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1359, 393, N'718907', N'Weighbridge Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1360, 393, N'718908', N'Car Compactor Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1361, 393, N'718909', N'Lighthouse Keeper', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1362, 393, N'718910', N'Lock Master (Water Transport)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1363, 393, N'718911', N'Snow Maker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1364, 393, N'718912', N'Wash Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1365, 393, N'718913', N'Motion Picture Projectionist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1366, 393, N'718914', N'Sand Blaster', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1367, 393, N'718915', N'Venetian Blind Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1368, 394, N'721101', N'Machinery Assembler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1369, 395, N'721201', N'Electrical and Electronic Equipment Assembler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1370, 396, N'721901', N'Product Assembler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1371, 397, N'731101', N'Train Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1372, 397, N'731102', N'Tram Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1373, 398, N'731201', N'Railway Signal Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1374, 398, N'731202', N'Train Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1375, 399, N'732101', N'Delivery Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1376, 399, N'732102', N'Delivery Driver (Motorcycle)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1377, 400, N'732201', N'Chauffeur', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1378, 400, N'732202', N'Taxi Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1379, 400, N'732203', N'Emergency Vehicle Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1380, 400, N'732204', N'Oversize Load Pilot / Escort', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1381, 401, N'733101', N'Bus Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1382, 401, N'733102', N'Charter and Tour Bus Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1383, 401, N'733103', N'Passenger Coach Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1384, 402, N'733201', N'Truck Driver (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1385, 402, N'733202', N'Aircraft Refueller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1386, 402, N'733203', N'Furniture Removalist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1387, 402, N'733204', N'Tanker Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1388, 402, N'733205', N'Tow Truck Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1389, 402, N'733206', N'Armoured Personnel Carrier Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1390, 402, N'733207', N'Snow Groomer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1391, 402, N'733208', N'Mobile Mining Equipment Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1392, 402, N'733209', N'Linemarker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1393, 402, N'733210', N'Road Construction Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1394, 402, N'733211', N'Remotely Operated Vehicle (ROV) Pilot', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1395, 403, N'734101', N'Agricultural Mobile Plant (Equipment) Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1396, 403, N'734102', N'Logging Plant Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1397, 404, N'734201', N'Earthmoving Plant Operator (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1398, 404, N'734202', N'Backhoe Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1399, 404, N'734203', N'Bulldozer Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1400, 404, N'734204', N'Excavator Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1401, 404, N'734205', N'Grader Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1402, 404, N'734206', N'Loader Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1403, 404, N'734207', N'Mulcher Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1404, 404, N'734208', N'Tunnelling Machine Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1405, 404, N'734209', N'Mobile Explosives Manufacturing Unit (MEMU) Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1406, 404, N'734210', N'Scraper Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1407, 404, N'734211', N'Dragline Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1408, 404, N'734212', N'Railway Track Master', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1409, 404, N'734213', N'Road Roller Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1410, 404, N'734214', N'Dump Truck Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1411, 405, N'734301', N'Crane or Hoist Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1412, 405, N'734302', N'Cable Ferry Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1413, 405, N'734303', N'Dredge Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1414, 406, N'734401', N'Lift Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1415, 406, N'734402', N'Forklift Driver', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1416, 406, N'734403', N'Straddle Carrier Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1417, 407, N'735101', N'Deck Hand', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1418, 407, N'735102', N'Jetty Operator', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1419, 408, N'811101', N'Domestic Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1420, 409, N'811201', N'Commercial Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1421, 409, N'811202', N'Healthcare Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1422, 409, N'811203', N'Tea Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1423, 409, N'811204', N'Caretaker / cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1424, 410, N'812101', N'Laundry Worker (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1425, 410, N'812103', N'Ironer or Presser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1426, 410, N'812104', N'Carpet Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1427, 411, N'812201', N'Vehicle Detailer (Valet Servicer)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1428, 412, N'812301', N'Window Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1429, 413, N'812901', N'Septic Tank Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1430, 413, N'812902', N'Swimming Pool Cleaner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1431, 413, N'812903', N'Washroom Attendant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1432, 413, N'812904', N'Sterilisation Technician', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1433, 414, N'821101', N'Crop Production Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1434, 414, N'821102', N'Irrigationist', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1435, 414, N'821103', N'Scout', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1436, 414, N'821104', N'Harvester / Picker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1437, 414, N'821105', N'Pruner', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1438, 415, N'821201', N'Livestock Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1439, 415, N'821202', N'Insect Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1440, 415, N'821203', N'Game Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1441, 415, N'821204', N'Poultry, Ratites or Avian Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1442, 415, N'821205', N'Wool Handler', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1443, 416, N'821301', N'Mixed Crop and Livestock Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1444, 417, N'821401', N'Garden Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1445, 417, N'821402', N'Ornamental Horticultural or Nursery Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1446, 417, N'821403', N'Indoor Plant Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1447, 418, N'821501', N'Forestry Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1448, 418, N'821502', N'Logging Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1449, 419, N'821601', N'Fishing Hand', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1450, 419, N'821602', N'Aquaculture Farm Worker / Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1451, 420, N'831101', N'Mining Support Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1452, 420, N'831102', N'Driller''s Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1453, 420, N'831103', N'Mineral Beneficiation Plant Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1454, 420, N'831104', N'Mining Spotter Controller', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1455, 422, N'831301', N'Builder''s Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1456, 422, N'831302', N'Drainage, Sewerage and Storm Water Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1457, 422, N'831303', N'Earthmoving Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1458, 422, N'831304', N'Plumber''s Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1459, 422, N'831305', N'Cement and Concrete Plant Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1460, 422, N'831306', N'Paving and Surfacing Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1461, 422, N'831307', N'Railway Track Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1462, 422, N'831308', N'Crane Chaser', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1463, 422, N'831309', N'Lagger', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1464, 422, N'831310', N'Surveyor''s Assistant', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1465, 422, N'831311', N'Fencer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1466, 422, N'831312', N'Sign Erector', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1467, 422, N'831313', N'Water Process Worker', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1468, 423, N'832101', N'Packer (Non Perishable Products)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1469, 423, N'832102', N'Meat Packer', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1470, 423, N'832103', N'Fish or Seafood Packer', 1, CAST(N'2019-03-16T22:16:59.510' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1471, 423, N'832104', N'Cheese Packer', 1, CAST(N'2019-03-16T22:17:00.303' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1472, 424, N'832901', N'Metal Engineering Process Worker', 1, CAST(N'2019-03-16T22:17:01.190' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1473, 424, N'832902', N'Plastics, Composites and Rubber Factory Worker', 1, CAST(N'2019-03-16T22:17:01.987' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1474, 424, N'832903', N'Timber and Wood Process Worker', 1, CAST(N'2019-03-16T22:17:02.753' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1475, 424, N'832904', N'Food and Beverage Factory Worker', 1, CAST(N'2019-03-16T22:17:03.593' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1476, 424, N'832905', N'Footwear and Leather Factory Worker', 1, CAST(N'2019-03-16T22:17:04.387' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1477, 424, N'832906', N'Glass Processing Worker', 1, CAST(N'2019-03-16T22:17:05.170' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1478, 424, N'832907', N'Chemical Plant Worker', 1, CAST(N'2019-03-16T22:17:05.993' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1479, 424, N'832908', N'Clay Processing Factory Worker', 1, CAST(N'2019-03-16T22:17:06.783' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1480, 424, N'832909', N'Textile, Clothing and Footwear Factory Worker', 1, CAST(N'2019-03-16T22:17:07.560' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1481, 424, N'832910', N'Component Fitter', 1, CAST(N'2019-03-16T22:17:08.333' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1482, 427, N'833301', N'Freight Handler (Rail or Road)', 1, CAST(N'2019-03-16T22:17:09.117' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1483, 427, N'833302', N'Truck Driver''s Offsider', 1, CAST(N'2019-03-16T22:17:09.893' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1484, 427, N'833303', N'Waterside Worker', 1, CAST(N'2019-03-16T22:17:10.667' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1485, 427, N'833304', N'Airline Ground Crew', 1, CAST(N'2019-03-16T22:17:11.463' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1486, 428, N'833401', N'Shelf Filler', 1, CAST(N'2019-03-16T22:17:12.393' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1487, 428, N'833402', N'Store Person', 1, CAST(N'2019-03-16T22:17:13.183' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1488, 429, N'841101', N'Fast Food Cook', 1, CAST(N'2019-03-16T22:17:13.970' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1489, 430, N'841201', N'Kitchenhand', 1, CAST(N'2019-03-16T22:17:14.703' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1490, 430, N'841202', N'Food Trade Assistant', 1, CAST(N'2019-03-16T22:17:15.567' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1491, 431, N'851101', N'Car Park Attendant', 1, CAST(N'2019-03-16T22:17:16.350' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1492, 431, N'851102', N'Leaflet or Newspaper Deliverer', 1, CAST(N'2019-03-16T22:17:17.157' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1493, 432, N'852101', N'Street Vendor', 1, CAST(N'2019-03-16T22:17:17.950' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1494, 433, N'861101', N'Recycling or Rubbish Collector', 1, CAST(N'2019-03-16T22:17:18.713' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1495, 434, N'861201', N'Refuse Sorter', 1, CAST(N'2019-03-16T22:17:19.497' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1496, 434, N'861202', N'Waste Material Sorter and Classifier', 1, CAST(N'2019-03-16T22:17:20.270' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1497, 435, N'861301', N'Street Sweeper Operator', 1, CAST(N'2019-03-16T22:17:21.060' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1498, 436, N'862101', N'Busser', 1, CAST(N'2019-03-16T22:17:21.840' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1499, 436, N'862102', N'Luggage Porter', 1, CAST(N'2019-03-16T22:17:22.703' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1500, 436, N'862103', N'Cloak Room Attendant', 1, CAST(N'2019-03-16T22:17:23.537' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1501, 436, N'862104', N'Hotel Cellar Hand', 1, CAST(N'2019-03-16T22:17:24.303' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1502, 437, N'862201', N'Home Improvement Installer', 1, CAST(N'2019-03-16T22:17:25.090' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1503, 437, N'862202', N'Handyperson', 1, CAST(N'2019-03-16T22:17:25.970' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1504, 438, N'862301', N'Meter Reader', 1, CAST(N'2019-03-16T22:17:26.787' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1505, 438, N'862302', N'Vending Machine Attendant', 1, CAST(N'2019-03-16T22:17:27.610' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1506, 440, N'862913', N'Event Assistant', 1, CAST(N'2019-03-16T22:17:28.397' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1507, 440, N'862914', N'Sheltered Workshop Worker', 1, CAST(N'2019-03-16T22:17:29.357' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1508, 440, N'862915', N'Chemical Mixer', 1, CAST(N'2019-03-16T22:17:30.120' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1509, 440, N'862916', N'Farm Maintenance Worker', 1, CAST(N'2019-03-16T22:17:30.910' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1510, 440, N'862917', N'Crossing Supervisor', 1, CAST(N'2019-03-16T22:17:31.713' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1511, 440, N'862918', N'Electrical or Telecommunications Trades Assistant', 1, CAST(N'2019-03-16T22:17:32.497' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1512, 440, N'862919', N'Mechanic Trade Assistant', 1, CAST(N'2019-03-16T22:17:33.260' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1513, 440, N'862920', N'Railways Assistant', 1, CAST(N'2019-03-16T22:17:34.057' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1514, 440, N'862922', N'Electronics and Telecommunications Trades Assistant', 1, CAST(N'2019-03-16T22:17:35.017' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1515, 440, N'862923', N'Trolley Collector', 1, CAST(N'2019-03-16T22:17:35.817' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1516, 440, N'862924', N'Stage or Studio Hand', 1, CAST(N'2019-03-16T22:17:36.693' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1517, 440, N'862925', N'Caddie', 1, CAST(N'2019-03-16T22:17:37.737' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1518, 440, N'862926', N'Ticket Collector', 1, CAST(N'2019-03-16T22:17:38.550' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_Occupations] ([Occupations_ID], [UnitGroupID], [OccupationsCode], [OccupationsDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1519, 440, N'862927', N'Borehole Pump Operator ', 1, CAST(N'2019-03-16T22:17:39.330' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_Occupations] OFF
GO
SET IDENTITY_INSERT [dbo].[Const_WorkArea_Sys] ON 
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, 1, N'Core Admin', 1, CAST(N'2014-08-21T11:20:30.603' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, 1, N'Core Finance', 1, CAST(N'2014-08-21T11:20:38.157' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, 1, N'Legal', 1, CAST(N'2014-08-21T11:20:45.450' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, 1, N'IT', 1, CAST(N'2014-08-21T11:20:49.560' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, 1, N'Procurement', 1, CAST(N'2014-08-21T11:21:50.147' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, 3, N'Property Valuation', 1, CAST(N'2014-08-21T11:22:13.567' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, 3, N'Rates', 1, CAST(N'2014-08-21T11:22:20.830' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, 3, N'Billing', 1, CAST(N'2014-08-21T11:22:29.233' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, 3, N'Client Services', 1, CAST(N'2014-08-21T11:22:37.030' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (10, 4, N'Parks', 1, CAST(N'2014-08-21T11:22:50.893' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (11, 4, N'Community Facilities', 1, CAST(N'2014-08-21T11:23:04.533' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (12, 4, N'Libraries', 1, CAST(N'2014-08-21T11:23:12.023' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (13, 4, N'Recreation Centers', 1, CAST(N'2014-08-21T11:23:49.663' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (14, 4, N'Primary Health Care Facilities', 1, CAST(N'2014-08-21T11:23:59.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (15, 4, N'Cemeteries', 1, CAST(N'2014-08-21T11:30:21.090' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (16, 5, N'Environmental Health', 1, CAST(N'2014-08-21T11:25:31.427' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (17, 5, N'Pollution Control', 1, CAST(N'2014-08-21T11:25:39.980' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (18, 6, N'By-laws', 1, CAST(N'2014-08-21T11:25:51.130' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (19, 6, N'Licensing', 1, CAST(N'2014-08-21T11:25:59.417' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (20, 7, N'Fire & rescue', 1, CAST(N'2014-08-21T11:26:11.507' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (21, 7, N'Disaster Planning and Management', 1, CAST(N'2014-08-21T11:26:18.767' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (22, 8, N'Public Safety', 1, CAST(N'2014-08-21T11:26:29.237' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (23, 8, N'Traffic Management', 1, CAST(N'2014-08-21T11:26:37.653' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (24, 10, N'LED/IDP/Urban Planning', 1, CAST(N'2014-08-21T11:26:55.827' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (25, 10, N'Land use management', 1, CAST(N'2014-08-21T11:27:03.977' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (26, 12, N'Roads and Stormwater', 1, CAST(N'2014-08-21T11:27:20.580' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (27, 12, N'Solid Waste and Landfill', 1, CAST(N'2014-08-21T11:27:46.903' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (28, 12, N'Water supply and waste water', 1, CAST(N'2014-08-21T11:27:55.167' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_WorkArea_Sys] ([WorkArea_ID], [EmploymentCodeId], [WorkArea], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (29, 12, N'Electricity', 1, CAST(N'2014-08-21T11:28:02.910' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_WorkArea_Sys] OFF
GO
ALTER TABLE [dbo].[Const_EmploymentCategory_Sys] ADD  CONSTRAINT [DF_Const_EmploymentCategory_Sys_Enabled]  DEFAULT ((1)) FOR [Enabled]
GO
ALTER TABLE [dbo].[Const_EmploymentCode_Sys] ADD  CONSTRAINT [DF_Const_EmploymentCode_Sys_Enabled]  DEFAULT ((1)) FOR [Enabled]
GO
ALTER TABLE [dbo].[Const_Occupations]  WITH NOCHECK ADD  CONSTRAINT [FK_Const_Occupations_Const_UnitGroup] FOREIGN KEY([UnitGroupID])
REFERENCES [dbo].[Const_UnitGroup] ([UnitGroup_ID])
GO
ALTER TABLE [dbo].[Const_Occupations] CHECK CONSTRAINT [FK_Const_Occupations_Const_UnitGroup]
GO
ALTER TABLE [dbo].[Const_WorkArea_Sys]  WITH NOCHECK ADD  CONSTRAINT [FK_Const_WorkArea_Sys_Const_EmploymentCode_Sys] FOREIGN KEY([EmploymentCodeId])
REFERENCES [dbo].[Const_EmploymentCode_Sys] ([EmploymentCode_ID])
GO
ALTER TABLE [dbo].[Const_WorkArea_Sys] CHECK CONSTRAINT [FK_Const_WorkArea_Sys_Const_EmploymentCode_Sys]
GO
