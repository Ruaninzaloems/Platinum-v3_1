namespace AssetManagement.Models;

public class UnitOfIssue
{
    public int UnitOfIssue_ID { get; set; }
    public string? UnitOfIssueDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public string? UOMCode { get; set; }
    public string? MeasureCategoryCode { get; set; }
    public int? Base { get; set; }
    public int? GroupDefaultUom { get; set; }
    public int? IsDeleted { get; set; }
}
