namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanActualProcurementPlanVsBudgetRptRequest
{
    public string? FinYear { get; set; }
    public int? ProcurementPlanNumber { get; set; }
    public int? ProjectNumber { get; set; }
    public int? StatusID { get; set; }
}

public class PlanBudgetZeroItemReportRequest
{
    public string? finYear { get; set; }
}

public class PlanDailyBudgetReportRequest
{
    public string? finYear { get; set; }
    public int? fromMonth { get; set; }
    public int? toMonth { get; set; }
    public string? department { get; set; }
}

public class PlanFundAvailablityReportRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanFundingSourceChangeReportRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetAdjustmentBudgetSplitDetailsReportRequest
{
    public int? AdjustmentProjectItemId { get; set; }
    public int? ReferenceProjectItemId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetBTOReportRequest
{
    public string? FinYear { get; set; }
    public int? VendorID { get; set; }
}

public class PlanGetBudgetActualComparisonHistoricalCurrentReportRequest
{
    public string? FinYear { get; set; }
    public string? Div { get; set; }
    public string? Func { get; set; }
}

public class PlanGetBudgetCapitalOperatingByWardReportRequest
{
    public int? BudgetVersionID { get; set; }
    public int? SCOARegionID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetBudgetCapitalWorksPlanReportRequest
{
    public int? DivisionID { get; set; }
    public int? IDPItem { get; set; }
    public string? FinYear { get; set; }
    public int? BudgetVersionID { get; set; }
}

public class PlanGetBudgetConsumptionReconReportRequest
{
    public string? FinYear { get; set; }
    public int? DivisionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ScoaItemID { get; set; }
}

public class PlanGetBudgetDraftCapitalReportRequest
{
    public string? FinYear { get; set; }
    public int? BudgetVersionID { get; set; }
    public int? DivisionID { get; set; }
}

public class PlanGetDraftMTREFRptRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetVirementBudgetSplitDetailsReportRequest
{
    public int? VirementId { get; set; }
    public string? TransferFromto { get; set; }
}

public class PlanImportAssetBudgetReportResultsRequest
{
    public string? Type { get; set; }
}

public class PlanImportHRBudgetReportResultsRequest
{
    // No parameters
}

public class PlanProjectDetailRpt1Request
{
    public int? ProjectID { get; set; }
}

public class PlanProjectRptRequest
{
    public string? ProjCode { get; set; }
    public string? ProjName { get; set; }
    public int? StatusID { get; set; }
    public int? IDPItemID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? ProjectCategoryID { get; set; }
    public int? ProjectID { get; set; }
    public string? FinancialYear { get; set; }
}

public class PlanReportAdjustmentBudgetStringRptRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanReportNTIDPStringRptRequest
{
    public string? finyear { get; set; }
}

public class PlanReportNTIDPStringRptspBackendRequest
{
    public string? finyear { get; set; }
}

public class PlanReportNTIDPStringORGBRptRequest
{
    public string? finyear { get; set; }
}

public class PlanReportNTIDPStringORGBRptspBackendRequest
{
    public string? finyear { get; set; }
}

public class PlanReportNTPRADAdjustmentIDPStringRptRequest
{
    public string? finyear { get; set; }
}

public class PlanRevenueReconciliationReportRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanSDBIPProgressRptRequest
{
    public string? FinYear { get; set; }
    public string? Quater { get; set; }
    public int? Department { get; set; }
    public int? ResponsiblePost { get; set; }
}

public class PlanVirementBudgetDetailsReportRequest
{
    public string? FinYear { get; set; }
    public int? Budget { get; set; }
    public int? Information { get; set; }
    public int? ProjectStatusId { get; set; }
    public int? ProjectId { get; set; }
    public int? ScoaProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaRegionID { get; set; }
    public string? strDivisionID { get; set; }
    public int? DepartmentID { get; set; }
    public int? ScoaCostingID { get; set; }
    public int? ScoaFundID { get; set; }
    public int? ScoaItemID { get; set; }
    public string? SingleMultiYear { get; set; }
    public string? BudgetType { get; set; }
}
