namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanBuddgetRegisterRequest
{
    public int? ProjectId { get; set; }
    public bool? ShowDetail { get; set; }
    public bool? RecalcBudget { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetAdjustmentFundWidgetDetailsRequest
{
    public string? FinYear { get; set; }
    public long? SCOAID { get; set; }
    public long? FundingSource { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetApprovedAdjustmentRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetDepartmentDivisionsRequest
{
    public int? DivisionId { get; set; }
    public string? DivisionType { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetDepartmentDivisionsWithPermissionsRequest
{
    public int? DivisionId { get; set; }
    public string? DivisionType { get; set; }
    public int? UserId { get; set; }
}

public class PlanGetDepartmentWithDivisionsRequest
{
    public bool? IsDepartment { get; set; }
    public int? DepartmentId { get; set; }
    public int? DivisionId { get; set; }
    public string? DivisionType { get; set; }
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
}

public class PlanGetDivisionsForTrackChangesRequest
{
    // No parameters
}

public class PlanGetFundWidgetDetailsRequest
{
    public string? FinYear { get; set; }
    public long? SCOAID { get; set; }
    public long? FundingSource { get; set; }
}

public class PlanGetIDPFullDescriptionRequest
{
    public int? IDPLevelNumber { get; set; }
    public string? FinancialYear { get; set; }
}

public class PlanGetKpiPerDepartmentRequest
{
    public long? ScoreCardType { get; set; }
    public long? Quarter { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetKpiPerEmployeeRequest
{
    public long? ScoreCardType { get; set; }
    public long? Quarter { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetKpiPerKpaRequest
{
    public long? ScoreCardType { get; set; }
    public long? Quarter { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetNetAssetItemsForAdjustmentRequest
{
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetPaymentFrameworkApprovalRequest
{
    public string? ProjectName { get; set; }
}

public class PlanGetPendingAdjustmentRequest
{
    public string? FinYear { get; set; }
    public int? ProjectId { get; set; }
}

public class PlanGetRecommendedAdjustmentRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetRejectedAdjustmentRequest
{
    public string? FinYear { get; set; }
}

public class PlanNTLedgertValidationsRequest
{
    public string? finYear { get; set; }
    public int? fromMonth { get; set; }
    public int? toMonth { get; set; }
}

public class PlanSubmitSupplementaryAdjustmentRequest
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
    public string? SupplementaryAdjustmentFileName { get; set; }
}

public class PlanTariffSearchByServiceDescRequest
{
    public string? ServiceDesc { get; set; }
    public string? FinYear { get; set; }
}

public class PlanUpdateAdjustmentStatusRequest
{
    public string? FMSAuditDBName { get; set; }
    public int? AuditUserID { get; set; }
    public DateTime? AuditDate { get; set; }
    public string? AuditUser { get; set; }
    public string? ActivFinYear { get; set; }
}

public class PlanUpdateIDPItemInitializationRequest
{
    public string? FMSAuditDBName { get; set; }
    public int? AuditUserID { get; set; }
    public DateTime? AuditDate { get; set; }
    public string? AuditUser { get; set; }
    public string? ActivFinYear { get; set; }
}
