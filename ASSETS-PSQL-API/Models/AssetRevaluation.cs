namespace AssetManagement.Models;

public class AssetRevaluation
{
    public int Asset_RevaluationsID { get; set; }
    public int AssetRegisterID { get; set; }
    public int Revaluation { get; set; }
    public int Asset { get; set; }
    public int Profit { get; set; }
    public int RevalModel { get; set; }
    public decimal RevalautionAmt { get; set; }
    public DateTime? RevalutionDate { get; set; }
    public int UserID { get; set; }
    public decimal DiffDepAcc { get; set; }
    public decimal DiffBook { get; set; }
    public int ProjectDR { get; set; }
    public int ProjectItemDR { get; set; }
    public int ProjectCR { get; set; }
    public int ProjectItemCR { get; set; }
    public DateTime? PostDateTime { get; set; }
    public int? SCOAItemDR { get; set; }
    public int? SCOAItemCR { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public decimal? SurplusAmount { get; set; }
    public decimal? DepreciationAdjustment { get; set; }
    public bool? Approved { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}
