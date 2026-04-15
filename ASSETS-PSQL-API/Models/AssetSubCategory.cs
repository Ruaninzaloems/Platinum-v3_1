namespace AssetManagement.Models;

public class AssetSubCategory
{
    public int Asset_SubCategory_ID { get; set; }
    public string? Asset_SubCategoryDescription { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? Capturer_ID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? Modifier_ID { get; set; }
    public int? AssetCategoryID { get; set; }
    public int? TypeID { get; set; }
    public int? Default { get; set; } = 1;
}
