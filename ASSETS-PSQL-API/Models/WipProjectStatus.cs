namespace AssetManagement.Models;

public class WipProjectStatus
{
    public int WIPProjectStatus_ID { get; set; }
    public string? WIPProjectStatusDesc { get; set; }
    public int? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
