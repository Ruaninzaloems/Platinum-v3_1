namespace MssqlApi.Models;

public class ScmContractDetailItems
{
    public int ContractDetailItems_ID { get; set; }
    public int? ContractID { get; set; }
    public int? RequisitionDetailID { get; set; }
    public decimal? Cost { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public decimal? VatAmount { get; set; }
    public decimal? TotalAmount { get; set; }
    public bool? VatExempt { get; set; }
    public bool? ServiceItem { get; set; }
    public bool? GoodsItem { get; set; }
    public int? PreviousContractDetailItemsID { get; set; }
    public int? BillOfQuantityID { get; set; }
    public decimal? VariationAmount { get; set; }
    public decimal? OriginalTotalAmount { get; set; }
    public decimal? VoidAmount { get; set; }
    public decimal? OriginalVATAmount { get; set; }
    public decimal? VoidVATAmount { get; set; }
    public int? PlanProjectItemId { get; set; }
    public bool? IsScopedExtensionVariation { get; set; }
}
