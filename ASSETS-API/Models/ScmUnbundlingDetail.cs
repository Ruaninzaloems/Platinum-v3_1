namespace MssqlApi.Models;

public class ScmUnbundlingDetail
{
    public int AssetContractDetail_ID { get; set; }
    public int AssetContractHeaderId { get; set; }
    public int? RegisterItemsId { get; set; }
    public int? RequisitionBillOfQuantityId { get; set; }
    public int? QuotationServiceDetailId { get; set; }
    public int? InformalTenderServiceDetailId { get; set; }
    public int? InvoiceDetailId { get; set; }
    public int? CreditDebtNoteDetailId { get; set; }
    public int? ProjectItemId { get; set; }
    public int? SCOAItem { get; set; }
    public string? GoodsServiceDescription { get; set; }
    public int? UOM { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? Rate { get; set; }
    public decimal? Amount { get; set; }
    public bool IsAsset { get; set; }
    public string? AssetDescription { get; set; }
    public int? CIDMS_Sub_Component_Type { get; set; }
    public int? Asset_Type { get; set; }
    public int? Asset_Category { get; set; }
    public int? Asset_Sub_Category { get; set; }
    public int? Measurement_Type { get; set; }
    public int? Asset_Status { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? ContractDetailItemId { get; set; }
}
