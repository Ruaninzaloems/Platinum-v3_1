using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("Inven_Commodity")]
public class Commodity
{
    [Key]
    [Column("Commodity_ID")]
    public int CommodityId { get; set; }

    [Column("CommodityDesc")]
    public string? CommodityDesc { get; set; }

    [Column("CommodityExtendedDesc")]
    public string? CommodityExtendedDesc { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("CommodityClassificationID")]
    public int? CommodityClassificationId { get; set; }

    [Column("UnitOfIssueID")]
    public int? UnitOfIssueId { get; set; }

    [Column("CommodityTypeID")]
    public int? CommodityTypeId { get; set; }

    [Column("VatIndicatorID")]
    public int? VatIndicatorId { get; set; }

    [Column("CommodityInfoWebsite")]
    public string? CommodityInfoWebsite { get; set; }

    [Column("IsAwaitingApproval")]
    public bool? IsAwaitingApproval { get; set; }

    [Column("DateApproved")]
    public DateTime? DateApproved { get; set; }

    [Column("ApproverID")]
    public int? ApproverId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("RejectedReason")]
    public string? RejectedReason { get; set; }

    [Column("AddMarkup")]
    public bool? AddMarkup { get; set; }

    [Column("SCOAFundsID")]
    public int? ScoaFundsId { get; set; }

    [Column("SCOARegionID")]
    public int? ScoaRegionId { get; set; }

    [Column("SCOACostingID")]
    public int? ScoaCostingId { get; set; }

    [Column("SCOAProjectID")]
    public int? ScoaProjectId { get; set; }

    [Column("MeasureGroupCategoryId")]
    public int? MeasureGroupCategoryId { get; set; }

    [Column("ScoaItem")]
    public string? ScoaItem { get; set; }

    [Column("MarkupPercentage")]
    public decimal? MarkupPercentage { get; set; }

    [Column("CommodityWAVGchange")]
    public int? CommodityWavgChange { get; set; }

    [Column("CommodityWeightedAvg")]
    public decimal? CommodityWeightedAvg { get; set; }

    [Column("CommodityTotalQty")]
    public decimal? CommodityTotalQty { get; set; }

    [Column("RunningTotal")]
    public decimal? RunningTotal { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CommodityIDUnique")]
    public string? CommodityIdUnique { get; set; }

    [Column("CommoditySubTypeID")]
    public int? CommoditySubTypeId { get; set; }
}

[Table("Inven_Inventory")]
public class InventoryItem
{
    [Key]
    [Column("Inventory_ID")]
    public int InventoryId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("BinLocation")]
    public string? BinLocation { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("SellingPrice")]
    public decimal? SellingPrice { get; set; }

    [Column("MinimumLevel")]
    public decimal? MinimumLevel { get; set; }

    [Column("MaximumLevel")]
    public decimal? MaximumLevel { get; set; }

    [Column("ReorderLevel")]
    public decimal? ReorderLevel { get; set; }

    [Column("ReorderQuantity")]
    public decimal? ReorderQuantity { get; set; }

    [Column("SlowMovingInventory")]
    public bool? SlowMovingInventory { get; set; }

    [Column("InventoryTurnover")]
    public decimal? InventoryTurnover { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("StockLevelsRequired")]
    public bool? StockLevelsRequired { get; set; }

    [Column("SlowMovingReason")]
    public string? SlowMovingReason { get; set; }

    [Column("OverwrittenSellingPrice")]
    public decimal? OverwrittenSellingPrice { get; set; }

    [Column("OverwrittenBy")]
    public int? OverwrittenBy { get; set; }

    [Column("OverwrittenDate")]
    public DateTime? OverwrittenDate { get; set; }

    [Column("PriceIndicated")]
    public decimal? PriceIndicated { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("Vat")]
    public decimal? Vat { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("PreferredVendor")]
    public int? PreferredVendor { get; set; }

    [Column("BinNumber")]
    public int? BinNumber { get; set; }

    [Column("BinStatusID")]
    public int? BinStatusId { get; set; }

    [Column("GrnDetailID")]
    public int? GrnDetailId { get; set; }

    [Column("ScoaItemID")]
    public int? ScoaItemId { get; set; }

    [Column("SCOAFunction")]
    public int? ScoaFunction { get; set; }

    [Column("SCOARegion")]
    public int? ScoaRegion { get; set; }

    [Column("SCOACosting")]
    public int? ScoaCosting { get; set; }

    [Column("SCOAFund")]
    public int? ScoaFund { get; set; }

    [Column("SCOAProject")]
    public int? ScoaProject { get; set; }

    [Column("RunningTotal")]
    public decimal? RunningTotal { get; set; }

    [Column("CommodityTotalQty")]
    public decimal? CommodityTotalQty { get; set; }

    [Column("CommodityWeightedAvg")]
    public decimal? CommodityWeightedAvg { get; set; }

    [Column("CommodityWAVGchange")]
    public int? CommodityWavgChange { get; set; }

    [Column("RequisitionGrnTranNr")]
    public string? RequisitionGrnTranNr { get; set; }

    [Column("DocumentNr")]
    public int? DocumentNr { get; set; }

    [Column("FIFOUnitTotal")]
    public decimal? FifoUnitTotal { get; set; }

    [Column("FIFOValueTotal")]
    public decimal? FifoValueTotal { get; set; }

    [Column("FIFOTotalAmount")]
    public decimal? FifoTotalAmount { get; set; }

    [Column("FIFODateCaptured")]
    public DateTime? FifoDateCaptured { get; set; }

    [Column("AssetCategoryID")]
    public int? AssetCategoryId { get; set; }

    [Column("AssetClassID")]
    public int? AssetClassId { get; set; }
}

