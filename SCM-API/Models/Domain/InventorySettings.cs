using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("Const_AutoBinCode")]
public class AutoBinCode
{
    [Key]
    [Column("AutoBinCode_ID")]
    public int AutoBinCodeId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("BinPrefix")]
    public string? BinPrefix { get; set; }

    [Column("BinSuffix")]
    public string? BinSuffix { get; set; }

    [Column("BinLength")]
    public int? BinLength { get; set; }

    [Column("NextNumber")]
    public int? NextNumber { get; set; }

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
}

[Table("Const_CommodityClassification")]
public class CommodityClassification
{
    [Key]
    [Column("CommodityClassification_ID")]
    public int CommodityClassificationId { get; set; }

    [Column("CommodityClassificationDesc")]
    public string? CommodityClassificationDesc { get; set; }

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
}

[Table("Const_CommodityType")]
public class CommodityType
{
    [Key]
    [Column("CommodityType_ID")]
    public int CommodityTypeId { get; set; }

    [Column("CommodityTypeDesc")]
    public string? CommodityTypeDesc { get; set; }

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
}

[Table("Const_CommoditySubType")]
public class CommoditySubType
{
    [Key]
    [Column("CommoditySubType_ID")]
    public int CommoditySubTypeId { get; set; }

    [Column("CommoditySubTypeDesc")]
    public string? CommoditySubTypeDesc { get; set; }

    [Column("CommodityTypeID")]
    public int? CommodityTypeId { get; set; }

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
}

[Table("Const_CommodityTypeSubTypeMapping")]
public class CommodityTypeSubTypeMapping
{
    [Key]
    [Column("Mapping_ID")]
    public int MappingId { get; set; }

    [Column("CommodityTypeID")]
    public int? CommodityTypeId { get; set; }

    [Column("CommoditySubTypeID")]
    public int? CommoditySubTypeId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_UnitOfIssue")]
public class UnitOfIssue
{
    [Key]
    [Column("UnitOfIssue_ID")]
    public int UnitOfIssueId { get; set; }

    [Column("UnitOfIssueDesc")]
    public string? UnitOfIssueDesc { get; set; }

    [Column("UOMCode")]
    public string? UomCode { get; set; }

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

    [Column("MeasureGroupCategoryId")]
    public int? MeasureGroupCategoryId { get; set; }
}

[Table("Const_MeasureGroupCategory")]
public class MeasureGroupCategory
{
    [Key]
    [Column("MeasureGroupCategory_ID")]
    public int MeasureGroupCategoryId { get; set; }

    [Column("MeasureGroupCategoryDesc")]
    public string? MeasureGroupCategoryDesc { get; set; }

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
}

[Table("Const_InventorySCOAItemSetup")]
public class InventoryScoaItemSetup
{
    [Key]
    [Column("InventorySCOAItemSetup_ID")]
    public int InventoryScoaItemSetupId { get; set; }

    [Column("ScoaItemID")]
    public int? ScoaItemId { get; set; }

    [Column("ScoaItemDesc")]
    public string? ScoaItemDesc { get; set; }

    [Column("CommodityClassificationID")]
    public int? CommodityClassificationId { get; set; }

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
}

[Table("Const_Inventory_CommodityClassification_SCOAItem")]
public class CommodityClassificationScoaItem
{
    [Key]
    [Column("ClassificationSCOAItem_ID")]
    public int ClassificationScoaItemId { get; set; }

    [Column("CommodityClassificationID")]
    public int? CommodityClassificationId { get; set; }

    [Column("ScoaItemID")]
    public int? ScoaItemId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_Inventory_CommodityClassification_SCOAItem_Expense")]
public class CommodityClassificationScoaExpense
{
    [Key]
    [Column("ClassificationSCOAItemExpense_ID")]
    public int ClassificationScoaItemExpenseId { get; set; }

    [Column("CommodityClassificationID")]
    public int? CommodityClassificationId { get; set; }

