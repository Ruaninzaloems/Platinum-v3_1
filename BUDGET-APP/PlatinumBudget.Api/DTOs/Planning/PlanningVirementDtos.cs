namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanApprovedVirementByCapturerIDRequest
{
    public string? FinYear { get; set; }
    public int? CapturerId { get; set; }
}

public class PlanCheckUserIsLastApproverForVirementRequest
{
    public int? VirementId { get; set; }
}

public class PlanCreateVirementPolicyVersionRequest
{
    public string? FinYear { get; set; }
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public bool? IsCouncilApproved { get; set; }
    public string? FileName { get; set; }
    public int? userId { get; set; }
}

public class PlanGetApprovedVirementByDateRequest
{
    public DateTime? FromVirementDate { get; set; }
    public DateTime? ToVirementDate { get; set; }
}

public class PlanGetDetailsOfVirementReportRequest
{
    public int? ProjectId { get; set; }
}

public class PlanGetLatestVirementPolicyVersionNumberRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetListProjectUsedInVirementRequest
{
    public string? FinancialYear { get; set; }
}

public class PlanGetNextVirementApproverRequest
{
    public string? FinYear { get; set; }
    public int? FromProjectId { get; set; }
    public int? UserId { get; set; }
}

public class PlanGetProjectDetailsforVirementApprovalRequest
{
    public int? VirementId { get; set; }
}

public class PlanGetProjectDetailsforVirementReportRequest
{
    public string? FinYear { get; set; }
    public string? Status { get; set; }
    public int? FromProjectId { get; set; }
    public int? ToProjectId { get; set; }
    public int? VirementId { get; set; }
}

public class PlanGetProjectDetailsforVirementReportApprovalLevelRequest
{
    public string? FinYear { get; set; }
    public string? Status { get; set; }
    public int? FromProjectId { get; set; }
    public int? ToProjectId { get; set; }
    public int? VirementId { get; set; }
}

public class PlanGetProjectforVirementApprovalRequest
{
    public string? FinYear { get; set; }
    public int? FromProjectId { get; set; }
    public int? UserId { get; set; }
}

public class PlanGetVirementCountsByVirementIdRequest
{
    public int? VirementID { get; set; }
}

public class PlanGetVirementDetailsByIdRequest
{
    public int? VirementId { get; set; }
}

public class PlanPendingVirementByApproverIDRequest
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
}

public class PlanPendingVirementByApproverIDPerApprovalLevelRequest
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
}

public class PlanRejectedVirementByCapturerIDRequest
{
    public string? FinYear { get; set; }
    public int? CapturerId { get; set; }
}

public class PlanReportNTVirementStringRequest
{
    public string? finYear { get; set; }
    public int? fromMonth { get; set; }
    public int? toMonth { get; set; }
}

public class PlanUpdateProjectFundAndItemForVirementRequest
{
    public string? VirementId { get; set; }
    public string? UserId { get; set; }
}

public class PlanVirementHistoryByProjectIDRequest
{
    public int? ProjectId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanVirementNewPlanProjectItemScoaSegmentRequest
{
    public int? projectID { get; set; }
    public int? divisionID { get; set; }
    public string? scoaSegment { get; set; }
}

public class PlanVirementPlanProjectItemRequest
{
    public int? projectID { get; set; }
    public int? divisionID { get; set; }
}

public class PlanVirementPlanProjectItemAmountRequest
{
    public int? planProjectItemID { get; set; }
}

public class PlanVirementPlanProjectItemScoaSegmentRequest
{
    public int? planProjectItemID { get; set; }
}

public class PlanVirementTrackChangesByVirementIdRequest
{
    public int? VirementId { get; set; }
}
