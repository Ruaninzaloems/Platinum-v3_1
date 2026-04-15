namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanAdjustmentFundingSourceBudgetPerYearRequest
{
    public string? FinYear { get; set; }
    public string? CurFinYear { get; set; }
    public string? BudgetType { get; set; }
    public int? AdjustmentVersionId { get; set; }
    public int? AdjustmentFundingVersionId { get; set; }
}

public class PlanBudgetConsumptionDetailFnRequest
{
    public int? PlanProjectItemID { get; set; }
    public int? StartMonth { get; set; }
    public int? EndMonth { get; set; }
    public int? IsDetailRpt { get; set; }
}

public class PlanFundingSourceBudgetAvailableAmtPerYearRequest
{
    public string? FinYear { get; set; }
}

public class PlanFundingSourceBudgetPerYearRequest
{
    public string? FinYear { get; set; }
    public string? CurFinYear { get; set; }
    public string? BudgetType { get; set; }
}

public class PlanGetBudgetAmountsByProjectItemIDRequest
{
    public int? PlanProjectItemID { get; set; }
}

public class PlanGetBudgetDocumentDetailRequest
{
    public string? TableName { get; set; }
    public int? PK { get; set; }
}

public class PlanProjectAmountRequiredRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanningGetQuarterStartEndDateRequest
{
    public string? FinStartYear { get; set; }
    public int? QuarterNo { get; set; }
}

public class Section71AuditedOutcomeRequest
{
    public string? FinYear { get; set; }
}

public class Section71BudgetRequest
{
    public string? FinYear { get; set; }
}

public class Section71VersionAuditedOutcomeRequest
{
    public string? FinYear { get; set; }
    public string? VersionFinYear { get; set; }
}

public class Section71VirementRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class Section71VirementMonthRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class SplitRequest
{
    public string? String { get; set; }
    public string? Delimiter { get; set; }
}

public class YearStartingAtMonthRequest
{
    public int? StartMonth { get; set; }
}

public class IDPGetItemParentIDRequest
{
    public int? itemID { get; set; }
}

public class IDPGetItemPathRequest
{
    public int? itemID { get; set; }
    public string? path { get; set; }
}

public class PlanBudgetSignRequest
{
    public string? scoaItemCode { get; set; }
    public int? capitalOperational { get; set; }
    public string? creditDebit { get; set; }
    public string? scoaItemShortDesc { get; set; }
    public string? finYear { get; set; }
}

public class PlanGetAdjustmentFundAllocatedAmountRequest
{
    public int? SCOAId { get; set; }
    public string? FynYear { get; set; }
    public string? CurFinYear { get; set; }
    public int? AdjustmentVersionId { get; set; }
}

public class PlanGetAdjustmentFundAvailableAmountRequest
{
    public int? SCOAId { get; set; }
    public string? FynYear { get; set; }
    public int? AdjustmentFundingVersionId { get; set; }
}

public class PlanGetBudgetDocumentDetailLinkRequest
{
    public string? TableName { get; set; }
    public int? PK { get; set; }
}

public class PlanGetBudgetTransactionOutstandingAmountRequest
{
    public string? TableName { get; set; }
    public int? PK { get; set; }
}

public class PlanGetBudgetTransactionTypeDescRequest
{
    public int? BudgetConsumptionProcessID { get; set; }
    public int? BudgetTransactionTypeID { get; set; }
}

public class PlanGetProjectDivisionByDivisionIdRequest
{
    public int? DivisionID { get; set; }
}

public class PlanProjectDaysBehindRequest
{
    public int? ProjectID { get; set; }
}

public class PlaningGetFundAllocatedAmountRequest
{
    public int? SCOAId { get; set; }
    public string? FynYear { get; set; }
    public string? CurFinYear { get; set; }
}

public class PlaningGetFundAvailableAmountRequest
{
    public int? SCOAId { get; set; }
    public string? FynYear { get; set; }
}

public class PlaningGetFundAvailableTotalAmountRequest
{
    public string? FynYear { get; set; }
}

public class PlaningGetProjectRevenueAmountRequest
{
    public string? FynYear { get; set; }
}

public class Section71BudgetAdjustmentCouncilApprovedVersionIDRequest
{
    public string? finYear { get; set; }
}

public class Section71BudgetAdjustmentMonthIDRequest
{
    public int? budgetAdjustmentVersionID { get; set; }
}

public class Section71BudgetAdjustmentVersionCountRequest
{
    public string? finYear { get; set; }
}

public class Section71BudgetAdjustmentVersionIDRequest
{
    public string? finYear { get; set; }
    public int? monthID { get; set; }
}

public class Section71BudgetAdjustmentVersionPreviousIDRequest
{
    public string? finYear { get; set; }
    public int? maxAdjustmentVersionID { get; set; }
    public int? monthID { get; set; }
}

public class Section71BudgetOriginalVersionIDRequest
{
    public string? finYear { get; set; }
}
