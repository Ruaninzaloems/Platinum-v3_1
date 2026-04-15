/****** Object:  UserDefinedFunction [dbo].[Plan_AdjustmentFundingSourceBudgetPerYear_fxn]    Script Date: 2026/03/11 4:28:08 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:	Sahil Nagpal
-- Description: Returns table of ammount required for a project for the given financial year  
-- Calls: select * from Plan_FundingSourceBudgetPerYear_fxn('2016/2017','2016/2017','C')
-- 30-05-2019 By SNagpal: #89269 - Add multiyear concept to SCOA segments based upon financial year
-- 10-03-2023 By CM: 98477 - Look at adjustment project item tables to calculate allocated funds
-- =============================================================================  
CREATE   FUNCTION [dbo].[Plan_AdjustmentFundingSourceBudgetPerYear_fxn]    
(  
	@FinYear nvarchar(9)  ,
	@CurFinYear nvarchar(9),
	@BudgetType VARCHAR(10),
	@AdjustmentVersionId INT,
	@AdjustmentFundingVersionId INT
)  
RETURNS 
@tblTotals TABLE   
(   
	ParentID int,  
	SCOAFundID int, 
	SCOADesc nvarchar(700),  
	ScoaCode nvarchar(50),
	ScoaShortDesc nvarchar(200),
	RemainingFundAmount DECIMAL(16,2)
)  

AS  
BEGIN   

	DECLARE @tmpTbl AS TABLE   
	(   
		 ParentID int,  
		 SCOAFundID int, 
		 SCOADesc nvarchar(700),  
		 ScoaCode nvarchar(50),
		 ScoaShortDesc nvarchar(200),
		 RemainingFundAmount DECIMAL(16,2)
	)

	DECLARE @CurFinYearAsNumber INT = CAST(SUBSTRING(@CurFinYear, 1, 4) AS INT)
	DECLARE @FinYearAsNumber INT = CAST(SUBSTRING(@FinYear, 1, 4) AS INT)

	INSERT INTO @tmpTbl   
	SELECT 
		 availFund.ParentID
		,availFund.SCOAFundID
		,availFund.SCOADesc
		,availFund.ScoaCode 
		,availFund.ScoaShortDesc
		,(ISNULL(availFund.AvailFundAmt,0) - ISNULL(allocatedFund.AllocFundAmount,0))
	FROM
		(
			SELECT f.ScoaParentID as ParentID
			 ,f.ScoaID as SCOAFundID
			 ,f.ScoaDesc + ' (' + left(f.PostingLevel,1) + '/ ' + f.ScoaCode + ')' as SCOADesc
			 ,f.ScoaCode 
			 ,f.ScoaShortDesc
			 ,ISNULL(SUM(ISNULL(d.FundingSourceBudget,0)),0) as AvailFundAmt
			 FROM Plan_AdjustmentFundingSourceBudget_Detail d
			INNER JOIN Plan_AdjustmentFundingSourceBudget_Header h ON d.AdjustmentFundingSourceBudgetHeaderID=h.AdjustmentFundingSourceBudgetHeader_ID
			INNER JOIN dbo.Const_Scoa_Funds_Structure_ByYear(@CurFinYear) f ON d.ScoaID=f.ScoaID
			WHERE 
			 h.FinancialYear = @FinYear AND d.AdjustmentFundingVersionId= @AdjustmentFundingVersionId
			 GROUP BY f.ScoaParentID 
			 ,f.ScoaID 
			 ,f.ScoaDesc ,f.PostingLevel,f.ScoaCode 
			 ,f.ScoaCode 
			 ,f.ScoaShortDesc
		) availFund

	LEFT JOIN

	(
		SELECT  ScoaFundID, 
			ISNULL(CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber THEN SUM(ISNULL(AdjustedBudgetAmount, BudgetAmount))
							ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 1 THEN SUM(ISNULL(AdjustedBudgetAmountCurP1, BudgetAmountCurP1))
								ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 2 THEN SUM(ISNULL(AdjustedBudgetAmountCurP2, BudgetAmountCurP2))
								END
							END
						END, 0) AllocFundAmount
		FROM    Plan_AdjustmentProjectItem ppi
				INNER JOIN Plan_AdjustmentProject pp ON ppi.AdjustmentProjectID = pp.AdjustmentProject_ID 
		WHERE   pp.AdjustmentVersionId = @AdjustmentVersionId
				AND CapitalOperation IN (0, 1, 4)
				AND ISNULL(pp.isDeleted, 0) <> 1
		GROUP BY ScoaFundID
	) allocatedFund on availFund.SCOAFundID=allocatedFund.ScoaFundID

	WHERE  ISNULL(AvailFundAmt,0)-ISNULL(AllocFundAmount,0)>=0

	IF (@BudgetType = 'C')
	BEGIN
		INSERT INTO @tblTotals
		SELECT t.* FROM @tmpTbl t
		INNER JOIN dbo.Const_PlanSCOAFundCapital cps ON t.SCOAFundID = cps.ScoaFundId
		WHERE cps.IsEnable=1 AND cps.FinYear= @CurFinYear
	END
	ELSE IF (@BudgetType = 'O')
	BEGIN
		INSERT INTO @tblTotals
		SELECT t.* FROM @tmpTbl t
		INNER JOIN dbo.Const_PlanSCOAFundOperational cpso ON t.SCOAFundID = cpso.ScoaFundId
		WHERE cpso.IsEnable=1 AND cpso.FinYear= @CurFinYear
	END
	ELSE
	BEGIN
		INSERT INTO @tblTotals
		SELECT t.* FROM @tmpTbl t
	END


RETURN
END

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_BudgetConsumptionDetail_fxn]    Script Date: 2026/03/11 4:28:08 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 06 August 2020
-- Description:	Return budget consumption details
-- NP - 26 AUG 2020 - WI 42288
-- 20 Jan 2021 : Savvin M. : #53777 Delta01 Budget Consumption - Csv export issue(s)
--23-Feb-2021 : MS : #57965 Delta 01 Payment - Sundry Invoice payment issues
-- 15 Mar 2021 : Savvin M. : #59527 UAT- Debit and credit note Budget consumption
-- 25 Mar 2021 : Savvin M. : #60512 UAT Consumption - Project initiation shows budget for 3 financial years
-- 02 Apr 2021 : Mikolenko R. : #63055 UAT budget consumption detail and incorrect on multiyear req and transactions
-- 12 Sept 2021 : SNagpal : #64238 UAT: All lines on Order not displayed after contract is rolled forward, budget incorrect
-- 16 Sept 2021 : NP : 74428 - UAT - Budget Consumption Summary Report Incorrectly Displaying - Note that the report must only display the last consuming record
-- 06 Oct 2021 : MS #75041 UAT- Budget Consumption summary Incorrect-transactions on budget migrated contract
-- 06 Oct 2021 : MS #75041 UAT- Budget Consumption summary Incorrect-transactions on budget migrated contract - Behalf of him
-- 12 Oct 2021 : MS #77193 - Rollback change as per discussion with Nicola, Nirav
-- 22 Oct 2021 : CM #77547 - Fix how tranasaction amount is calculated on CSR approval for summary report
-- 06 Dec 2021 : CM #75106 - Change join to OUTER APPLY to return document details for imported/consolidated entries
-- 13 Aug 2024 : NP - 114183 - Budget consumption summary is incorrect on issue to capital expense
-- =============================================
CREATE FUNCTION [dbo].[Plan_BudgetConsumptionDetail_fxn]
(
	-- Add the parameters for the function here
	@PlanProjectItemID INT,
	@StartMonth INT,
	@EndMonth INT,
	@IsDetailRpt INT
)
RETURNS @BudgetConsumptionDetail TABLE
(
	-- Add the column definitions for the TABLE variable here
	BudgetConsumption_ID INT,
	TransactionDate	VARCHAR(50),
	TransactionAmount DECIMAL(18,2),	
	DocumentNumber VARCHAR(1000),	
	TransactionType	VARCHAR(1000),	
	BudgetTransactionType VARCHAR(1000),	
	PlanProjectItemID INT,
	DateCaptured DATETIME
)
AS
BEGIN
	-- Multiyear amount should not be considered for Project Initiation records
	DECLARE @ProjectInitiationID INT = 200;

	-- Fill the table variable with the rows for your result set
	IF (@IsDetailRpt = 0)
	BEGIN
		DECLARE @RequestType_ID INT, @Status_ID INT
		SELECT @RequestType_ID = RequestType_ID FROM Const_RequestType_sys where RequestDesc = 'Inventory Request'
		SELECT @Status_ID = Status_ID FROM Const_Status where StatusDesc = 'Approved' and UsedBy = 'InvenIssue'
		DECLARE @IssueToCapitalExpenseRequisition TABLE  
		( 
			RequisitionNumber NVARCHAR(100)
		)

		INSERT INTO @IssueToCapitalExpenseRequisition
		SELECT DISTINCT R.RequisitionNumber FROM SCM_Requisition R 
			INNER JOIN SCM_RequisitionServiceDetails RSD ON R.Requisition_ID = RSD.RequisitionID
			INNER JOIN SCM_GeneralRequest GR ON R.Requisition_ID = GR.SCMRequisitionID
			INNER JOIN Inven_InventoryIssue I ON I.InvRequisitionID = GR.InvRequisitionID
			INNER JOIN Inven_InventoryIssueLineItem ILI ON I.Issue_ID = ILI.IssueID
		WHERE GR.RequestTypeID = @RequestType_ID and I.Status = @Status_ID and 
			  ILI.IssueToCapitalExpense = 1 and RSD.PlanProjectItemId = @PlanProjectItemID

		INSERT INTO	@BudgetConsumptionDetail
		SELECT
			MIN(Q.BudgetConsumption_ID) AS BudgetConsumption_ID,
			CONVERT(VARCHAR, MIN(Q.DateCaptured), 103) AS TransactionDate,
			SUM(Q.TransactionAmount) AS TransactionAmount,
			Q.DocumentNumber,
			BCP.BudgetConsumptionProcessDesc AS TransactionType,
			dbo.Plan_GetBudgetTransactionTypeDesc(Q.BudgetConsumptionProcessID, Q.BudgetTransactionTypeID) AS BudgetTransactionType,
			Q.PlanProjectItemID,
			MIN(Q.DateCaptured) AS DateCaptured
		FROM
		(
			SELECT 
				BC.BudgetConsumption_ID,
				BC.BudgetConsumptionProcessID,
				BC.BudgetTransactionTypeID,
				-(CASE WHEN TransactionTableName  = 'SCM_ContractServiceRequestDetails' AND BudgetConsumptionProcessID = 129 THEN ISNULL(ABS(ConsumingTransactionAmount), 0) ELSE ISNULL(BC.CurrentlyConsumedAmount, 0) END + IIF(BC.BudgetConsumptionProcessID = @ProjectInitiationID, 0, ISNULL(BC.CurrentlyConsumedAmountMultiyear, 0))) AS TransactionAmount,
				BC.InitialLine,
				docDetail.DocNumber DocumentNumber,
				BC.DateCaptured,
				BC.PlanProjectItemID
			FROM
				(	
					SELECT 
						MIN(BC.BudgetConsumption_ID) AS BudgetConsumption_ID,
						BC.InitialLine
					FROM
						Plan_BudgetConsumption BC 
					WHERE 
						BC.PlanProjectItemID = @PlanProjectItemID
						AND BC.ProcessingMonth BETWEEN @StartMonth AND @EndMonth
						AND ISNULL(BC.CurrentlyConsumedAmount, 0) + IIF(BC.BudgetConsumptionProcessID = @ProjectInitiationID, 0, ISNULL(BC.CurrentlyConsumedAmountMultiyear, 0)) != 0
					GROUP BY BC.InitialLine
				) IL
				INNER JOIN Plan_BudgetConsumption BC 
					ON IL.InitialLine = BC.InitialLine
				OUTER APPLY Plan_GetBudgetDocumentDetail(BC.TransactionTableName, BC.PK_TransactionID) docDetail
			WHERE 
				BC.PlanProjectItemID = @PlanProjectItemID
				AND BC.ProcessingMonth BETWEEN @StartMonth AND @EndMonth
				AND ((CASE WHEN docDetail.DocNumber LIKE 'PI%' THEN ABS(ISNULL(BC.CurrentlyConsumedAmount, 0)) ELSE
                (ISNULL(BC.CurrentlyConsumedAmount, 0) + IIF(BC.BudgetConsumptionProcessID = @ProjectInitiationID, 0, ISNULL(BC.CurrentlyConsumedAmountMultiyear, 0))) END)) != 0
		) Q
		LEFT JOIN Const_BudgetConsumptionProcess_Sys BCP 
			ON Q.BudgetConsumptionProcessID = BCP.BudgetConsumptionProcess_ID
		WHERE Q.DocumentNumber NOT IN ( SELECT RequisitionNumber FROM @IssueToCapitalExpenseRequisition )
		GROUP BY
			Q.DocumentNumber,
			BCP.BudgetConsumptionProcessDesc,
			Q.BudgetConsumptionProcessID,
			Q.BudgetTransactionTypeID,
			Q.PlanProjectItemID

	END
	ELSE
	BEGIN
		
		INSERT INTO	@BudgetConsumptionDetail
		SELECT
			pbc.BudgetConsumption_ID,
			CONVERT(VARCHAR, pbc.DateCaptured, 103) TransactionDate,
			CASE 
				WHEN pbc.BudgetTransactionTypeID = 6 THEN AdjustedTansactionAmount 
				ELSE ConsumingTransactionAmount + IIF(pbc.BudgetConsumptionProcessID = @ProjectInitiationID, 0, ISNULL(ConsumingTransactionAmountMultiyear, 0)) END TransactionAmount,
			ISNULL(docDetail.DocNumber, pbc.TransactionTableName + '_' + CONVERT(VARCHAR, pbc.PK_TransactionID)) DocumentNumber,
			bcp.BudgetConsumptionProcessDesc TransactionType,
			dbo.Plan_GetBudgetTransactionTypeDesc(pbc.BudgetConsumptionProcessID, pbc.BudgetTransactionTypeID) AS BudgetTransactionType,
			PlanProjectItemID,
			pbc.DateCaptured
		FROM
			Plan_BudgetConsumption pbc
			LEFT JOIN Const_BudgetConsumptionProcess_Sys bcp ON pbc.BudgetConsumptionProcessID = bcp.BudgetConsumptionProcess_ID
			OUTER APPLY Plan_GetBudgetDocumentDetail(pbc.TransactionTableName, pbc.PK_TransactionID) docDetail
		WHERE 
			PlanProjectItemID = @PlanProjectItemID
			AND ProcessingMonth BETWEEN @StartMonth AND @EndMonth
			AND ConsumingTransactionAmount + IIF(pbc.BudgetConsumptionProcessID = @ProjectInitiationID, 0, ISNULL(ConsumingTransactionAmountMultiyear, 0)) != 0

	END

	RETURN 
END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_FundingSourceBudgetAvailableAmtPerYear_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



-- =============================================
-- Author:		Jignesh Prajapati
-- Create date: 14/03/2016
-- Description:	Get Fund Available Amount
-- =============================================
CREATE FUNCTION [dbo].[Plan_FundingSourceBudgetAvailableAmtPerYear_fxn] ( @FinYear NVARCHAR(9) )
RETURNS @tblTotals TABLE
    (
      ParentID INT ,
      SCOAFundID INT ,
      SCOADesc NVARCHAR(700) ,
      ScoaCode NVARCHAR(50) ,
      ScoaShortDesc NVARCHAR(200) ,
      AvailableAmt DECIMAL(16, 2)
    )
AS
    BEGIN   
        INSERT  INTO @tblTotals
                SELECT  availFund.ParentID ,
                        availFund.SCOAFundID ,
                        availFund.SCOADesc ,
                        availFund.ScoaCode ,
                        availFund.ScoaShortDesc ,
                        ISNULL(AvailFundAmt, 0) - ISNULL(AllocFundAmount, 0)
                FROM    ( SELECT    f.ScoaParentID AS ParentID ,
                                    f.ScoaID AS SCOAFundID ,
                                    f.ScoaDesc + ' (' + LEFT(f.PostingLevel, 1)
                                    + '/ ' + f.ScoaCode + ')' AS SCOADesc ,
                                    f.ScoaCode ,
                                    f.ScoaShortDesc ,
                                    SUM(d.FundingSourceBudget) AS AvailFundAmt
                          FROM      Plan_FundingSourceBudget_Detail d
                                    INNER JOIN Plan_FundingSourceBudget_Header h ON d.FundingSourceBudgetHeaderID = h.FundingSourceBudgetHeader_ID
                                    INNER JOIN Const_SCOA_Funds_Structure f ON d.ScoaID = f.ScoaID
                          WHERE     h.FinancialYear = @FinYear
                          GROUP BY  f.ScoaParentID ,
                                    f.ScoaID ,
                                    f.ScoaDesc ,
                                    f.PostingLevel ,
                                    f.ScoaCode ,
                                    f.ScoaCode ,
                                    f.ScoaShortDesc
                        ) availFund
                        LEFT JOIN ( SELECT  pf.ScoaFundID ,
                                            SUM(y.YearFundAmount) AS AllocFundAmount
                                    FROM    Plan_ProjectFund pf
                                            INNER JOIN Plan_ProjectFundYear y ON pf.ProjectFund_ID = y.ProjectFundID
                                            INNER JOIN Plan_Project pp ON pf.ProjectID = pp.Project_ID
                                    WHERE   y.FinYear = @FinYear
                                            AND ISNULL(pp.IsDeleted, 0) <> 1
                                    GROUP BY ScoaFundID
                                  ) allocatedFund ON availFund.SCOAFundID = allocatedFund.ScoaFundID;
        RETURN;   
    END;

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_FundingSourceBudgetPerYear_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================================================  
-- Author:  RC
-- Create date: 18/05/2015  
-- Description: Returns table of ammount required for a project for the given financial year  
-- Calls: select * from Plan_FundingSourceBudgetPerYear_fxn('2020/2021','2019/2020','')
-- 25/02/2016 by RC : Only fund that still have availabe fund must be returned
-- 09/03/2016 by RC : Need to sum on YearFundAmount.
-- 27/09/2016 by SNagpal: Added >= in "WHERE  ISNULL(AvailFundAmt,0)-ISNULL(AllocFundAmount,0)>=0"
---- 07-12-2016 By SNagpal: Add column for Remaining Amount
--09-12-2016 By SNagpal: Apply Isnull Conditions on amount
--13-12-2016 By SNagpal: Change the where clause of filtering Finyear. before it was from Plan_ProjectFundYear now from Plan_project.
--31-01-2017 By SNagpal: Revert the changes of where clause of filtering Finyear. before it was from Plan_project now from Plan_ProjectFundYear.
--01-02-2017 By SNagpal: Add @CurFinYear in where clause
--06-11-2017 By SNagpal: #63164 : Add Parameter BudgetType, Based upon SCOAFunds loaded from Constants
--30-05-2019 By SNagpal: #89269 - Add multiyear concept to SCOA segments based upon financial year
--24-03-2021 By CMoodley: #61107 - Only include CapitalOperation projects in 0, 1, 4
--20-05-2021 By CM: 64327 - Only include CapitalOperation projects in 0, 1, 4
--10-03-2023 By CM: 98477 - Look at project item tables to calculate allocated funds
-- =============================================================================  
CREATE   FUNCTION [dbo].[Plan_FundingSourceBudgetPerYear_fxn]    
(  
 @FinYear nvarchar(9)  ,
 @CurFinYear nvarchar(9),
 @BudgetType VARCHAR(10)
)  
RETURNS   
@tblTotals TABLE   
(   
	 ParentID int,  
	 SCOAFundID int, 
	 SCOADesc nvarchar(700),  
	 ScoaCode nvarchar(50),
	 ScoaShortDesc nvarchar(200),
	 RemainingFundAmount DECIMAL(16,2)
)  
AS  
BEGIN   

	DECLARE @tmpTbl AS TABLE   
	(   
		 ParentID int,  
		 SCOAFundID int, 
		 SCOADesc nvarchar(700),  
		 ScoaCode nvarchar(50),
		 ScoaShortDesc nvarchar(200),
		 RemainingFundAmount DECIMAL(16,2)
	)

	DECLARE @CurFinYearAsNumber INT = CAST(SUBSTRING(@CurFinYear, 1, 4) AS INT);
	DECLARE @FinYearAsNumber INT = CAST(SUBSTRING(@FinYear, 1, 4) AS INT);

	INSERT INTO @tmpTbl   
	select 
		availFund.ParentID
		,availFund.SCOAFundID
		,availFund.SCOADesc
		,availFund.ScoaCode 
		,availFund.ScoaShortDesc
		,(ISNULL(availFund.AvailFundAmt,0) - ISNULL(allocatedFund.AllocFundAmount,0))
	From
		(
			SELECT f.ScoaParentID as ParentID
			 ,f.ScoaID as SCOAFundID
			 ,f.ScoaDesc + ' (' + left(f.PostingLevel,1) + '/ ' + f.ScoaCode + ')' as SCOADesc
			 ,f.ScoaCode 
			 ,f.ScoaShortDesc
			 ,ISNULL(SUM(ISNULL(d.FundingSourceBudget,0)),0) as AvailFundAmt
			 FROM Plan_FundingSourceBudget_Detail d
			INNER JOIN Plan_FundingSourceBudget_Header h ON d.FundingSourceBudgetHeaderID=h.FundingSourceBudgetHeader_ID
			INNER JOIN dbo.Const_Scoa_Funds_Structure_ByYear(@CurFinYear) f ON d.ScoaID=f.ScoaID
			WHERE 
			 h.FinancialYear = @FinYear
			 GROUP BY f.ScoaParentID 
			 ,f.ScoaID 
			 ,f.ScoaDesc ,f.PostingLevel,f.ScoaCode 
			 ,f.ScoaCode 
			 ,f.ScoaShortDesc
		) availFund
	LEFT JOIN
		(
			SELECT  
				ScoaFundID,  
				ISNULL(CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber THEN ISNULL(SUM(BudgetAmount), 0)
						ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 1 THEN ISNULL(SUM(BudgetAmountCurP1), 0)
							ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 2 THEN ISNULL(SUM(BudgetAmountCurP2), 0)
							END
						END
					END, 0) As AllocFundAmount
			FROM    Plan_ProjectItem ppi
					INNER JOIN Plan_Project pp ON ppi.ProjectID = pp.Project_ID
			WHERE   ppi.FinYear = @CurFinYear
					AND CapitalOperation IN (0, 1, 4)
					AND ISNULL(IsDeleted, 0) <> 1
			GROUP BY ScoaFundID
		) allocatedFund on availFund.SCOAFundID=allocatedFund.ScoaFundID
	WHERE  ISNULL(AvailFundAmt,0)-ISNULL(AllocFundAmount,0)>=0

	IF (@BudgetType = 'C')
	BEGIN
		INSERT INTO @tblTotals
		SELECT t.* FROM @tmpTbl t
		INNER JOIN dbo.Const_PlanSCOAFundCapital cps ON t.SCOAFundID = cps.ScoaFundId
		WHERE cps.IsEnable=1 AND cps.FinYear= @CurFinYear
	END
	ELSE IF (@BudgetType = 'O')
	BEGIN
		INSERT INTO @tblTotals
		SELECT t.* FROM @tmpTbl t
		INNER JOIN dbo.Const_PlanSCOAFundOperational cpso ON t.SCOAFundID = cpso.ScoaFundId
		WHERE cpso.IsEnable=1 AND cpso.FinYear= @CurFinYear
	END
	ELSE
	BEGIN
		INSERT INTO @tblTotals
		SELECT t.* FROM @tmpTbl t
	END


RETURN
END

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetBudgetAmountsByProjectItemID_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Raindree Chetty
-- Create date: 11/08/2017
-- Description:	Get Project budget values by PlanProjectItemID
-- Call : select * from dbo.[Plan_GetBudgetAmountsByProjectItemID_fxn](0)
-- 
-- =============================================
CREATE FUNCTION [dbo].[Plan_GetBudgetAmountsByProjectItemID_fxn]
(	
	@PlanProjectItemID INT
)
RETURNS @Budget TABLE
(
	PlanProjectItemID INT ,
	BudgetAmount DECIMAL(18,2),
	BudgetAmountCurP1 DECIMAL(18,2),
	BudgetAmountCurP2 DECIMAL(18,2)
)
BEGIN
	INSERT INTO @Budget
	(PlanProjectItemID, BudgetAmount, BudgetAmountCurP1, BudgetAmountCurP2)
	SELECT PlanProjectItem_ID
		,( CASE WHEN (((css.ScoaCode LIKE 'IR%' OR css.ScoaCode LIKE 'IL%') AND pp.CapitalOperation IN (0,1,2))OR ppi.CreditDebit = 'C')
		THEN -ppi.BudgetAmount	ELSE ppi.BudgetAmount	END ) AS BudgetAmount 
		,( CASE WHEN (((css.ScoaCode LIKE 'IR%' OR css.ScoaCode LIKE 'IL%') AND pp.CapitalOperation IN (0,1,2))OR ppi.CreditDebit = 'C')
			THEN -ppi.BudgetAmountCurP1	ELSE ppi.BudgetAmountCurP1	END ) AS BudgetAmountCurP1 
		,( CASE WHEN (((css.ScoaCode LIKE 'IR%' OR css.ScoaCode LIKE 'IL%') AND pp.CapitalOperation IN (0,1,2))OR ppi.CreditDebit = 'C')
			THEN -ppi.BudgetAmountCurP2	ELSE ppi.BudgetAmountCurP2	END ) AS BudgetAmountCurP2 
	FROM Plan_Project pp
		INNER JOIN Plan_ProjectItem ppi ON pp.Project_ID=ppi.ProjectID
		INNER JOIN Const_SCOA_Structure css ON ppi.ScoaItemID=css.ScoaID
	WHERE PlanProjectItem_ID=@PlanProjectItemID OR  @PlanProjectItemID=0
	RETURN;
END


GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetBudgetDocumentDetail]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- ==========================================================================================  
-- Author:  Richa Mills  
-- Create date: 19 Feb 2019  
-- Description: Return Document Numbers for specific Docs  
-- 18-05-2020 by CM: Include additional document types  
-- 03-06-2020 by CM: Return document details for Led_PaymentInstructionDetails  
-- 07-07-2020 by V Shemet: #37642 Display actual Payment Instruction number  
-- 08-07-2020 by V Shemet: #37641 Display actual CSR number  
-- 08-07-2020 by V Shemet: #37704 GRA to display GRA number and merge lines  
-- 10-07-2020 by CM: #37388 Return document details for SCM_InvoiceCreditDetail  
-- 14 Jul 2020 by CM: #38562 Handle case where Document Number is NULL for Led_Journal_Multiple  
-- 17 Jul 2020 by CM: #38658 Return document number for SCM_TenderBBBEEPreferencePoints table  
-- 02 Aug 2020 by SNagpal: #38445 Return document number for SCM_ContractExtensionAndVariation
-- Select * from [dbo].[Plan_GetBudgetDocumentDetail] ('SCM_ContractExtensionAndVariation', 16) 
-- 01 Mar 2022 by SNagpal: #83995 Reports displays Requisition Numbers on the reports when Tenders have been created
-- ==========================================================================================  
CREATE FUNCTION [dbo].[Plan_GetBudgetDocumentDetail] ( @TableName VARCHAR(MAX),@PK int )  
RETURNS   
 @tbl TABLE    
 (  
  DocType VARCHAR(500),  
  DocNumber VARCHAR(500)  
 )  
AS  
BEGIN  
  IF @TableName = 'Plan_ProjectItem'  
  INSERT INTO @tbl  
  SELECT 'Opening Budget' AS DocType, 'Plan_ProjectItem_' + CONVERT(VARCHAR, @Pk) DocNumber   
  
  ELSE IF @TableName = 'Plan_Virements'  
  INSERT INTO @tbl  
  SELECT 'Virement' DocType,'Plan_Virements_' + CONVERT(VARCHAR,@Pk) DocNumber  
   
  ELSE IF @TableName = 'SCM_RequisitionServiceDetails'  
  INSERT INTO @tbl  
  SELECT  'Requisition' AS DocType,RequisitionNumber AS DocNumber FROM SCM_Requisition WHERE Requisition_ID in   
  (SELECT RequisitionId FROM SCM_RequisitionServiceDetails WHERE RequisitionDetail_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_ServiceInvoiceDetails'  
  INSERT INTO @tbl  
  SELECT 'Service Invoice' AS DocType, ServiceInvoiceNumber AS DocNumber FROM SCM_ServiceInvoice WHERE ServiceInvoice_ID in   
  (SELECT ServiceInvoiceId FROM SCM_ServiceInvoiceDetails WHERE ServiceInvoiceDetail_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_GRNDetails'  
  INSERT INTO @tbl  
  SELECT 'GRN' AS DocType, GrnVendorNumber AS DocNumber FROM SCM_Grn WHERE Grn_Id in  
  (SELECT GrnId FROM SCM_GrnDetails WHERE GrnDetail_Id = @PK)  
  
  ELSE IF @TableName = 'SCM_OrderTypeDetail'  
  INSERT INTO @tbl  
  SELECT 'Order' AS DocType, OrderNumber AS DocNumber FROM SCM_Order WHERE Order_ID in   
  (SELECT OrderId FROM SCM_OrderTypeDetail WHERE OrderDetailID = @PK)  
  
  ELSE IF @TableName = 'SCM_QuotationServiceDetail'  
  INSERT INTO @tbl  
  SELECT 'Quotation' AS DocType, QuotationNumber AS DocNumber FROM Scm_Quotation WHERE Quotation_Id in  
  (SELECT QuotationId FROM SCM_QuotationServiceDetail WHERE QuotationServiceDel_ID = @Pk)  
  
  ELSE IF @TableName = 'SCM_InvoiceDetail'  
  INSERT INTO @tbl  
  SELECT 'Invoice' AS DocType, VendorInvoiceNumber AS DocNumber FROM SCM_Invoice WHERE Invoice_ID in  
  (SELECT InvoiceId FROM Scm_InvoiceDetail WHERE InvoiceDetail_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_InformalTenderServiceDetail'  
  INSERT INTO @tbl  
  SELECT 'Informal Tender' DocType,InformalTenderNumber DocNumber FROM SCM_InformalTender WHERE InformalTender_ID in  
  (SELECT InformalTenderId FROM SCM_InformalTenderServiceDetail WHERE TenderServiceDel_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_SundryPaymentServiceDetails'  
  INSERT INTO @tbl  
  SELECT 'Sundry Invoice' DocType,SundryPaymentNumber DocNumber FROM SCM_SundryPayment WHERE SundryPayment_ID in  
  (SELECT SundryPaymentID FROM SCM_SundryPaymentServiceDetails WHERE SundryPaymentDetail_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_ContractDetailItems'  
  INSERT INTO @tbl  
  SELECT 'Contract Detail' DocType,ContractNumber DocNumber FROM SCM_ContractDetails WHERE Contract_ID in  
  (SELECT ContractID FROM SCM_ContractDetailItems WHERE ContractDetailItems_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_RequisitionTenderLink'  
  INSERT INTO @tbl   
    SELECT 'Tender Requisition' DocType,TenderNumber DocNumber FROM SCM_Tender WHERE Tender_ID in  
	(SELECT TenderID FROM SCM_RequisitionTenderLink WHERE RequisitionTenderLink_ID = @PK)
  --SELECT 'Tender Requisition' DocType,RequisitionNumber DocNumber FROM SCM_Requisition WHERE Requisition_ID in  
  --(SELECT RequisitionID FROM SCM_RequisitionServiceDetails WHERE RequisitionDetail_ID IN   
  --(SELECT RequisitionDetailID FROM SCM_RequisitionTenderLink WHERE RequisitionTenderLink_ID = @PK))  
  
  ELSE IF @TableName = 'Asset_DepreciationSchedule_Item'  
  INSERT INTO @tbl   
  SELECT 'Asset Depreciation Schedule' DocType,'Asset_DepreciationSchedule_Item' + '_' + CONVERT(VARCHAR, @PK) DocNumber   
    
  ELSE IF @TableName = 'Asset_Disposal_Approval'  
  INSERT INTO @tbl   
  SELECT 'Asset Disposal' DocType,'Asset_Disposal_Approval' + '_' + CONVERT(VARCHAR, @PK) DocNumber   
  
  ELSE IF @TableName = 'Asset_Impairment'  
  INSERT INTO @tbl   
  SELECT 'Asset Impairment' DocType,'Asset_Impairment' + '_' + CONVERT(VARCHAR, @PK) DocNumber   
  
  ELSE IF @TableName = 'Asset_Register_Transactions'  
  INSERT INTO @tbl   
  SELECT 'Asset Register' DocType,'Asset_Register_Transactions' + '_' + CONVERT(VARCHAR, @PK) DocNumber   
  
  ELSE IF @TableName = 'Inven_InventoryRequisition'  
  INSERT INTO @tbl  
  SELECT 'Inventory Requisition' DocType,InvRequistionNumber DocNumber FROM Inven_InventoryRequisition WHERE InvRequisition_ID = @PK  
  
  ELSE IF @TableName = 'Inven_InventoryRequisitionLineItem'  
  INSERT INTO @tbl  
  SELECT 'Inventory Requisition Line Item' DocType,InvRequistionNumber DocNumber FROM Inven_InventoryRequisition WHERE InvRequisition_ID IN   
  (SELECT InvRequisitionID FROM Inven_InventoryRequisitionLineItem WHERE InvRequisitionLineItem_ID = @PK)  
  
  ELSE IF @TableName = 'Inven_InventoryIssue'  
  INSERT INTO @tbl  
  SELECT 'Inventory Issue' DocType,UniqueInventoryReference DocNumber FROM Inven_InventoryIssue WHERE Issue_ID = @PK  
  
  ELSE IF @TableName = 'Inven_InventoryIssueLineItem'  
  INSERT INTO @tbl  
  SELECT 'Inventory Requisition Line Item' DocType,UniqueInventoryReference DocNumber FROM Inven_InventoryIssue WHERE Issue_ID IN   
  (SELECT IssueID FROM Inven_InventoryIssueLineItem WHERE InvIssueLineItem_ID = @PK)  
  
  ELSE IF @TableName = 'Led_Journal_Multiple'  
  INSERT INTO @tbl  
  SELECT 'Multiple Journal' DocType, ISNULL(DocumentNumber, TransactionID) DocNumber FROM Led_Journal_Multiple WHERE MultipleJournal_ID = @PK  
  
  ELSE IF @TableName = 'Led_Journal_Normal'  
  INSERT INTO @tbl  
  SELECT 'Normal Journal' DocType,DocumentNumber DocNumber FROM Led_Journal_Normal WHERE NormalJournal_ID = @PK  
  
  ELSE IF @TableName = 'Led_Journal_Asset'  
  INSERT INTO @tbl  
  SELECT 'Asset Journal' DocType,DocumentNumber DocNumber FROM Led_Journal_Asset WHERE AssetJournal_ID = @PK  
  
  ELSE IF @TableName = 'Led_Journal_Inven'  
  INSERT INTO @tbl  
  SELECT 'Inventory Journal' DocType,DocumentNumber DocNumber FROM Led_Journal_Inven WHERE InvenJournal_ID = @PK  
  
  ELSE IF @TableName = 'Led_PaymentInstructionDetails'  
  INSERT INTO @tbl  
  SELECT 'Payment Instructions' DocType, PaymentReferenceNumber AS DocNumber FROM SCM_Payment WHERE Payment_ID IN   
  (SELECT PaymentID   
   FROM Led_PaymentInstructionDetails Led_PID  
   INNER JOIN Led_PaymentInstructions Led_PI ON Led_PID.PaymentInstructions_ID = Led_PI.PaymentInstructions_ID  
   WHERE Led_PID.PaymentInstructionDetail_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_ContractServiceRequestDetails'  
  INSERT INTO @tbl  
  SELECT 'SCM_ContractServiceRequestDetails' DocType, ServiceRequestNumber AS DocNumber FROM SCM_ContractServiceRequest WHERE ContractServiceRequest_ID IN   
  (SELECT ContractServiceRequestId   
   FROM SCM_ContractServiceRequestDetails  
   WHERE ContractServiceRequestDetails_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_GRADetails'  
  INSERT INTO @tbl  
  SELECT 'SCM_GRADetails' DocType, GRAVendorNumber AS DocNumber FROM SCM_GRA WHERE GRA_ID IN   
  (SELECT GRAID   
   FROM SCM_GRADetails  
   WHERE GRADetail_ID = @PK)  
  
  ELSE IF @TableName = 'SCM_InvoiceCreditDetail'  
  INSERT INTO @tbl  
  SELECT 'Invoice Credit Detail' DocType, CreditDebitNumber AS DocNumber FROM SCM_InvoiceCreditDebtNote WHERE ID IN   
  (SELECT InvoiceCreditID FROM SCM_InvoiceCreditDetail WHERE InvoiceCreditDetail_ID = @PK)  
  
  ELSE IF @TableName = 'Inven_InventoryReturnLineItem'  
  INSERT INTO @tbl  
  SELECT 'Inventory Return To Store Line Item' DocType, IIR.UniqueInventoryReference as DocNumber   
  FROM dbo.Inven_InventoryReturnLineItem IIRL  
        LEFT JOIN Inven_InventoryReturn IIR ON IIR.Return_ID = IIRL.ReturnID   
  WHERE IIRL.InvReturnLineItem_ID = @PK  
  
  ELSE IF @TableName = 'SCM_TenderBBBEEPreferencePoints'  
  INSERT INTO @tbl  
  SELECT 'Tender BBBEE Points' DocType, TenderNumber DocNumber FROM SCM_Tender WHERE Tender_ID IN  
  (SELECT TenderID FROM SCM_TenderBBBEEPreferencePoints WHERE PreferencePoints_ID = @PK)  

  ELSE IF @TableName = 'SCM_ContractExtensionAndVariation'  
  INSERT INTO @tbl  
  SELECT 'SCM_ContractExtensionAndVariation' AS DocType,ContractNumber AS DocNumber FROM SCM_ContractDetails WHERE Contract_ID in  
  (SELECT ContractID FROM SCM_ContractExtensionAndVariation WHERE Extension_ID = @PK)  

  ELSE  
  INSERT INTO @tbl  
  SELECT @TableName AS DocType, @TableName + '_' + CONVERT(VARCHAR, @PK) AS DocNumber  
  
 RETURN  
END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectAmountRequired_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


 
-- =============================================================================  
-- Author:  RC
-- Create date: 22/12/2014  
-- Description: Returns table of ammount required for a project for the given financial year  
-- Calls: select * from Plan_ProjectAmountRequired_fxn(0,'2014/2015')
--  : 
-- =============================================================================  
CREATE FUNCTION [dbo].[Plan_ProjectAmountRequired_fxn]   
(  
@ProjectID int,
 @FinYear nvarchar(9)  
)  
RETURNS   
@tblTotals TABLE   
(   
 ProjectID int,  
 SCOAItemID int, 
 ProjectItemID int,  
 FinYear nvarchar(9),  
 AmtRequired decimal(16,2)
)  
AS  
BEGIN   
INSERT INTO @tblTotals   
SELECT	ppi.ProjectID		, ppi.SCOAItemID
		,ppi.ProjectItemID	, ppi.FinYear
		,SUM(pim.UnitPrice) AS AmtRequired 
FROM
	Plan_ProjectItem ppi 
	INNER JOIN Plan_ProjectItemMonth pim ON ppi.PlanProjectItem_ID=pim.PlanProjectItemID
WHERE 
	FinYear = @FinYear 
	AND (ProjectID =@ProjectID OR @ProjectID=0)
GROUP BY  
	ppi.ProjectID,ppi.ProjectItemID, ppi.SCOAItemID,ppi.FinYear
RETURN   
END
GO

/****** Object:  UserDefinedFunction [dbo].[Planning_GetQuarterStartEndDate_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Jignesh Prajapati
-- Create date: 2016-04-01
-- Description:	Get Quater Start End date
-- CALL: SELECT * FROM dbo.Planning_GetQuarterStartEndDate_fxn(2016,1)
-- =============================================
CREATE FUNCTION [dbo].[Planning_GetQuarterStartEndDate_fxn]
    (
      @FinStartYear NVARCHAR(5) ,
      @QuarterNo INT
    )
RETURNS @QauterDates TABLE
    (
      StartDate DATETIME ,
      EndDate DATETIME
    )
    BEGIN

	DECLARE @StartDate NVARCHAR(10),
			@FinStartMonth NVARCHAR(2)

            SELECT  @FinStartMonth = KeyValue
            FROM    dbo.AAAA_ConfigSettings
            WHERE   KeyName = 'FinYearStartMonth';

	 SET @StartDate = @FinStartYear + '-' + @FinStartMonth + '-01'

	-- Add the SELECT statement with parameter references here
        INSERT  INTO @QauterDates
                ( StartDate ,
                  EndDate
                )
                SELECT  StartDate ,
                        Result.EndDate
                FROM    ( SELECT    DATEADD(mm, ( quarter - 1 ) * 3, year_date) StartDate ,
                                    DATEADD(dd, -1,
                                            DATEADD(mm, quarter * 3, year_date)) EndDate ,
                                    quarter QuarterNo
                          FROM      ( SELECT    @StartDate year_date
                                    ) s
                                    CROSS JOIN ( SELECT 1 quarter
                                                 UNION ALL
                                                 SELECT 2
                                                 UNION ALL
                                                 SELECT 3
                                                 UNION ALL
                                                 SELECT 4
                                               ) q
                        ) AS Result
                WHERE   QuarterNo = @QuarterNo;
 
        RETURN;		
    END;
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_AuditedOutcome_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 20 Novmber 2019
-- Description:	Return audited outcome per financial year
-- 20191211 by CM: Return actuals from Led_GeneralLedger if not actuals exist in Section71_AuditedOutcome 
-- 20210511 by CM: Return IDP Strategic Objective and Goals (IDP Programme) 
-- =============================================
CREATE FUNCTION [dbo].[Section71_AuditedOutcome_fxn]
(
	-- Add the parameters for the function here
	@FinYear VARCHAR(10)
)
RETURNS 
@AuditedOutcome TABLE 
(
	-- Add the column definitions for the TABLE variable here
	 DivisionID INT
	,FinYear VARCHAR(10)
	,Debit DECIMAL(16, 2)
	,Credit DECIMAL(16, 2)
	,ScoaItemID INT
	,ScoaFunctionID INT
	,ScoaProjectID INT
	,ScoaFundID INT
	,ScoaRegionID INT
	,ScoaCostingID INT
	,SingleMultiYear VARCHAR(5)
	,ProcessingMonth INT
	,StrategicObjective VARCHAR(1000)
	,Goal VARCHAR(1000)
)
AS
BEGIN
	-- Fill the table variable with the rows for your result set

	IF ((SELECT COUNT(1) FROM Section71_AuditedOutcome WHERE FinYear = @FinYear) > 0)
	BEGIN
		INSERT INTO @AuditedOutcome
		SELECT 
			DivisionID
		   ,FinYear
		   ,ABS(Debit) AS  Debit
		   ,ABS(Credit) AS Credit
		   ,item.ScoaID AS ScoaItemID
		   ,func.ScoaID AS ScoaFunctionID
		   ,proj.ScoaID AS ScoaProjectID
		   ,fund.ScoaID AS ScoaFundID
		   ,region.ScoaID AS ScoaRegionID
		   ,cost.ScoaID AS ScoaCostingID
		   ,SingleMultiYear
		   ,ProcessingMonth
		   ,StrategicObjective
		   ,Goal
		FROM 
			Section71_AuditedOutcome ao
			LEFT JOIN Const_SCOA_Structure_ByYear(@FinYear) item ON ao.ScoaItemGUID = item.NTScoaID
			LEFT JOIN Const_SCOA_Function_Structure_ByYear(@FinYear) func ON ao.ScoaFunctionGUID = func.NTScoaID
			LEFT JOIN Const_SCOA_Project_Structure_ByYear(@FinYear) proj ON ao.ScoaProjectGUID = proj.NTScoaID
			LEFT JOIN Const_SCOA_Funds_Structure_ByYear(@FinYear) fund ON ao.ScoaFundGUID = fund.NTScoaID
			LEFT JOIN Const_SCOA_Regional_Structure_ByYear(@FinYear) region ON ao.ScoaRegionGUID = region.NTScoaID
			LEFT JOIN Const_SCOA_Costing_Structure_ByYear(@FinYear) cost ON ao.ScoaCostingGUID = cost.NTScoaID
		WHERE
			ao.FinYear = @FinYear
	END
	ELSE
	BEGIN
		INSERT INTO @AuditedOutcome
		SELECT 
			DivisionID
		   ,led.FinYear
		   ,Debit
		   ,Credit
		   ,ScoaItemID
		   ,ScoaFunctionID
		   ,led.ScoaProjectID
		   ,ScoaFundsID AS ScoaFundID
		   ,ScoaRegionID
		   ,ScoaCostingID
		   ,SingleMultiYear
		   ,ProcessingMonth
		   ,idpSO.ItemDesc StrategicObjective
		   ,idpProg.ItemDesc Goal
		FROM 
			Led_GeneralLedger led
			LEFT JOIN Plan_Project pp ON led.ProjectID = pp.Project_ID
			LEFT JOIN IDP_Item idpProj on pp.Project_ID = idpProj.ActProjID
			LEFT JOIN IDP_Item idpProg on idpProj.ItemParentID = idpProg.Item_ID
			LEFT JOIN IDP_Item idpSO on idpProg.ItemParentID = idpSO.Item_ID
		WHERE
			led.FinYear = @FinYear
			AND led.ProjectID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)
	END

	RETURN 
END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_Budget_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 04 December 2019
-- Description:	Return correct budgte to use for A schedule
-- =============================================
CREATE FUNCTION [dbo].[Section71_Budget_fxn]
(
	-- Add the parameters for the function here
	 @FinYear VARCHAR(10)

)
RETURNS 
@Budget TABLE
(
	-- Add the column definitions for the TABLE variable here
	 BudgetVersion_ID INT
	,Project_ID INT
	,ProjectName VARCHAR(1000)
	,PlanProjectItemID INT
	,FinYear VARCHAR(10)
	,ScoaProjectID INT
	,SCOAItemID INT
	,SCOAFundId INT
	,DivisionId INT
	,SCOAFunctionId INT
	,SCOARegionId INT
	,SCOACostingID INT
	,BudgetAmount DECIMAL(16,2)
	,BudgetAmountCurP1 DECIMAL(16,2)
	,BudgetAmountCurP2 DECIMAL(16,2)
	,IsDeleted BIT
	,BudgetMonth1 DECIMAL(16,2)
	,BudgetMonth2 DECIMAL(16,2)
	,BudgetMonth3 DECIMAL(16,2)
	,BudgetMonth4 DECIMAL(16,2)
	,BudgetMonth5 DECIMAL(16,2)
	,BudgetMonth6 DECIMAL(16,2)
	,BudgetMonth7 DECIMAL(16,2)
	,BudgetMonth8 DECIMAL(16,2)
	,BudgetMonth9 DECIMAL(16,2)
	,BudgetMonth10 DECIMAL(16,2)
	,BudgetMonth11 DECIMAL(16,2)
	,BudgetMonth12 DECIMAL(16,2)
	,SingleMultiYear VARCHAR(5)
	,CapitalOperation INT
	,CreditDebit VARCHAR(6)
)
AS
BEGIN
	-- Fill the table variable with the rows for your result set
	DECLARE @budgetVersionID INT

	SELECT @budgetVersionID = ISNULL(dbo.Section71_BudgetOriginalVersionID_fxn(@FinYear), -1)

	IF (@budgetVersionID = -1)
	BEGIN
		INSERT INTO @Budget
		SELECT
		    -1 AS BudgetVersion_ID,
		    Project_ID,
		    ProjectName,
		    PlanProjectItemID,
		    FinYear,
		    ScoaProjectID,
		    SCOAItemID,
		    SCOAFundId,
		    DivisionId,
		    SCOAFunctionId,
		    SCOARegionId,
		    SCOACostingID,
		    BudgetAmount,
		    BudgetAmountCurP1,
		    BudgetAmountCurP2,
		    IsDeleted,
		    BudgetMonth1,
		    BudgetMonth2,
		    BudgetMonth3,
		    BudgetMonth4,
		    BudgetMonth5,
		    BudgetMonth6,
		    BudgetMonth7,
		    BudgetMonth8,
		    BudgetMonth9,
		    BudgetMonth10,
		    BudgetMonth11,
		    BudgetMonth12,
		    SingleMultiYear,
		    CapitalOperation,
		    CreditDebit
		FROM dbo.Section71_ProjectBudget_vw WHERE FinYear = @FinYear
	END
	ELSE
	BEGIN
		INSERT INTO @Budget
		SELECT
		    BudgetVersion_ID,
		    Project_ID,
		    ProjectName,
		    PlanProjectItemID,
		    FinYear,
		    ScoaProjectID,
		    SCOAItemID,
		    SCOAFundId,
		    DivisionId,
		    SCOAFunctionId,
		    SCOARegionId,
		    SCOACostingID,
		    BudgetAmount,
		    BudgetAmountCurP1,
		    BudgetAmountCurP2,
		    IsDeleted,
		    BudgetMonth1,
		    BudgetMonth2,
		    BudgetMonth3,
		    BudgetMonth4,
		    BudgetMonth5,
		    BudgetMonth6,
		    BudgetMonth7,
		    BudgetMonth8,
		    BudgetMonth9,
		    BudgetMonth10,
		    BudgetMonth11,
		    BudgetMonth12,
		    SingleMultiYear,
		    CapitalOperation,
		    CreditDebit
		FROM Section71_BudgetOriginal_vw WHERE BudgetVersion_ID = @BudgetVersionID
	END

	RETURN 
END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_VersionAuditedOutcome_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 31 March 2020
-- Description:	Return audited outcome per financial year
-- 20210511 by CM: Return IDP Strategic Objective and Goals (IDP Programme) 
-- 20230601 by CM - 102755 - Ensure only one link from project to IDP is returned to prevent duplicates
-- =============================================
CREATE   FUNCTION [dbo].[Section71_VersionAuditedOutcome_fxn]
(
	-- Add the parameters for the function here
	 @FinYear VARCHAR(10)
	,@VersionFinYear VARCHAR(10)
)
RETURNS 
@AuditedOutcome TABLE 
(
	-- Add the column definitions for the TABLE variable here
	 DivisionID INT
	,FinYear VARCHAR(10)
	,Debit DECIMAL(16, 2)
	,Credit DECIMAL(16, 2)
	,ScoaItemID INT
	,ScoaFunctionID INT
	,ScoaProjectID INT
	,ScoaFundID INT
	,ScoaRegionID INT
	,ScoaCostingID INT
	,SingleMultiYear VARCHAR(5)
	,ProcessingMonth INT
	,StrategicObjective VARCHAR(1000)
	,Goal VARCHAR(1000)
)
AS
BEGIN
	-- Fill the table variable with the rows for your result set

	IF ((SELECT COUNT(1) FROM Section71_AuditedOutcome WHERE FinYear = @FinYear) > 0)
	BEGIN
		INSERT INTO @AuditedOutcome
		SELECT 
			DivisionID
		   ,FinYear
		   ,ABS(Debit) AS  Debit
		   ,ABS(Credit) AS Credit
		   ,ScoaItemID
		   ,ScoaFunctionID
		   ,ScoaProjectID
		   ,ScoaFundID
		   ,ScoaRegionID
		   ,ScoaCostingID
		   ,SingleMultiYear
		   ,ProcessingMonth
		   ,StrategicObjective
		   ,Goal
		FROM 
			Section71_AuditedOutcome
		WHERE
			FinYear = @FinYear
	END
	ELSE
	BEGIN
		INSERT INTO @AuditedOutcome
		SELECT 
			DivisionID
		   ,led.FinYear
		   ,Debit
		   ,Credit
		   ,ScoaItemID
		   ,ScoaFunctionID
		   ,led.ScoaProjectID
		   ,ScoaFundsID AS ScoaFundID
		   ,ScoaRegionID
		   ,ScoaCostingID
		   ,SingleMultiYear
		   ,ProcessingMonth
		   ,idpSO.ItemDesc StrategicObjective
		   ,idpProg.ItemDesc Goal
		FROM 
			Led_GeneralLedger led
			LEFT JOIN Plan_Project pp ON led.ProjectID = pp.Project_ID
			LEFT JOIN (SELECT MIN(Item_ID) ItemID, ActProjID FROM IDP_Item WHERE FinancialYear = @FinYear AND IDPLevelNumber = 50 GROUP BY ActProjID) idpMin ON pp.Project_ID = idpMin.ActProjID
			LEFT JOIN IDP_Item idpProj ON idpMin.ItemID = idpProj.Item_ID 
			LEFT JOIN IDP_Item idpProg on idpProj.ItemParentID = idpProg.Item_ID
			LEFT JOIN IDP_Item idpSO on idpProg.ItemParentID = idpSO.Item_ID
		WHERE
			led.FinYear = @FinYear
			AND led.ProjectID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)
	END

	RETURN 
END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_Virement_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 03 July 2020
-- Description:	Return virements per date period
-- 220126 by CM - 80160 - Handle case where @EndDate is null
-- =============================================
CREATE FUNCTION [dbo].[Section71_Virement_fxn]
(
	-- Add the parameters for the function here
	 @StartDate DATETIME
	,@EndDate DATETIME
)
RETURNS @Virement TABLE
(
	-- Add the column definitions for the TABLE variable here
	 TotalVirementAmount DECIMAL(16,2)	
	,PlanProjectItem_ID	INT
	,ProjectID	INT
	,FinYear VARCHAR(50)
	,ScoaProjectID INT
	,ScoaItemID	INT
	,ScoaFundID	INT
	,DivisionID	INT
	,ScoaFunctionID	INT
	,ScoaRegionID INT
	,ScoaCostingID INT
	,SingleMultiYear VARCHAR(6)
	,CapitalOperation INT
	,CreditDebit VARCHAR(6)
	,isDeleted BIT
)
AS
BEGIN
	-- Fill the table variable with the rows for your result set
	INSERT INTO @Virement
	SELECT 
		 v.TotalVirementAmount
		,v.PlanProjectItem_ID
		,v.ProjectID
		,v.FinYear
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
				SUM(VirementAmount) AS TotalVirementAmount, PlanProjectItem_ID, ProjectID, FinYear 
			FROM
				(
					SELECT  *
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
					WHERE virementFromTo.VirementID NOT IN (SELECT DISTINCT VirementID FROM dbo.Plan_VirementApprovalRejections WHERE IsRejected = 1)
				) virement

				LEFT JOIN

				(SELECT MAX(ApprovedOn) ApprovalDate, VirementID FROM dbo.Plan_VirementApprovalRejections GROUP BY VirementID) vApproval ON virement.VirementID = vApproval.VirementID

			WHERE ApprovalDate BETWEEN @StartDate AND ISNULL(@EndDate, GETDATE())
			GROUP BY PlanProjectItem_ID,ProjectID, FinYear
		) v

		INNER JOIN Plan_ProjectItem ppi ON v.PlanProjectItem_ID = ppi.PlanProjectItem_ID
		INNER JOIN Plan_Project p ON ppi.ProjectID = p.Project_ID
	WHERE  
		ISNULL(isDeleted, 0) <> 1
		AND v.ProjectID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)

	RETURN 
END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_VirementMonth_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 03 July 2020
-- Description:	Return virements per date period
-- 220126 by CM - 80160 - Handle case where @EndDate is null
-- =============================================
CREATE FUNCTION [dbo].[Section71_VirementMonth_fxn]
(
	-- Add the parameters for the function here
	 @StartDate DATETIME
	,@EndDate DATETIME
)
RETURNS @Virement TABLE
(
	-- Add the column definitions for the TABLE variable here
	 TotalVirementAmount DECIMAL(16,2)	
	,M1 DECIMAL(16,2)
	,M2 DECIMAL(16,2)
	,M3 DECIMAL(16,2)
	,M4 DECIMAL(16,2)
	,M5 DECIMAL(16,2)
	,M6 DECIMAL(16,2)
	,M7 DECIMAL(16,2)
	,M8 DECIMAL(16,2)
	,M9 DECIMAL(16,2)
	,M10 DECIMAL(16,2)
	,M11 DECIMAL(16,2)
	,M12 DECIMAL(16,2)
	,PlanProjectItem_ID	INT
	,ProjectID	INT
	,FinYear VARCHAR(50)
	,ScoaProjectID INT
	,ScoaItemID	INT
	,ScoaFundID	INT
	,DivisionID	INT
	,ScoaFunctionID	INT
	,ScoaRegionID INT
	,ScoaCostingID INT
	,SingleMultiYear VARCHAR(6)
	,CapitalOperation INT
	,CreditDebit VARCHAR(6)
	,isDeleted BIT
)
AS
BEGIN
	-- Fill the table variable with the rows for your result set
	INSERT INTO @Virement
	SELECT 
		 v.TotalVirementAmount
		,v.M1
		,v.M2
		,v.M3
		,v.M4
		,v.M5
		,v.M6
		,v.M7
		,v.M8
		,v.M9
		,v.M10
		,v.M11
		,v.M12
		,v.PlanProjectItem_ID
		,v.ProjectID
		,v.FinYear
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
				SUM(VirementAmount) AS TotalVirementAmount, PlanProjectItem_ID, ProjectID, FinYear,
				SUM(M1) M1, SUM(M2) M2, SUM(M3) M3, SUM(M4) M4, SUM(M5) M5, SUM(M6) M6,
				SUM(M7) M7, SUM(M8) M8, SUM(M9) M9, SUM(M10) M10, SUM(M11) M11, SUM(M6) M12
			FROM
				(
					SELECT  *
					FROM 
						(
							SELECT -ISNULL(V.FromVirementAmount, 0) AS VirementAmount, PPIFrom.PlanProjectItem_ID,PPIFrom.ProjectID,V.VirementId, PrjFrom.FinYear,
										-ISNULL(Month1Price, 0) M1, -ISNULL(Month2Price, 0) M2, -ISNULL(Month3Price, 0) M3, -ISNULL(Month4Price, 0) M4, -ISNULL(Month5Price, 0) M5, -ISNULL(Month6Price, 0) M6,
										-ISNULL(Month7Price, 0) M7, -ISNULL(Month8Price, 0) M8, -ISNULL(Month9Price, 0) M9, -ISNULL(Month10Price, 0) M10, -ISNULL(Month11Price, 0) M11, -ISNULL(Month12Price, 0) M12
							FROM  dbo.Plan_Project PrjFrom
									INNER JOIN dbo.Plan_ProjectItem PPIFrom ON PPIFrom.ProjectID = PrjFrom.Project_ID
									INNER JOIN dbo.Plan_Virements V ON V.FromProjectId = PrjFrom.Project_ID
										AND V.FromSCOAProjectID = PrjFrom.ScoaProjectID AND v.FromSCOAFunctionId = PPIFrom.SCOAFunctionId
										AND v.FromDivisionId = PPIFrom.DivisionId AND V.FromSCOAFundID = PPIFrom.SCOAFundId
										AND v.FromSCOARegion = PPIFrom.SCOARegionId AND v.FromSCOAItem = PPIFrom.SCOAItemID
										AND v.FromSCOACostingId = PPIFrom.SCOACostingID 
									INNER JOIN dbo.Plan_VirementBudgetSplit BSplit ON V.VirementId= BSplit.VirementId
							UNION 
							SELECT ISNULL(V.ToVirementAmount, 0) AS VirementAmount, PPITo.PlanProjectItem_ID,PPITo.ProjectID,V.VirementId, PrjTo.FinYear,
										ISNULL(Month1Price, 0) M1, ISNULL(Month2Price, 0) M2, ISNULL(Month3Price, 0) M3, ISNULL(Month4Price, 0) M4, ISNULL(Month5Price, 0) M5, ISNULL(Month6Price, 0) M6,
										ISNULL(Month7Price, 0) M7, ISNULL(Month8Price, 0) M8, ISNULL(Month9Price, 0) M9, ISNULL(Month10Price, 0) M10, ISNULL(Month11Price, 0) M11, ISNULL(Month12Price, 0) M12
							FROM  dbo.Plan_Project PrjTo
								INNER JOIN dbo.Plan_ProjectItem PPITo ON PPITo.ProjectID = PrjTo.Project_ID
								INNER JOIN dbo.Plan_Virements V ON V.ToProjectId = PrjTo.Project_ID
									AND V.ToSCOAProjectID = PrjTo.ScoaProjectID AND v.ToSCOAFunctionId = PPITo.SCOAFunctionId
									AND v.ToDivisionId = PPITo.DivisionId AND V.ToSCOAFundID = PPITo.SCOAFundId
									AND v.ToSCOARegion = PPITo.SCOARegionId AND v.ToSCOAItem = PPITo.SCOAItemID
									AND v.ToSCOACostingId = PPITo.SCOACostingID 
								INNER JOIN dbo.Plan_VirementBudgetSplit BSplit ON V.VirementId= BSplit.VirementId
						) AS virementFromTo 
					WHERE virementFromTo.VirementID NOT IN (SELECT DISTINCT VirementID FROM dbo.Plan_VirementApprovalRejections WHERE IsRejected = 1)
				) virement

				LEFT JOIN

				(SELECT MAX(ApprovedOn) ApprovalDate, VirementID FROM dbo.Plan_VirementApprovalRejections GROUP BY VirementID) vApproval ON virement.VirementID = vApproval.VirementID

			WHERE ApprovalDate BETWEEN @StartDate AND ISNULL(@EndDate, GETDATE())
			GROUP BY PlanProjectItem_ID,ProjectID, FinYear
		) v

		INNER JOIN Plan_ProjectItem ppi ON v.PlanProjectItem_ID = ppi.PlanProjectItem_ID
		INNER JOIN Plan_Project p ON ppi.ProjectID = p.Project_ID
	WHERE  
		ISNULL(isDeleted, 0) <> 1
		AND v.ProjectID NOT IN (SELECT ProjectID FROM Plan_ProjectReportExclude)

	RETURN 
END
GO

/****** Object:  UserDefinedFunction [dbo].[Split_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE function [dbo].[Split_fxn](
/**********************************************************
Created by	:	CB - copied from the net
Created on	:	30/04/2010
Does		:	Splits a string into a table based on the a given character
Used in		:	
Modifications:
 by :	
 2019/04/16 M Van Wyk - Modify @String Paramater to MAX
**********************************************************/

 @String nvarchar (MAX),
 @Delimiter nvarchar (10)
 )
