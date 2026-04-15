namespace AssetManagement.Models;

public class PriorPeriodSubmitRequest
{
    public int AssetRegisterItemId { get; set; }
    public string? AdjustmentTypeCode { get; set; }
    public string? TargetFinYear { get; set; }
    public int TargetFinPeriod { get; set; }
    public DateTime? TransactionDate { get; set; }
    public decimal? DebitAmount { get; set; }
    public decimal? CreditAmount { get; set; }
    public string? Narration { get; set; }
    public decimal? AdjustmentAmount { get; set; }
    public decimal? NewDepreciationAmount { get; set; }
    public decimal? NewCostAmount { get; set; }
    public decimal? NewImpairmentAmount { get; set; }
    public decimal? NewImpairmentReversalAmount { get; set; }
    public decimal? NewRevaluationAmount { get; set; }
    public int? DrPlanProjectItemID { get; set; }
    public int? CrPlanProjectItemID { get; set; }
    public string? Comments { get; set; }
    public int DownstreamImpactCount { get; set; }
    public string? DownstreamImpactTypes { get; set; }
}

public class PriorPeriodApproveRequest
{
    public string? Comments { get; set; }
}

public class PriorPeriodRejectRequest
{
    public string? RejectionReason { get; set; }
}
