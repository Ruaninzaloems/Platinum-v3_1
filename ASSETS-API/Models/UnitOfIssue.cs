namespace MssqlApi.Models;

public class UnitOfIssue
{
    public int UnitOfIssue_ID { get; set; }
    public string? UnitOfIssueDesc { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public string? UOMCode { get; set; }
    public string? MeasureCategoryCode { get; set; }
    public int? @base { get; set; }
    public bool? GroupDefaultUom { get; set; }
    public bool? IsDeleted { get; set; }
}
