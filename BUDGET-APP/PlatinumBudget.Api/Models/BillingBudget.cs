namespace PlatinumBudget.Api.Models;

public class ServiceCategory
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ServiceType Type { get; set; }
    public string MeasurementUnit { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ICollection<Tariff> Tariffs { get; set; } = new List<Tariff>();
    public ICollection<RebateType> RebateTypes { get; set; } = new List<RebateType>();
    public ICollection<ConsumerCategoryService> ConsumerServices { get; set; } = new List<ConsumerCategoryService>();
}

public class Tariff
{
    public int Id { get; set; }
    public int ServiceCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PropertyCategory PropertyCategory { get; set; }
    public TariffType TariffType { get; set; }
    public decimal BasicCharge { get; set; }
    public decimal UnitRate { get; set; }
    public decimal? BlockStart { get; set; }
    public decimal? BlockEnd { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsApproved { get; set; }
    public int FinancialYearId { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public ServiceCategory ServiceCategory { get; set; } = null!;
    public FinancialYear FinancialYear { get; set; } = null!;
}

public class TariffScenario
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FinancialYearId { get; set; }
    public BillingApprovalStatus Status { get; set; } = BillingApprovalStatus.Draft;
    public decimal BaseIncreasePercentage { get; set; }
    public string? Justification { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
    public ICollection<TariffScenarioLine> Lines { get; set; } = new List<TariffScenarioLine>();
}

public class TariffScenarioLine
{
    public int Id { get; set; }
    public int TariffScenarioId { get; set; }
    public int ServiceCategoryId { get; set; }
    public int? BaseTariffId { get; set; }
    public decimal CurrentUnitRate { get; set; }
    public decimal CurrentBasicCharge { get; set; }
    public decimal ProjectedUnitRate { get; set; }
    public decimal ProjectedBasicCharge { get; set; }
    public decimal IncreasePercent { get; set; }
    public decimal CurrentRevenue { get; set; }
    public decimal ProjectedRevenue { get; set; }
    public decimal VarianceAmount { get; set; }
    public decimal VariancePercent { get; set; }
    public bool IsMaterialShift { get; set; }

    public TariffScenario Scenario { get; set; } = null!;
    public ServiceCategory ServiceCategory { get; set; } = null!;
    public Tariff? BaseTariff { get; set; }
}

public class ConsumerCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ConsumerType Type { get; set; }
    public int ConsumerCount { get; set; }
    public decimal AvgMonthlyConsumption { get; set; }
    public decimal? PropertyValueMin { get; set; }
    public decimal? PropertyValueMax { get; set; }
    public string? GeographicArea { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFlagged { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ICollection<ConsumerCategoryService> ConsumerServices { get; set; } = new List<ConsumerCategoryService>();
}

public class ConsumerCategoryService
{
    public int Id { get; set; }
    public int ConsumerCategoryId { get; set; }
    public int ServiceCategoryId { get; set; }
    public decimal AvgConsumption { get; set; }
    public int ConsumerCount { get; set; }

    public ConsumerCategory ConsumerCategory { get; set; } = null!;
    public ServiceCategory ServiceCategory { get; set; } = null!;
}

public class RevenueProjection
{
    public int Id { get; set; }
    public int FinancialYearId { get; set; }
    public int? BudgetVersionId { get; set; }
    public int ServiceCategoryId { get; set; }
    public int? ConsumerCategoryId { get; set; }
    public int? TariffScenarioId { get; set; }
    public int ConsumerCount { get; set; }
    public decimal AvgConsumption { get; set; }
    public decimal TariffRate { get; set; }
    public decimal GrossRevenue { get; set; }
    public decimal RebateAmount { get; set; }
    public decimal NetRevenue { get; set; }
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
    public BillingApprovalStatus Status { get; set; } = BillingApprovalStatus.Draft;
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
    public ServiceCategory ServiceCategory { get; set; } = null!;
    public ConsumerCategory? ConsumerCategory { get; set; }
    public TariffScenario? TariffScenario { get; set; }
    public ScoaItem? ScoaItem { get; set; }
    public ScoaFund? ScoaFund { get; set; }
    public ScoaFunction? ScoaFunction { get; set; }
    public ScoaRegion? ScoaRegion { get; set; }
    public ScoaCosting? ScoaCosting { get; set; }
}

public class RebateType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public RebateCategory Category { get; set; }
    public int? ServiceCategoryId { get; set; }
    public decimal RebatePercent { get; set; }
    public decimal? FixedAmount { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ServiceCategory? ServiceCategory { get; set; }
    public ICollection<RebateProjection> Projections { get; set; } = new List<RebateProjection>();
}

public class RebateProjection
{
    public int Id { get; set; }
    public int FinancialYearId { get; set; }
    public int RebateTypeId { get; set; }
    public int? ServiceCategoryId { get; set; }
    public int EligibleCount { get; set; }
    public decimal ProjectedUptakePercent { get; set; }
    public decimal TotalRebateAmount { get; set; }
    public decimal Year1Amount { get; set; }
    public decimal Year2Amount { get; set; }
    public decimal Year3Amount { get; set; }
    public BillingApprovalStatus Status { get; set; } = BillingApprovalStatus.Draft;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
    public RebateType RebateType { get; set; } = null!;
    public ServiceCategory? ServiceCategory { get; set; }
}

public class BillingBudgetApproval
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public BillingApprovalType ApprovalType { get; set; }
    public int Stage { get; set; } = 1;
    public ApprovalDecision Decision { get; set; }
    public string? Comment { get; set; }
    public string DecidedBy { get; set; } = string.Empty;
    public DateTime DecidedOn { get; set; } = DateTime.UtcNow;
}