[Table("Inven_InventoryIssue")]
public class InventoryIssue
{
    [Key]
    [Column("Issue_ID")]
    public int IssueId { get; set; }

    [Column("InvRequisitionID")]
    public int? InvRequisitionId { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("Dispatched")]
    public bool? Dispatched { get; set; }

    [Column("InvRequisitionLineItemID")]
    public int? InvRequisitionLineItemId { get; set; }

    [Column("canceled")]
    public bool? Canceled { get; set; }

    [Column("QuantityIssued")]
    public decimal? QuantityIssued { get; set; }

    [Column("UOMCode")]
    public string? UomCode { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("Status")]
    public int? StatusId { get; set; }

    [Column("ApproveDate")]
    public DateTime? ApproveDate { get; set; }

    [Column("ApproveBy")]
    public int? ApproveBy { get; set; }

    [Column("CancelReason")]
    public string? CancelReason { get; set; }

    public virtual ICollection<InventoryIssueLineItem> LineItems { get; set; } = new List<InventoryIssueLineItem>();
}

[Table("Inven_InventoryIssueLineItem")]
public class InventoryIssueLineItem
{
    [Key]
    [Column("InvIssueLineItem_ID")]
    public int IssueLineItemId { get; set; }

    [Column("IssueID")]
    public int? IssueId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("Completed")]
    public bool? Completed { get; set; }

    [Column("Cancelled")]
    public bool? Cancelled { get; set; }

    [Column("CancelledReason")]
    public string? CancelledReason { get; set; }

    [Column("DateIssued")]
    public DateTime? DateIssued { get; set; }

    [Column("EmployeeID")]
    public int? EmployeeId { get; set; }

    [Column("VAT")]
    public decimal? Vat { get; set; }

    [Column("Price")]
    public decimal? Price { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("UOMCode")]
    public string? UomCode { get; set; }

    [Column("ScoaItem")]
    public string? ScoaItem { get; set; }

    [Column("BinLocationID")]
    public int? BinLocationId { get; set; }

    [Column("Processed")]
    public bool? Processed { get; set; }

    [Column("UomId")]
    public int? UomId { get; set; }

    [Column("RequisitionDetailID")]
    public int? RequisitionDetailId { get; set; }

    [Column("IssueToCapitalExpense")]
    public bool? IssueToCapitalExpense { get; set; }

    [Column("AssetCategoryID")]
    public int? AssetCategoryId { get; set; }

    [Column("AssetClassID")]
    public int? AssetClassId { get; set; }

    [Column("IssuedToName")]
    public string? IssuedToName { get; set; }

    [ForeignKey("IssueId")]
    public virtual InventoryIssue? Issue { get; set; }
}

