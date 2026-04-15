namespace AssetManagement.Models;

public class WipRegister
{
    public int WIPRegister_ID { get; set; }
    public string? ProjectName { get; set; }
    public string? ProjectNumber { get; set; }
    public int? WIPProjectStatus_ID { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public decimal? TotalBudget { get; set; }
    public decimal? TotalExpenditure { get; set; }
    public int? AssetType_ID { get; set; }
    public int? AssetCategory_ID { get; set; }
    public string? FinYear { get; set; }
    public string? Status { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
