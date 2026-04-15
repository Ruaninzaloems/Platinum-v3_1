using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("Inven_CommodityVendor")]
public class CommodityVendor
{
    [Key]
    [Column("CommodityVendor_ID")]
    public int CommodityVendorId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("VendorPrice")]
    public decimal? VendorPrice { get; set; }

    [Column("IsPreferred")]
    public bool? IsPreferred { get; set; }

    [Column("LeadTimeDays")]
    public int? LeadTimeDays { get; set; }

    [Column("MinimumOrderQty")]
    public decimal? MinimumOrderQty { get; set; }

    [Column("VendorCommodityCode")]
    public string? VendorCommodityCode { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [ForeignKey("CommodityId")]
    public virtual Commodity? Commodity { get; set; }

    [ForeignKey("VendorId")]
    public virtual Vendor? Vendor { get; set; }
}

[Table("Inven_CommodityUomMap")]
public class CommodityUomMap
{
    [Key]
    [Column("CommodityUomMap_ID")]
    public int CommodityUomMapId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("UnitOfIssueID")]
    public int? UnitOfIssueId { get; set; }

    [Column("ConversionFactor")]
    public decimal? ConversionFactor { get; set; }

    [Column("IsBaseUom")]
    public bool? IsBaseUom { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("CommodityId")]
    public virtual Commodity? Commodity { get; set; }
}

[Table("Inven_Commodity_Scoa_Functions")]
public class CommodityScoaFunction
{
    [Key]
    [Column("CommodityScoaFunction_ID")]
    public int CommodityScoaFunctionId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("SCOAFunctionID")]
    public int? ScoaFunctionId { get; set; }

    [Column("SCOAFunctionDesc")]
    public string? ScoaFunctionDesc { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("CommodityId")]
    public virtual Commodity? Commodity { get; set; }
}

[Table("Inven_VendorBarcode")]
public class VendorBarcode
{
    [Key]
    [Column("VendorBarcode_ID")]
    public int VendorBarcodeId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("Barcode")]
    public string? Barcode { get; set; }

    [Column("BarcodeType")]
    public string? BarcodeType { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("CommodityId")]
    public virtual Commodity? Commodity { get; set; }

    [ForeignKey("VendorId")]
    public virtual Vendor? Vendor { get; set; }
}

[Table("Inven_Notifications")]
public class InvenNotification
{
    [Key]
    [Column("InvenNotification_ID")]
    public int InvenNotificationId { get; set; }

    [Column("NotificationType")]
    public string? NotificationType { get; set; }

    [Column("Title")]
    public string? Title { get; set; }

    [Column("Message")]
    public string? Message { get; set; }

    [Column("ReferenceID")]
    public int? ReferenceId { get; set; }

    [Column("ReferenceType")]
    public string? ReferenceType { get; set; }

    [Column("UserID")]
    public int? UserId { get; set; }

    [Column("IsRead")]
    public bool? IsRead { get; set; }