[Table("Inven_InventoryReturn")]
public class InventoryReturn
{
    [Key]
    [Column("Return_ID")]
    public int ReturnId { get; set; }

    [Column("InvRequisitionID")]
    public int? InvRequisitionId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    [Column("ReturnType")]
    public byte? ReturnType { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("LegacyRequisitionID")]
    public int? LegacyRequisitionId { get; set; }

    [Column("OrderNumber")]
    public string? OrderNumber { get; set; }

    [Column("GRNNumber")]
    public string? GrnNumber { get; set; }

    [Column("InvocieNumber")]
    public string? InvoiceNumber { get; set; }

    [Column("RequisitionNumber")]
    public string? RequisitionNumber { get; set; }

    [Column("InventoryHighValueId")]
    public int? InventoryHighValueId { get; set; }

    public virtual ICollection<InventoryReturnLineItem> LineItems { get; set; } = new List<InventoryReturnLineItem>();
}

[Table("Inven_InventoryReturnLineItem")]
public class InventoryReturnLineItem
{
    [Key]
    [Column("InvReturnLineItem_ID")]
    public int ReturnLineItemId { get; set; }

    [Column("ReturnID")]
    public int? ReturnId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("EmployeeID")]
    public int? EmployeeId { get; set; }

    [Column("DateReturned")]
    public DateTime? DateReturned { get; set; }

    [Column("VAT")]
    public decimal? Vat { get; set; }

    [Column("Price")]
    public decimal? Price { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("BinLocationID")]
    public int? BinLocationId { get; set; }

    [Column("Reason")]
    public string? Reason { get; set; }

    [Column("isApproved")]
    public bool? IsApproved { get; set; }

    [Column("Approvedby")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("ReturnType")]
    public bool? ReturnLineType { get; set; }

    [ForeignKey("ReturnId")]
    public virtual InventoryReturn? Return { get; set; }
}

[Table("Inven_InventoryTransfer")]
public class InventoryTransfer
{
    [Key]
    [Column("Transfer_ID")]
    public int TransferId { get; set; }

    [Column("TransferReferenceNumber")]
    public string? TransferReferenceNumber { get; set; }

    [Column("FromStoreID")]
    public int? FromStoreId { get; set; }

    [Column("ToStoreID")]
    public int? ToStoreId { get; set; }

    [Column("FromStoreManagerID")]
    public int? FromStoreManagerId { get; set; }

    [Column("ToStoreManagerID")]
    public int? ToStoreManagerId { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("LineManagerID")]
    public int? LineManagerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("RequestedByID")]
    public int? RequestedById { get; set; }

    [Column("DivisionID")]
    public int? DivisionId { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    public virtual ICollection<InventoryTransferLineItem> LineItems { get; set; } = new List<InventoryTransferLineItem>();
}

[Table("Inven_InventoryTransferLineItem")]
public class InventoryTransferLineItem
{
    [Key]
    [Column("InvTransferLineItem_ID")]
    public int TransferLineItemId { get; set; }

    [Column("Transfer_ID")]
    public int? TransferId { get; set; }

    [Column("FromInventoryID")]
    public int? FromInventoryId { get; set; }

    [Column("ToInventoryID")]
    public int? ToInventoryId { get; set; }

    [Column("QuantityToTransfer")]
    public decimal? QuantityToTransfer { get; set; }

    [Column("TransferRequestDate")]
    public DateTime? TransferRequestDate { get; set; }

    [Column("TransferReceiveDate")]
    public DateTime? TransferReceiveDate { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("ApprovedByID")]
    public int? ApprovedById { get; set; }

    [Column("ApprovedByDate")]
    public DateTime? ApprovedByDate { get; set; }

    [Column("RejectedByID")]
    public int? RejectedById { get; set; }

    [Column("RejectedByDate")]
    public DateTime? RejectedByDate { get; set; }

    [Column("RejectReasonID")]
    public int? RejectReasonId { get; set; }

    [Column("DispatchedByID")]
    public int? DispatchedById { get; set; }

    [Column("DispatchedByDate")]
    public DateTime? DispatchedByDate { get; set; }

    [Column("ReceivedByID")]
    public int? ReceivedById { get; set; }

    [Column("ReceivedByDate")]
    public DateTime? ReceivedByDate { get; set; }

