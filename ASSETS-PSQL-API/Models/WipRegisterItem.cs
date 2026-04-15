namespace AssetManagement.Models;

public class WipRegisterItem
{
    public int WIPRegisterItem_ID { get; set; }
    public int? WIPRegister_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public string? Description { get; set; }
    public decimal? Amount { get; set; }
    public DateTime? TransferDate { get; set; }
    public string? Status { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
