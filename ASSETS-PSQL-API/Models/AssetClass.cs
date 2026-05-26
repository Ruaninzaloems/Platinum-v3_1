namespace AssetManagement.Models;

public class AssetClass
{
    public int AssetClass_ID { get; set; }
    public string? AssetClassDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Asset_SubCategory_ID { get; set; }
    public int? UsefulLifeInMonths { get; set; }
    public int? AssetDepreciationMethod_ID { get; set; }
    public int? RevaluationByCostModel { get; set; }
    public int? RevaluationByRevalutionModel { get; set; }
    public int? TypeID { get; set; }
    public int? Default { get; set; }
    public int? AssetCategoryID { get; set; }
    public int? AssetStatus_ID { get; set; }
    public int? AssetMeasurement_ID { get; set; }
    public string? RevaluationMethod { get; set; }
}