    [Column("FromSCOAFundsID")]
    public int? FromScoaFundsId { get; set; }

    [Column("FromSCOARegionID")]
    public int? FromScoaRegionId { get; set; }

    [Column("FromSCOACostingID")]
    public int? FromScoaCostingId { get; set; }

    [Column("FromSCOAProjectID")]
    public int? FromScoaProjectId { get; set; }

    [Column("FromSCOAFunctionID")]
    public int? FromScoaFunctionId { get; set; }

    [Column("FromSCOAItemID")]
    public int? FromScoaItemId { get; set; }

    [Column("ToSCOAFundsID")]
    public int? ToScoaFundsId { get; set; }

    [Column("ToSCOARegionID")]
    public int? ToScoaRegionId { get; set; }

    [Column("ToSCOACostingID")]
    public int? ToScoaCostingId { get; set; }

    [Column("ToSCOAProjectID")]
    public int? ToScoaProjectId { get; set; }

    [Column("ToSCOAFunctionID")]
    public int? ToScoaFunctionId { get; set; }

    [Column("ToSCOAItemID")]
    public int? ToScoaItemId { get; set; }

    [Column("TransferStatusID")]
    public int? TransferStatusId { get; set; }

    [Column("QuantityRequested")]
    public decimal? QuantityRequested { get; set; }

    [Column("QuantityReceived")]
    public decimal? QuantityReceived { get; set; }

    [Column("VAT")]
    public decimal? Vat { get; set; }

    [Column("Price")]
    public decimal? Price { get; set; }

    [Column("FromLocation")]
    public int? FromLocation { get; set; }

    [Column("TOLocation")]
    public int? ToLocation { get; set; }

    [Column("UnitOfIssueID")]
    public int? UnitOfIssueId { get; set; }

    [Column("rejectionReason")]
    public string? RejectionReason { get; set; }

    [Column("QuantityRejected")]
    public decimal? QuantityRejected { get; set; }

    [Column("UomId")]
    public int? UomId { get; set; }

    [ForeignKey("TransferId")]
    public virtual InventoryTransfer? Transfer { get; set; }
}

[Table("Inven_Stocktake")]
public class Stocktake
{
    [Key]
    [Column("Stocktake_ID")]
    public int StocktakeId { get; set; }

    [Column("StocktakeDate")]
    public DateTime? StocktakeDate { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("isApproved")]
    public bool? IsApproved { get; set; }

    [Column("ApprovedByID")]
    public int? ApprovedById { get; set; }

    [Column("RejectReason")]
    public string? RejectReason { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("isCancelled")]
    public bool? IsCancelled { get; set; }

    [Column("CancellationReason")]
    public string? CancellationReason { get; set; }

    [Column("CancelledByID")]
    public int? CancelledById { get; set; }

    [Column("CounterID")]
    public int? CounterId { get; set; }

    [Column("CheckerID")]
    public int? CheckerId { get; set; }

    [Column("StocktakeStatus")]
    public string? StocktakeStatus { get; set; }

    [Column("StocktakeName")]
    public string? StocktakeName { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    [Column("VerifierId")]
    public int? VerifierId { get; set; }

    [Column("IsVerified")]
    public bool? IsVerified { get; set; }

    public virtual ICollection<StocktakeLineItem> LineItems { get; set; } = new List<StocktakeLineItem>();
}

[Table("Inven_StocktakeLineItem")]
public class StocktakeLineItem
{
    [Key]
    [Column("StocktakeLineItem_ID")]
    public int StocktakeLineItemId { get; set; }

    [Column("StocktakeID")]
    public int? StocktakeId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("QuantityCounted")]
    public decimal? QuantityCounted { get; set; }

    [Column("QuantityChecked")]
    public decimal? QuantityChecked { get; set; }

    [Column("QuantityDamaged")]
    public decimal? QuantityDamaged { get; set; }

    [Column("ValueCounted")]
    public decimal? ValueCounted { get; set; }

    [Column("ValueChecked")]
    public decimal? ValueChecked { get; set; }

    [Column("ValueDamaged")]
    public decimal? ValueDamaged { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("QuantityVariance")]
    public decimal? QuantityVariance { get; set; }

    [Column("ValueVariance")]
    public decimal? ValueVariance { get; set; }

