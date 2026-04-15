namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanBudgetAdjustmentNTValidationRequest
{
    public int? BudgetAdjustmentExportImportVersionHeaderID { get; set; }
    public int? BudgetAdjustmentImportVersionNumber { get; set; }
}

public class PlanBudgetOriginalNTValidationRequest
{
    public int? BudgetOriginalExportImportVersionHeaderID { get; set; }
    public int? BudgetOriginalImportVersionNumber { get; set; }
}

public class PlanBudgetZeroNTValidationRequest
{
    public int? BudgetZeroExportImportVersionHeaderID { get; set; }
    public int? BudgetZeroImportVersionNumber { get; set; }
}

public class PlanCheckCategoryBalanceRequest
{
    public string? FinYear { get; set; }
    public string? FileName { get; set; }
}

public class PlanCheckCostingBalanceRequest
{
    public string? FinYear { get; set; }
    public string? FileName { get; set; }
}

public class PlanCheckFieldsLengthRequest
{
    public string? TableName { get; set; }
    public string? columnName { get; set; }
}

public class PlanCheckFunctionBalanceRequest
{
    public string? FinYear { get; set; }
    public string? FileName { get; set; }
}

public class PlanCheckFundAvailableAmountRequest
{
    public string? FinYear { get; set; }
}

public class PlanCheckFundBalanceRequest
{
    public string? FinYear { get; set; }
    public string? FileName { get; set; }
}

public class PlanCheckMendatoryFieldsRequest
{
    public string? TableName { get; set; }
    public string? columnName { get; set; }
}

public class PlanCheckNTValidationsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaItemId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanCheckNTValidationsForAdjustmentRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaItemId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanCheckPendingAdjudstmentApprovalRequest
{
    public string? Finyear { get; set; }
}

public class PlanCheckProjectBalanceRequest
{
    public string? FinYear { get; set; }
    public string? FileName { get; set; }
}

public class PlanCheckReferanceFieldsRequest
{
    public string? TableName { get; set; }
    public string? columnName { get; set; }
    public string? RefTableName { get; set; }
    public string? RefColumnName { get; set; }
    public string? whereCondition { get; set; }
    public string? OuterWhereQuery { get; set; }
}

public class PlanCheckSCOAProjectExceptionsRequest
{
    public int? UserId { get; set; }
    public string? currFinYear { get; set; }
    public string? nextFinYear { get; set; }
}

public class PlanCheckUserIsLastApproverForAdjustmentProjectRequest
{
    public int? AdjustmentProjectId { get; set; }
}

public class PlanGetNTValidationsRequest
{
    public int? SCOAFundOperationalID { get; set; }
    public int? SCOAItemId { get; set; }
    public int? SCOAFunctionId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanImportBudgetAmountValidationRequest
{
    public string? TableName { get; set; }
    public string? TableNameExp { get; set; }
    public string? RunBy { get; set; }
}

public class PlanInsertNTValidationsRequest
{
    public int? SCOAItemId { get; set; }
    public int? SCOAFunctionId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? AuditUser { get; set; }
}

public class PlanProjectItemNTValidationRequest
{
    public string? finYear { get; set; }
    public int? scoaProjectID { get; set; }
    public int? scoaItemID { get; set; }
    public int? scoaFunctionID { get; set; }
    public int? scoaRegionID { get; set; }
    public int? scoaCostingID { get; set; }
    public int? scoaFundID { get; set; }
}

public class PlanUpdateNTValidationsRequest
{
    public int? SCOAItemId { get; set; }
    public int? SCOAFunctionId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public bool? IsEnable { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
}
