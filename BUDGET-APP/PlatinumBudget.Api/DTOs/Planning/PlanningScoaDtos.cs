namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanCheckSCOACostingExceptionsRequest
{
    public int? UserId { get; set; }
    public string? currFinYear { get; set; }
    public string? nextFinYear { get; set; }
}

public class PlanCheckSCOAFunctionExceptionsRequest
{
    public int? UserId { get; set; }
    public string? currFinYear { get; set; }
    public string? nextFinYear { get; set; }
}

public class PlanCheckSCOAFundExceptionsRequest
{
    public int? UserId { get; set; }
    public string? currFinYear { get; set; }
    public string? nextFinYear { get; set; }
}

public class PlanCheckSCOAItemExceptionsRequest
{
    public int? UserId { get; set; }
    public string? currFinYear { get; set; }
    public string? nextFinYear { get; set; }
    public string? Type { get; set; }
}

public class PlanCheckSCOARegionExceptionsRequest
{
    public int? UserId { get; set; }
    public string? currFinYear { get; set; }
    public string? nextFinYear { get; set; }
}

public class PlanGetDepartmentDivisionsUsingSCOAFunctionRequest
{
    public int? ProjectID { get; set; }
    public int? DivisionID { get; set; }
}

public class PlanGetDepartmentDivisionsUsingSCOAFunctionspbackupRequest
{
    public int? ProjectID { get; set; }
    public int? DivisionID { get; set; }
}

public class PlanGetMultipleSCOASegmentsRequest
{
    public string? SegmentType { get; set; }
}

public class PlanGetSCOACostingExceptionDetailsRequest
{
    public string? CurrentFinyear { get; set; }
    public string? NewFinyear { get; set; }
    public string? ExceptionType { get; set; }
}

public class PlanGetSCOACostingExceptionDetailsByIDRequest
{
    public int? ExceptionID { get; set; }
    public string? CurrentFinyear { get; set; }
}

public class PlanGetSCOAFunctionExceptionDetailsRequest
{
    public string? CurrentFinyear { get; set; }
    public string? NewFinyear { get; set; }
    public string? ExceptionType { get; set; }
}

public class PlanGetSCOAFunctionExceptionDetailsByIDRequest
{
    public int? ExceptionID { get; set; }
    public string? CurrentFinyear { get; set; }
}

public class PlanGetSCOAFundCapitalRequest
{
    public int? SCOAFundCapitalID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAFundingExceptionDetailsRequest
{
    public string? CurrentFinyear { get; set; }
    public string? NewFinyear { get; set; }
    public string? ExceptionType { get; set; }
}

public class PlanGetSCOAFundingExceptionDetailsByIDRequest
{
    public int? ExceptionID { get; set; }
    public string? CurrentFinyear { get; set; }
}

public class PlanGetSCOAFundOperationalRequest
{
    public int? SCOAFundOperationalID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAIDRequest
{
    // No parameters
}

public class PlanGetSCOAItemAssetFBSRequest
{
    public int? SCOAItemAssetFBSID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAItemDescriptionRequest
{
    public int? SCOAItemID { get; set; }
}

public class PlanGetSCOAItemExceptionDetailsRequest
{
    public string? CurrentFinyear { get; set; }
    public string? NewFinyear { get; set; }
    public string? ExceptionType { get; set; }
    public string? SCOAType { get; set; }
}

public class PlanGetSCOAItemExceptionDetailsByIDRequest
{
    public int? ExceptionID { get; set; }
    public string? CurrentFinyear { get; set; }
    public string? SCOAType { get; set; }
}

public class PlanGetSCOAItemForTrackChangesRequest
{
    // No parameters
}

public class PlanGetSCOAItemGainORRequest
{
    public int? SCOAItemGainORID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAItemLossOERequest
{
    public int? SCOAItemLossOEID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAItemRevenueFBSRequest
{
    public int? SCOAItemRevenueFBSID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAItemUsingAllSCOAFieldsRequest
{
    public int? ProjectID { get; set; }
    public int? DivisionId { get; set; }
    public int? SCOAFunctionId { get; set; }
    public int? SCOAFundId { get; set; }
    public int? SCOARegionId { get; set; }
    public int? SCOACostingId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOARegionalExceptionDetailsRequest
{
    public string? CurrentFinyear { get; set; }
    public string? NewFinyear { get; set; }
    public string? ExceptionType { get; set; }
}

public class PlanGetSCOARegionalExceptionDetailsByIDRequest
{
    public int? ExceptionID { get; set; }
    public string? CurrentFinyear { get; set; }
}

public class PlanGetSCOASegmentsCreditDebitDetailsRequest
{
    public int? ScoaID { get; set; }
    public string? SegmentType { get; set; }
    public string? FinYear { get; set; }
}

public class PlanInsertSCOAFundCapitalRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? AuditUser { get; set; }
    public DateTime? CurrDate { get; set; }
}

public class PlanInsertSCOAFundOperationalRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? AuditUser { get; set; }
    public DateTime? CurrDate { get; set; }
}

public class PlanInsertSCOAItemAssetFBSRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanInsertSCOAItemGainORRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? AuditUser { get; set; }
    public DateTime? CurrDate { get; set; }
}

public class PlanInsertSCOAItemLossOERequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? AuditUser { get; set; }
    public DateTime? CurrDate { get; set; }
}

public class PlanInsertSCOAItemRevenueFBSRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? AuditUser { get; set; }
    public DateTime? CurrDate { get; set; }
}

public class PlanReportNTSCOAStringRptRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanReportNTSCOAStringRptspbackupRequest
{
    public string? FinancialYear { get; set; }
    public int? p2 { get; set; }
}

public class PlanReportNTSCOAStringORGBRptRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanReportSCOASegmentRequest
{
    public string? FinYear { get; set; }
    public int? ProjectID { get; set; }
    public string? ScoaSegmentType { get; set; }
    public int? BudgetType { get; set; }
}

public class PlanSCOASegmentsFilteredListRequest
{
    public int? ScoaID { get; set; }
    public int? Level { get; set; }
    public string? SegmentType { get; set; }
    public string? FinYear { get; set; }
}

public class PlanUpdateSCOAFundCapitalRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanUpdateSCOAFundOperationalRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanUpdateSCOAItemAssetFBSRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanUpdateSCOAItemGainORRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanUpdateSCOAItemLossOERequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanUpdateSCOAItemRevenueFBSRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? CreditDebit { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}
