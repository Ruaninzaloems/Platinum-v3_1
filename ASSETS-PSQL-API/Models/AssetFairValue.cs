namespace AssetManagement.Models;

public class AssetFairValue
{
    public int AssetFairValue_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public DateTime? FairValueDate { get; set; }
    public decimal? FairValueAmount { get; set; }
    public decimal? PreviousCarryingAmount { get; set; }
    public decimal? GainLoss { get; set; }
    public string? Status { get; set; }
    public string? FinYear { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
