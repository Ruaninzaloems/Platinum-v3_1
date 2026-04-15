namespace AssetManagement.Models;

public class AssetFairValueApproval
{
    public int FairValueApproval_ID { get; set; }
    public int? AssetFairValue_ID { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public int? ApprovedByID { get; set; }
    public string? Status { get; set; }
    public string? Comments { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
}