returns @ValueTable table (ID int identity(1,1), [Value] nvarchar(4000))
begin
 declare @NextString nvarchar(4000)
 declare @Pos int
 declare @NextPos int
 declare @CommaCheck nvarchar(1)
 
 --Initialize
 set @NextString = ''
 set @CommaCheck = right(@String,1) 
 
 --Check for trailing Comma, if not exists, INSERT
 --if (@CommaCheck <> @Delimiter )
 set @String = @String + @Delimiter
 
 --Get position of first Comma
 set @Pos = charindex(@Delimiter,@String)
 set @NextPos = 1
 
 --Loop while there is still a comma in the String of levels
 while (@pos <>  0)  
 begin
  set @NextString = substring(@String,1,@Pos - 1)
 
  insert into @ValueTable ( [Value]) Values (@NextString)
 
  set @String = substring(@String,@pos +1,len(@String))
  
  set @NextPos = @Pos
  set @pos  = charindex(@Delimiter,@String)
 end
 
 return
end


GO

/****** Object:  UserDefinedFunction [dbo].[YearStartingAtMonth_fxn]    Script Date: 2026/03/11 4:28:09 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================================================
-- Author:		Raindree Chetty
-- Create date: 13 February 2017
-- Description:	Returns table of month given the start month
-- =============================================================================
CREATE FUNCTION [dbo].[YearStartingAtMonth_fxn] 
(
	-- Add the parameters for the function here

	@StartMonth INT
)
RETURNS 
@tblFinYear TABLE 
(
	-- Add the column definitions for the TABLE variable here
	Month_ID INT IDENTITY(1,1),
	SysMonthID INT ,
	MonthDesc VARCHAR(50)
)
AS
BEGIN
	-- Fill the table variable with the rows for your result set
	
	BEGIN
		INSERT INTO @tblFinYear 
		SELECT Month_ID,[Month] FROM Const_Month_sys where Month_ID>=@StartMonth
		INSERT INTO @tblFinYear 
		SELECT Month_ID,[Month] FROM Const_Month_sys where Month_ID<@StartMonth
	END
	
	RETURN 
END
GO


/****** Object:  UserDefinedFunction [dbo].[IDP_GetItemParentID]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 16 July 2014
-- Description:	Returns IDP item ParentID
-- =============================================
CREATE FUNCTION [dbo].[IDP_GetItemParentID] 
(
	-- Add the parameters for the function here
	@itemID INT
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @parentID AS INT

	-- Add the T-SQL statements to compute the return value here
	SELECT 
		@parentID = item.ItemParentID 
	FROM
		dbo.IDP_Item item
	WHERE
		item.Item_ID = @itemID

	-- Return the result of the function
	RETURN @parentID

END
GO

/****** Object:  UserDefinedFunction [dbo].[IDP_GetItemPath]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date, ,>
-- Description:	<Description, ,>
-- =============================================
CREATE FUNCTION [dbo].[IDP_GetItemPath]
(
	-- Add the parameters for the function here
	@itemID INT,
	@path NVARCHAR(MAX)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE 
		@itemParentID INT

	-- Add the T-SQL statements to compute the return value here
	SELECT 
		@itemParentID = dbo.IDP_GetItemParentID(@itemID)

	--select @itemName = b.ItemName from IDP_Item a join IDP_ItemName b on a.ItemNameID = b.ItemNameID
	--where a.itemID = @itemID	 -- set the itemNameID of current node

	---------------------- recursion starts here ----------------------
	IF (@itemParentID IS NULL)
		SET @Path = @itemID
	ELSE
		SET @Path = ISNULL(@path,'') + dbo.IDP_GetItemPath(@itemParentID, @path) + '#' +  CONVERT(VARCHAR, @itemID)
	----------------------recursion ends here ----------------------		

	-- Return the result of the function
	RETURN ISNULL(@path, '')

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_AdjustmentProjectCosting_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:	Sahil Nagpal
-- Create date: 27/11/2017
-- Description:	Gets list of Costing per year for a AdjustmentProject
-- Calls : SELECT dbo.Plan_AdjustmentProjectCosting_fxn(1,0)
-- =============================================
CREATE FUNCTION [dbo].[Plan_AdjustmentProjectCosting_fxn]
	-- Add the parameters for the function here
(
	@AdjustmentProjectID int,
	@ShowCode bit
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(max)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(SCOACostingCODE,''))
		FROM 
	(SELECT DISTINCT
	 (CASE WHEN @ShowCode = 1 THEN
		 ScoaCode + ' : ' +  ScoaDesc
		ELSE
			  ScoaDesc
		END)
	AS SCOACostingCODE 
	FROM dbo.Plan_AdjustmentProjectCosting
		INNER JOIN dbo.Const_SCOA_Costing_Structure ON ScoaID = ScoaCostingID
		WHERE  AdjustmentProjectID =@AdjustmentProjectID)  AS PlanAdjustmentProjectFunction

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_AdjustmentProjectFunction_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:	Sahil Nagpal
-- Create date: 27/11/2017
-- Description:	Gets list of funding per year for a AdjustmentProject
-- Calls : SELECT dbo.Plan_AdjustmentProjectFunction_fxn(57,0)
-- =============================================
CREATE FUNCTION [dbo].[Plan_AdjustmentProjectFunction_fxn]
	-- Add the parameters for the function here
(
	@AdjustmentProjectID int,
	@ShowCode bit
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(max)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(SCOAFunctionCODE,''))
		FROM 
	(SELECT DISTINCT
	 (CASE WHEN @ShowCode = 1 THEN
		 ScoaCode + ' : ' +  ScoaDesc
		ELSE
			  ScoaDesc
		END)
	AS SCOAFunctionCODE 
	FROM dbo.Plan_AdjustmentProjectFunctions
		INNER JOIN dbo.Const_SCOA_Function_Structure ON ScoaID = ScoaFunctionID
		WHERE  AdjustmentProjectID =@AdjustmentProjectID)  AS PlanAdjustmentProjectRegion

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_AdjustmentProjectIDP_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:  Raindree Chetty
-- Create date: 05/02/2018
-- Description: Gets list of Plan_AdjustmentProjectIDP for a project
-- Calls : SELECT dbo.Plan_AdjustmentProjectIDP_fxn(0,0)
-- 16/02/2018 Rchetty : Need to find idp parent not project idp item
-- =============================================
CREATE FUNCTION [dbo].[Plan_AdjustmentProjectIDP_fxn]
 -- Add the parameters for the function here
(
 @ProjectID int,
 @IDPItemID int
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
 -- Declare the return variable here
 DECLARE @listStr VARCHAR(max)
 
 -- Add the T-SQL statements to compute the return value here
  SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(IDPDesc,''))
  FROM 
 (SELECT DISTINCT
  iit.ItemDesc
 AS IDPDesc 
 FROM dbo.Plan_AdjustmentProjectIDP ppid
  INNER JOIN dbo.IDP_Item iit ON iit.Item_ID = ppid.ParentIDPItemID
  WHERE  
  (CASE WHEN @ProjectID = 0 THEN 0
                ELSE ppid.AdjustmentProjectID
           END = @ProjectID )
  AND
  (CASE WHEN @IDPItemID = 0 THEN 0
                ELSE ppid.ParentIDPItemID
           END = @IDPItemID )
  )  AS PlanProjectIDP

 -- Return the result of the function
 RETURN ISNULL(@listStr,'')

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_BudgetSign_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE   FUNCTION [dbo].[Plan_BudgetSign_fxn]
(
	@scoaItemCode NVARCHAR(50),
	@capitalOperational INT,
	@creditDebit NVARCHAR(1),
	@scoaItemShortDesc NVARCHAR(200),
	@finYear NVARCHAR(9)
)
RETURNS INT
AS
BEGIN
	DECLARE @sign INT = 1;
	DECLARE @finYearEnd INT = CONVERT(INT, SUBSTRING(@finYear, 6, 9))

	SELECT @sign = 
		CASE WHEN @finYearEnd >= 2026 THEN
		CASE 
			WHEN @scoaItemCode LIKE 'IL%' 
			     AND @scoaItemShortDesc IN ('Deposits')
			THEN 
				CASE WHEN @creditDebit = 'C' THEN -1 ELSE 1 END

			WHEN @scoaItemCode LIKE 'IL%' 
			     AND @scoaItemShortDesc IN ('Withdrawals')
			THEN 
				CASE WHEN @creditDebit = 'D' THEN 1 ELSE -1 END

			WHEN @scoaItemCode LIKE 'IL%' 
			     AND @scoaItemShortDesc NOT IN ('Deposits', 'Withdrawals')
			THEN 
				CASE WHEN @creditDebit = 'C' THEN -1 ELSE 1 END

			ELSE 
				CASE 
					WHEN 
						(
							(@scoaItemCode LIKE 'IL%' OR @scoaItemCode LIKE 'IR%')
							AND @capitalOperational IN (0,1,2)
						)
						OR @creditDebit = 'C'
					THEN -1 ELSE 1 
				END
		END
		ELSE
			CASE 
				WHEN 
					(
						(@scoaItemCode LIKE 'IL%' OR @scoaItemCode LIKE 'IR%')
						AND @capitalOperational IN (0,1,2)
					)
					OR @creditDebit = 'C'
				THEN -1 ELSE 1 
			END
		END;

	RETURN @sign;
END;
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_DivisionDescDirectorate_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 06/03/2017
-- Description:	Gets DivisionDesc of Directorate level
-- Calls : SELECT dbo.Plan_DivisionDescDirectorate_fxn(100)
-- =============================================
CREATE FUNCTION [dbo].[Plan_DivisionDescDirectorate_fxn]
	-- Add the parameters for the function here
(
	@DivisionID int
)
RETURNS VARCHAR(500)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @DivisionDesc VARCHAR(500)

;WITH CTE1 AS
(
	SELECT  DivisionDesc,DivisionParentID,Division_ID,DirectorateLevel
	FROM Const_Division
		WHERE Division_ID = @DivisionID
	UNION ALL 
	SELECT D.DivisionDesc, D.DivisionParentID, D.Division_ID,D.DirectorateLevel
	FROM Const_Division D
	INNER JOIN CTE1 C ON C.DivisionParentID = D.Division_ID 
)

SELECT TOP 1 @DivisionDesc = CTE1.DivisionDesc FROM CTE1
WHERE DirectorateLevel = 1

	-- Return the result of the function
	RETURN @DivisionDesc

END



GO

/****** Object:  UserDefinedFunction [dbo].[Plan_DivisionIDDirectorate_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 06/03/2017
-- Description:	Gets DivisionDesc of Directorate level
-- Calls : SELECT dbo.Plan_DivisionIDDirectorate_fxn(1152)

-- Updated:		Richard Bothma
-- Create date: 15/05/2017
-- Description:	Adapted original version of function (Plan_DivisionDescDirectorate_fxn) to pass ID instead of Description only
				--Gets DivisionID of Directorate level
-- =============================================
CREATE FUNCTION [dbo].[Plan_DivisionIDDirectorate_fxn]
	-- Add the parameters for the function here
(
	@DivisionID INT
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @DivisionID_Returned INT

;WITH CTE1 AS
(
	SELECT  DivisionDesc,DivisionParentID,Division_ID,DirectorateLevel
	FROM Const_Division
		WHERE Division_ID = @DivisionID
	UNION ALL 
	SELECT D.DivisionDesc, D.DivisionParentID, D.Division_ID,D.DirectorateLevel
	FROM Const_Division D
	INNER JOIN CTE1 C ON C.DivisionParentID = D.Division_ID 
)

SELECT TOP 1 @DivisionID_Returned = CTE1.Division_ID FROM CTE1
WHERE DirectorateLevel = 1

	-- Return the result of the function
	RETURN @DivisionID_Returned

END

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetAdjustmentFundAllocatedAmount_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:	Sahil Nagpal
-- Create date: 28/11/2017
-- Description: Get Alloacted Fund Amount
-- 210126 by CM: 45335 - Only include CapitalOperation projects in 0, 1, 4
-- select [dbo].[Plan_GetAdjustmentFundAllocatedAmount_fxn](1,'2016/2017','2016/2017',1)
-- 03-03-2023 By CM: 97883 - Get allocated amounts from Plan_AdjustmentProjectItem table
-- ==============================================================

CREATE   FUNCTION [dbo].[Plan_GetAdjustmentFundAllocatedAmount_fxn]
    (
      @SCOAId INT ,
      @FynYear VARCHAR(50),
	  @CurFinYear VARCHAR(50),
	  @AdjustmentVersionId INT
    )
RETURNS DECIMAL(18, 2)
AS
BEGIN
    DECLARE @Amount DECIMAL(18, 2)

    DECLARE @CurFinYearAsNumber INT = CAST(SUBSTRING(@CurFinYear, 1, 4) AS INT);
	DECLARE @FinYearAsNumber INT = CAST(SUBSTRING(@FynYear, 1, 4) AS INT);

	SELECT  @Amount = CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber THEN SUM(ISNULL(AdjustedBudgetAmount, BudgetAmount))
						ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 1 THEN SUM(ISNULL(AdjustedBudgetAmountCurP1, BudgetAmountCurP1))
							ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 2 THEN SUM(ISNULL(AdjustedBudgetAmountCurP2, BudgetAmountCurP2))
							END
						END
					END
    FROM    Plan_AdjustmentProjectItem ppi
			INNER JOIN Plan_AdjustmentProject pp ON ppi.AdjustmentProjectID = pp.AdjustmentProject_ID 
    WHERE   ScoaFundID = @SCOAId 
			AND pp.AdjustmentVersionId = @AdjustmentVersionId
			AND CapitalOperation IN (0, 1, 4)
			AND ISNULL(pp.isDeleted, 0) <> 1;

    RETURN @Amount;
 
END;
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetAdjustmentFundAvailableAmount_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:	Sahil Nagpal
-- Create date: 28/11/2017
-- Description:	Get Available Fund Amount
-- select [dbo].[Plan_GetAdjustmentFundAvailableAmount_fxn](1,'2016/2017')
-- ============================================================== 
CREATE FUNCTION [dbo].[Plan_GetAdjustmentFundAvailableAmount_fxn]
    (
      @SCOAId INT ,
      @FynYear VARCHAR(50),
	  @AdjustmentFundingVersionId INT
    )
RETURNS DECIMAL(18, 2)
AS
    BEGIN
        DECLARE @Amount DECIMAL(18, 2);

        SELECT  @Amount = SUM (ISNULL(FundingSourceBudget, 0))
        FROM    dbo.Plan_AdjustmentFundingSourceBudget_Header AS pah
                INNER JOIN Plan_AdjustmentFundingSourceBudget_Detail AS pad
				ON pad.AdjustmentFundingSourceBudgetHeaderID = pah.AdjustmentFundingSourceBudgetHeader_ID
        WHERE   ScoaID = @SCOAId
                AND FinancialYear = @FynYear AND pah.AdjustmentFundingVersionId = @AdjustmentFundingVersionId;

        RETURN @Amount;
	
    END;

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetBudgetDocumentDetailLink_fxn]    Script Date: 2026/03/11 4:32:30 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Chris Moodley
-- Create date: 09 July 2020
-- Description:	Return document link between processes
-- 17 Jul 2020 by CM: #38658 Return document link for SCM_TenderBBBEEPreferencePoints table
-- =============================================
CREATE FUNCTION [dbo].[Plan_GetBudgetDocumentDetailLink_fxn]
(
	-- Add the parameters for the function here
	@TableName VARCHAR(MAX),
	@PK int
)
RETURNS VARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @DocumentDetailLink VARCHAR(MAX)

	-- Add the T-SQL statements to compute the return value here
	IF @TableName = 'Plan_ProjectItem'
	SELECT @DocumentDetailLink = 'Plan_ProjectItem_' + CONVERT(VARCHAR, @PK)

	ELSE IF @TableName = 'Plan_Virements'
	SELECT @DocumentDetailLink = 'Plan_Virements_' + CONVERT(VARCHAR, @PK)

	ELSE IF @TableName = 'Led_PaymentInstructionDetails'
	SELECT @DocumentDetailLink = 'Led_PaymentInstructionDetails_' + CONVERT(VARCHAR, @PK)

	ELSE IF @TableName = 'Led_Cashbook'
	SELECT @DocumentDetailLink = 'Led_Cashbook_' + CONVERT(VARCHAR, @PK)

	ELSE IF @TableName = 'SCM_ContractExtensionAndVariation'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) FROM SCM_ContractExtensionAndVariation WHERE Extension_ID = @PK

	ELSE IF @TableName = 'Inven_InventoryIssueLineItem'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) FROM Inven_InventoryIssueLineItem WHERE InvIssueLineItem_ID = @PK

	ELSE IF @TableName = 'SCM_GRNDetails'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDelID) 
	FROM SCM_GRNDetails grn LEFT JOIN dbo.SCM_OrderTypeDetail sotd ON grn.OrderDetailID = sotd.OrderDetailID
	WHERE GRNDetail_ID = @PK

	ELSE IF @TableName = 'SCM_ContractServiceRequestDetails'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) 
	FROM SCM_ContractServiceRequestDetails scsrd LEFT JOIN dbo.SCM_ServiceInvoiceDetails ssid ON scsrd.ServiceInvoiceDetail_ID = ssid.ServiceInvoiceDetail_ID
	WHERE ContractServiceRequestDetails_ID = @PK

	ELSE IF @TableName = 'SCM_InformalTenderServiceDetail'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) FROM SCM_InformalTenderServiceDetail WHERE TenderServiceDel_ID = @PK

	ELSE IF @TableName = 'Asset_DepreciationSchedule_Item'
	SELECT @DocumentDetailLink = 'Asset_DepreciationSchedule_Item_' + CONVERT(VARCHAR, Asset_DepreciationSchedule_Item_ID) FROM Asset_DepreciationSchedule_Item WHERE Asset_DepreciationSchedule_Item_ID = @PK

	ELSE IF @TableName = 'Asset_Disposal_Approval'
	SELECT @DocumentDetailLink = 'Asset_Disposal_Approval_' + CONVERT(VARCHAR, AssetDisposalApproval_ID) FROM Asset_Disposal_Approval WHERE AssetDisposalApproval_ID = @PK

	ELSE IF @TableName = 'Asset_Impairment'
	SELECT @DocumentDetailLink = 'Asset_Impairment_' + CONVERT(VARCHAR, Impairment_ID) FROM Asset_Impairment WHERE Impairment_ID = @PK

	ELSE IF @TableName = 'Asset_Register_Transactions'
	SELECT @DocumentDetailLink = 'Asset_Register_Transactions_' + CONVERT(VARCHAR, ID) FROM Asset_Register_Transactions WHERE ID = @PK

	ELSE IF @TableName = 'SCM_ContractDetailItems'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) FROM SCM_ContractDetailItems WHERE ContractDetailItems_ID = @PK

	ELSE IF @TableName = 'SCM_InvoiceCreditDetail'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, ISNULL(sotd.RequisitionDelID, sid.RequisitionDetailID)) 
	FROM SCM_InvoiceCreditDetail sicd 
	LEFT JOIN SCM_InvoiceDetail sidl ON sicd.InvoiceDetailID = sidl.InvoiceDetail_ID
	LEFT JOIN SCM_OrderTypeDetail sotd ON sidl.OrderDetailID = sotd.OrderDetailID OR sotd.OrderDetailID = sicd.OrderDetailID
	LEFT JOIN SCM_ContractServiceRequestDetails csrd ON sidl.ContractServiceRequestDetailsId = csrd.ContractServiceRequestDetails_ID
	LEFT JOIN SCM_ServiceInvoiceDetails sid ON csrd.ServiceInvoiceDetail_ID = sid.ServiceInvoiceDetail_ID
	WHERE InvoiceCreditDetail_ID = @PK

	ELSE IF @TableName = 'Led_PettyCashExpense'
	SELECT @DocumentDetailLink = 'Led_PettyCashExpense_' + CONVERT(VARCHAR, PettyCashExpenseID) FROM Led_PettyCashExpense WHERE PettyCashExpenseID = @PK

	ELSE IF @TableName = 'SCM_OrderTypeDetail'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDelID) FROM SCM_OrderTypeDetail WHERE OrderDetailID = @PK

	ELSE IF @TableName = 'SCM_SundryPaymentServiceDetails'
	SELECT @DocumentDetailLink = 'SCM_SundryPaymentServiceDetails_' + CONVERT(VARCHAR, SundryPaymentDetail_ID) FROM SCM_SundryPaymentServiceDetails WHERE SundryPaymentDetail_ID = @PK

	ELSE IF @TableName = 'Led_Journal_Multiple'
	SELECT @DocumentDetailLink = 'Led_Journal_Multiple_' + CONVERT(VARCHAR, MultipleJournal_ID) FROM Led_Journal_Multiple WHERE MultipleJournal_ID = @PK

	ELSE IF @TableName = 'Led_Journal_Normal'
	SELECT @DocumentDetailLink = 'Led_Journal_Normal_' + CONVERT(VARCHAR, NormalJournal_ID) FROM Led_Journal_Normal WHERE NormalJournal_ID = @PK

	ELSE IF @TableName = 'Led_Journal_Asset'
	SELECT @DocumentDetailLink = 'Led_Journal_Asset_' + CONVERT(VARCHAR, AssetJournal_ID) FROM Led_Journal_Asset WHERE AssetJournal_ID = @PK

	ELSE IF @TableName = 'Led_Journal_Inven'
	SELECT @DocumentDetailLink = 'Led_Journal_Inven_' + CONVERT(VARCHAR, InvenJournal_ID) FROM Led_Journal_Inven WHERE InvenJournal_ID = @PK

	ELSE IF @TableName = 'SCM_InvoiceDetail'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, ISNULL(sotd.RequisitionDelID, sid.RequisitionDetailID)) 
	FROM SCM_InvoiceDetail sidl 
	LEFT JOIN SCM_OrderTypeDetail sotd ON sidl.OrderDetailID = sotd.OrderDetailID
	LEFT JOIN SCM_ContractServiceRequestDetails csrd ON sidl.ContractServiceRequestDetailsId = csrd.ContractServiceRequestDetails_ID
	LEFT JOIN SCM_ServiceInvoiceDetails sid ON csrd.ServiceInvoiceDetail_ID = sid.ServiceInvoiceDetail_ID
	WHERE InvoiceDetail_ID = @PK

	ELSE IF @TableName = 'SCM_RequisitionTenderLink'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) FROM SCM_RequisitionTenderLink WHERE RequisitionTenderLink_ID = @PK

	ELSE IF @TableName = 'SCM_RequisitionServiceDetails'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetail_ID) FROM SCM_RequisitionServiceDetails WHERE RequisitionDetail_ID = @PK

	ELSE IF @TableName = 'SCM_GRADetails'
	SELECT DISTINCT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetail_ID) 
	FROM dbo.SCM_GRADetails GRAD
		LEFT JOIN dbo.SCM_GRNDetails GD ON GD.GRNID = GRAD.GRN_Id
		LEFT JOIN dbo.SCM_OrderTypeDetail OD ON OD.OrderDetailID = GD.OrderDetailID
		LEFT JOIN dbo.SCM_RequisitionServiceDetails RSD ON RSD.RequisitionDetail_ID = OD.RequisitionDelID
	WHERE GRADetail_ID = @PK

	ELSE IF @TableName = 'SCM_QuotationServiceDetail'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) FROM SCM_QuotationServiceDetail WHERE QuotationServiceDel_ID = @PK

	ELSE IF @TableName = 'Inven_InventoryReturnLineItem'
	SELECT @DocumentDetailLink = 'Inven_InventoryReturnLineItem_ID_' + CONVERT(VARCHAR, InvReturnLineItem_ID) FROM Inven_InventoryReturnLineItem WHERE InvReturnLineItem_ID = @PK

	ELSE IF @TableName = 'SCM_TenderBBBEEPreferencePoints'
	SELECT @DocumentDetailLink = 'SCM_RequisitionServiceDetails_' + CONVERT(VARCHAR, RequisitionDetailID) 
	FROM SCM_TenderBBBEEPreferencePoints stbpp LEFT JOIN dbo.SCM_RequisitionTenderLink srtl ON stbpp.TenderRequisitionLinkID = srtl.RequisitionTenderLink_ID
	WHERE PreferencePoints_ID = @PK

	-- Return the result of the function
	RETURN @DocumentDetailLink

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetBudgetTransactionOutstandingAmount_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Mike Savvin
-- Create date: 01 Jan 2021
-- Description:	Function to define the outstanding amount of the entity
-- =============================================
CREATE FUNCTION [dbo].[Plan_GetBudgetTransactionOutstandingAmount_fxn]
(
	-- Add the parameters for the function here
	@TableName VARCHAR(MAX),
	@PK INT
)
RETURNS DECIMAL(18, 2)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @OutstandingAmount DECIMAL(18, 2)

	-- Add the T-SQL statements to compute the return value here
	IF @TableName = 'SCM_RequisitionServiceDetails'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_QuotationServiceDetail QSD
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = QSD.RequisitionDetailID
			INNER JOIN SCM_Quotation Q
				ON QSD.QuotationID = Q.Quotation_ID
			WHERE ISNULL(Q.Cancel, 0) = 0
				AND RSD.RequisitionDetail_ID = @PK

			UNION

			SELECT 1
			FROM SCM_InformalTenderServiceDetail ITSD
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = ITSD.RequisitionDetailID
			INNER JOIN SCM_InformalTender IT
				ON ITSD.InformalTenderID = IT.InformalTender_ID
			WHERE ISNULL(IT.Cancel, 0) = 0
				AND RSD.RequisitionDetail_ID = @PK

			UNION

			SELECT 1
			FROM SCM_RequisitionTenderLink RTL
			INNER JOIN SCM_Tender T
				ON T.Tender_ID = RTL.TenderID
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = RTL.RequisitionDetailID
			WHERE ISNULL(T.TenderCancel, 0) = 0
				AND RSD.RequisitionDetail_ID = @PK

			UNION

			SELECT 1
			FROM Inven_InventoryIssueLineItem IIL
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = IIL.RequisitionDetailID
			INNER JOIN Inven_InventoryIssue II
				ON II.Issue_ID = IIL.IssueID
			WHERE ISNULL(II.CancelReason, '') != ''
				AND ISNULL(IIL.Completed, 0) = 1
				AND RSD.RequisitionDetail_ID = @PK

			UNION

			SELECT 1
			FROM SCM_RequisitionServiceDetails RSD
			INNER JOIN SCM_Requisition R
				ON R.Requisition_ID = RSD.RequisitionID
			WHERE ISNULL(R.Enabled, 0) = 0
				AND RSD.RequisitionDetail_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
				(EstimatedCost * Quantity) AS Amount
			FROM SCM_RequisitionServiceDetails RSD
			WHERE RSD.RequisitionDetail_ID = @PK
		)
		END

	IF @TableName = 'SCM_QuotationServiceDetail'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_ContractDetailItems CDI
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = CDI.RequisitionDetailID
			INNER JOIN SCM_QuotationServiceDetail QSD
				ON QSD.RequisitionDetailID = RSD.RequisitionDetail_ID
			WHERE ISNULL(CDI.Enabled, 0) = 1
				AND QSD.QuotationServiceDel_ID = @PK

			UNION

			SELECT 1
			FROM SCM_QuotationServiceDetail QSD
			INNER JOIN SCM_Quotation Q
				ON Q.Quotation_ID = QSD.QuotationID
			WHERE ISNULL(Q.Cancel, 0) = 1
				AND QSD.QuotationServiceDel_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				ISNULL(QSVD.Cost, QSD.EstimatedCost * QSD.Quantity) -
				(
					SELECT ISNULL(SUM(OTD.Amount), 0)
					FROM SCM_OrderTypeDetail OTD
					INNER JOIN SCM_RequisitionServiceDetails RSD
						ON RSD.RequisitionDetail_ID = OTD.RequisitionDelID
					INNER JOIN SCM_QuotationServiceDetail QSD
						ON QSD.RequisitionDetailID = RSD.RequisitionDetail_ID
					WHERE (ISNULL(OTD.IsVoid, 0) = 0 OR ISNULL(OTD.IsCompletedOnVoid, 0) = 1)
						AND QSD.QuotationServiceDel_ID = @PK 
				)
			) AS Amount
			FROM SCM_QuotationServiceDetail QSD
			LEFT JOIN SCM_QuotationServiceVendorDetail QSVD
				ON QSVD.QuotationServiceDetailID = QSD.QuotationServiceDel_ID AND ISNULL(QSVD.Successful, 0) = 1
			WHERE QSD.QuotationServiceDel_ID = @PK
		)
		END

	IF @TableName = 'SCM_InformalTenderServiceDetail'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_ContractDetailItems CDI
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = CDI.RequisitionDetailID
			INNER JOIN SCM_InformalTenderServiceDetail ITSD
				ON ITSD.RequisitionDetailID = RSD.RequisitionDetail_ID
			WHERE ISNULL(CDI.Enabled, 0) = 1
				AND ITSD.TenderServiceDel_ID = @PK

			UNION

			SELECT 1
			FROM SCM_InformalTenderServiceDetail ITSD
			INNER JOIN SCM_InformalTender IT
				ON IT.InformalTender_ID = ITSD.InformalTenderID
			WHERE ISNULL(IT.Cancel, 0) = 1
				AND ITSD.TenderServiceDel_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				ISNULL(ITSVD.Cost, ITSD.EstimatedCost * ITSD.Quantity) -
				(
					SELECT ISNULL(SUM(OTD.Amount), 0)
					FROM SCM_OrderTypeDetail OTD
					INNER JOIN SCM_RequisitionServiceDetails RSD
						ON RSD.RequisitionDetail_ID = OTD.RequisitionDelID
					INNER JOIN SCM_InformalTenderServiceDetail ITSD
						ON ITSD.RequisitionDetailID = RSD.RequisitionDetail_ID
					WHERE (ISNULL(OTD.IsVoid, 0) = 0 OR ISNULL(OTD.IsCompletedOnVoid, 0) = 1)
						AND ITSD.TenderServiceDel_ID = @PK 
				)
			) AS Amount
			FROM SCM_InformalTenderServiceDetail ITSD
			LEFT JOIN SCM_InformalTenderServiceVendorDetail ITSVD
				ON ITSVD.TenderServiceDelID = ITSD.TenderServiceDel_ID AND ISNULL(ITSVD.Successful, 0) = 1
			WHERE ITSD.TenderServiceDel_ID = @PK
		)
		END

	IF @TableName = 'SCM_RequisitionTenderLink'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_RequisitionTenderLink RTL
			INNER JOIN SCM_TenderBBBEEPreferencePoints BPP
				ON BPP.TenderRequisitionLinkID = RTL.RequisitionTenderLink_ID
			WHERE RTL.RequisitionTenderLink_ID = @PK

			UNION

			SELECT 1
			FROM SCM_RequisitionTenderLink RTL
			INNER JOIN SCM_Tender T
				ON T.Tender_ID = RTL.TenderID
			WHERE ISNULL(T.TenderCancel, 0) = 1
				AND RTL.RequisitionTenderLink_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
				(RSD.EstimatedCost * RSD.Quantity) AS Amount
			FROM SCM_RequisitionTenderLink RTL
			INNER JOIN SCM_RequisitionServiceDetails RSD
				ON RSD.RequisitionDetail_ID = RTL.RequisitionDetailID
			WHERE RTL.RequisitionTenderLink_ID = @PK
		)
		END

	IF @TableName = 'SCM_TenderBBBEEPreferencePoints'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_TenderBBBEEPreferencePoints BPP
			INNER JOIN SCM_RequisitionBillOfQuantity BOQ
				ON BPP.BillOfQuantityID = BOQ.BillOfQuantityId
			INNER JOIN SCM_ContractDetailItems CDI
				ON CDI.BillOfQuantityID = BOQ.BillOfQuantityId
			WHERE ISNULL(CDI.Enabled, 0) = 1
				AND BPP.PreferencePoints_ID = @PK

			UNION

			SELECT 1
			FROM SCM_TenderBBBEEPreferencePoints BPP
			INNER JOIN SCM_Tender T
				ON T.Tender_ID = BPP.TenderID
			WHERE ISNULL(T.TenderCancel, 0) = 1
				AND BPP.PreferencePoints_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
				(BPP.Cost) AS Amount
			FROM SCM_TenderBBBEEPreferencePoints BPP
			INNER JOIN SCM_TenderAwardedVendor TAV
				ON TAV.PreferencePointsID = BPP.PreferencePoints_ID
			WHERE BPP.PreferencePoints_ID = @PK
		)
		END

	IF @TableName = 'SCM_ContractDetailItems'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_ContractDetailItems CDI
			WHERE ISNULL(CDI.Enabled, 0) = 0
				AND CDI.ContractDetailItems_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				CDI.Cost -
				(
					SELECT ISNULL(SUM(OTD.Amount), 0)
					FROM SCM_OrderTypeDetail OTD
					INNER JOIN SCM_ContractDetailItems CDI
						ON CDI.ContractDetailItems_ID = OTD.ContractDetailItemsID
					WHERE (ISNULL(OTD.IsVoid, 0) = 0 OR ISNULL(OTD.IsCompletedOnVoid, 0) = 1)
						AND CDI.ContractDetailItems_ID = @PK 
				)
				-
				(
					SELECT ISNULL(SUM(CSRD.TotalAmountExcl), 0)
					FROM SCM_ContractServiceRequestDetails CSRD
					INNER JOIN SCM_ContractServiceRequest CSR
						ON CSR.ContractServiceRequest_ID = CSRD.ContractServiceRequestId
					INNER JOIN SCM_ServiceInvoiceDetails SID
						ON SID.ServiceInvoiceDetail_ID = CSRD.ServiceInvoiceDetail_ID
					INNER JOIN SCM_ContractDetailItems CDI
						ON CDI.ContractDetailItems_ID = SID.ContractDetailItemsID
					WHERE ISNULL(CSR.IsVoid, 0) = 0
						AND CDI.ContractDetailItems_ID = @PK 
				)
			) AS Amount
			FROM SCM_ContractDetailItems CDI
			WHERE CDI.ContractDetailItems_ID = @PK
		)
		END

	IF @TableName = 'SCM_OrderTypeDetail'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_OrderTypeDetail OTD
			WHERE ISNULL(OTD.IsVoid, 0) = 1
				AND OTD.OrderDetailID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				OTD.Amount -
				(
					SELECT ISNULL(SUM(GRND.ReceivedUnitPrice * (GRND.GoodsReceived - ISNULL(GRND.QuantityVoided, 0))), 0)
					FROM SCM_GRNDetails GRND
					INNER JOIN SCM_OrderTypeDetail OTD
						ON OTD.OrderDetailID = GRND.OrderDetailID
					WHERE OTD.OrderDetailID = @PK 
				)
			) AS Amount
			FROM SCM_OrderTypeDetail OTD
			WHERE OTD.OrderDetailID = @PK
		)
		END

	IF @TableName = 'SCM_GRNDetails'
	SELECT @OutstandingAmount = 
		(
			SELECT TOP (1) 
			(
				GRND.ReceivedUnitPrice * (GRND.GoodsReceived - ISNULL(GRND.QuantityVoided, 0) - 
				(
					SELECT SUM(ID.QuantityReceived)
					FROM SCM_InvoiceDetail ID
					INNER JOIN SCM_GRNDetails GRND
						ON GRND.GRNDetail_ID = ID.GRRDetailID
					WHERE ISNULL(ID.IsVoid, 0) = 0
						AND GRND.GRNDetail_ID = @PK
				))
			) AS Amount
			FROM SCM_GRNDetails GRND
			WHERE GRND.GRNDetail_ID = @PK
		)

	IF @TableName = 'SCM_ContractServiceRequestDetails'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_ContractServiceRequestDetails CSRD
			INNER JOIN SCM_ContractServiceRequest CSR
				ON CSR.ContractServiceRequest_ID = CSRD.ContractServiceRequestId
			WHERE ISNULL(CSR.IsVoid, 0) = 1
				AND CSRD.ContractServiceRequestDetails_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				CSRD.TotalAmountExcl -
				(
					SELECT ISNULL(SUM(ID.Amount), 0)
					FROM SCM_InvoiceDetail ID
					INNER JOIN SCM_ContractServiceRequestDetails CSRD
						ON CSRD.ContractServiceRequestDetails_ID = ID.ContractServiceRequestDetailsId
					WHERE ISNULL(ID.IsVoid, 0) = 0
						AND CSRD.ContractServiceRequestDetails_ID = @PK 
				)
			) AS Amount
			FROM SCM_ContractServiceRequestDetails CSRD
			WHERE CSRD.ContractServiceRequestDetails_ID = @PK
		)
		END

	IF @TableName = 'SCM_InvoiceDetail'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_InvoiceDetail ID
			WHERE ISNULL(ID.IsVoid, 0) = 1
				AND ID.InvoiceDetail_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				ID.Amount -
				(
					SELECT ISNULL(SUM(PID.VoteAmount), 0)
					FROM SCM_PaymentAllocation PA
					INNER JOIN Led_PaymentInstructionDetails PID
						ON PA.PaymentInstructionDetailID = PID.PaymentInstructionDetail_ID
					INNER JOIN SCM_Payment P
						ON P.Payment_ID = PA.PaymentID
					INNER JOIN SCM_InvoiceDetail ID
						ON ID.InvoiceDetail_ID = PA.InvoiceDetailID
					WHERE ISNULL(P.IsVoid, 0) = 0
						AND ID.InvoiceDetail_ID = @PK 
				)
				-
				(
					SELECT SUM(IIF(ICDN.NoteType = 1, ICD.Amount, -ICD.Amount))
					FROM SCM_InvoiceCreditDetail ICD
					INNER JOIN SCM_InvoiceDetail ID
						ON ID.InvoiceDetail_ID = ICD.InvoiceDetailID
					INNER JOIN SCM_InvoiceCreditDebtNote ICDN
						ON ICDN.ID = ICD.InvoiceCreditID
					WHERE ID.InvoiceDetail_ID = @PK
				)
			) AS Amount
			FROM SCM_InvoiceDetail ID
			WHERE ID.InvoiceDetail_ID = @PK
		)
		END

	IF @TableName = 'SCM_SundryPaymentServiceDetails'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_SundryPaymentServiceDetails SPSD
			INNER JOIN SCM_SundryPayment SP
				ON SP.SundryPayment_ID = SPSD.SundryPaymentID
			WHERE ISNULL(SP.IsVoid, 0) = 1
				AND SPSD.SundryPaymentDetail_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
			(
				SPSD.Amount -
				(
					SELECT ISNULL(SUM(PID.VoteAmount), 0)
					FROM SCM_PaymentAllocation PA
					INNER JOIN Led_PaymentInstructionDetails PID
						ON PA.PaymentInstructionDetailID = PID.PaymentInstructionDetail_ID
					INNER JOIN SCM_Payment P
						ON P.Payment_ID = PA.PaymentID
					INNER JOIN SCM_SundryPaymentServiceDetails SPSD
						ON SPSD.SundryPaymentDetail_ID = PA.SundryPaymentDetailID
					WHERE ISNULL(P.IsVoid, 0) = 0
						AND SPSD.SundryPaymentDetail_ID = @PK 
				)
			) AS Amount
			FROM SCM_SundryPaymentServiceDetails SPSD
			WHERE SPSD.SundryPaymentDetail_ID = @PK
		)
		END

	IF @TableName = 'Led_PaymentInstructionDetails'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM SCM_PaymentAllocation PA
			INNER JOIN Led_PaymentInstructionDetails PID
				ON PA.PaymentInstructionDetailID = PID.PaymentInstructionDetail_ID
			INNER JOIN SCM_Payment P
				ON P.Payment_ID = PA.PaymentID
			WHERE ISNULL(P.IsVoid, 0) = 1
				AND PID.PaymentInstructionDetail_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
				PID.VoteAmount AS Amount
			FROM Led_PaymentInstructionDetails PID
			WHERE PID.PaymentInstructionDetail_ID = @PK
		)
		END

	IF @TableName = 'Inven_InventoryIssueLineItem'
	SELECT @OutstandingAmount = 
		CASE WHEN EXISTS
		(
			SELECT 1
			FROM Inven_InventoryIssueLineItem IIL
			WHERE ISNULL(IIL.IssueToCapitalExpense, 0) = 1
				AND IIL.InvIssueLineItem_ID = @PK
		)
		THEN 
			0
		ELSE
		(
			SELECT TOP (1) 
				(IIL.Quantity * IIL.Price) AS Amount
			FROM Inven_InventoryIssueLineItem IIL
			WHERE IIL.InvIssueLineItem_ID = @PK
		)
		END

	-- Return the result of the function
	RETURN @OutstandingAmount

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetBudgetTransactionTypeDesc]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- Create date: 24 Jun 2020
-- Description:	Format budget transaction type desc  
CREATE FUNCTION [dbo].[Plan_GetBudgetTransactionTypeDesc]
(
	@BudgetConsumptionProcessID int,
	@BudgetTransactionTypeID int
)
RETURNS NVARCHAR(200)
AS
BEGIN
	DECLARE @Result NVARCHAR(200);
	SELECT TOP 1 @Result = BudgetTransDesc FROM Const_BudgetTransactionType_sys
	WHERE BudgetTransactionType_ID = @BudgetTransactionTypeID
	
	SELECT  @Result =  
	   CASE   
		  WHEN @BudgetConsumptionProcessID = 103 
		  THEN 'Supervisor ' + @Result    
		  ELSE @Result   
	   END   
	RETURN @Result
END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_GetProjectDivisionByDivisionId_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 19/08/2016
-- Description:	Gets Specific Division for a projectItem
-- SELECT dbo.Plan_GetProjectDivisionByDivisionId_fxn(26)
-- =============================================
CREATE FUNCTION [dbo].[Plan_GetProjectDivisionByDivisionId_fxn] ( @DivisionID INT )
RETURNS NVARCHAR(MAX)
AS
    BEGIN
        DECLARE @ObjStr VARCHAR(MAX);

	--Recursive code found on net
        WITH    DeptDivGroup ( DivisionParentID, Division_ID, DivisionDesc, DivisionCode, DepartmentID )
                  AS (
	-- Anchor member definition
                       SELECT   e.DivisionParentID ,
                                e.Division_ID ,
                                e.DivisionDesc ,
                                e.DivisionCode ,
                                e.DepartmentID
                       FROM     dbo.Const_Division AS e
                       WHERE    DivisionParentID IS NULL
                       UNION ALL
	-- Recursive member definition
                       SELECT   e.DivisionParentID ,
                                e.Division_ID ,
                                e.DivisionDesc ,
                                e.DivisionCode ,
                                e.DepartmentID
                       FROM     dbo.Const_Division AS e
                                INNER JOIN DeptDivGroup AS d ON e.DivisionParentID = d.Division_ID
                     )
            SELECT DISTINCT
                    @ObjStr = ( cd.DepartmentCode + '/' + DivisionCode + ' '
                                + DepartmentDesc + ' / ' + DivisionDesc )
            FROM    DeptDivGroup rs
                    INNER JOIN Plan_ProjectDivisions pd ON pd.DivisionID = rs.Division_ID
                    INNER JOIN Const_Department cd ON rs.DepartmentID = cd.Department_ID
            WHERE   pd.DivisionID = @DivisionID;

			-- Return the result of the function
        RETURN ISNULL(@ObjStr,'');
   
    END;

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectCosting_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 22/11/2016
-- Description:	Gets list of Costing per year for a project
-- Calls : SELECT dbo.Plan_ProjectCosting_fxn(1,0)
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectCosting_fxn]
	-- Add the parameters for the function here
(
	@ProjectID int,
	@ShowCode bit
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(max)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(SCOACostingCODE,''))
		FROM 
	(SELECT DISTINCT
	 (CASE WHEN @ShowCode = 1 THEN
		 ScoaCode + ' : ' +  ScoaDesc
		ELSE
			  ScoaDesc
		END)
	AS SCOACostingCODE 
	FROM dbo.Plan_ProjectCosting
		INNER JOIN dbo.Const_SCOA_Costing_Structure ON ScoaID = ScoaCostingID
		WHERE  ProjectID =@ProjectID)  AS PlanProjectFunction

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectDaysBehind_fn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER OFF
GO


CREATE FUNCTION [dbo].[Plan_ProjectDaysBehind_fn] (@ProjectID INT, @AsAtDate SMALLDATETIME)
	RETURNS INT
AS
BEGIN

	DECLARE @DaysBehind INT
	DECLARE @PlanDate SMALLDATETIME
	DECLARE @ActDate SMALLDATETIME
	DECLARE @NextPlanDate SMALLDATETIME

	SELECT TOP 1 @PlanDate = PlanDate, @ActDate = [ActualDate]
	FROM
	(SELECT CASE WHEN [RevisedDate] IS NOT NULL Then [RevisedDate] Else [PlanDate] END AS [PlanDate], [ActualDate]
		FROM	[dbo].[Plan_Project_Milestone]
		WHERE	ProjectID = @ProjectID
	 UNION
	 SELECT CASE WHEN [RevisedDate] IS NOT NULL Then [RevisedDate] Else [PlanDate] END AS [PlanDate], [ActualDate]
		FROM	[dbo].[Plan_Project_Milestone_Custom]
		WHERE	ProjectID = @ProjectID
	) a
	ORDER BY [ActualDate] DESC, [PlanDate] DESC

	SELECT TOP 1 @NextPlanDate = PlanDate
	FROM
	(SELECT CASE WHEN [RevisedDate] IS NOT NULL Then [RevisedDate] Else [PlanDate] END AS [PlanDate], [ActualDate]
		FROM	[dbo].[Plan_Project_Milestone]
		WHERE	ProjectID = @ProjectID
	 UNION
	 SELECT CASE WHEN [RevisedDate] IS NOT NULL Then [RevisedDate] Else [PlanDate] END AS [PlanDate], [ActualDate]
		FROM	[dbo].[Plan_Project_Milestone_Custom]
		WHERE	ProjectID = @ProjectID
	) a
	WHERE [PlanDate] >= @PlanDate and [ActualDate] is null
	ORDER BY [PlanDate]

	SELECT 	@DaysBehind =
	CASE
		WHEN @NextPlanDate IS NULL THEN DATEDIFF(day,@PlanDate,@ActDate)
		WHEN  (DATEDIFF(day, @PlanDate, @ActDate) >= DATEDIFF(day, @NextPlanDate, @AsAtDate)) THEN DATEDIFF(day, @PlanDate, @ActDate)
		ELSE  DATEDIFF(day, @NextPlanDate, @AsAtDate)
	END

	RETURN @DaysBehind

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectDepartment_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Jignesh Prajapati
-- Create date: 05/04/2016
-- Description:	Gets list of Department for a project
-- Calls : SELECT dbo.Plan_ProjectDepartment_fxn(57,0)
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectDepartment_fxn]
	-- Add the parameters for the function here
    (
      @ProjectID INT ,
      @ShowCode BIT
    )
RETURNS NVARCHAR(MAX)
AS
    BEGIN
	-- Declare the return variable here
        DECLARE @listStr VARCHAR(MAX);
	
	-- Add the T-SQL statements to compute the return value here
        SELECT  @listStr = COALESCE(@listStr + ',', '')
                + CONVERT(NVARCHAR(300), ISNULL(DepartmentCODE, ''))
        FROM    ( SELECT DISTINCT
                            ( CASE WHEN @ShowCode = 1
                                   THEN CDep.DepartmentCode + ' : '
                                        + CDep.DepartmentDesc
                                   ELSE CDep.DepartmentDesc
                              END ) AS DepartmentCODE
                  FROM      dbo.Plan_ProjectDivisions PPD
                            INNER JOIN dbo.Const_Division CD ON CD.Division_ID = PPD.DivisionID
                            INNER JOIN dbo.Const_Department CDep ON CDep.Department_ID = CD.DepartmentID
                  WHERE     PPD.ProjectID = @ProjectID
                ) AS PlanProjectDepartment;

	-- Return the result of the function
        RETURN ISNULL(@listStr,'');

    END;

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectDivision_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Jignesh Prajapati
-- Create date: 05/04/2016
-- Description:	Gets list of Division for a project
-- Calls : SELECT dbo.Plan_ProjectDivision_fxn(57,0)
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectDivision_fxn]
	-- Add the parameters for the function here
    (
      @ProjectID INT ,
      @ShowCode BIT
    )
RETURNS NVARCHAR(MAX)
AS
    BEGIN
	-- Declare the return variable here
        DECLARE @listStr VARCHAR(MAX);
	
	-- Add the T-SQL statements to compute the return value here
        SELECT  @listStr = COALESCE(@listStr + ',', '')
                + CONVERT(NVARCHAR(300), ISNULL(DivisionCODE, ''))
        FROM    ( SELECT DISTINCT
                            ( CASE WHEN @ShowCode = 1
                                   THEN CD.DivisionCode + ' : '
                                        + CD.DivisionDesc
                                   ELSE CD.DivisionDesc
                              END ) AS DivisionCODE
                  FROM      dbo.Plan_ProjectDivisions PPD
                            INNER JOIN dbo.Const_Division CD ON CD.Division_ID = PPD.DivisionID
                  WHERE     PPD.ProjectID = @ProjectID
                ) AS PlanProjectDivision;

	-- Return the result of the function
        RETURN ISNULL(@listStr,'');

    END;

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectFunction_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 03/03/2016
-- Description:	Gets list of funding per year for a project
-- Calls : SELECT dbo.Plan_ProjectFunction_fxn(57,0)
--  By  : 
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectFunction_fxn]
	-- Add the parameters for the function here
(
	@ProjectID int,
	@ShowCode bit
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(max)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(SCOAFunctionCODE,''))
		FROM 
	(SELECT DISTINCT
	 (CASE WHEN @ShowCode = 1 THEN
		 ScoaCode + ' : ' +  ScoaDesc
		ELSE
			  ScoaDesc
		END)
	AS SCOAFunctionCODE 
	FROM dbo.Plan_ProjectFunctions
		INNER JOIN dbo.Const_SCOA_Function_Structure ON ScoaID = ScoaFunctionID
		WHERE  ProjectID =@ProjectID)  AS PlanProjectRegion

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectFunds_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 03/08/2016
-- Description:	Gets list of funding for a project
-- Calls : SELECT dbo.Plan_ProjectFunds_fxn(1022,0)
--  By  : 
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectFunds_fxn]
	-- Add the parameters for the function here
(
	@ProjectID int,
	@ShowCode bit
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(max)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(SCOAFunctionCODE,''))
		FROM 
	(SELECT DISTINCT
	 (CASE WHEN @ShowCode = 1 THEN
		 ScoaCode + ' : ' +  ScoaDesc
		ELSE
			  ScoaDesc
		END)
	AS SCOAFunctionCODE 
	FROM dbo.Plan_ProjectFund
		INNER JOIN dbo.Const_SCOA_Funds_Structure ON ScoaID = ScoaFundID
		WHERE  ProjectID =@ProjectID)  AS PlanProjectFund

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END

GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectIDP_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Sahil Nagpal
-- Create date: 29/03/2017
-- Description:	Gets list of ProjectIDP for a project
-- Calls : SELECT dbo.Plan_ProjectIDP_fxn(3,2326)
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectIDP_fxn]
	-- Add the parameters for the function here
(
	@ProjectID int,
	@IDPItemID int
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(max)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(IDPDesc,''))
		FROM 
	(SELECT DISTINCT
	 iit.ItemDesc
	AS IDPDesc 
	FROM dbo.Plan_ProjectIDP ppid
		INNER JOIN dbo.IDP_Item iit ON iit.Item_ID = ppid.ParentIDPItemID
		WHERE  
		(CASE WHEN @ProjectID = 0 THEN 0
                ELSE ppid.ProjectID
           END = @ProjectID )
		AND
		(CASE WHEN @IDPItemID = 0 THEN 0
                ELSE ppid.ParentIDPItemID
           END = @IDPItemID )
		)  AS PlanProjectRegion

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END
GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectMunicipalClass_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Jignesh Prajapati
-- Create date: 05/04/2016
-- Description:	Gets list of Municipal Classification for a project
-- Calls : SELECT dbo.Plan_ProjectMunicipalClass_fxn(1,0)
-- 03-03-2017 SNagpal : Change format for MunicipalClassCODE
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectMunicipalClass_fxn]
	-- Add the parameters for the function here
    (
      @ProjectID INT ,
      @ShowCode BIT
    )
RETURNS NVARCHAR(MAX)
AS
    BEGIN
	-- Declare the return variable here
        DECLARE @listStr VARCHAR(MAX);
	
	-- Add the T-SQL statements to compute the return value here
         SELECT  @listStr = COALESCE(@listStr + ',', '')
                + CONVERT(NVARCHAR(300), ISNULL(MunicipalClassCODE, ''))
        FROM    ( SELECT DISTINCT
                            ( CASE WHEN @ShowCode = 1
									THEN  CD.DivisionDesc + ' / ' + CD.DivisionCode
                                   --THEN CDEP.DepartmentDesc +' / ' + CDep.DepartmentCode + ' / ' + CD.DivisionDesc + ' / ' + CD.DivisionCode
                                   ELSE CDep.DepartmentDesc + ' / ' + CD.DivisionDesc
                              END ) AS MunicipalClassCODE
                  FROM      dbo.Plan_ProjectDivisions PPD
                            INNER JOIN dbo.Const_Division CD ON CD.Division_ID = PPD.DivisionID
                            INNER JOIN dbo.Const_Department CDep ON CDep.Department_ID = CD.DepartmentID
                  WHERE     PPD.ProjectID = @ProjectID
                ) AS PlanProjectDepartment;

	-- Return the result of the function
        RETURN ISNULL(@listStr,'');

    END;


GO

/****** Object:  UserDefinedFunction [dbo].[Plan_ProjectRegions_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Raindree Chetty
-- Create date: 24/12/2015
-- Description:	Gets list of funding per year for a project
-- Calls : SELECT dbo.Plan_ProjectRegions_fxn(57,0)
-- 05/04/2016 By JP : Isnull is replaced by 0 to resolve error when Region Percent not defined
-- =============================================
CREATE FUNCTION [dbo].[Plan_ProjectRegions_fxn]
	-- Add the parameters for the function here
(
	@ProjectID INT,
	@ShowCode BIT
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @listStr VARCHAR(MAX)
	
	-- Add the T-SQL statements to compute the return value here
		SELECT @listStr = COALESCE(@listStr +',','') + CONVERT(NVARCHAR(300),ISNULL(SCOARegionCODE,''))
		FROM 
	(SELECT DISTINCT
	 (CASE WHEN @ShowCode = 1 THEN
		 ScoaCode + ' : ' +  ScoaDesc + ' ('+CONVERT(NVARCHAR(300),ISNULL(RegionPercent,'0'))+ ')' 
		ELSE
			  ScoaDesc + ' ('+CONVERT(NVARCHAR(300),ISNULL(RegionPercent,'0'))+ ')'
		END)
	AS SCOARegionCODE 
	FROM dbo.Plan_ProjectRegions
		INNER JOIN dbo.Const_SCOA_Regional_Structure ON ScoaID = SCOARegionID
		WHERE  ProjectID =@ProjectID)  AS PlanProjectRegion

	-- Return the result of the function
	RETURN ISNULL(@listStr,'')

END


GO

/****** Object:  UserDefinedFunction [dbo].[Planing_GetFundAllocatedAmount]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- ==============================================================
-- Author:  Niren P
-- Create date: 02/22/2016
-- Description: Get Alloacted Fund Amount
-- 25/02/2016 By RC : added filter on deleted projects
-- 13-12-2016 By SNagpal: Change the where clause of filtering Finyear. before it was from Plan_ProjectFundYear now from Plan_project.
-- select [dbo].[Planing_GetFundAllocatedAmount](1,'2015/2016')
-- 17-01-2017 By SNagpal: Revert the changes of where clause of filtering Finyear. before it was from Plan_project now from Plan_ProjectFundYear.
-- 01-02-2017 By RChetty: Added curfinyear
-- 26-01-2021 By CM: 45335 - Only include CapitalOperation projects in 0, 1, 4
-- 20-05-2021 By CM: 64327 - Only include CapitalOperation projects in 0, 1, 4
-- 03-03-2023 By CM: 97883 - Get allocated amounts from Plan_ProjectItem table
-- ==============================================================

CREATE   FUNCTION [dbo].[Planing_GetFundAllocatedAmount]
    (
      @SCOAId INT ,
      @FynYear VARCHAR(50),
	  @CurFinYear VARCHAR(50)
    )
RETURNS DECIMAL(18, 2)
AS
BEGIN
    DECLARE @Amount DECIMAL(18, 2);

	DECLARE @CurFinYearAsNumber INT = CAST(SUBSTRING(@CurFinYear, 1, 4) AS INT);
	DECLARE @FinYearAsNumber INT = CAST(SUBSTRING(@FynYear, 1, 4) AS INT);

    SELECT  @Amount = CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber THEN ISNULL(SUM(BudgetAmount), 0)
						ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 1 THEN ISNULL(SUM(BudgetAmountCurP1), 0)
							ELSE CASE WHEN @FinYearAsNumber = @CurFinYearAsNumber + 2 THEN ISNULL(SUM(BudgetAmountCurP2), 0)
							END
						END
					END
    FROM    Plan_ProjectItem ppi
			INNER JOIN Plan_Project pp ON ppi.ProjectID = pp.Project_ID
    WHERE   ppi.FinYear = @CurFinYear
            AND ScoaFundID = @SCOAId
			AND CapitalOperation IN (0, 1, 4)
			AND ISNULL(IsDeleted, 0) <> 1;

    RETURN @Amount;
 
END;
GO

/****** Object:  UserDefinedFunction [dbo].[Planing_GetFundAvailableAmount]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- ==============================================================
-- Author:		Niren P
-- Create date: 02/22/2016
-- Description:	Get Available Fund Amount
-- SN: 25/03/2016 - Add Sum function to @Amount = ISNULL(FundingSourceBudget, 0)
-- ============================================================== 
CREATE FUNCTION [dbo].[Planing_GetFundAvailableAmount]
    (
      @SCOAId INT ,
      @FynYear VARCHAR(50)
    )
RETURNS DECIMAL(18, 2)
AS
    BEGIN
        DECLARE @Amount DECIMAL(18, 2);

        SELECT  @Amount = SUM (ISNULL(FundingSourceBudget, 0))
        FROM    dbo.Plan_FundingSourceBudget_Header
                INNER JOIN Plan_FundingSourceBudget_Detail 
				ON Plan_FundingSourceBudget_Detail.FundingSourceBudgetHeaderID = Plan_FundingSourceBudget_Header.FundingSourceBudgetHeader_ID
        WHERE   ScoaID = @SCOAId
                AND FinancialYear = @FynYear;

        RETURN @Amount;
	
    END;
GO

/****** Object:  UserDefinedFunction [dbo].[Planing_GetFundAvailableTotalAmount]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- ==============================================================
-- Author:		Niren P
-- Create date: 02/22/2016
-- Description:	Get Available Fund Total Amount

-- ==============================================================
CREATE FUNCTION [dbo].[Planing_GetFundAvailableTotalAmount] ( @FynYear VARCHAR(50) )
RETURNS DECIMAL(18, 2)
AS
    BEGIN
        DECLARE @Amount DECIMAL(18, 2);

        SELECT  @Amount = ISNULL(SUM(FundingSourceBudget), 0)
        FROM    dbo.Plan_FundingSourceBudget_Header
                INNER JOIN Plan_FundingSourceBudget_Detail ON Plan_FundingSourceBudget_Detail.FundingSourceBudgetHeaderID = Plan_FundingSourceBudget_Header.FundingSourceBudgetHeader_ID
        WHERE   FinancialYear = @FynYear;

        RETURN @Amount;
	
    END;

GO

/****** Object:  UserDefinedFunction [dbo].[Planing_GetProjectRevenueAmount]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- ==============================================================
-- Author:		Niren P
-- Create date: 02/22/2016
-- Description:	Get Project Revenue Amount
-- SN: 04/05/2016 Add join with Plan_Project
--SELECT [dbo].[Planing_GetProjectRevenueAmount] ('2015/2016')
-- ==============================================================


CREATE FUNCTION [dbo].[Planing_GetProjectRevenueAmount] ( @FynYear VARCHAR(50) )
RETURNS DECIMAL(18, 2)
AS
    BEGIN
        DECLARE @Amount DECIMAL(18, 2);

        SELECT  @Amount = ISNULL(SUM(BudgetAmount), 0)
        FROM    dbo.Plan_ProjectItem ppi
                INNER JOIN Plan_Project pp ON pp.Project_ID = ppi.ProjectID
                INNER JOIN Const_SCOA_Structure s ON ppi.SCOAItemID = s.ScoaID
        WHERE   pp.FinYear = @FynYear
                AND ppi.FinYear = @FynYear
                AND ISNULL(pp.IsDeleted, 0) <> 1
                AND s.ScoaCode LIKE 'IR%';

        RETURN @Amount;
    END;
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_BudgetAdjustmentCouncilApprovedVersionID_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		 Chris Moodley
-- Create date: 12 March 2021
-- Description:	  Returns adjustment version ID for council approved budget
-- =============================================
CREATE FUNCTION [dbo].[Section71_BudgetAdjustmentCouncilApprovedVersionID_fxn]
(
	-- Add the parameters for the function here
	@finYear VARCHAR(10)
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @budgetAdjustmentVersionID INT = NULL

	-- Add the T-SQL statements to compute the return value here
	IF EXISTS (SELECT 1 FROM Plan_AdjustmentBudgetApproval WHERE IsCouncilApproved = 1 and FinancialYear = @finYear)
	BEGIN
		SELECT @budgetAdjustmentVersionID = AdjustmentVersionID
		FROM Plan_AdjustmentBudgetApproval 
		WHERE IsCouncilApproved = 1 and FinancialYear = @finYear
	END

	-- Return the result of the function
	RETURN @budgetAdjustmentVersionID

END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_BudgetAdjustmentMonthID_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- ==============================================================================
-- Author:		Chris Moodley
-- Create date: 05 May 2018
-- Description: Return Adjustment Budget Month ID when adjustment budget approved
-- ==============================================================================
CREATE FUNCTION [dbo].[Section71_BudgetAdjustmentMonthID_fxn]
(
	-- Add the parameters for the function here
	@budgetAdjustmentVersionID INT
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @budgetAdjustmentMonthID INT

	-- Add the T-SQL statements to compute the return value here
	SELECT @budgetAdjustmentMonthID = MONTH(DateCaptured) FROM Plan_AdjustmentBudgetVersion WHERE AdjustmentBudgetVersion_ID = @budgetAdjustmentVersionID

	IF @budgetAdjustmentMonthID <= 6 BEGIN SET @budgetAdjustmentMonthID = @budgetAdjustmentMonthID + 6 END ELSE BEGIN SET @budgetAdjustmentMonthID = @budgetAdjustmentMonthID - 6 END
	
	-- Return the result of the function
	RETURN @budgetAdjustmentMonthID

END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_BudgetAdjustmentVersionCount_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- ==============================================================================
-- Author:		Chris Moodley
-- Create date: 03 July 2020
-- Description: Return number of adjustments per financial year
-- ==============================================================================
CREATE FUNCTION [dbo].[Section71_BudgetAdjustmentVersionCount_fxn]
(
	-- Add the parameters for the function here
	@finYear VARCHAR(10)
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @budgetAdjustmentVersionCount INT

	-- Add the T-SQL statements to compute the return value here
	SELECT TOP 1 @budgetAdjustmentVersionCount = COUNT(DISTINCT AdjustmentBudgetVersion_ID)
	FROM
		(
			SELECT 
				AdjustmentBudgetVersion_ID, 
				CASE WHEN MONTH(papv.DateCaptured) <= 6 THEN MONTH(papv.DateCaptured) + 6 ELSE MONTH(papv.DateCaptured) - 6 END AS MonthApproved
			FROM Plan_AdjustmentBudgetVersion papv
						INNER JOIN dbo.Plan_AdjustmentProject pap ON pap.AdjustmentVersionId = papv.AdjustmentBudgetVersion_ID
			WHERE VersionName LIKE @finYear + '%' AND Comments LIKE '%Adjustment Budget approved by Council%'  
		
		) a

	-- Return the result of the function
	RETURN @budgetAdjustmentVersionCount

END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_BudgetAdjustmentVersionID_fxn]    Script Date: 2026/03/11 4:32:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- ==============================================================================
-- Author:		Chris Moodley
-- Create date: 05 May 2018
-- Description: Return Adjustment Budget Version ID when adjustment budget approved
-- 20190802 by CM: Return latest version ID per month selected
-- ==============================================================================
CREATE FUNCTION [dbo].[Section71_BudgetAdjustmentVersionID_fxn]
(
	-- Add the parameters for the function here
	@finYear VARCHAR(10),
	@monthID INT = 12
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @budgetAdjustmentVersionID INT

	-- Add the T-SQL statements to compute the return value here
	--SELECT @budgetAdjustmentVersionID = MAX(AdjustmentBudgetVersion_ID) FROM Plan_AdjustmentBudgetVersion WHERE SUBSTRING(VersionName, 1, 9) = @finYear AND Comments LIKE '%Adjustment Budget approved by Council%'
	
	SELECT TOP 1 @budgetAdjustmentVersionID = AdjustmentBudgetVersion_ID
	FROM
		(
			SELECT 
				AdjustmentBudgetVersion_ID, 
				CASE WHEN MONTH(papv.DateCaptured) <= 6 THEN MONTH(papv.DateCaptured) + 6 ELSE MONTH(papv.DateCaptured) - 6 END AS MonthApproved
			FROM Plan_AdjustmentBudgetVersion papv
						INNER JOIN dbo.Plan_AdjustmentProject pap ON pap.AdjustmentVersionId = papv.AdjustmentBudgetVersion_ID
			WHERE VersionName LIKE @finYear + '%' AND Comments LIKE '%Adjustment Budget approved by Council%'  
		
		) a
	WHERE
		MonthApproved <= @monthID
	ORDER BY AdjustmentBudgetVersion_ID DESC

	-- Return the result of the function
	RETURN @budgetAdjustmentVersionID

END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_BudgetAdjustmentVersionPreviousID_fxn]    Script Date: 2026/03/11 4:32:32 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- ==============================================================================
-- Author:		Chris Moodley
-- Create date: 03 July 2020
-- Description: Return Previous Adjustment Budget Version ID when adjustment budget approved
-- ==============================================================================
CREATE FUNCTION [dbo].[Section71_BudgetAdjustmentVersionPreviousID_fxn]
(
	-- Add the parameters for the function here
	@finYear VARCHAR(10),
	@maxAdjustmentVersionID INT,
	@monthID INT = 12
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @budgetAdjustmentVersionID INT

	-- Add the T-SQL statements to compute the return value here
	SELECT TOP 1 @budgetAdjustmentVersionID = AdjustmentBudgetVersion_ID
	FROM
		(
			SELECT 
				AdjustmentBudgetVersion_ID, 
				CASE WHEN MONTH(papv.DateCaptured) <= 6 THEN MONTH(papv.DateCaptured) + 6 ELSE MONTH(papv.DateCaptured) - 6 END AS MonthApproved
			FROM Plan_AdjustmentBudgetVersion papv
						INNER JOIN dbo.Plan_AdjustmentProject pap ON pap.AdjustmentVersionId = papv.AdjustmentBudgetVersion_ID
			WHERE VersionName LIKE @finYear + '%' AND Comments LIKE '%Adjustment Budget approved by Council%'  
		
		) a
	WHERE
		MonthApproved <= @monthID AND a.AdjustmentBudgetVersion_ID <> @maxAdjustmentVersionID
	ORDER BY AdjustmentBudgetVersion_ID DESC

	-- Return the result of the function
	RETURN @budgetAdjustmentVersionID

END
GO

/****** Object:  UserDefinedFunction [dbo].[Section71_BudgetOriginalVersionID_fxn]    Script Date: 2026/03/11 4:32:32 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- ==============================================================================
-- Author:		Chris Moodley
-- Create date: 05 May 2018
-- Description: Return Original Budget Version ID when original budget approved
-- ==============================================================================
CREATE FUNCTION [dbo].[Section71_BudgetOriginalVersionID_fxn]
(
	-- Add the parameters for the function here
	@finYear VARCHAR(10)
)
RETURNS INT
AS
BEGIN
	-- Declare the return variable here
	DECLARE @budgetOriginalVersionID INT

	-- Add the T-SQL statements to compute the return value here
	SELECT @budgetOriginalVersionID = MAX(BudgetVersion_ID) FROM Plan_BudgetVersion WHERE SUBSTRING(VersionName, 1, 9) = @finYear AND Comments LIKE '%Budget approved by Council%'

	-- Return the result of the function
	RETURN @budgetOriginalVersionID

END
GO