    [Column("QtyDamagedChecked")]
    public decimal? QtyDamagedChecked { get; set; }

    [Column("BinLocation")]
    public string? BinLocation { get; set; }

    [Column("approved")]
    public bool? Approved { get; set; }

    [Column("VarianceReason")]
    public string? VarianceReason { get; set; }

    [Column("RejectionReason")]
    public string? RejectionReason { get; set; }

    [Column("QuantityDamagedVerified")]
    public decimal? QuantityDamagedVerified { get; set; }

    [Column("BinNumber")]
    public string? BinNumber { get; set; }

    [Column("needChecking")]
    public bool? NeedChecking { get; set; }

    [Column("CapturedQtyUOM")]
    public int? CapturedQtyUom { get; set; }

    [Column("CountedQtyUOM")]
    public int? CountedQtyUom { get; set; }

    [Column("CapturedDamageUOM")]
    public int? CapturedDamageUom { get; set; }

    [Column("CountedDamageUOM")]
    public int? CountedDamageUom { get; set; }

    [Column("OnHandQty")]
    public decimal? OnHandQty { get; set; }

    [ForeignKey("StocktakeId")]
    public virtual Stocktake? Stocktake { get; set; }
}

[Table("Inven_BinLocation")]
public class BinLocation
{
    [Key]
    [Column("BinLocation_ID")]
    public int BinLocationId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("BinCode")]
    public string? BinCode { get; set; }

    [Column("BinDescription")]
    public string? BinDescription { get; set; }

    [Column("Aisle")]
    public string? Aisle { get; set; }

    [Column("Rack")]
    public string? Rack { get; set; }

    [Column("Shelf")]
    public string? Shelf { get; set; }

    [Column("Level")]
    public string? Level { get; set; }

    [Column("Position")]
    public string? Position { get; set; }

    [Column("MaxCapacity")]
    public decimal? MaxCapacity { get; set; }

    [Column("CurrentUsage")]
    public decimal? CurrentUsage { get; set; }

    [Column("IsActive")]
    public bool? IsActive { get; set; }
}

[Table("Inven_InventoryDisposal")]
public class InventoryDisposal
{
    [Key]
    [Column("Disposal_ID")]
    public int DisposalId { get; set; }

    [Column("DisposalTypeID")]
    public int? DisposalTypeId { get; set; }

    [Column("DisposalCategoryID")]
    public int? DisposalCategoryId { get; set; }

    [Column("DisposalDate")]
    public DateTime? DisposalDate { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("ReceiverName")]
    public string? ReceiverName { get; set; }

    [Column("ReceiverContactDetails")]
    public string? ReceiverContactDetails { get; set; }

    [Column("Reference")]
    public string? Reference { get; set; }

    [Column("Notes")]
    public string? Notes { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("CaptureID")]
    public int? CaptureId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    public virtual ICollection<InventoryDisposalLineItem> LineItems { get; set; } = new List<InventoryDisposalLineItem>();
}

[Table("Inven_InventoryDisposalLineItem")]
public class InventoryDisposalLineItem
{
    [Key]
    [Column("DisposalLineItem_ID")]
    public int DisposalLineItemId { get; set; }

    [Column("DisposalID")]
    public int? DisposalId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("QuantityToDispose")]
    public decimal? QuantityToDispose { get; set; }

    [Column("SalesUnitPrice")]
    public decimal? SalesUnitPrice { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("CaptureID")]
    public int? CaptureId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("RejectionReason")]
    public string? RejectionReason { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("IsApproved")]
    public bool? IsApproved { get; set; }

    [Column("UOM")]
    public string? Uom { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("DisposalValue")]
    public decimal? DisposalValue { get; set; }

    [Column("QuantityOnHand")]
    public decimal? QuantityOnHand { get; set; }

    [Column("CommodityExpiryDate")]
    public DateTime? CommodityExpiryDate { get; set; }

    [Column("QunatityAvailable")]
    public decimal? QuantityAvailable { get; set; }

    [Column("TotalCostOfDisposal")]
    public decimal? TotalCostOfDisposal { get; set; }

    [Column("BinLocation")]
    public string? BinLocation { get; set; }

    [Column("BinCode")]
    public string? BinCode { get; set; }

    [Column("BinNumber")]
    public int? BinNumber { get; set; }

    [Column("Quantitytosell")]
    public decimal? QuantityToSell { get; set; }

    [Column("UomId")]
    public int? UomId { get; set; }

    [ForeignKey("DisposalId")]
    public virtual InventoryDisposal? Disposal { get; set; }
}

