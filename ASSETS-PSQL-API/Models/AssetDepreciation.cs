namespace AssetManagement.Models;

public class AssetDepreciation
{
    public int AssetDepreciation_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public DateTime? DepreciationDate { get; set; }
    public decimal? DepreciationAmount { get; set; }
    public decimal? AccumulatedDepreciation { get; set; }
    public decimal? CarryingAmount { get; set; }
    public int? RunType_ID { get; set; }
    public int? RunStatus_ID { get; set; }
    public string? FinYear { get; set; }
    public int? MonthID { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
