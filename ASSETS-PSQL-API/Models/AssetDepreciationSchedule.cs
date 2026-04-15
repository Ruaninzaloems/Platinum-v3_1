namespace AssetManagement.Models;

public class AssetDepreciationSchedule
{
    public int DepreciationSchedule_ID { get; set; }
    public string? FinYear { get; set; }
    public DateTime? RunDate { get; set; }
    public int? RunType_ID { get; set; }
    public int? RunStatus_ID { get; set; }
    public int? StatusID { get; set; }
    public int? PendingApproval { get; set; }
    public int? TotalAssets { get; set; }
    public decimal? TotalDepreciation { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? FinancialPeriod { get; set; }
}

public class AssetDepreciationScheduleItem
{
    public int DepreciationScheduleItem_ID { get; set; }
    public int? DepreciationSchedule_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public decimal? DepreciationAmount { get; set; }
    public decimal? AccumulatedDepreciation { get; set; }
    public decimal? CarryingAmount { get; set; }
    public DateTime? DateCaptured { get; set; }
}