    [Column("DateRead")]
    public DateTime? DateRead { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Inven_TransferLocationDetails")]
public class TransferLocationDetail
{
    [Key]
    [Column("TransferLocationDetail_ID")]
    public int TransferLocationDetailId { get; set; }

    [Column("TransferID")]
    public int? TransferId { get; set; }

    [Column("FromStoreID")]
    public int? FromStoreId { get; set; }

    [Column("ToStoreID")]
    public int? ToStoreId { get; set; }

    [Column("FromBinLocation")]
    public string? FromBinLocation { get; set; }

    [Column("ToBinLocation")]
    public string? ToBinLocation { get; set; }

    [Column("TransportMethod")]
    public string? TransportMethod { get; set; }

    [Column("DriverName")]
    public string? DriverName { get; set; }

    [Column("VehicleRegNo")]
    public string? VehicleRegNo { get; set; }

    [Column("Notes")]
    public string? Notes { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("TransferId")]
    public virtual InventoryTransfer? Transfer { get; set; }
}

[Table("Inven_InvoiceAdjustment")]
public class InvenInvoiceAdjustment
{
    [Key]
    [Column("InvoiceAdjustment_ID")]
    public int InvoiceAdjustmentId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("OriginalUnitPrice")]
    public decimal? OriginalUnitPrice { get; set; }

    [Column("AdjustedUnitPrice")]
    public decimal? AdjustedUnitPrice { get; set; }

    [Column("PriceDifference")]
    public decimal? PriceDifference { get; set; }

    [Column("Reason")]
    public string? Reason { get; set; }

    [Column("AdjustmentType")]
    public string? AdjustmentType { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Inven_IssueSerialNo")]
public class IssueSerialNo
{
    [Key]
    [Column("IssueSerialNo_ID")]
    public int IssueSerialNoId { get; set; }

    [Column("IssueLineItemID")]
    public int? IssueLineItemId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("SerialNumber")]
    public string? SerialNumber { get; set; }

    [Column("BatchNumber")]
    public string? BatchNumber { get; set; }

    [Column("ExpiryDate")]
    public DateTime? ExpiryDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("IssueLineItemId")]
    public virtual InventoryIssueLineItem? IssueLineItem { get; set; }
}

[Table("Inven_ReconciliationException")]
public class ReconciliationException
{
    [Key]
    [Column("ReconciliationException_ID")]
    public int ReconciliationExceptionId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("ExceptionType")]
    public string? ExceptionType { get; set; }

    [Column("SystemQuantity")]
    public decimal? SystemQuantity { get; set; }

    [Column("PhysicalQuantity")]
    public decimal? PhysicalQuantity { get; set; }

    [Column("Variance")]
    public decimal? Variance { get; set; }

    [Column("VarianceValue")]
    public decimal? VarianceValue { get; set; }

    [Column("Resolution")]
    public string? Resolution { get; set; }

    [Column("IsResolved")]
    public bool? IsResolved { get; set; }

    [Column("ResolvedDate")]
    public DateTime? ResolvedDate { get; set; }

    [Column("ResolvedByID")]
    public int? ResolvedById { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("Period")]
    public int? Period { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Inven_CommodityTakeOnSettings")]
public class CommodityTakeOnSettings
{
    [Key]
    [Column("CommodityTakeOnSettings_ID")]
    public int CommodityTakeOnSettingsId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("AllowTakeOn")]
    public bool? AllowTakeOn { get; set; }

    [Column("TakeOnDate")]
    public DateTime? TakeOnDate { get; set; }

    [Column("IsComplete")]
    public bool? IsComplete { get; set; }

    [Column("CompletedDate")]
    public DateTime? CompletedDate { get; set; }

    [Column("CompletedByID")]
    public int? CompletedById { get; set; }

    [Column("TotalCommodities")]
    public int? TotalCommodities { get; set; }

    [Column("TotalValue")]
    public decimal? TotalValue { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Inven_CommodityTakeOnInfo")]
public class CommodityTakeOnInfo
{
    [Key]
    [Column("CommodityTakeOnInfo_ID")]
    public int CommodityTakeOnInfoId { get; set; }

    [Column("TakeOnSettingsID")]
    public int? TakeOnSettingsId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("TotalValue")]
    public decimal? TotalValue { get; set; }

    [Column("BinLocation")]
    public string? BinLocation { get; set; }

    [Column("IsProcessed")]
    public bool? IsProcessed { get; set; }

    [Column("ProcessedDate")]
    public DateTime? ProcessedDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("TakeOnSettingsId")]
    public virtual CommodityTakeOnSettings? TakeOnSettings { get; set; }

    [ForeignKey("CommodityId")]
    public virtual Commodity? Commodity { get; set; }
}

[Table("Inven_ValuationRejectionReason")]
public class ValuationRejectionReason
{
    [Key]
    [Column("ValuationRejectionReason_ID")]
    public int ValuationRejectionReasonId { get; set; }

    [Column("ValuationID")]
    public int? ValuationId { get; set; }

    [Column("RejectionReason")]
    public string? RejectionReason { get; set; }

    [Column("RejectedByID")]
    public int? RejectedById { get; set; }

    [Column("RejectedDate")]
    public DateTime? RejectedDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("ValuationId")]
    public virtual InventoryValuation? Valuation { get; set; }
}