[Table("Inven_InventoryDonation")]
public class InventoryDonation
{
    [Key]
    [Column("DonationID")]
    public int DonationId { get; set; }

    [Column("DonationDate")]
    public DateTime? DonationDate { get; set; }

    [Column("DonationIdNumber")]
    public string? DonationIdNumber { get; set; }

    [Column("DonationCompanyRegistrationNumber")]
    public string? DonationCompanyRegistrationNumber { get; set; }

    [Column("DonationFullName")]
    public string? DonationFullName { get; set; }

    [Column("DonationAddressLine1")]
    public string? DonationAddressLine1 { get; set; }

    [Column("DonationAddressLine2")]
    public string? DonationAddressLine2 { get; set; }

    [Column("DonationAddressLine3")]
    public string? DonationAddressLine3 { get; set; }

    [Column("DonationPostalCode")]
    public string? DonationPostalCode { get; set; }

    [Column("DonationTelephoneNumber")]
    public string? DonationTelephoneNumber { get; set; }

    [Column("DonationEmailAddress")]
    public string? DonationEmailAddress { get; set; }

    [Column("DonationValuatorFirstName")]
    public string? DonationValuatorFirstName { get; set; }

    [Column("DonationValuatorSurname")]
    public string? DonationValuatorSurname { get; set; }

    [Column("DonationValuatorPhoneNumber")]
    public string? DonationValuatorPhoneNumber { get; set; }

    [Column("DonationUploadFileName")]
    public string? DonationUploadFileName { get; set; }

    [Column("DonationAccountScoaID")]
    public int? DonationAccountScoaId { get; set; }

    [Column("ProjectID")]
    public int? ProjectId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("BinNumberID")]
    public int? BinNumberId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("UOMID")]
    public int? UomId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("PlanProjectItemID")]
    public int? PlanProjectItemId { get; set; }

    [Column("RejectionReason")]
    public string? RejectionReason { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("IsApproved")]
    public bool? IsApproved { get; set; }

    [Column("BinCode")]
    public string? BinCode { get; set; }

    [Column("BinLocation")]
    public string? BinLocation { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    [Column("Donor_Project")]
    public int? DonorProject { get; set; }

    [Column("Donor_ProjectItem")]
    public int? DonorProjectItem { get; set; }
}

[Table("Inven_Corrections")]
public class InventoryCorrection
{
    [Key]
    [Column("InventoryCorrectionId")]
    public int InventoryCorrectionId { get; set; }

    [Column("CorrectRefNumber")]
    public string? CorrectRefNumber { get; set; }

    [Column("Commodity_ID")]
    public int? CommodityId { get; set; }

    [Column("CommodityDesc")]
    public string? CommodityDesc { get; set; }

    [Column("CommodityExtendedDesc")]
    public string? CommodityExtendedDesc { get; set; }

    [Column("CommodityTypeID")]
    public int? CommodityTypeId { get; set; }

    [Column("CommoditySubTypeID")]
    public int? CommoditySubTypeId { get; set; }

    [Column("CommodityClassficaionID")]
    public int? CommodityClassificationId { get; set; }

    [Column("BinLocation")]
    public string? BinLocation { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("DateOfCorrection")]
    public DateTime? DateOfCorrection { get; set; }

    [Column("CorrectedBy")]
    public int? CorrectedBy { get; set; }

    [Column("UnitOfCost")]
    public decimal? UnitOfCost { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("TotalCost")]
    public decimal? TotalCost { get; set; }

    [Column("YearCorrected")]
    public int? YearCorrected { get; set; }

    [Column("JournoDesc")]
    public string? JournoDesc { get; set; }

    [Column("CommodityDR")]
    public decimal? CommodityDr { get; set; }

    [Column("CommodityCR")]
    public decimal? CommodityCr { get; set; }

    [Column("CorrectionType")]
    public string? CorrectionType { get; set; }

    [Column("VoteDR")]
    public int? VoteDr { get; set; }

