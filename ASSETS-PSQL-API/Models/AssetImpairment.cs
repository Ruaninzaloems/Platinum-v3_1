namespace AssetManagement.Models;

public class AssetImpairment
{
    public int AssetImpairment_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public int? Asset_ItemID { get; set; }
    public DateTime? ImpairmentDate { get; set; }
    public decimal? ImpairmentAmount { get; set; }
    public decimal? PreviousCarryingAmount { get; set; }
    public decimal? NewCarryingAmount { get; set; }
    public decimal? RemainingUsefulLife { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; }
    public string? FinYear { get; set; }
    public decimal? CatchUpDepreciation { get; set; }
    public int? CatchUpDays { get; set; }
    public short? Approved { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public int? ApprovedBy { get; set; }
    public short? IsRejected { get; set; }
    public short? IsReversal { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
