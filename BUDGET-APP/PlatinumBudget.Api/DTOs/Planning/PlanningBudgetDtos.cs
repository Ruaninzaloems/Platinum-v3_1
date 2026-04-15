namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanAdjustmentFundingSourceBudgetRequest
{
    public string? financialYear { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanAdjustmentFundingSourceBudgetMultiYearRequest
{
    public string? FinYear { get; set; }
    public int? ShowOnlyZerovaluedFunds { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanAdjustmentProjectBudgetingExportRequest
{
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
    public string? BudgetType { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ProjectStatusId { get; set; }
    public int? VersionId { get; set; }
    public string? SingleMultiYear { get; set; }
    public int? Information { get; set; }
}

public class PlanAutoCreateActivationVotesByProjectForAdjustmentBudgetRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanAutoCreateProcurementByProjectForAdjustmentBudgetRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanBudgetAdjustmentExportVersionDetailRequest
{
    public int? adjustmentVersionID { get; set; }
    public string? finYear { get; set; }
    public int? budgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetAdjustmentExportVersionRequest
{
    public string? FinYear { get; set; }
}

public class PlanBudgetAdjustmentFieldValidationRequest
{
    public int? BudgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? BudgetAdjustmentImportVersionNumber { get; set; }
}

public class PlanBudgetAdjustmentImportResultRequest
{
    public int? budgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? budgetAdjustmentImportVersionNumber { get; set; }
}

public class PlanBudgetAdjustmentImportVersionExceptionRequest
{
    public int? budgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? budgetAdjustmentImportVersionNumber { get; set; }
}

public class PlanBudgetAdjustmentImportVersionRequest
{
    public int? budgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? budgetAdjustmentImportVersionNumber { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetAdjustmentProjectRegisterRequest
{
    public int? budgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? budgetAdjustmentImportVersionNumber { get; set; }
    public int? userId { get; set; }
}

public class PlanBudgetApprovalRequest
{
    public string? FinYear { get; set; }
    public int? UserID { get; set; }
}

public class PlanBudgetConsumptionRequest
{
    public string? FinYear { get; set; }
    public int? StartMonth { get; set; }
    public int? EndMonth { get; set; }
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? DepartmentID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ScoaProjectId { get; set; }
    public int? ScoaCostingId { get; set; }
    public string? SingleMultiYear { get; set; }
    public string? CapitalOperational { get; set; }
    public int? ShowScoaFunction { get; set; }
    public int? ShowScoaRegion { get; set; }
    public int? ShowDivision { get; set; }
    public int? ShowScoaCosting { get; set; }
    public int? ShowScoaFund { get; set; }
    public int? IsDetailRpt { get; set; }
}

public class PlanBudgetConsumptionCommitmentDetailRequest
{
    public string? FinYear { get; set; }
    public string? BudgetTransDesc { get; set; }
}

public class PlanBudgetConsumptionDetailRequest
{
    public int? PlanProjectItemID { get; set; }
    public int? StartMonth { get; set; }
    public int? EndMonth { get; set; }
    public int? IsDetailRpt { get; set; }
}

public class PlanBudgetConsumptionExportCSVRequest
{
    public string? FinYear { get; set; }
    public int? StartMonth { get; set; }
    public int? EndMonth { get; set; }
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? DepartmentID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ScoaProjectId { get; set; }
    public int? ScoaCostingId { get; set; }
    public string? SingleMultiYear { get; set; }
    public string? CapitalOperational { get; set; }
    public int? ShowScoaFunction { get; set; }
    public int? ShowScoaRegion { get; set; }
    public int? ShowDivision { get; set; }
    public int? ShowScoaCosting { get; set; }
    public int? ShowScoaFund { get; set; }
    public int? IsDetailRpt { get; set; }
}

public class PlanBudgetConsumptionInsertRequest
{
    public string? FinYear { get; set; }
    public int? PlanProjectItemId { get; set; }
    public int? TransactionTypeId { get; set; }
    public int? ModuleId { get; set; }
    public int? ProcessId { get; set; }
    public int? TransactionId { get; set; }
    public string? TransactionTable { get; set; }
    public int? CapturerId { get; set; }
    public decimal? TransactionAmount { get; set; }
    public decimal? AvailableBudgetDiff { get; set; }
    public decimal? ReserveToDateDiff { get; set; }
    public decimal? CapturedExpenditureToDateDiff { get; set; }
    public decimal? CommitToDateDiff { get; set; }
    public string? InitialLine { get; set; }
    public decimal? CurrentlyConsumedAmount { get; set; }
    public decimal? TransactionAmountMultiyear { get; set; }
    public decimal? AvailableBudgetMultiyearDiff { get; set; }
    public decimal? ReserveToDateMultiyearDiff { get; set; }
    public decimal? CapturedExpenditureToDateMultiyearDiff { get; set; }
}

public class PlanBudgetConsumptionUpdateRequest
{
    public string? finYear { get; set; }
}

public class PlanBudgetCurrentDataRequest
{
    public int? budgetOriginalExportImportVersionHeaderID { get; set; }
    public int? budgetOriginalImportVersionNumber { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetImportProjectRegisterExceptionRequest
{
    public string? finYear { get; set; }
}

public class PlanBudgetMigrationOfReservationCommitmentsRequest
{
    public string? FromFinyear { get; set; }
    public string? MigrationFinyear { get; set; }
}

public class PlanBudgetOriginalBulkInitiateRequest
{
    public int? IDPItemID { get; set; }
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaCostingID { get; set; }
    public int? ScoaProjectID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? DivisionID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? SCOAFundID { get; set; }
    public int? StatusId { get; set; }
    public string? DepartmentId { get; set; }
    public int? UserID { get; set; }
}

public class PlanBudgetOriginalExportVersionDetailRequest
{
    public int? versionID { get; set; }
    public string? finYear { get; set; }
    public int? projectStatusID { get; set; }
    public string? budgetType { get; set; }
    public int? budgetOriginalExportImportVersionHeaderID { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetOriginalFieldValidationRequest
{
    public int? BudgetOriginalExportImportVersionHeaderID { get; set; }
    public int? BudgetOriginalImportVersionNumber { get; set; }
}

public class PlanBudgetOriginalImportResultRequest
{
    public int? budgetOriginalExportImportVersionHeaderID { get; set; }
    public int? budgetOriginalImportVersionNumber { get; set; }
}

public class PlanBudgetOriginalImportVersionExceptionRequest
{
    public int? budgetOriginalExportImportVersionHeaderID { get; set; }
    public int? budgetOriginalImportVersionNumber { get; set; }
}

public class PlanBudgetOriginalImportVersionRequest
{
    public int? budgetOriginalExportImportVersionHeaderID { get; set; }
    public int? budgetOriginalImportVersionNumber { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetOriginalProjectRegisterRequest
{
    public string? versionNumber { get; set; }
    public string? versionName { get; set; }
    public string? comments { get; set; }
    public int? budgetOriginalExportImportVersionHeaderID { get; set; }
    public int? budgetOriginalImportVersionNumber { get; set; }
    public int? userId { get; set; }
}

public class PlanBudgetRolloverByFinYearRequest
{
    public string? FinYear { get; set; }
    public int? UserID { get; set; }
    public string? BudgetRolloverFileName { get; set; }
}

public class PlanBudgetRolloverForConstantsRequest
{
    public string? FinYear { get; set; }
    public int? UserID { get; set; }
}

public class PlanBudgetRolloverForPlanTablesRequest
{
    public string? FinYear { get; set; }
    public int? UserID { get; set; }
}

public class PlanBudgetZeroBudgetConsumptionEntryRequest
{
    public string? finYear { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetZeroFieldValidationRequest
{
    public int? BudgetZeroExportImportVersionHeaderID { get; set; }
    public int? BudgetZeroImportVersionNumber { get; set; }
}

public class PlanBudgetZeroImportResultRequest
{
    public int? budgetZeroExportImportVersionHeaderID { get; set; }
    public int? budgetZeroImportVersionNumber { get; set; }
}

public class PlanBudgetZeroImportVersionExceptionRequest
{
    public int? budgetZeroExportImportVersionHeaderID { get; set; }
    public int? budgetZeroImportVersionNumber { get; set; }
}

public class PlanBudgetZeroImportVersionRequest
{
    public int? budgetZeroExportImportVersionHeaderID { get; set; }
    public int? budgetZeroImportVersionNumber { get; set; }
    public int? userID { get; set; }
}

public class PlanBudgetZeroInitiateProjectRequest
{
    public string? FinYear { get; set; }
    public int? UserID { get; set; }
}

public class PlanBudgetZeroItemWithActualRequest
{
    public string? finYear { get; set; }
}

public class PlanCreateAdjustmentBudgetVersionRequest
{
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public string? FinYear { get; set; }
    public int? userId { get; set; }
    public string? CreateAdjustmentBudgetVersionResult { get; set; }
}

public class PlanCreateAdjustmentFundingBudgetVersionRequest
{
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public string? FinYear { get; set; }
    public int? userId { get; set; }
    public string? CreateAdjustmentBudgetVersionResult { get; set; }
}

public class PlanCreateBudgetVersionRequest
{
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public string? FinYear { get; set; }
    public int? userId { get; set; }
}

public class PlanCreateFundingBudgetVersionRequest
{
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public string? FinYear { get; set; }
    public int? userId { get; set; }
}

public class PlanDailyBudgetConsumptionRequest
{
    // No parameters
}

public class PlanFundingSourceBudgetRequest
{
    public string? financialYear { get; set; }
    public string? strActiveFinyear { get; set; }
}

public class PlanFundingSourceBudgetMultiYearRequest
{
    public string? FinYear { get; set; }
    public int? ShowOnlyZerovaluedFunds { get; set; }
}

public class PlanGetAdjustmentBudgetAmountByFinYearRequest
{
    public string? CurrYear { get; set; }
}

public class PlanGetAdjustmentBudgetsRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetAdjustmentFundingBudgetSCOAFundByFinYearsRequest
{
    public string? FinYearlst { get; set; }
    public string? BudgetType { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAdjustmentProjectBudgetingReportRequest
{
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
    public string? BudgetType { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ProjectStatusId { get; set; }
    public string? SingleMultiYear { get; set; }
    public int? Information { get; set; }
    public int? ScoaCostingID { get; set; }
    public int? ScoaProjectID { get; set; }
    public int? ShowCostingProject { get; set; }
}

public class PlanGetAdjustmentProjectBudgetingReportByVersionRequest
{
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
    public string? BudgetType { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ProjectStatusId { get; set; }
    public int? VersionId { get; set; }
    public string? SingleMultiYear { get; set; }
    public int? Information { get; set; }
    public int? ScoaCostingID { get; set; }
    public int? ScoaProjectID { get; set; }
    public int? ShowCostingProject { get; set; }
}

public class PlanGetAllAdjustmentFundingBudgetsByFinYearsRequest
{
    public string? FinancialYear { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAllFundingBudgetsByFinYearsRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanGetApprovedAdjustmentBudgetVersionsRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetBudgetAmountByFinYearRequest
{
    public string? CurrYear { get; set; }
}

public class PlanGetBudgetedProjectItemsByProjectRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetBudgetProjectedCashflowReportRequest
{
    public string? FinYear { get; set; }
    public int? BudgetVersionID { get; set; }
    public int? DivisionID { get; set; }
}

public class PlanGetFundingBudgetSCOAFundByFinYearsRequest
{
    public string? FinYearlst { get; set; }
    public string? BudgetType { get; set; }
}

public class PlanGetLatestAdjustmentBudgetVersionNumberRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetLatestAdjustmentFundingBudgetVersionNumberRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetLatestBudgetVersionNumberRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetPartialAvailableBudgetByAdjustmentProjectIdRequest
{
    public int? ProjectID { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetPartialAvailableBudgetByProjectIdRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetProjectBudgetingReportRequest
{
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
    public int? CapitalOperational { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ProjectStatusId { get; set; }
    public string? SingleMultiYear { get; set; }
    public int? ShowCostingProject { get; set; }
}

public class PlanGetProjectBudgetingReportByVersionRequest
{
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
    public int? CapitalOperational { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ProjectStatusId { get; set; }
    public int? VersionId { get; set; }
    public string? SingleMultiYear { get; set; }
    public int? ShowCostingProject { get; set; }
}

public class PlanGetProjectItemBudgetByProjectIDRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetProjectRollOverDataForExportRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetSupportingDocumentsForAdjustmentFundingSourceRequest
{
    public int? FundingSourceBudgetDetailID { get; set; }
    public int? SupportingDocID { get; set; }
}

public class PlanGetSupportingDocumentsForFundingSourceRequest
{
    public int? FundingSourceBudgetDetailID { get; set; }
    public int? SupportingDocID { get; set; }
}

public class PlanGetUpdateBudgetMigrationOfReservationCommitmentsRequest
{
    public string? FromFinyear { get; set; }
    public string? MigrationFinyear { get; set; }
    public bool? UpdateMigrationOnly { get; set; }
}

public class PlanImportBudgetAmountIntoPlanBudgetRegisterRequest
{
    public string? TableName { get; set; }
    public string? TableNameExp { get; set; }
}

public class PlanNTBudgetValidationsRequest
{
    public string? finYear { get; set; }
}

public class PlanNTORGBudgetValidationsRequest
{
    public string? finYear { get; set; }
}

public class PlanProjectBudgetingExportRequest
{
    public string? strDivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
    public int? CapitalOperational { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public int? ProjectStatusId { get; set; }
    public int? VersionId { get; set; }
    public string? SingleMultiYear { get; set; }
}

public class PlanProjectRolloverRequest
{
    public string? FinYear { get; set; }
    public int? ProjectStatusID { get; set; }
}

public class PlanProjectRollOverDataImportRequest
{
    // No parameters
}

public class PlanRecalcBudgetRegisterRequest
{
    // No parameters
}

public class PlanSaveAdjustmentBudgetApprovalRejectionRequest
{
    public string? VersionNumber { get; set; }
    public string? FileName { get; set; }
    public string? RejectReason { get; set; }
    public bool? Approved { get; set; }
    public bool? Rejected { get; set; }
    public int? UserId { get; set; }
}

public class PlanSubmitAdjustmentBudgetRequest
{
    public string? FinancialYear { get; set; }
    public int? UserId { get; set; }
    public string? ApprovedAdjustmentBudgetFileName { get; set; }
    public DateTime? CouncilApprovedDate { get; set; }
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
}

public class PlanSubmitAdjustmentBudgetPolicyRequest
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
    public string? ApprovedAdjustmentBudgetPolicyFileName { get; set; }
}

public class PlanSubmitAdjustmentBudgetPolicyTempPart1Request
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
}

public class PlanUpdateFundingSourceForAdjustedProjectsRequest
{
    public int? AdjustmentProjectId { get; set; }
    public string? UserId { get; set; }
    public string? FinYear { get; set; }
    public string? UserFinYear { get; set; }
}
