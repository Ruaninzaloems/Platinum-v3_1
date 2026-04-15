namespace PlatinumBudget.Api.Models;

public class ExpenditureCategory
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ExpenditureCategoryType Type { get; set; }
    public string? Department { get; set; }
    public string MeasurementUnit { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ICollection<CostItem> CostItems { get; set; } = new List<CostItem>();
    public ICollection<CreditorCategoryItem> CreditorItems { get; set; } = new List<CreditorCategoryItem>();
}

public class CostItem
{
    public int Id { get; set; }
    public int ExpenditureCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public CostItemType ItemType { get; set; }
    public decimal BasicCost { get; set; }
    public decimal UnitRate { get; set; }
    public VatIndicator VatIndicator { get; set; } = VatIndicator.StandardRated;
    public decimal? BlockStart { get; set; }
    public decimal? BlockEnd { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsApproved { get; set; }
    public int FinancialYearId { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierVatNumber { get; set; }
    public string? ContractReference { get; set; }
    public bool IsVariabilityFlagged { get; set; }
    public string? VariabilityType { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public ExpenditureCategory ExpenditureCategory { get; set; } = null!;
    public FinancialYear FinancialYear { get; set; } = null!;
}

public class ExpenditureScenario
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FinancialYearId { get; set; }
    public CreditorApprovalStatus Status { get; set; } = CreditorApprovalStatus.Draft;
    public decimal BaseInflationPercent { get; set; }
    public decimal? DemandAdjustmentPercent { get; set; }
    public string? Justification { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
    public ICollection<ExpenditureScenarioLine> Lines { get; set; } = new List<ExpenditureScenarioLine>();
}

public class ExpenditureScenarioLine
{
    public int Id { get; set; }
    public int ExpenditureScenarioId { get; set; }
    public int ExpenditureCategoryId { get; set; }
    public int? BaseCostItemId { get; set; }
    public decimal CurrentUnitRate { get; set; }
    public decimal CurrentBasicCost { get; set; }
    public decimal ProjectedUnitRate { get; set; }
    public decimal ProjectedBasicCost { get; set; }
    public decimal InflationPercent { get; set; }
    public decimal DemandAdjustmentPercent { get; set; }
    public decimal CurrentExpenditure { get; set; }
    public decimal ProjectedExpenditure { get; set; }
    public decimal VarianceAmount { get; set; }
    public decimal VariancePercent { get; set; }
    public bool IsMaterialShift { get; set; }

    public ExpenditureScenario Scenario { get; set; } = null!;
    public ExpenditureCategory ExpenditureCategory { get; set; } = null!;
    public CostItem? BaseCostItem { get; set; }
}

public class CreditorCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public CreditorCategoryType Type { get; set; }
    public int PaymentTermDays { get; set; }
    public decimal? InterestRate { get; set; }
    public bool ChargesInterest { get; set; }
    public string? InterestCalculationMethod { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ICollection<CreditorCategoryItem> CreditorItems { get; set; } = new List<CreditorCategoryItem>();
}

public class CreditorCategoryItem
{
    public int Id { get; set; }
    public int CreditorCategoryId { get; set; }
    public int ExpenditureCategoryId { get; set; }
    public decimal PaymentRate30Days { get; set; }
    public decimal PaymentRate60Days { get; set; }
    public decimal PaymentRate90Days { get; set; }
    public decimal PaymentRateOver90Days { get; set; }

    public CreditorCategory CreditorCategory { get; set; } = null!;
    public ExpenditureCategory ExpenditureCategory { get; set; } = null!;
}

public class ExpenditureProjection
{
    public int Id { get; set; }
    public int FinancialYearId { get; set; }
    public int? BudgetVersionId { get; set; }
    public int ExpenditureCategoryId { get; set; }
    public int? CostItemId { get; set; }
    public int? ExpenditureScenarioId { get; set; }
    public decimal UnitRate { get; set; }
    public decimal BasicCost { get; set; }
    public decimal GrossExpenditure { get; set; }
    public decimal VatAmount { get; set; }
    public decimal NetExpenditure { get; set; }
    public decimal Year1Amount { get; set; }
    public decimal Year2Amount { get; set; }
    public decimal Year3Amount { get; set; }
    public decimal Month01 { get; set; }
    public decimal Month02 { get; set; }
    public decimal Month03 { get; set; }
    public decimal Month04 { get; set; }
    public decimal Month05 { get; set; }
    public decimal Month06 { get; set; }
    public decimal Month07 { get; set; }
    public decimal Month08 { get; set; }
    public decimal Month09 { get; set; }
    public decimal Month10 { get; set; }
    public decimal Month11 { get; set; }
    public decimal Month12 { get; set; }
    public CreditorApprovalStatus Status { get; set; } = CreditorApprovalStatus.Draft;
    public int? ScoaItemId { get; set; }
    public int? ScoaFundId { get; set; }
    public int? ScoaFunctionId { get; set; }
    public int? ScoaRegionId { get; set; }
    public int? ScoaCostingId { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
    public BudgetVersion? BudgetVersion { get; set; }
    public ExpenditureCategory ExpenditureCategory { get; set; } = null!;
    public CostItem? CostItem { get; set; }
    public ExpenditureScenario? ExpenditureScenario { get; set; }
    public ScoaItem? ScoaItem { get; set; }
    public ScoaFund? ScoaFund { get; set; }
    public ScoaFunction? ScoaFunction { get; set; }
    public ScoaRegion? ScoaRegion { get; set; }
    public ScoaCosting? ScoaCosting { get; set; }
}

public class CreditorLiability
{
    public int Id { get; set; }
    public int FinancialYearId { get; set; }
    public int ExpenditureCategoryId { get; set; }
    public int? CreditorCategoryId { get; set; }
    public string LiabilityType { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; }
    public decimal ProjectedExpenditure { get; set; }
    public decimal ProjectedPayments { get; set; }
    public decimal ClosingBalance { get; set; }
    public decimal PaymentRate { get; set; }
    public string? ContraBankAccount { get; set; }
    public bool IsPriorYearLiability { get; set; }
    public decimal Year1Amount { get; set; }
    public decimal Year2Amount { get; set; }
    public decimal Year3Amount { get; set; }
    public int? ScoaItemId { get; set; }
    public int? ScoaFundId { get; set; }
    public int? ScoaFunctionId { get; set; }
    public int? ScoaRegionId { get; set; }
    public CreditorApprovalStatus Status { get; set; } = CreditorApprovalStatus.Draft;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
    public ExpenditureCategory ExpenditureCategory { get; set; } = null!;
    public CreditorCategory? CreditorCategory { get; set; }
    public ScoaItem? ScoaItem { get; set; }
    public ScoaFund? ScoaFund { get; set; }
    public ScoaFunction? ScoaFunction { get; set; }
    public ScoaRegion? ScoaRegion { get; set; }
}

public class CreditorPaymentArrangement
{
    public int Id { get; set; }
    public string CreditorName { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public decimal TotalOutstanding { get; set; }
    public decimal InstalmentAmount { get; set; }
    public int PaymentIntervalDays { get; set; }
    public decimal RemainingBalance { get; set; }
    public decimal? InterestRate { get; set; }
    public PaymentArrangementStatus ArrangementStatus { get; set; } = PaymentArrangementStatus.Active;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? ExpenditureCategoryId { get; set; }
    public int? ScoaItemId { get; set; }
    public int? ScoaFunctionId { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ExpenditureCategory? ExpenditureCategory { get; set; }
    public ScoaItem? ScoaItem { get; set; }
    public ScoaFunction? ScoaFunction { get; set; }
}

public class ForecastAssumption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ForecastAssumptionType AssumptionType { get; set; }
    public int FinancialYearId { get; set; }
    public decimal Year1Value { get; set; }
    public decimal Year2Value { get; set; }
    public decimal Year3Value { get; set; }
    public string? Category { get; set; }
    public string? Justification { get; set; }
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class CreditorsBudgetApproval
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public CreditorApprovalType ApprovalType { get; set; }
    public int Stage { get; set; } = 1;
    public ApprovalDecision Decision { get; set; }
    public string? Comment { get; set; }
    public string DecidedBy { get; set; } = string.Empty;
    public DateTime DecidedOn { get; set; } = DateTime.UtcNow;
}

public enum ExpenditureCategoryType
{
    EmployeeCosts,
    BulkPurchases,
    ContractedServices,
    GeneralExpenses,
    RepairsAndMaintenance,
    OtherExpenditure
}

public enum CostItemType
{
    Recurring,
    Contracted,
    Estimated,
    OneOff
}

public enum VatIndicator
{
    StandardRated,
    ZeroRated,
    Exempt,
    OutOfScope
}

public enum CreditorCategoryType
{
    Current,
    ThirtyDay,
    SixtyDay,
    NinetyPlusDay
}

public enum CreditorApprovalStatus
{
    Draft,
    Submitted,
    Approved,
    Rejected
}

public enum CreditorApprovalType
{
    Submit,
    Approve,
    Reject,
    Return
}

public enum PaymentArrangementStatus
{
    Active,
    Completed,
    Overdue,
    Restructured
}

public enum ForecastAssumptionType
{
    CPI,
    PPI,
    WageIncrease,
    BulkElectricity,
    BulkWater,
    FuelCost,
    ExchangeRate,
    Custom
}
