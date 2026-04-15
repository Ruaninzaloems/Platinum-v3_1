namespace AssetManagement.Models;

public class AssetDisposal
{
    public int AssetDisposal_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public DateTime? DisposalDate { get; set; }
    public int? DisposalMethod_ID { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? CarryingAmount { get; set; }
    public decimal? ProfitLoss { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; }
    public string? FinYear { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}

public class AssetDisposalApproval
{
    public int DisposalApproval_ID { get; set; }
    public int? AssetDisposal_ID { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public int? ApprovedByID { get; set; }
    public string? Status { get; set; }
    public string? Comments { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
}
