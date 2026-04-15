/****** Object:  View [dbo].[Plan_Const_SCOA_Structure_Consolidated_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[Plan_Const_SCOA_Structure_Consolidated_vw]
	
AS
	
	SELECT DISTINCT 
		item.FinYear, item.ScoaID, item.FinYearText, item.ScoaCode, item.LevelID, item.PostingLevel, item.BreakDownAllowed, item.ScoaDesc, item.ScoaShortDesc, item.ScoaParentID, item.ParentID, item.NTGFSCode, 
    	item.NTVatStatus, item.NTSCOAFile, item.NTScoaLevel, item.NTExcelRowNumber, item.NTPrinciple, item.NTApplicableTo, item.NTPostingLevelDescription, item.NTScoaID, item.NTParentScoaId, item.Enabled, item.Version, 
    	item.TableID, item.TableName, item.VoteTypeID, item.DebitCreditID, item.VatIndicatorID, item.VatApportionment, item.CapitalTimePeriodID, item.IsCapexVote, item.IsControlVote, item.DefinitionDescription
	FROM            
		dbo.Plan_AdjustmentProjectItem AS PPI INNER JOIN
    	dbo.Plan_AdjustmentProject AS PP ON PP.AdjustmentProject_ID = PPI.AdjustmentProjectID INNER JOIN
    	(
			SELECT        
				FinYear, ScoaID, FinYearText, ScoaCode, LevelID, PostingLevel, BreakDownAllowed, ScoaDesc, ScoaShortDesc, ScoaParentID, ParentID, NTGFSCode, NTVatStatus, NTSCOAFile, NTScoaLevel, 
            	NTExcelRowNumber, NTPrinciple, NTApplicableTo, NTPostingLevelDescription, NTScoaID, NTParentScoaId, Enabled, Version, TableID, TableName, VoteTypeID, DebitCreditID, VatIndicatorID, VatApportionment, 
            	CapitalTimePeriodID, IsCapexVote, IsControlVote, DefinitionDescription
			FROM            
				dbo.Const_SCOA_Structure_Consolidated
		) AS item ON PPI.SCOAItemID = item.ScoaID
	WHERE        
		(ISNULL(PP.IsDeleted, 0) <> 1)

	UNION

	SELECT DISTINCT 
		item.FinYear, item.ScoaID, item.FinYearText, item.ScoaCode, item.LevelID, item.PostingLevel, item.BreakDownAllowed, item.ScoaDesc, item.ScoaShortDesc, item.ScoaParentID, item.ParentID, item.NTGFSCode, 
    	item.NTVatStatus, item.NTSCOAFile, item.NTScoaLevel, item.NTExcelRowNumber, item.NTPrinciple, item.NTApplicableTo, item.NTPostingLevelDescription, item.NTScoaID, item.NTParentScoaId, item.Enabled, item.Version, 
    	item.TableID, item.TableName, item.VoteTypeID, item.DebitCreditID, item.VatIndicatorID, item.VatApportionment, item.CapitalTimePeriodID, item.IsCapexVote, item.IsControlVote, item.DefinitionDescription
	FROM            
		dbo.Plan_ProjectItem AS PPI INNER JOIN
    	dbo.Plan_Project AS PP ON PP.Project_ID = PPI.ProjectID INNER JOIN
    	(
			SELECT        
				FinYear, ScoaID, FinYearText, ScoaCode, LevelID, PostingLevel, BreakDownAllowed, ScoaDesc, ScoaShortDesc, ScoaParentID, ParentID, NTGFSCode, NTVatStatus, NTSCOAFile, NTScoaLevel, 
            	NTExcelRowNumber, NTPrinciple, NTApplicableTo, NTPostingLevelDescription, NTScoaID, NTParentScoaId, Enabled, Version, TableID, TableName, VoteTypeID, DebitCreditID, VatIndicatorID, VatApportionment, 
            	CapitalTimePeriodID, IsCapexVote, IsControlVote, DefinitionDescription
			FROM            
				dbo.Const_SCOA_Structure_Consolidated
		) AS item ON PPI.SCOAItemID = item.ScoaID
	WHERE        
		(ISNULL(PP.IsDeleted, 0) <> 1)

	UNION

	SELECT DISTINCT 
		item.FinYear, item.ScoaID, item.FinYearText, item.ScoaCode, item.LevelID, item.PostingLevel, item.BreakDownAllowed, item.ScoaDesc, item.ScoaShortDesc, item.ScoaParentID, item.ParentID, item.NTGFSCode, 
    	item.NTVatStatus, item.NTSCOAFile, item.NTScoaLevel, item.NTExcelRowNumber, item.NTPrinciple, item.NTApplicableTo, item.NTPostingLevelDescription, item.NTScoaID, item.NTParentScoaId, item.Enabled, item.Version, 
    	item.TableID, item.TableName, item.VoteTypeID, item.DebitCreditID, item.VatIndicatorID, item.VatApportionment, item.CapitalTimePeriodID, item.IsCapexVote, item.IsControlVote, item.DefinitionDescription
	FROM            
		dbo.Plan_BudgetOriginalImportVersion_Detail AS PPI INNER JOIN
    	(
			SELECT        
				FinYear, ScoaID, FinYearText, ScoaCode, LevelID, PostingLevel, BreakDownAllowed, ScoaDesc, ScoaShortDesc, ScoaParentID, ParentID, NTGFSCode, NTVatStatus, NTSCOAFile, NTScoaLevel, 
            	NTExcelRowNumber, NTPrinciple, NTApplicableTo, NTPostingLevelDescription, NTScoaID, NTParentScoaId, Enabled, Version, TableID, TableName, VoteTypeID, DebitCreditID, VatIndicatorID, VatApportionment, 
            	CapitalTimePeriodID, IsCapexVote, IsControlVote, DefinitionDescription
			FROM            
				dbo.Const_SCOA_Structure_Consolidated
		) AS item ON PPI.SCOAItemCode = item.ScoaCode

	UNION

	SELECT DISTINCT 
		item.FinYear, item.ScoaID, item.FinYearText, item.ScoaCode, item.LevelID, item.PostingLevel, item.BreakDownAllowed, item.ScoaDesc, item.ScoaShortDesc, item.ScoaParentID, item.ParentID, item.NTGFSCode, 
    	item.NTVatStatus, item.NTSCOAFile, item.NTScoaLevel, item.NTExcelRowNumber, item.NTPrinciple, item.NTApplicableTo, item.NTPostingLevelDescription, item.NTScoaID, item.NTParentScoaId, item.Enabled, item.Version, 
    	item.TableID, item.TableName, item.VoteTypeID, item.DebitCreditID, item.VatIndicatorID, item.VatApportionment, item.CapitalTimePeriodID, item.IsCapexVote, item.IsControlVote, item.DefinitionDescription
	FROM            
		dbo.Plan_BudgetAdjustmentImportVersion_Detail AS PPI INNER JOIN
    	(
			SELECT        
				FinYear, ScoaID, FinYearText, ScoaCode, LevelID, PostingLevel, BreakDownAllowed, ScoaDesc, ScoaShortDesc, ScoaParentID, ParentID, NTGFSCode, NTVatStatus, NTSCOAFile, NTScoaLevel, 
            	NTExcelRowNumber, NTPrinciple, NTApplicableTo, NTPostingLevelDescription, NTScoaID, NTParentScoaId, Enabled, Version, TableID, TableName, VoteTypeID, DebitCreditID, VatIndicatorID, VatApportionment, 
            	CapitalTimePeriodID, IsCapexVote, IsControlVote, DefinitionDescription
			FROM            
				dbo.Const_SCOA_Structure_Consolidated
		) AS item ON PPI.SCOAItemCode = item.ScoaCode

	UNION

	SELECT DISTINCT 
		item.FinYear, item.ScoaID, item.FinYearText, item.ScoaCode, item.LevelID, item.PostingLevel, item.BreakDownAllowed, item.ScoaDesc, item.ScoaShortDesc, item.ScoaParentID, item.ParentID, item.NTGFSCode, 
    	item.NTVatStatus, item.NTSCOAFile, item.NTScoaLevel, item.NTExcelRowNumber, item.NTPrinciple, item.NTApplicableTo, item.NTPostingLevelDescription, item.NTScoaID, item.NTParentScoaId, item.Enabled, item.Version, 
    	item.TableID, item.TableName, item.VoteTypeID, item.DebitCreditID, item.VatIndicatorID, item.VatApportionment, item.CapitalTimePeriodID, item.IsCapexVote, item.IsControlVote, item.DefinitionDescription
	FROM            
		dbo.Plan_BudgetZeroImportVersion_Detail AS PPI INNER JOIN
    	(
			SELECT        
				FinYear, ScoaID, FinYearText, ScoaCode, LevelID, PostingLevel, BreakDownAllowed, ScoaDesc, ScoaShortDesc, ScoaParentID, ParentID, NTGFSCode, NTVatStatus, NTSCOAFile, NTScoaLevel, 
            	NTExcelRowNumber, NTPrinciple, NTApplicableTo, NTPostingLevelDescription, NTScoaID, NTParentScoaId, Enabled, Version, TableID, TableName, VoteTypeID, DebitCreditID, VatIndicatorID, VatApportionment, 
            	CapitalTimePeriodID, IsCapexVote, IsControlVote, DefinitionDescription
			FROM            
				dbo.Const_SCOA_Structure_Consolidated
		) AS item ON PPI.SCOAItemCode = item.ScoaCode
GO

/****** Object:  View [dbo].[Plan_GetSCOAItem_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author: SAHIL NAGPAL
-- Create date: 06 JAN 2017
-- Description: Get list of SCOAID, SCOADESC
-- =============================================
CREATE VIEW [dbo].[Plan_GetSCOAItem_vw]
WITH SCHEMABINDING  
AS  
	SELECT  ScoaID , ScoaDesc
	FROM    dbo.Const_SCOA_Structure
	WHERE   Enabled = 1
			AND PostingLevel = 'Yes';
GO

/****** Object:  View [dbo].[Plan_ProjectBudget_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[Plan_ProjectBudget_vw]
AS
    SELECT DISTINCT
			pp.FinYear AS FinYear,
            pp.Project_ID ,
            pp.ProjectName ,
            REPLACE(REPLACE(REPLACE(pp.ProjectDesc, CHAR(10), ' '), CHAR(13),
                            ' '), CHAR(09), ' ') AS ProjectDesc ,
            pp.CostEstimate ,
            pp.CapitalOperation ,
            CASE WHEN [CapitalOperation] = 2 THEN 'Operational Revenue'
                 WHEN [CapitalOperation] = 1 THEN 'Capital'
                 WHEN [CapitalOperation] = 0 THEN 'Operational Expenditure'
            END AS CapitalOperationDesc ,
            pp.ProjectStatus ,
            cs.StatusDesc ,
            dep.Department_ID ,
            cd.Division_ID ,
            pp.ProjectTypeID ,
            dep.DepartmentDesc + '/' + cd.DivisionDesc AS MuniClassification ,
            cpt.ProjectTypeDescrip ,
			func.ScoaID AS SCOAFunctionID,
            func.ScoaCode AS SCOAFuncCode ,
            func.ScoaDesc AS SCOAFuncDesc ,
			func.NTSCOAID AS SCOAFuncGUID , 
            func.ScoaCode + ' ' + func.ScoaDesc AS SCOAFunctions ,
			region.ScoaID AS SCOARegionID,
            region.ScoaCode AS SCOARegionCode ,
            region.ScoaDesc AS SCOARegionDesc ,
			region.NTSCOAID AS SCOARegionGUID , 
            region.ScoaCode + ' ' + region.ScoaDesc AS SCOARegions ,
            costing.ScoaID AS SCOACostingID,
			costing.ScoaCode AS SCOACostingCode ,
            costing.ScoaDesc AS SCOACostingDesc ,
			costing.NTSCOAID AS SCOACostingGUID , 
			project.ScoaID AS SCOAProjectID,
            project.ScoaCode AS SCOAProjectCode ,
            project.ScoaDesc AS SCOAProjectDesc ,
			project.NTSCOAID AS SCOAProjectGUID , 
            fs.ScoaID AS SCOAFundID,
			fs.ScoaCode AS SCOAFundCode ,
            fs.ScoaDesc AS SCOAFundDesc ,
			fs.NTSCOAID AS SCOAFundGUID , 
            fs.ScoaCode + ' ' + fs.ScoaDesc AS SCOAFundings ,
            ppi.BudgetAmount AS FUNDCurrentYearAmt ,
            ppi.BudgetAmountCurP1 AS FUNDCurrentP1YearAmt ,
            ppi.BudgetAmountCurP2 AS FUNDCurrentP2YearAmt ,
            cpi.ItemDescription ,
			css.ScoaID AS SCOAItemID,
            css.ScoaCode ,
			css.NTSCOAID AS SCOAItemGUID , 
            dbo.Const_SCOAItemFullDesc_fxn(css.ScoaID) AS ScoaShortDesc ,
            CASE WHEN ( css.ScoaCode LIKE 'IR%'
                        OR css.ScoaCode LIKE 'IL%'
                      ) THEN -ISNULL(ppi.BudgetAmount, 0)
                 ELSE ISNULL(ppi.BudgetAmount, 0)
            END AS ReqCurrentYearAmt ,
            CASE WHEN ( css.ScoaCode LIKE 'IR%'
                        OR css.ScoaCode LIKE 'IL%'
                      ) THEN -ISNULL(ppi.BudgetAmountCurP1, 0)
                 ELSE ISNULL(ppi.BudgetAmountCurP1, 0)
            END AS ReqCurrentYearP1Amt ,
            CASE WHEN ( css.ScoaCode LIKE 'IR%'
                        OR css.ScoaCode LIKE 'IL%'
                      ) THEN -ISNULL(ppi.BudgetAmountCurP2, 0)
                 ELSE ISNULL(ppi.BudgetAmountCurP2, 0)
            END AS ReqCurrentYearP2Amt ,
            0 AS ReqCurrentYearP3Amt ,
			0 AS IDPItemID ,
            '' AS IDP ,
            0 AS ShowColumn
    FROM    dbo.Plan_Project AS pp
            LEFT OUTER JOIN dbo.Const_Status AS cs ON cs.Status_ID = pp.ProjectStatus
            LEFT OUTER JOIN dbo.Plan_ProjectItem AS ppi ON pp.Project_ID = ppi.ProjectID
            LEFT OUTER JOIN dbo.Const_Division AS cd ON cd.Division_ID = ppi.DivisionId
            LEFT OUTER JOIN dbo.Const_Department AS dep ON cd.DepartmentID = dep.Department_ID
            LEFT OUTER JOIN dbo.Const_SCOA_Function_Structure AS func ON func.ScoaID = ppi.SCOAFunctionId
            LEFT OUTER JOIN dbo.Const_SCOA_Regional_Structure AS region ON region.ScoaID = ppi.SCOARegionId
            LEFT OUTER JOIN dbo.Const_SCOA_Costing_Structure AS costing ON costing.ScoaID = ppi.SCOACostingID
            LEFT OUTER JOIN dbo.Const_SCOA_Project_Structure AS project ON project.ScoaID = pp.ScoaProjectID
            LEFT OUTER JOIN dbo.Const_ProjectItem AS cpi ON ppi.ProjectItemID = cpi.ProjectItem_ID
            LEFT OUTER JOIN dbo.Const_SCOA_Structure AS css ON ppi.SCOAItemID = css.ScoaID
            LEFT OUTER JOIN dbo.Const_ProjectType AS cpt ON pp.ProjectTypeID = cpt.ProjectType_ID
            --LEFT OUTER JOIN dbo.IDP_Item AS idp ON idp.Item_ID = pp.IDPItemID
            LEFT OUTER JOIN dbo.Const_SCOA_Funds_Structure AS fs ON ppi.SCOAFundId = fs.ScoaID;


GO

/****** Object:  View [dbo].[PMS_ProjectBudget_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =========================================================
-- Author:		Chris Moodley
-- Create date: 08 September 2023
-- Description:	Return project budget for PMS module report
-- =========================================================

CREATE   VIEW [dbo].[PMS_ProjectBudget_vw]
AS
SELECT 
	pp.Project_ID, pp.ProjectName, PlanProjectItemID, pp.FinYear, pp.ScoaProjectID, ppi.SCOAItemID, ppi.SCOAFundId, ppi.DivisionId,
	ppi.SCOAFunctionId, ppi.SCOARegionId, ppi.SCOACostingID, ppi.BudgetAmount, ppi.BudgetAmountCurP1, ppi.BudgetAmountCurP2, pp.IsDeleted, 
	BudgetMonth1, BudgetMonth2, BudgetMonth3, BudgetMonth4, BudgetMonth5, BudgetMonth6,
	BudgetMonth7, BudgetMonth8, BudgetMonth9, BudgetMonth10, BudgetMonth11, BudgetMonth12, 
	SingleMultiYear, CapitalOperation, CreditDebit, ppi.PreviousReferenceId, ProjectStatus, ProjectItemID, ppi.HistoricalProjectCode
FROM     
	dbo.Plan_ProjectItem AS ppi INNER JOIN
		dbo.Plan_Project AS pp ON 
	pp.Project_ID = ppi.ProjectID LEFT JOIN
		(
			SELECT 
				PlanProjectItemID, MAX(BudgetMonth1) AS BudgetMonth1, MAX (BudgetMonth2) AS BudgetMonth2, MAX(BudgetMonth3) AS BudgetMonth3,
				MAX(BudgetMonth4) AS BudgetMonth4, MAX (BudgetMonth5) AS BudgetMonth5, MAX(BudgetMonth6) AS BudgetMonth6,
				MAX(BudgetMonth7) AS BudgetMonth7, MAX (BudgetMonth8) AS BudgetMonth8, MAX(BudgetMonth9) AS BudgetMonth9,
				MAX(BudgetMonth10) AS BudgetMonth10, MAX (BudgetMonth11) AS BudgetMonth11, MAX(BudgetMonth12) AS BudgetMonth12
			FROM
				( 
					SELECT 
						PlanProjectItemID, UnitPrice AS BudgetMonth1, NULL AS BudgetMonth2, NULL AS BudgetMonth3,
						NULL AS BudgetMonth4, NULL AS BudgetMonth5, NULL AS BudgetMonth6,
						NULL AS BudgetMonth7, NULL AS BudgetMonth8, NULL AS BudgetMonth9,
						NULL AS BudgetMonth10, NULL AS BudgetMonth11, NULL AS BudgetMonth12   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 7

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 8

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 9

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 10

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 11

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 12

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 1

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 2

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 3

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 4

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 5

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 6

		 ) MonthDataTable

		 GROUP BY PlanProjectItemID

	) MonthData  ON ppi.PlanProjectItem_ID = MonthData.PlanProjectItemID
                  
WHERE  (ISNULL(pp.IsDeleted, 0) <> 1)
GO

/****** Object:  View [dbo].[Section71_BudgetAdjustment_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 2017
-- Description:	Return values adjustment budget version deatils
-- 20181218 CM: Reference Plan_AdjustmentProject table 
-- 20190207 CM: Fix how data is returned and retrun adjustment values correctly
-- 20190425 CM: Return the AdjustmentTypeID for items adjusted in previous versions
-- 20191119 CM: Return unadjusted values
-- 20191201 CM: 24526 - Exclude projects that are not required for reporting
-- 20200306 CM: 29604 - Handle null ReferenceProject_ID
-- 20210309 CM: 60126 - Return papi.ProjectItemID as there exists exact SCOA combination and budget amounts that are being filtered out by the DISTINCT
-- 20220818 CM: 89917 - Return AdjustmentTypeID as adjType.Number
-- =============================================

CREATE   VIEW [dbo].[Section71_BudgetAdjustment_vw]
AS

SELECT DISTINCT  
	papi.AdjustmentVersionID AS AdjustmentBudgetVersion_ID, ReferenceProject_ID AS ProjectID, AdjustmentProjectName AS ProjectName, papi.ReferencePlanProjectItem_ID AS PlanProjectItemID, pap.FinYear, adjType.Number AS AdjustmentTypeID, pap.ScoaProjectID, SCOAItemID, SCOAFundId, DivisionId,
	SCOAFunctionId, SCOARegionId, SCOACostingID, ISNULL(AdjustedBudgetAmount, BudgetAmount) AS BudgetAmount, ISNULL(AdjustedBudgetAmountCurP1, BudgetAmountCurP1) AS BudgetAmountCurP1, ISNULL(AdjustedBudgetAmountCurP2, BudgetAmountCurP2) AS BudgetAmountCurP2, IsDeleted, 
	ISNULL(BudgetMonth1, 0) AS BudgetMonth1, ISNULL(BudgetMonth2, 0) AS BudgetMonth2, ISNULL(BudgetMonth3, 0) AS BudgetMonth3, 
	ISNULL(BudgetMonth4 ,0) AS BudgetMonth4, ISNULL(BudgetMonth5, 0) AS BudgetMonth5, ISNULL(BudgetMonth6, 0) AS BudgetMonth6,
	ISNULL(BudgetMonth7, 0) AS BudgetMonth7, ISNULL(BudgetMonth8, 0) AS BudgetMonth8, ISNULL(BudgetMonth9, 0) AS BudgetMonth9, 
	ISNULL(BudgetMonth10, 0) AS BudgetMonth10, ISNULL(BudgetMonth11, 0) AS BudgetMonth11, ISNULL(BudgetMonth12, 0) AS BudgetMonth12,
	SingleMultiYear, pap.CapitalOperation, CreditDebit,
	ISNULL(BudgetAmount, 0) AS BudgetAmountUnadjusted, ISNULL(BudgetAmountCurP1, 0) AS BudgetAmountUnadjustedCurP1, ISNULL(BudgetAmountCurP2, 0) AS BudgetAmountUnadjustedCurP2, papi.ProjectItemID
FROM 
	Plan_AdjustmentProject pap LEFT JOIN
		Plan_AdjustmentProjectItem papi ON
			pap.AdjustmentProject_ID = papi.AdjustmentProjectID LEFT JOIN
		(
			SELECT 
				BM1.PlanAdjustmentProjectItemID, BM1.AdjustmentVersionID AS AdjustmentBudgetVersionID,
				BM1.BudgetMonth AS BudgetMonth1, BM2.BudgetMonth AS BudgetMonth2, BM3.BudgetMonth AS BudgetMonth3, BM4.BudgetMonth AS BudgetMonth4,
				BM5.BudgetMonth AS BudgetMonth5, BM6.BudgetMonth AS BudgetMonth6, BM7.BudgetMonth AS BudgetMonth7, BM8.BudgetMonth AS BudgetMonth8,
				BM9.BudgetMonth AS BudgetMonth9, BM10.BudgetMonth AS BudgetMonth10, BM11.BudgetMonth AS BudgetMonth11, BM12.BudgetMonth AS BudgetMonth12
			FROM
				(SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 7) BM1
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 8) BM2 ON BM1.PlanAdjustmentProjectItemID = BM2.PlanAdjustmentProjectItemID AND BM1.AdjustmentVersionID = BM2.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 9) BM3 ON BM2.PlanAdjustmentProjectItemID = BM3.PlanAdjustmentProjectItemID AND BM2.AdjustmentVersionID = BM3.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 10) BM4 ON BM3.PlanAdjustmentProjectItemID = BM4.PlanAdjustmentProjectItemID AND BM3.AdjustmentVersionID = BM4.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 11) BM5 ON BM4.PlanAdjustmentProjectItemID = BM5.PlanAdjustmentProjectItemID AND BM4.AdjustmentVersionID = BM5.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 12) BM6 ON BM5.PlanAdjustmentProjectItemID = BM6.PlanAdjustmentProjectItemID AND BM5.AdjustmentVersionID = BM6.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 1) BM7 ON BM6.PlanAdjustmentProjectItemID = BM7.PlanAdjustmentProjectItemID AND BM6.AdjustmentVersionID = BM7.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 2) BM8 ON BM7.PlanAdjustmentProjectItemID = BM8.PlanAdjustmentProjectItemID AND BM7.AdjustmentVersionID = BM8.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 3) BM9 ON BM8.PlanAdjustmentProjectItemID = BM9.PlanAdjustmentProjectItemID AND BM8.AdjustmentVersionID = BM9.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 4) BM10 ON BM9.PlanAdjustmentProjectItemID = BM10.PlanAdjustmentProjectItemID AND BM9.AdjustmentVersionID = BM10.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 5) BM11 ON BM10.PlanAdjustmentProjectItemID = BM11.PlanAdjustmentProjectItemID AND BM10.AdjustmentVersionID = BM11.AdjustmentVersionID
				LEFT JOIN (SELECT PlanAdjustmentProjectItemID, AdjustmentVersionID, ISNULL(AdjustedUnitPrice, UnitPrice) AS BudgetMonth FROM Plan_AdjustmentProjectItemMonth WHERE MonthID = 6) BM12 ON BM11.PlanAdjustmentProjectItemID = BM12.PlanAdjustmentProjectItemID AND BM11.AdjustmentVersionID = BM12.AdjustmentVersionID


	) MonthData  ON papi.PlanAdjustmentProjectItem_ID = MonthData.PlanAdjustmentProjectItemID AND papi.AdjustmentVersionID = MonthData.AdjustmentBudgetVersionID LEFT JOIN

	Plan_AdjustmentBudgetVersion abv ON
		abv.AdjustmentBudgetVersion_ID = pap.AdjustmentVersionID LEFT JOIN
	(
		SELECT 
			papi.PlanAdjustmentProjectItem_ID, papi.ReferencePlanProjectItem_ID, AdjutmentType, Number
		FROM
			Plan_AdjustmentProjectItem papi 
				INNER JOIN
					(SELECT ReferencePlanProjectItem_ID, MAX(PlanAdjustmentProjectItem_ID) AS PlanAdjustmentProjectItemIDMax
					FROM Plan_AdjustmentProjectItem papi
					WHERE AdjutmentType IS NOT NULL AND ReferencePlanProjectItem_ID IS NOT NULL
					GROUP BY ReferencePlanProjectItem_ID) papiMax ON papi.PlanAdjustmentProjectItem_ID = papiMax.PlanAdjustmentProjectItemIDMax
				LEFT JOIN
					Const_PlanAdjustmentType_sys adjType ON
						papi.AdjutmentType = adjType.AdjustmentType_ID
		UNION 

		SELECT 
			papi.PlanAdjustmentProjectItem_ID, papiMax.ReferencePlanProjectItem_ID, AdjutmentType, Number
		FROM
			Plan_AdjustmentProjectItem papi 
				INNER JOIN
					(SELECT papi2.ReferencePlanProjectItem_ID, MAX(papi.PlanAdjustmentProjectItem_ID) AS PlanAdjustmentProjectItemIDMax
					FROM Plan_AdjustmentProjectItem papi INNER JOIN Plan_AdjustmentProjectItem papi2 ON papi.PlanAdjustmentProjectItem_ID = papi2.AdjustmentID
					WHERE papi.AdjutmentType IS NOT NULL AND papi.ReferencePlanProjectItem_ID IS NULL 
					GROUP BY papi2.ReferencePlanProjectItem_ID) papiMax ON papi.PlanAdjustmentProjectItem_ID = papiMax.PlanAdjustmentProjectItemIDMax
				LEFT JOIN
					Const_PlanAdjustmentType_sys adjType ON
						papi.AdjutmentType = adjType.AdjustmentType_ID
		UNION	 

		SELECT 
			papi.PlanAdjustmentProjectItem_ID, papi.ReferencePlanProjectItem_ID, papi.AdjutmentType, Number
		FROM
			Plan_AdjustmentProjectItem papi LEFT JOIN
					Plan_AdjustmentProjectItem papi2 ON papi.PlanAdjustmentProjectItem_ID = papi2.AdjustmentId LEFT JOIN
					Const_PlanAdjustmentType_sys adjType ON
						papi.AdjutmentType = adjType.AdjustmentType_ID
		WHERE 
			papi.AdjutmentType IS NOT NULL AND papi.ReferencePlanProjectItem_ID IS NULL AND papi.AdjustmentID IS NULL AND papi2.AdjustmentId IS NULL

	) projAdjType ON
		papi.ReferencePlanProjectItem_ID = projAdjType.ReferencePlanProjectItem_ID
	 LEFT JOIN
		Const_PlanAdjustmentType_sys adjType ON
			papi.AdjutmentType = adjType.AdjustmentType_ID 
WHERE  
	(ISNULL(IsDeleted, 0) <> 1) 
	AND Comments like '%Adjustment Budget approved by Council%'
	AND ProjectStatus <> 4
	AND ISNULL(ReferenceProject_ID, -1) NOT IN (SELECT ProjectID FROM dbo.Plan_ProjectReportExclude)
GO

/****** Object:  View [dbo].[Section71_BudgetOriginal_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 2017
-- Description:	Return original budget
-- 20191130 CM: Exclude projects not required for reporting
-- =============================================

CREATE VIEW [dbo].[Section71_BudgetOriginal_vw]
AS
SELECT 
	BudgetVersion_ID, pp.Project_ID, pp.ProjectName, bvd.PlanProjectItemID, bvd.FinYear, bvd.ScoaProjectID, bvd.SCOAItemID, bvd.SCOAFundId, bvd.DivisionId,
	bvd.SCOAFunctionId, bvd.SCOARegionId, bvd.SCOACostingID, bvd.BudgetAmount, bvd.BudgetAmountCurP1, bvd.BudgetAmountCurP2, IsDeleted, 
	BudgetMonth1, BudgetMonth2, BudgetMonth3, BudgetMonth4, BudgetMonth5, BudgetMonth6,
	BudgetMonth7, BudgetMonth8, BudgetMonth9, BudgetMonth10, BudgetMonth11, BudgetMonth12, 
	SingleMultiYear, bvd.CapitalOperation, CreditDebit
FROM     
	Plan_BudgetVersion AS bv INNER JOIN
		Plan_BudgetVersionDetail AS bvd ON 
			bv.BudgetVersion_ID = bvd.BudgetVersionID INNER JOIN
		Plan_Project pp ON 
			bvd.ProjectID = pp.Project_ID LEFT JOIN
		Plan_projectItem ppi ON
			bvd.PlanProjectItemID = ppi.PlanProjectItem_ID LEFT JOIN
		(
			SELECT 
				PlanProjectItemID, BudgetVersionID, MAX(BudgetMonth1) AS BudgetMonth1, MAX (BudgetMonth2) AS BudgetMonth2, MAX(BudgetMonth3) AS BudgetMonth3,
				MAX(BudgetMonth4) AS BudgetMonth4, MAX (BudgetMonth5) AS BudgetMonth5, MAX(BudgetMonth6) AS BudgetMonth6,
				MAX(BudgetMonth7) AS BudgetMonth7, MAX (BudgetMonth8) AS BudgetMonth8, MAX(BudgetMonth9) AS BudgetMonth9,
				MAX(BudgetMonth10) AS BudgetMonth10, MAX (BudgetMonth11) AS BudgetMonth11, MAX(BudgetMonth12) AS BudgetMonth12
			FROM
				( 
					SELECT 
						PlanProjectItemID, BudgetVersionID, UnitPrice AS BudgetMonth1, NULL AS BudgetMonth2, NULL AS BudgetMonth3,
						NULL AS BudgetMonth4, NULL AS BudgetMonth5, NULL AS BudgetMonth6,
						NULL AS BudgetMonth7, NULL AS BudgetMonth8, NULL AS BudgetMonth9,
						NULL AS BudgetMonth10, NULL AS BudgetMonth11, NULL AS BudgetMonth12   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 7

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 8

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 9

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 10

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 11

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 12

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 1

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 2

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 3

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 4

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 5

					UNION ALL

					SELECT 
						PlanProjectItemID, BudgetVersionID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice   
					FROM
						Plan_BudgetVersionMonths 
					WHERE
						MonthID = 6

		 ) MonthDataTable

		 GROUP BY PlanProjectItemID, BudgetVersionID

	) MonthData  ON bvd.PlanProjectItemID = MonthData.PlanProjectItemID AND bvd.BudgetVersionID = MonthData.BudgetVersionID
                  
WHERE  (ISNULL(IsDeleted, 0) <> 1) AND ((bvd.BudgetAmount <> 0) OR (bvd.BudgetAmountCurP1 <> 0) OR (bvd.BudgetAmountCurP2 <> 0))
		AND Project_ID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)
GO

/****** Object:  View [dbo].[Section71_DepartmentDivision_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[Section71_DepartmentDivision_vw]
AS
WITH DeptDivGroup(DivisionParentID, Division_ID, DivisionDesc, DivisionCode, DepartmentID) AS (SELECT e.DivisionParentID, e.Division_ID, e.DivisionDesc, e.DivisionCode, e.DivisionParentID AS Expr1
                                                                                                                                                                                                  FROM     dbo.Const_Division AS e INNER JOIN
                                                                                                                                                                                                                 dbo.Section71_OrgStructureMainVote AS m ON e.DepartmentID = m.DepartmentID
                                                                                                                                                                                                  WHERE  (e.DivisionParentID IN
                                                                                                                                                                                                                        (SELECT DivisionID
                                                                                                                                                                                                                         FROM      dbo.Section71_OrgStructureSubVote))
                                                                                                                                                                                                  UNION ALL
                                                                                                                                                                                                  SELECT e.DivisionParentID, e.Division_ID, e.DivisionDesc, e.DivisionCode, d.DepartmentID
                                                                                                                                                                                                  FROM     dbo.Const_Division AS e INNER JOIN
                                                                                                                                                                                                                    DeptDivGroup AS d ON e.DivisionParentID = d.Division_ID)
    SELECT DivisionParentID, Division_ID, DivisionDesc, DivisionCode, DepartmentID
    FROM     DeptDivGroup AS DeptDivGroup_1
GO

/****** Object:  View [dbo].[Section71_Ledger_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 2017
-- Description:	Return transactions excluding projects not required for reporting
-- 200724 ChrisM: 38726 - Return TransactionTypeID
-- 210205 ChrisM: 54899 - Exclude ledger entries of contra legs of projects in Plan_ProjectReportExclude
-- 210319 ChrisM: 60815 - Include ledger entries of contra legs of projects in Plan_ProjectReportExclude
-- =============================================

CREATE VIEW [dbo].[Section71_Ledger_vw]
AS

	SELECT        
		GenLedger_ID, ProcessingMonth, Debit, Credit, SCOAFundsID, SCOARegionID, SCOACostingID, SCOAProjectID, SCOAFunctionID, SCOAItemID, DivisionID, ProjectID, PlanProjectItemID, FinYear, TransactionTypeID
	FROM          
		Led_GeneralLedger
	WHERE	  
		ProjectID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)
GO

/****** Object:  View [dbo].[Section71_ProjectBudget_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 2017
-- Description:	Return virements per plan project item ID
-- 20191130 CM: Exclude projects not required for reporting
-- =============================================

CREATE VIEW [dbo].[Section71_ProjectBudget_vw]
AS
SELECT 
	pp.Project_ID, pp.ProjectName, PlanProjectItemID, pp.FinYear, pp.ScoaProjectID, ppi.SCOAItemID, ppi.SCOAFundId, ppi.DivisionId,
	ppi.SCOAFunctionId, ppi.SCOARegionId, ppi.SCOACostingID, ppi.BudgetAmount, ppi.BudgetAmountCurP1, ppi.BudgetAmountCurP2, pp.IsDeleted, 
	BudgetMonth1, BudgetMonth2, BudgetMonth3, BudgetMonth4, BudgetMonth5, BudgetMonth6,
	BudgetMonth7, BudgetMonth8, BudgetMonth9, BudgetMonth10, BudgetMonth11, BudgetMonth12, 
	SingleMultiYear, CapitalOperation, CreditDebit
FROM     
	dbo.Plan_ProjectItem AS ppi INNER JOIN
		dbo.Plan_Project AS pp ON 
	pp.Project_ID = ppi.ProjectID LEFT JOIN
		(
			SELECT 
				PlanProjectItemID, MAX(BudgetMonth1) AS BudgetMonth1, MAX (BudgetMonth2) AS BudgetMonth2, MAX(BudgetMonth3) AS BudgetMonth3,
				MAX(BudgetMonth4) AS BudgetMonth4, MAX (BudgetMonth5) AS BudgetMonth5, MAX(BudgetMonth6) AS BudgetMonth6,
				MAX(BudgetMonth7) AS BudgetMonth7, MAX (BudgetMonth8) AS BudgetMonth8, MAX(BudgetMonth9) AS BudgetMonth9,
				MAX(BudgetMonth10) AS BudgetMonth10, MAX (BudgetMonth11) AS BudgetMonth11, MAX(BudgetMonth12) AS BudgetMonth12
			FROM
				( 
					SELECT 
						PlanProjectItemID, UnitPrice AS BudgetMonth1, NULL AS BudgetMonth2, NULL AS BudgetMonth3,
						NULL AS BudgetMonth4, NULL AS BudgetMonth5, NULL AS BudgetMonth6,
						NULL AS BudgetMonth7, NULL AS BudgetMonth8, NULL AS BudgetMonth9,
						NULL AS BudgetMonth10, NULL AS BudgetMonth11, NULL AS BudgetMonth12   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 7

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 8

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 9

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 10

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 11

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 12

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 1

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 2

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 3

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 4

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice, NULL   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 5

					UNION ALL

					SELECT 
						PlanProjectItemID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UnitPrice   
					FROM
						Plan_ProjectItemMonth 
					WHERE
						MonthID = 6

		 ) MonthDataTable

		 GROUP BY PlanProjectItemID

	) MonthData  ON ppi.PlanProjectItem_ID = MonthData.PlanProjectItemID
                  
WHERE  (ISNULL(pp.IsDeleted, 0) <> 1) AND ((BudgetAmount <> 0) OR (BudgetAmountCurP1 <> 0) OR (BudgetAmountCurP2 <> 0))
	   AND Project_ID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)
GO

/****** Object:  View [dbo].[Section71_Virement_vw]    Script Date: 2026/03/11 4:16:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 2017
-- Description:	Return virement per plan project item ID
-- 20191130 CM: Exclude projects not required for reporting
-- 20191204 CM: Fix issue where rejected or unapproved virements were being returned
-- 20200415 CM: 32192 - Ensure that virements are not duplicated
-- 20200611 CM: 35007 - Remove condition where FromProjectID <> ToProjectID as virements can occur within same project
-- 20220308 CM: 84301 - Handle scenario where virements are partially captured and there are no approval/rejections
-- =============================================

CREATE VIEW [dbo].[Section71_Virement_vw]
AS 
SELECT 
		 v.*
		,ScoaProjectID
		,ScoaItemID
		,ScoaFundID
		,DivisionID
		,ScoaFunctionID
		,ScoaRegionID
		,ScoaCostingID
		,SingleMultiYear
		,CapitalOperation
		,CreditDebit 
		,isDeleted
	FROM
		(
			SELECT  
				SUM(virementFromTo.VirementAmount) AS TotalVirementAmount, virementFromTo.PlanProjectItem_ID, virementFromTo.ProjectID, virementFromTo.FinYear 
			FROM 
				(
					SELECT -ISNULL(V.FromVirementAmount, 0) AS VirementAmount, PPIFrom.PlanProjectItem_ID,PPIFrom.ProjectID,V.VirementId, PrjFrom.FinYear
					FROM  dbo.Plan_Project PrjFrom
							INNER JOIN dbo.Plan_ProjectItem PPIFrom ON PPIFrom.ProjectID = PrjFrom.Project_ID
							INNER JOIN dbo.Plan_Virements V ON V.FromProjectId = PrjFrom.Project_ID
							AND V.FromSCOAProjectID = PrjFrom.ScoaProjectID AND v.FromSCOAFunctionId = PPIFrom.SCOAFunctionId
							AND v.FromDivisionId = PPIFrom.DivisionId AND V.FromSCOAFundID = PPIFrom.SCOAFundId
							AND v.FromSCOARegion = PPIFrom.SCOARegionId AND v.FromSCOAItem = PPIFrom.SCOAItemID
							AND v.FromSCOACostingId = PPIFrom.SCOACostingID 
					UNION 
					SELECT ISNULL(V.ToVirementAmount, 0) AS VirementAmount, PPITo.PlanProjectItem_ID,PPITo.ProjectID,V.VirementId, PrjTo.FinYear
					FROM  dbo.Plan_Project PrjTo
						INNER JOIN dbo.Plan_ProjectItem PPITo ON PPITo.ProjectID = PrjTo.Project_ID
						INNER JOIN dbo.Plan_Virements V ON V.ToProjectId = PrjTo.Project_ID
						AND V.ToSCOAProjectID = PrjTo.ScoaProjectID AND v.ToSCOAFunctionId = PPITo.SCOAFunctionId
						AND v.ToDivisionId = PPITo.DivisionId AND V.ToSCOAFundID = PPITo.SCOAFundId
						AND v.ToSCOARegion = PPITo.SCOARegionId AND v.ToSCOAItem = PPITo.SCOAItemID
						AND v.ToSCOACostingId = PPITo.SCOACostingID 
				) AS virementFromTo 
			WHERE virementFromTo.VirementID NOT IN (SELECT VirementID FROM dbo.Plan_VirementApprovalRejections WHERE IsRejected = 1 UNION SELECT VirementID FROM Plan_Virements where VirementID NOT IN (SELECT VirementID FROM Plan_VirementApprovalRejections))
			GROUP BY virementFromTo.PlanProjectItem_ID,ProjectID, FinYear
		) v

		INNER JOIN Plan_ProjectItem ppi ON v.PlanProjectItem_ID = ppi.PlanProjectItem_ID
		INNER JOIN Plan_Project p ON ppi.ProjectID = p.Project_ID
	WHERE  
		ISNULL(isDeleted, 0) <> 1
		AND v.ProjectID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)
GO

EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[20] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "pp"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 265
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "cs"
            Begin Extent = 
               Top = 6
               Left = 303
               Bottom = 136
               Right = 473
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ppi"
            Begin Extent = 
               Top = 6
               Left = 511
               Bottom = 136
               Right = 715
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "cd"
            Begin Extent = 
               Top = 6
               Left = 753
               Bottom = 136
               Right = 931
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "dep"
            Begin Extent = 
               Top = 6
               Left = 969
               Bottom = 136
               Right = 1149
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "func"
            Begin Extent = 
               Top = 6
               Left = 1187
               Bottom = 136
               Right = 1419
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "region"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 268
               Right = 270
            End
            DisplayFlags = 280
            TopColumn = 0
   ' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'Plan_ProjectBudget_vw'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane2', @value=N'      End
         Begin Table = "costing"
            Begin Extent = 
               Top = 138
               Left = 308
               Bottom = 268
               Right = 540
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "project"
            Begin Extent = 
               Top = 138
               Left = 578
               Bottom = 268
               Right = 810
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "cpi"
            Begin Extent = 
               Top = 138
               Left = 848
               Bottom = 268
               Right = 1021
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "css"
            Begin Extent = 
               Top = 138
               Left = 1059
               Bottom = 268
               Right = 1291
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "cpt"
            Begin Extent = 
               Top = 138
               Left = 1329
               Bottom = 268
               Right = 1520
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "idp"
            Begin Extent = 
               Top = 270
               Left = 38
               Bottom = 400
               Right = 235
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "fs"
            Begin Extent = 
               Top = 270
               Left = 273
               Bottom = 400
               Right = 505
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'Plan_ProjectBudget_vw'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=2 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'Plan_ProjectBudget_vw'
GO