    [Column("VoteCR")]
    public int? VoteCr { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("UOMID")]
    public int? UomId { get; set; }

    [Column("ProjectId")]
    public int? ProjectId { get; set; }

    [Column("ProjectLineItemId")]
    public int? ProjectLineItemId { get; set; }

    [Column("SelectedUomId")]
    public int? SelectedUomId { get; set; }

    [Column("Debit_ProjectID")]
    public int? DebitProjectId { get; set; }

    [Column("Debit_ProjectItemID")]
    public int? DebitProjectItemId { get; set; }

    [Column("Credit_ProjectID")]
    public int? CreditProjectId { get; set; }

    [Column("Credit_ProjectItemID")]
    public int? CreditProjectItemId { get; set; }
}

[Table("Inven_InventoryValuation")]
public class InventoryValuation
{
    [Key]
    [Column("Valuation_ID")]
    public int ValuationId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("ValuationMethodID")]
    public int? ValuationMethodId { get; set; }

    [Column("ValuationDate")]
    public DateTime? ValuationDate { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("ValuatedCost")]
    public decimal? ValuatedCost { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("Comment")]
    public string? Comment { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("ValuationCostFormulaID")]
    public int? ValuationCostFormulaId { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }
}

[Table("Inven_InventoryGRNDetails")]
public class InventoryGrnDetail
{
    [Key]
    [Column("InventoryGRNDetails_ID")]
    public int InventoryGrnDetailsId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("GrnDetailID")]
    public int? GrnDetailId { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Inven_InventoryRequisition")]
public class InventoryRequisition
{
    [Key]
    [Column("InvRequisition_ID")]
    public int InvRequisitionId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("RequisitionDate")]
    public DateTime? RequisitionDate { get; set; }

    [Column("isApproved")]
    public bool? IsApproved { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("RequestedByID")]
    public int? RequestedById { get; set; }

    [Column("InvRequistionNumber")]
    public string? InvRequisitionNumber { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    public virtual ICollection<InventoryRequisitionLineItem> LineItems { get; set; } = new List<InventoryRequisitionLineItem>();
}

[Table("Inven_InventoryRequisitionLineItem")]
public class InventoryRequisitionLineItem
{
    [Key]
    [Column("InvRequisitionLineItem_ID")]
    public int InvRequisitionLineItemId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("EstimatedPrice")]
    public decimal? EstimatedPrice { get; set; }

    [Column("InvRequisitionID")]
    public int? InvRequisitionId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("InvRequisitionId")]
    public virtual InventoryRequisition? Requisition { get; set; }
}

[Table("Inven_DeptRequisition")]
public class DeptRequisition
{
    [Key]
    [Column("Inven_DeptRequisition_ID")]
    public int DeptRequisitionId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("RequisitionDate")]
    public DateTime? RequisitionDate { get; set; }

    [Column("RequisitionNumber")]
    public string? RequisitionNumber { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    public virtual ICollection<DeptRequisitionLineItem> LineItems { get; set; } = new List<DeptRequisitionLineItem>();
}

[Table("Inven_DeptRequisitionLineItem")]
public class DeptRequisitionLineItem
{
    [Key]
    [Column("Inven_DeptRequisitionLineItem_ID")]
    public int DeptRequisitionLineItemId { get; set; }

    [Column("DeptRequisitionID")]
    public int? DeptRequisitionId { get; set; }

    [Column("CommodityID")]
    public int? CommodityId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("TotalCost")]
    public decimal? TotalCost { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("DeptRequisitionId")]
    public virtual DeptRequisition? DeptRequisition { get; set; }
}

[Table("Inven_HighValue")]
public class HighValueItem
{
    [Key]
    [Column("InventoryHighValueId")]
    public int InventoryHighValueId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("TransferRefNumber")]
    public string? TransferRefNumber { get; set; }

    [Column("DateSubmit")]
    public DateTime? DateSubmit { get; set; }

    [Column("RequestedBy")]
    public int? RequestedBy { get; set; }

    [Column("ToFunctionId")]
    public int? ToFunctionId { get; set; }

    [Column("FromVote")]
    public int? FromVote { get; set; }

    [Column("ToVote")]
    public int? ToVote { get; set; }

    [Column("DateCapture")]
    public DateTime? DateCapture { get; set; }

    [Column("CaptureId")]
    public int? CaptureId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifiedId")]
    public int? ModifiedId { get; set; }

    [Column("UniqueInventoryReference")]
    public string? UniqueInventoryReference { get; set; }

    [Column("AssetCategoryID")]
    public int? AssetCategoryId { get; set; }

    [Column("AssetClassID")]
    public int? AssetClassId { get; set; }

    public virtual ICollection<HighValueLineItem> LineItems { get; set; } = new List<HighValueLineItem>();
}

