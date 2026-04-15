namespace AssetManagement.Models;

public class AssetCategory
{
    public int AssetCategoryID { get; set; }
    public string? AssetCategoryDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? RevaluationByCostModel { get; set; }
    public int? RevaluationByRevalutionModel { get; set; }
    public int? Default { get; set; } = 1;
    public int? TypeID { get; set; }
    public int? RequireStatus { get; set; }
}
