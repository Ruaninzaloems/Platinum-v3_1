namespace AssetManagement.Models;

public class WipApprovalItem
{
    public int WIPApprovalItem_ID { get; set; }
    public int? WIPRegister_ID { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public int? ApprovedByID { get; set; }
    public string? Status { get; set; }
    public string? Comments { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
}
