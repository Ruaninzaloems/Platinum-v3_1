USE [EMS_George]
GO
/****** Object:  Table [dbo].[Const_UnitGroup]    Script Date: 3/6/2026 3:12:59 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Const_UnitGroup](
	[UnitGroup_ID] [int] IDENTITY(1,1) NOT NULL,
	[MinorGroupID] [int] NOT NULL,
	[UnitGroupCode] [nvarchar](20) NOT NULL,
	[UnitGroupDesc] [nvarchar](1000) NOT NULL,
	[Enable] [bit] NOT NULL,
	[DateCaptured] [datetime] NOT NULL,
	[CapturerID] [int] NOT NULL,
	[DateModified] [datetime] NULL,
	[ModifierID] [int] NULL,
 CONSTRAINT [PK_Const_UnitGroup] PRIMARY KEY CLUSTERED 
(
	[UnitGroup_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 93, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Const_UnitGroup] ON 
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (1, 1, N'1111', N'Legislators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (2, 1, N'1112', N'Senior Government Officials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (3, 1, N'1113', N'Traditional Chiefs and Heads of Villages', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (4, 1, N'1114', N'Senior Officials of Special-Interest Organisations', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (5, 2, N'1121', N'Managing Directors and Chief Executives', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (6, 3, N'1211', N'Finance Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (7, 3, N'1212', N'Human Resource Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (8, 3, N'1213', N'Policy and Planning Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (9, 3, N'1219', N'Business Services and Administration Managers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (10, 4, N'1221', N'Sales and Marketing Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (11, 4, N'1222', N'Advertising and Public Relations Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (12, 4, N'1223', N'Research and Development Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (13, 5, N'1311', N'Agricultural and Forestry Production Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (14, 5, N'1312', N'Aquaculture and Fisheries Production Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (15, 6, N'1321', N'Manufacturing Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (16, 6, N'1322', N'Mining Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (17, 6, N'1323', N'Construction Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (18, 6, N'1324', N'Supply, Distribution and Related Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (19, 7, N'1331', N'Information and Communications Technology Service Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (20, 8, N'1341', N'Child Care Service Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (21, 8, N'1342', N'Health Service Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (22, 8, N'1343', N'Aged Care Service Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (23, 8, N'1344', N'Social Welfare Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (24, 8, N'1345', N'Education Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (25, 8, N'1346', N'Financial and Insurance Services Branch Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (26, 8, N'1347', N'Armed Forces Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (27, 8, N'1349', N'Professional Services Managers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (28, 9, N'1411', N'Hotel Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (29, 9, N'1412', N'Restaurant Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (30, 10, N'1421', N'Retail and Wholesale Trade Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (31, 11, N'1431', N'Sports, Recreation and Cultural Centre Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (32, 11, N'1439', N'Services Managers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (33, 12, N'2111', N'Physicists and Astronomers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (34, 12, N'2112', N'Meteorologists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (35, 12, N'2113', N'Chemists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (36, 12, N'2114', N'Geologists and Geophysicists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (37, 13, N'2121', N'Mathematicians, Actuaries and Statisticians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (38, 14, N'2131', N'Biologists, Botanists, Zoologists and Related Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (39, 14, N'2132', N'Farming, Forestry and Fisheries Advisers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (40, 14, N'2133', N'Environmental Protection Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (41, 15, N'2141', N'Industrial and Production Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (42, 15, N'2142', N'Civil Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (43, 15, N'2143', N'Environmental Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (44, 15, N'2144', N'Mechanical Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (45, 15, N'2145', N'Chemical Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (46, 15, N'2146', N'Mining Engineers, Metallurgists and Related Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (47, 15, N'2149', N'Engineering Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (48, 16, N'2151', N'Electrical Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (49, 16, N'2152', N'Electronics Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (50, 16, N'2153', N'Telecommunications Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (51, 17, N'2161', N'Building Architects', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (52, 17, N'2162', N'Landscape Architects', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (53, 17, N'2163', N'Product and Garment Designers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (54, 17, N'2164', N'Town and Traffic Planners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (55, 17, N'2165', N'Cartographers and Surveyors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (56, 17, N'2166', N'Graphic and Multimedia Designers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (57, 18, N'2211', N'Generalist Medical Practitioners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (58, 18, N'2212', N'Specialist Medical Practitioners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (59, 19, N'2221', N'Nursing Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (60, 19, N'2222', N'Midwifery Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (61, 20, N'2231', N'Traditional and Complementary Medicine Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (62, 21, N'2241', N'Paramedical Practitioners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (63, 22, N'2251', N'Veterinarians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (64, 23, N'2261', N'Dentists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (65, 23, N'2262', N'Pharmacists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (66, 23, N'2263', N'Environmental and Occupational Health and Hygiene Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (67, 23, N'2264', N'Physiotherapists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (68, 23, N'2265', N'Dieticians and Nutritionists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (69, 23, N'2266', N'Audiologists and Speech Therapists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (70, 23, N'2267', N'Optometrists and Ophthalmic Opticians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (71, 23, N'2269', N'Health Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (72, 24, N'2311', N'University and Higher Education Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (73, 25, N'2321', N'Vocational or Further Education Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (74, 26, N'2331', N'Secondary or Intermediate and Senior Education Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (75, 27, N'2341', N'Primary School or Foundational Phase Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (76, 27, N'2342', N'Early Childhood Educators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (77, 28, N'2351', N'Education Methods Specialists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (78, 28, N'2352', N'Special Needs Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (79, 28, N'2353', N'Other Language Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (80, 28, N'2354', N'Other Music Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (81, 28, N'2355', N'Other Arts Teachers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (82, 28, N'2356', N'Information Technology Trainers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (83, 28, N'2359', N'Teaching Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (84, 29, N'2411', N'Accountants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (85, 29, N'2412', N'Financial and Investment Advisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (86, 29, N'2413', N'Financial Analysts', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (87, 30, N'2421', N'Management and Organization Analysts', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (88, 30, N'2422', N'Policy Administration Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (89, 30, N'2423', N'Personnel and Careers Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (90, 30, N'2424', N'Training and Staff Development Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (91, 31, N'2431', N'Advertising and Marketing Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (92, 31, N'2432', N'Public Relations Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (93, 31, N'2433', N'Technical and Medical Sales Professionals (Excluding ICT)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (94, 31, N'2434', N'Information and Communications Technology Sales Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (95, 32, N'2511', N'Systems Analysts', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (96, 32, N'2512', N'Software Developers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (97, 32, N'2513', N'Web and Multimedia Developers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (98, 32, N'2514', N'Applications Programmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (99, 32, N'2519', N'Software and Applications Developers and Analysts not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (100, 33, N'2521', N'Database Designers and Administrators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (101, 33, N'2522', N'Systems Administrators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (102, 33, N'2523', N'Computer Network Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (103, 33, N'2529', N'Database and Network Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (104, 34, N'2611', N'Lawyers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (105, 34, N'2612', N'Judges', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (106, 34, N'2619', N'Legal Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (107, 35, N'2621', N'Archivists and Curators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (108, 35, N'2622', N'Librarians and Related Information Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (109, 36, N'2631', N'Economists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (110, 36, N'2632', N'Sociologists, Anthropologists and Related Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (111, 36, N'2633', N'Philosophers, Historians and Political Scientists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (112, 36, N'2634', N'Psychologists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (113, 36, N'2635', N'Social Work and Counselling Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (114, 36, N'2636', N'Religious Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (115, 37, N'2641', N'Authors and Related Writers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (116, 37, N'2642', N'Journalists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (117, 37, N'2643', N'Translators, Interpreters and Other Linguists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (118, 38, N'2651', N'Visual Artists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (119, 38, N'2652', N'Musicians, Singers and Composers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (120, 38, N'2653', N'Dancers and Choreographers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (121, 38, N'2654', N'Film, Stage and Related Directors and Producers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (122, 38, N'2655', N'Actors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (123, 38, N'2656', N'Announcers On Radio, Television and Other Media', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (124, 38, N'2659', N'Creative and Performing Artists Not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (125, 39, N'3111', N'Chemical and Physical Science Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (126, 39, N'3112', N'Civil Engineering Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (127, 39, N'3113', N'Electrical Engineering Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (128, 39, N'3114', N'Electronics Engineering Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (129, 39, N'3115', N'Mechanical Engineering Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (130, 39, N'3116', N'Chemical Engineering Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (131, 39, N'3117', N'Mining and Metallurgical Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (132, 39, N'3118', N'Draughtsperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (133, 39, N'3119', N'Physical and Engineering Science Technicians not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (134, 40, N'3121', N'Mining Production / Operations Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (135, 40, N'3122', N'Manufacturing Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (136, 40, N'3123', N'Construction Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (137, 41, N'3131', N'Power Production Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (138, 41, N'3132', N'Incinerator and Water Treatment Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (139, 41, N'3133', N'Chemical Processing Plant Controllers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (140, 41, N'3134', N'Petroleum and Natural Gas Refining Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (141, 41, N'3135', N'Metal Production Process Controllers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (142, 41, N'3139', N'Process Control Technicians not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (143, 42, N'3141', N'Life Science Technicians (Excluding Medical)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (144, 42, N'3142', N'Agricultural Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (145, 42, N'3143', N'Forestry Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (146, 43, N'3151', N'Ships'' Engineers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (147, 43, N'3152', N'Ships'' Deck Officers and Pilots', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (148, 43, N'3153', N'Aircraft Pilots and Related Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (149, 43, N'3154', N'Air Traffic Controllers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (150, 43, N'3155', N'Air Traffic Safety Electronics Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (151, 44, N'3211', N'Medical Imaging and Therapeutic Equipment Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (152, 44, N'3212', N'Medical and Pathology Laboratory Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (153, 44, N'3213', N'Pharmaceutical Technicians and Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (154, 44, N'3214', N'Medical and Dental Prosthetic Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (155, 45, N'3221', N'Nursing Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (156, 45, N'3222', N'Midwifery Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (157, 46, N'3231', N'Traditional and Complementary Medicine Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (158, 47, N'3241', N'Veterinary Technicians and Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (159, 48, N'3251', N'Dental Assistants and Therapists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (160, 48, N'3252', N'Medical Records and Health Information Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (161, 48, N'3253', N'Community Health Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (162, 48, N'3254', N'Dispensing Opticians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (163, 48, N'3255', N'Physiotherapy Technicians and Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (164, 48, N'3256', N'Medical Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (165, 48, N'3257', N'Environmental and Occupational Health Inspectors and Associates', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (166, 48, N'3258', N'Ambulance Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (167, 48, N'3259', N'Health Associate Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (168, 49, N'3311', N'Securities and Finance Dealers and Brokers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (169, 49, N'3312', N'Credit and Loans Officers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (170, 49, N'3313', N'Accounting Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (171, 49, N'3314', N'Statistical, Mathematical and Related Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (172, 49, N'3315', N'Valuers and Loss Assessors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (173, 50, N'3321', N'Insurance Representatives', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (174, 50, N'3322', N'Commercial Sales Representatives', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (175, 50, N'3323', N'Buyers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (176, 50, N'3324', N'Trade Brokers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (177, 51, N'3331', N'Clearing and Forwarding Agents', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (178, 51, N'3332', N'Conference and Event Planners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (179, 51, N'3333', N'Employment Agents and Contractors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (180, 51, N'3334', N'Real Estate Agents and Property Managers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (181, 51, N'3339', N'Business Services Agents not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (182, 52, N'3341', N'Office Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (183, 52, N'3342', N'Legal Secretaries', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (184, 52, N'3343', N'Administrative and Executive Secretaries', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (185, 52, N'3344', N'Medical Secretaries', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (186, 53, N'3351', N'Customs and Border Inspectors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (187, 53, N'3352', N'Government Tax and Excise Officials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (188, 53, N'3353', N'Government Social Benefits Officials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (189, 53, N'3354', N'Government Licensing Officials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (190, 53, N'3355', N'Police Inspectors and Detectives', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (191, 53, N'3359', N'Government Regulatory Associate Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (192, 54, N'3411', N'Legal and Related Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (193, 54, N'3412', N'Social Work Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (194, 54, N'3413', N'Religious Associate Professionals', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (195, 55, N'3421', N'Athletes and Sports Players', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (196, 55, N'3422', N'Sports Coaches, Instructors and Officials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (197, 55, N'3423', N'Fitness and Recreation Instructors and Program Leaders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (198, 56, N'3431', N'Photographers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (199, 56, N'3432', N'Interior Designers and Decorators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (200, 56, N'3433', N'Gallery, Museum and Library Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (201, 56, N'3434', N'Chefs', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (202, 56, N'3439', N'Artistic and Cultural Associate Professionals not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (203, 57, N'3511', N'Information and Communications Technology Operations Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (204, 57, N'3512', N'Information and Communications Technology User Support Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (205, 57, N'3513', N'Computer Network and Systems Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (206, 57, N'3514', N'Web Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (207, 58, N'3521', N'Broadcasting and Audio-Visual Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (208, 58, N'3522', N'Telecommunications Engineering Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (209, 59, N'4111', N'General Office Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (210, 60, N'4121', N'Secretaries (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (211, 61, N'4131', N'Typists and Word Processing Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (212, 61, N'4132', N'Data Entry Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (213, 62, N'4211', N'Bank Tellers and Related Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (214, 62, N'4212', N'Bookmakers, Croupiers and Related Gaming Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (215, 62, N'4213', N'Pawnbrokers and Money-Lenders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (216, 62, N'4214', N'Debt-Collectors and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (217, 63, N'4221', N'Travel Consultants and Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (218, 63, N'4222', N'Contact Centre Information Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (219, 63, N'4223', N'Telephone Switchboard Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (220, 63, N'4224', N'Hotel Receptionists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (221, 63, N'4225', N'Enquiry Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (222, 63, N'4226', N'Receptionists (General)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (223, 63, N'4227', N'Survey and Market Research Interviewers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (224, 63, N'4229', N'Client Information Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (225, 64, N'4311', N'Accounting and Bookkeeping Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (226, 64, N'4312', N'Statistical, Finance and Insurance Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (227, 64, N'4313', N'Payroll Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (228, 65, N'4321', N'Stock Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (229, 65, N'4322', N'Production Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (230, 65, N'4323', N'Transport Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (231, 66, N'4411', N'Library Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (232, 66, N'4412', N'Mail Carriers and Sorting Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (233, 66, N'4413', N'Coding, Proof-Reading and Related Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (234, 66, N'4414', N'Scribes and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (235, 66, N'4415', N'Filing and Copying Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (236, 66, N'4416', N'Personnel Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (237, 66, N'4419', N'Clerical Support Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (238, 67, N'5111', N'Travel Attendants and Travel Stewards', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (239, 67, N'5112', N'Transport Conductors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (240, 67, N'5113', N'Travel Guides', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (241, 68, N'5121', N'Cooks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (242, 69, N'5131', N'Waiters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (243, 69, N'5132', N'Bartenders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (244, 70, N'5141', N'Hairdressers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (245, 70, N'5142', N'Beauticians and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (246, 71, N'5151', N'Cleaning and Housekeeping Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (247, 71, N'5152', N'Domestic Housekeepers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (248, 71, N'5153', N'Building Caretakers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (249, 72, N'5161', N'Astrologers, Fortune-Tellers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (250, 72, N'5162', N'Companions and Valets', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (251, 72, N'5163', N'Undertakers and Embalmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (252, 72, N'5164', N'Pet Groomers and Animal Care Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (253, 72, N'5165', N'Driving Instructors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (254, 72, N'5169', N'Personal Services Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (255, 73, N'5211', N'Stall and Market Salespersons', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (256, 73, N'5212', N'Street Food Salespersons', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (257, 74, N'5221', N'Shop Keepers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (258, 74, N'5222', N'Shop Supervisors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (259, 74, N'5223', N'Shop Sales Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (260, 75, N'5231', N'Cashiers and Ticket Clerks', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (261, 76, N'5241', N'Fashion and Other Models', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (262, 76, N'5242', N'Sales Demonstrators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (263, 76, N'5243', N'Door-To-Door Salesperson', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (264, 76, N'5244', N'Contact Centre Salespersons', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (265, 76, N'5245', N'Service Station Attendants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (266, 76, N'5246', N'Food Service Counter Attendants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (267, 76, N'5249', N'Sales Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (268, 77, N'5311', N'Child Care Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (269, 77, N'5312', N'Teachers'' Aides', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (270, 78, N'5321', N'Health Care Assistants', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (271, 78, N'5322', N'Home-Based Personal Care Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (272, 78, N'5329', N'Personal Care Workers In Health Services not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (273, 79, N'5411', N'Fire fighters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (274, 79, N'5412', N'Police Officers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (275, 79, N'5413', N'Prison Guards', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (276, 79, N'5414', N'Security Guards', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (277, 79, N'5415', N'Intelligence Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (278, 79, N'5419', N'Protective Services Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (279, 80, N'5421', N'Seaward Defence Members', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (280, 80, N'5422', N'Special Forces Defence Members', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (281, 80, N'5423', N'Landward Defence Members', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (282, 80, N'5424', N'Defence Support Members', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (283, 80, N'5425', N'Airward Defence Members', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (284, 81, N'6111', N'Field Crop and Vegetable Growers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (285, 81, N'6112', N'Tree and Shrub Crop Growers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (286, 81, N'6113', N'Gardeners, Ornamental Horticultural and Nursery Growers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (287, 81, N'6114', N'Mixed Crop Growers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (288, 82, N'6121', N'Livestock and Dairy Producers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (289, 82, N'6122', N'Poultry Producers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (290, 82, N'6123', N'Apiarists and Sericulturists', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (291, 82, N'6129', N'Other Animal Producers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (292, 83, N'6131', N'Mixed Crop and Animal Producers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (293, 84, N'6211', N'Forestry and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (294, 85, N'6221', N'Skilled Aquaculture Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (295, 85, N'6222', N'Skilled Inland and Coastal Waters Fishery Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (296, 85, N'6223', N'Skilled Deep-Sea Fishery Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (297, 85, N'6224', N'Hunters and Trappers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (298, 86, N'6311', N'Subsistence Crop Farmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (299, 86, N'6312', N'Subsistence Livestock Farmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (300, 86, N'6313', N'Subsistence Mixed Crop and Livestock Farmers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (301, 86, N'6314', N'Subsistence Fishers, Hunters, Trappers and Gatherers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (302, 87, N'6411', N'House Builders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (303, 87, N'6412', N'Bricklayers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (304, 87, N'6413', N'Stonemasons, Stone Cutters, Splitters and Carvers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (305, 87, N'6414', N'Concrete Placers, Concrete Finishers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (306, 87, N'6415', N'Carpenters and Joiners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (307, 87, N'6419', N'Building Frame and Related Trades Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (308, 88, N'6421', N'Roofers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (309, 88, N'6422', N'Floor Layers and Tile Setters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (310, 88, N'6423', N'Plasterers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (311, 88, N'6424', N'Insulation Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (312, 88, N'6425', N'Glaziers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (313, 88, N'6426', N'Plumbers and Pipe Fitters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (314, 88, N'6427', N'Air Conditioning and Refrigeration Mechanics', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (315, 89, N'6431', N'Painters and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (316, 89, N'6432', N'Spray Painters and Varnishers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (317, 89, N'6433', N'Building Structure Cleaners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (318, 90, N'6511', N'Metal Moulders and Coremakers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (319, 90, N'6512', N'Welders and Flame Cutters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (320, 90, N'6513', N'Sheet Metal Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (321, 90, N'6514', N'Structural Metal Preparers and Erectors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (322, 90, N'6515', N'Riggers and Cable Splicers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (323, 91, N'6521', N'Blacksmiths, Hammersmiths and Forging Press Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (324, 91, N'6522', N'Toolmakers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (325, 91, N'6523', N'Metal Working Machine Tool Setters and Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (326, 91, N'6524', N'Metal Polishers, Wheel Grinders and Tool Sharpeners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (327, 92, N'6531', N'Motor Vehicle Mechanics and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (328, 92, N'6532', N'Aircraft Engine Mechanics and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (329, 92, N'6533', N'Agricultural and Industrial Machinery Mechanics and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (330, 92, N'6534', N'Bicycle and Related Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (331, 93, N'6611', N'Precision-Instrument Makers and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (332, 93, N'6612', N'Musical Instrument Makers and Tuners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (333, 93, N'6613', N'Jewellery and Precious Metal Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (334, 93, N'6614', N'Potters and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (335, 93, N'6615', N'Glass Makers, Cutters, Grinders and Finishers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (336, 93, N'6616', N'Sign Writers, Decorative Painters, Engravers and Etchers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (337, 93, N'6617', N'Handicraft Workers In Wood, Basketry and Related Materials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (338, 93, N'6618', N'Handicraft Workers In Textile, Leather and Related Materials', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (339, 93, N'6619', N'Handicraft Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (340, 94, N'6621', N'Pre-Press Technicians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (341, 94, N'6622', N'Printers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (342, 94, N'6623', N'Print Finishing and Binding Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (343, 95, N'6711', N'Building and Related Electricians', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (344, 95, N'6712', N'Electrical Mechanics and Fitters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (345, 95, N'6713', N'Electrical Line Installers and Repairers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (346, 96, N'6721', N'Electronics Mechanics and Servicers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (347, 96, N'6722', N'Information and Communications Technology Installers and Servicers and Related Occupations', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (348, 97, N'6811', N'Butchers, Fishmongers and Related Food Preparers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (349, 97, N'6812', N'Bakers, Pastry-Cooks and Confectionery Makers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (350, 97, N'6813', N'Dairy Products Makers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (351, 97, N'6814', N'Fruit, Vegetable and Related Preservers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (352, 97, N'6815', N'Food and Beverage Tasters and Graders', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (353, 97, N'6816', N'Tobacco Preparers and Tobacco Products Makers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (354, 98, N'6821', N'Wood Treaters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (355, 98, N'6822', N'Cabinet Makers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (356, 98, N'6823', N'Woodworking Machine Tool Setters and Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (357, 99, N'6831', N'Tailors, Dressmakers, Furriers and Hatters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (358, 99, N'6832', N'Garment and Related Patternmakers and Cutters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (359, 99, N'6833', N'Sewing, Embroidery and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (360, 99, N'6834', N'Upholsterers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (361, 99, N'6835', N'Pelt Dressers, Tanners and Fellmongers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (362, 99, N'6836', N'Shoemakers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (363, 100, N'6841', N'Underwater Divers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (364, 100, N'6842', N'Shotfirers and Blasters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (365, 100, N'6843', N'Product Graders and Testers (Except Foods and Beverages)', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (366, 100, N'6844', N'Fumigators and Other Pest and Weed Controllers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (367, 100, N'6849', N'Craft and Related Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (368, 101, N'7111', N'Miners and Quarriers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (369, 101, N'7112', N'Mineral and Stone Processing Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (370, 101, N'7113', N'Well Drillers and Borers and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (371, 101, N'7114', N'Cement, Stone and Other Mineral Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (372, 102, N'7121', N'Metal Processing Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (373, 102, N'7122', N'Metal Finishing, Plating and Coating Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (374, 103, N'7131', N'Chemical Products Plant and Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (375, 103, N'7132', N'Photographic Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (376, 104, N'7141', N'Rubber Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (377, 104, N'7142', N'Plastic Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (378, 104, N'7143', N'Paper Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (379, 105, N'7151', N'Fibre Preparing, Spinning and Winding Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (380, 105, N'7152', N'Weaving and Knitting Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (381, 105, N'7153', N'Sewing Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (382, 105, N'7154', N'Bleaching, Dyeing and Fabric Cleaning Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (383, 105, N'7155', N'Fur and Leather Preparing Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (384, 105, N'7156', N'Shoemaking and Related Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (385, 105, N'7157', N'Laundry Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (386, 105, N'7159', N'Textile, Fur and Leather Products Machine Operators not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (387, 106, N'7161', N'Food and Related Products Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (388, 107, N'7171', N'Pulp and Papermaking Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (389, 107, N'7172', N'Wood Processing Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (390, 108, N'7181', N'Glass and Ceramics Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (391, 108, N'7182', N'Steam Engine and Boiler Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (392, 108, N'7183', N'Packing, Bottling and Labelling Machine Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (393, 108, N'7189', N'Stationary Plant and Machine Operators not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (394, 109, N'7211', N'Mechanical Machinery Assemblers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (395, 109, N'7212', N'Electrical and Electronic Equipment Assemblers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (396, 109, N'7219', N'Assemblers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (397, 110, N'7311', N'Locomotive Engine Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (398, 110, N'7312', N'Railway Brake, Signal and Switch Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (399, 111, N'7321', N'Motorcycle Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (400, 111, N'7322', N'Car, Taxi and Van Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (401, 112, N'7331', N'Bus and Tram Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (402, 112, N'7332', N'Heavy Truck and Lorry Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (403, 113, N'7341', N'Mobile Farm and Forestry Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (404, 113, N'7342', N'Earthmoving and Related Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (405, 113, N'7343', N'Crane, Hoist and Related Plant Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (406, 113, N'7344', N'Lifting Truck Operators', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (407, 114, N'7351', N'Ships'' Deck Crews and Related Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (408, 115, N'8111', N'Domestic Cleaners and Helpers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (409, 115, N'8112', N'Cleaners and Helpers In Offices, Hotels and Other Establishments', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (410, 116, N'8121', N'Hand Launderers and Pressers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (411, 116, N'8122', N'Vehicle Cleaners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (412, 116, N'8123', N'Window Cleaners', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (413, 116, N'8129', N'Other Cleaning Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (414, 117, N'8211', N'Crop Farm Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (415, 117, N'8212', N'Livestock Farm Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (416, 117, N'8213', N'Mixed Crop and Livestock Farm Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (417, 117, N'8214', N'Garden and Horticultural Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (418, 117, N'8215', N'Forestry Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (419, 117, N'8216', N'Fishery and Aquaculture Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (420, 118, N'8311', N'Mining and Quarrying Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (421, 118, N'8312', N'Civil Engineering Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (422, 118, N'8313', N'Building Construction Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (423, 119, N'8321', N'Hand Packers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (424, 119, N'8329', N'Manufacturing Labourers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (425, 120, N'8331', N'Hand and Pedal Vehicle Drivers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (426, 120, N'8332', N'Drivers of Animal-Drawn Vehicles and Machinery', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (427, 120, N'8333', N'Freight Handlers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (428, 120, N'8334', N'Shelf Fillers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (429, 121, N'8411', N'Fast Food Preparers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (430, 121, N'8412', N'Kitchen Helpers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (431, 122, N'8511', N'Street and Related Service Workers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (432, 123, N'8521', N'Street Vendors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (433, 124, N'8611', N'Garbage and Recycling Collectors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (434, 124, N'8612', N'Refuse Sorters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (435, 124, N'8613', N'Sweepers and Related Labourers', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (436, 125, N'8621', N'Messengers, Package Deliverers and Luggage Porters', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (437, 125, N'8622', N'Odd Job Persons', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (438, 125, N'8623', N'Meter Readers and Vending-Machine Collectors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (439, 125, N'8624', N'Water and Firewood Collectors', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
INSERT [dbo].[Const_UnitGroup] ([UnitGroup_ID], [MinorGroupID], [UnitGroupCode], [UnitGroupDesc], [Enable], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) VALUES (440, 125, N'8629', N'Elementary Workers not Elsewhere Classified', 1, CAST(N'2014-04-22T00:00:00.000' AS DateTime), 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Const_UnitGroup] OFF
GO
ALTER TABLE [dbo].[Const_UnitGroup]  WITH NOCHECK ADD  CONSTRAINT [FK_Const_UnitGroup_Const_MinorGroup] FOREIGN KEY([MinorGroupID])
REFERENCES [dbo].[Const_MinorGroup] ([MinorGroup_ID])
GO
ALTER TABLE [dbo].[Const_UnitGroup] CHECK CONSTRAINT [FK_Const_UnitGroup_Const_MinorGroup]
GO