[Table("Inven_HighValueLineItem")]
public class HighValueLineItem
{
    [Key]
    [Column("Inven_HighValueItemId")]
    public int HighValueLineItemId { get; set; }

    [Column("Inven_HighValueId")]
    public int? HighValueId { get; set; }

    [Column("InventoryId")]
    public int? InventoryId { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("BinNumber")]
    public int? BinNumber { get; set; }

    [Column("ValueofTransfer")]
    public decimal? ValueOfTransfer { get; set; }

    [Column("IsApproved")]
    public bool? IsApproved { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturedId")]
    public int? CapturedId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifiedId")]
    public int? ModifiedId { get; set; }

    [Column("Processed")]
    public bool? Processed { get; set; }

    [Column("UomId")]
    public int? UomId { get; set; }

    [Column("DateApproved")]
    public DateTime? DateApproved { get; set; }

    [Column("ApprovedId")]
    public int? ApprovedId { get; set; }

    [Column("ProjectID")]
    public int? ProjectId { get; set; }

    [Column("ProjectItemID")]
    public int? ProjectItemId { get; set; }

    [ForeignKey("HighValueId")]
    public virtual HighValueItem? HighValueItem { get; set; }
}

[Table("Inven_MonthEndExceptions")]
public class MonthEndException
{
    [Key]
    [Column("MonthEndExceptionId")]
    public int MonthEndExceptionId { get; set; }

    [Column("KeyID")]
    public int? KeyId { get; set; }

    [Column("KeyIDValue")]
    public string? KeyIdValue { get; set; }

    [Column("ID")]
    public int? Id { get; set; }

    [Column("Value")]
    public string? Value { get; set; }

    [Column("Type")]
    public int? Type { get; set; }

    [Column("TransID")]
    public int? TransId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("finYearEnd")]
    public string? FinYearEnd { get; set; }

    [Column("intMonth")]
    public int? IntMonth { get; set; }
}

[Table("Inven_InventoryDisposalTypeCategoty")]
public class InventoryDisposalTypeCategory
{
    [Key]
    [Column("DisposalTypeCategory_ID")]
    public int DisposalTypeCategoryId { get; set; }

    [Column("DisposalTypeCategoryDescription")]
    public string? DisposalTypeCategoryDescription { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("InventoryValueHistory")]
public class InventoryValueHistory
{
    [Key]
    [Column("InventoryValueHistoryID")]
    public int InventoryValueHistoryId { get; set; }

    [Column("InventoryID")]
    public int? InventoryId { get; set; }

    [Column("BinNumberID")]
    public int? BinNumberId { get; set; }

    [Column("DateOfTransaction")]
    public DateTime? DateOfTransaction { get; set; }

    [Column("InventoryValueHistoryTransactionCodeID")]
    public int? InventoryValueHistoryTransactionCodeId { get; set; }

    [Column("TransQuantity")]
    public decimal? TransQuantity { get; set; }

    [Column("QuantityBalanceToDate")]
    public decimal? QuantityBalanceToDate { get; set; }

    [Column("CumulitiveBalanceQuantity")]
    public decimal? CumulativeBalanceQuantity { get; set; }

    [Column("InventoryUnitCost")]
    public decimal? InventoryUnitCost { get; set; }

    [Column("InventoryValueActual")]
    public decimal? InventoryValueActual { get; set; }

    [Column("AverageCost")]
    public decimal? AverageCost { get; set; }

    [Column("CumulativeBalanceValue")]
    public decimal? CumulativeBalanceValue { get; set; }

    [Column("ProjectID")]
    public int? ProjectId { get; set; }

    [Column("TransactionID")]
    public int? TransactionId { get; set; }
}
