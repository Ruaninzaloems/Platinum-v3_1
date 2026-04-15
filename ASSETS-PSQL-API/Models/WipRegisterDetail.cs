namespace AssetManagement.Models;

public class WipRegisterDetail
{
    public int WIPRegisterDetail_ID { get; set; }
    public int? WIPRegister_ID { get; set; }
    public string? Description { get; set; }
    public decimal? Amount { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