    [Column("ScoaItemID")]
    public int? ScoaItemId { get; set; }

    [Column("ExpenseTypeID")]
    public int? ExpenseTypeId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_Inventory_CommodityClassification_SCOAItem_CostFormula")]
public class CommodityClassificationScoaCostFormula
{
    [Key]
    [Column("ClassificationSCOAItemCostFormula_ID")]
    public int ClassificationScoaItemCostFormulaId { get; set; }

    [Column("CommodityClassificationID")]
    public int? CommodityClassificationId { get; set; }

    [Column("ScoaItemID")]
    public int? ScoaItemId { get; set; }

    [Column("CostFormulaID")]
    public int? CostFormulaId { get; set; }

    [Column("CostFormulaDesc")]
    public string? CostFormulaDesc { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_Inven_MonthEnd")]
public class InvenMonthEnd
{
    [Key]
    [Column("MonthEnd_ID")]
    public int MonthEndId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("Month")]
    public int? Month { get; set; }

    [Column("MonthName")]
    public string? MonthName { get; set; }

    [Column("IsClosed")]
    public bool? IsClosed { get; set; }

    [Column("ClosedDate")]
    public DateTime? ClosedDate { get; set; }

    [Column("ClosedByID")]
    public int? ClosedById { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Inven_TakeOnSettings")]
public class InvenTakeOnSettings
{
    [Key]
    [Column("TakeOnSettings_ID")]
    public int TakeOnSettingsId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("AllowTakeOn")]
    public bool? AllowTakeOn { get; set; }

    [Column("TakeOnFinYear")]
    public string? TakeOnFinYear { get; set; }

    [Column("TakeOnDate")]
    public DateTime? TakeOnDate { get; set; }

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
}

[Table("Inven_UserStorePermission")]
public class UserStorePermission
{
    [Key]
    [Column("UserStorePermission_ID")]
    public int UserStorePermissionId { get; set; }

    [Column("UserID")]
    public int? UserId { get; set; }

    [Column("StoreID")]
    public int? StoreId { get; set; }

    [Column("CanCapture")]
    public bool? CanCapture { get; set; }

    [Column("CanApprove")]
    public bool? CanApprove { get; set; }

    [Column("CanView")]
    public bool? CanView { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_Inventory_Water_RouteName")]
public class WaterRouteName
{
    [Key]
    [Column("RouteName_ID")]
    public int RouteNameId { get; set; }

    [Column("RouteName")]
    public string? RouteName { get; set; }

    [Column("RouteDescription")]
    public string? RouteDescription { get; set; }

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
}

[Table("Const_Inventory_Water_Route")]
public class WaterRoute
{
    [Key]
    [Column("Route_ID")]
    public int RouteId { get; set; }

    [Column("RouteNameID")]
    public int? RouteNameId { get; set; }

    [Column("RouteCode")]
    public string? RouteCode { get; set; }

    [Column("StartNodeID")]
    public int? StartNodeId { get; set; }

    [Column("EndNodeID")]
    public int? EndNodeId { get; set; }

    [Column("DistanceKm")]
    public decimal? DistanceKm { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_Inventory_Water_RouteNode")]
public class WaterRouteNode
{
    [Key]
    [Column("RouteNode_ID")]
    public int RouteNodeId { get; set; }

    [Column("NodeName")]
    public string? NodeName { get; set; }

    [Column("NodeType")]
    public string? NodeType { get; set; }

    [Column("Latitude")]
    public decimal? Latitude { get; set; }

    [Column("Longitude")]
    public decimal? Longitude { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("const_Inventory_Reporting")]
public class InventoryReporting
{
    [Key]
    [Column("Reporting_ID")]
    public int ReportingId { get; set; }

    [Column("ReportName")]
    public string? ReportName { get; set; }

    [Column("ReportDescription")]
    public string? ReportDescription { get; set; }

    [Column("ReportCategory")]
    public string? ReportCategory { get; set; }

    [Column("IsActive")]
    public bool? IsActive { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}
