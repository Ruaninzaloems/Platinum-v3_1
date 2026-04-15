namespace AssetManagement.Models;

public class AssetDepreciationApproval
{
    public int DepreciationApproval_ID { get; set; }
    public string? FinYear { get; set; }
    public int? MonthID { get; set; }
    public int? ApprovalTypeID { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public int? ApprovedByID { get; set; }
    public string? Status { get; set; }
    public string? Comments { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
