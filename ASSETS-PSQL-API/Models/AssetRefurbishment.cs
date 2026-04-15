namespace AssetManagement.Models;

public class AssetRefurbishment
{
    public int Asset_RefurbID { get; set; }
    public int? AssetRegisterID { get; set; }
    public int? FinancialPeriod { get; set; }
    public string? FinancialYear { get; set; }
    public DateTime? RefurbDate { get; set; }
    public decimal? Refurb_DT { get; set; }
    public decimal? Refurb_CT { get; set; }
    public decimal? Refurb_Depreciation { get; set; }
    public decimal? Refurb_Revaluation { get; set; }
    public decimal? Refurb_Impairment { get; set; }
    public bool? isApproved { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? DebitPlanProjectItemId { get; set; }
    public int? CreditPlanProjectItemId { get; set; }
}
