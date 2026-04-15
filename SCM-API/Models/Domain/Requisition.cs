using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_Requisition")]
public class Requisition
{
    [Key]
    [Column("Requisition_ID")]
    public int RequisitionId { get; set; }

    [Column("RequisitionNumber")]
    public string? RequisitionNumber { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("RequestedBy")]
    public int? RequestedBy { get; set; }

    [Column("RequestedFor")]
    public int? RequestedFor { get; set; }

    [Column("RequestedDate")]
    public DateTime? RequestedDate { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("FunctionID")]
    public int? FunctionId { get; set; }

    [Column("VoteID")]
    public int? VoteId { get; set; }

    [Column("CostCollectorID")]
    public int? CostCollectorId { get; set; }

    [Column("SupervisorID")]
    public int? SupervisorId { get; set; }

    [Column("HODID")]
    public int? HodId { get; set; }

    [Column("SupervisorApproval")]
    public bool? SupervisorApproval { get; set; }

    [Column("SupervisorApprovalDate")]
    public DateTime? SupervisorApprovalDate { get; set; }

    [Column("HODApproval")]
    public bool? HodApproval { get; set; }

    [Column("HODApprovalDate")]
    public DateTime? HodApprovalDate { get; set; }

    [Column("FinalApproved")]
    public bool? FinalApproved { get; set; }

    [Column("Rejected")]
    public bool? Rejected { get; set; }

    [Column("IsDeleted")]
    public bool? IsDeleted { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("FundAvailable")]
    public bool? FundAvailable { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("SavedStatusid")]
    public int? SavedStatusId { get; set; }

    [Column("Motivation")]
    public string? Motivation { get; set; }

    [Column("Comment")]
    public string? Comment { get; set; }

    [NotMapped]
    public string? AdditionalComment { get; set; }

    [Column("OfflineReferenceNumber")]
    public string? OfflineReferenceNumber { get; set; }

    [Column("RequisitionProject")]
    public string? RequisitionProject { get; set; }

    [Column("RequisitionProcurementPlan")]
    public string? RequisitionProcurementPlan { get; set; }

    [Column("FirstLevelApprID")]
    public int? FirstLevelApprId { get; set; }

    [Column("SecLevelApprID")]
    public int? SecondLevelApprId { get; set; }

    [Column("ThirLevelApprID")]
    public int? ThirdLevelApprId { get; set; }

    [Column("ForthLevelApprID")]
    public int? FourthLevelApprId { get; set; }

    [Column("FifthLevelApprID")]
    public int? FifthLevelApprId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    public virtual ICollection<RequisitionServiceDetail> ServiceDetails { get; set; } = new List<RequisitionServiceDetail>();
    public virtual ICollection<RequisitionDocument> Documents { get; set; } = new List<RequisitionDocument>();
}

[Table("SCM_RequisitionServiceDetails")]
public class RequisitionServiceDetail
{
    [Key]
    [Column("RequisitionDetail_ID")]
    public int RequisitionDetailId { get; set; }

    [Column("RequisitionID")]
    public int? RequisitionId { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("EstimatedCost")]
    public decimal? EstimatedCost { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("SCOAFunctionID")]
    public int? ScoaFunctionId { get; set; }

    [Column("SCOAItemID")]
    public int? ScoaItemId { get; set; }

    [Column("SCOARegionID")]
    public int? ScoaRegionId { get; set; }

    [Column("SCOACostingID")]
    public int? ScoaCostingId { get; set; }

    [Column("SCOAProjectID")]
    public int? ScoaProjectId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CommodityId")]
    public int? CommodityId { get; set; }

    [Column("UOM")]
    public string? Uom { get; set; }

    [Column("PurchaseItem")]
    public string? PurchaseItem { get; set; }

    [Column("PurchaseItem2")]
    public string? PurchaseItem2 { get; set; }

    [Column("PurchaseItem3")]
    public string? PurchaseItem3 { get; set; }

    [Column("DeliveryAddress")]
    public string? DeliveryAddress { get; set; }

    [Column("DeliveryDate")]
    public DateTime? DeliveryDate { get; set; }

    [Column("Approve")]
    public bool? Approve { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("AssetClassID")]
    public int? AssetClassId { get; set; }

    [Column("AssetCategoryID")]
    public int? AssetCategoryId { get; set; }

    [Column("DivisionID")]
    public int? DivisionId { get; set; }

    [Column("DirectDelivery")]
    public bool? DirectDelivery { get; set; }

    [Column("PlanProjectId")]
    public int? PlanProjectId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("RequisitionId")]
    public virtual Requisition? Requisition { get; set; }
}

[Table("SCM_RequisitionServiceDetailsFund")]
public class RequisitionServiceDetailFund
{
    [Key]
    [Column("RequisitionItemFund_ID")]
    public int RequisitionItemFundId { get; set; }

    [Column("RequisitionDetailID")]
    public int? RequisitionDetailId { get; set; }

    [Column("SCOAFundID")]
    public int? ScoaFundId { get; set; }

    [Column("Percentage")]
    public decimal? Percentage { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_RequisitionDocuments")]
public class RequisitionDocument
{
    [Key]
    [Column("Document_ID")]
    public int DocumentId { get; set; }

    [Column("GenRequestID")]
    public int? GenRequestId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_RequisitionBillOfQuantity")]
public class RequisitionBillOfQuantity
{
    [Key]
    [Column("BillOfQuantity_ID")]
    public int BillOfQuantityId { get; set; }

    [Column("RequisitionID")]
    public int? RequisitionId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("PurchaseItem")]
    public string? PurchaseItem { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UOM")]
    public string? Uom { get; set; }
}

[Table("SCM_RequistionAssignBuyer")]
public class RequisitionAssignBuyer
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [Column("RequisitionDetailID")]
    public int? RequisitionDetailId { get; set; }

    [Column("BuyerID")]
    public int? BuyerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }
}

[Table("SCM_RequisitionApprovalSetup")]
public class RequisitionApprovalSetup
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [Column("ApprovalLevel")]
    public int? ApprovalLevel { get; set; }

    [Column("ApprovalName")]
    public string? ApprovalName { get; set; }

    [Column("IsEnabled")]
    public bool? IsEnabled { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }
}
