namespace PlatinumBudget.Api.DTOs;

public record ServiceCategoryDto(int Id, string Code, string Name, string Type, string MeasurementUnit, bool IsActive, int TariffCount);
public record CreateServiceCategoryDto(string Code, string Name, string Type, string MeasurementUnit);

public record TariffDto(int Id, int ServiceCategoryId, string ServiceCategoryName, string Name, string PropertyCategory, string TariffType, decimal BasicCharge, decimal UnitRate, decimal? BlockStart, decimal? BlockEnd, DateTime EffectiveFrom, DateTime? EffectiveTo, bool IsApproved, int FinancialYearId);
public record CreateTariffDto(int ServiceCategoryId, string Name, string PropertyCategory, string TariffType, decimal BasicCharge, decimal UnitRate, decimal? BlockStart, decimal? BlockEnd, DateTime EffectiveFrom, DateTime? EffectiveTo, int FinancialYearId);
public record UpdateTariffDto(string? Name, string? PropertyCategory, string? TariffType, decimal? BasicCharge, decimal? UnitRate, decimal? BlockStart, decimal? BlockEnd, DateTime? EffectiveFrom, DateTime? EffectiveTo, bool? IsApproved);

public record TariffScenarioDto(int Id, string Name, string? Description, int FinancialYearId, string FinancialYear, string Status, decimal BaseIncreasePercentage, string? Justification, string CreatedBy, DateTime CreatedOn, string? ApprovedBy, DateTime? ApprovedOn, List<TariffScenarioLineDto> Lines);
public record TariffScenarioSummaryDto(int Id, string Name, string Status, decimal BaseIncreasePercentage, decimal TotalCurrentRevenue, decimal TotalProjectedRevenue, decimal TotalVariance, int LineCount, DateTime CreatedOn);
public record CreateTariffScenarioDto(string Name, string? Description, int FinancialYearId, decimal BaseIncreasePercentage, string? Justification, List<int>? ServiceCategoryIds);
public record UpdateTariffScenarioDto(string? Name, string? Description, decimal? BaseIncreasePercentage, string? Justification);
public record UpdateScenarioLineDto(int Id, decimal ProjectedUnitRate, decimal ProjectedBasicCharge);

public record TariffScenarioLineDto(int Id, int ServiceCategoryId, string ServiceCategoryName, string ServiceType, int? BaseTariffId, decimal CurrentUnitRate, decimal CurrentBasicCharge, decimal ProjectedUnitRate, decimal ProjectedBasicCharge, decimal IncreasePercent, decimal CurrentRevenue, decimal ProjectedRevenue, decimal VarianceAmount, decimal VariancePercent, bool IsMaterialShift);

public record ScenarioComparisonDto(List<ScenarioComparisonEntry> Scenarios, List<ServiceComparisonRow> ServiceComparisons);
public record ScenarioComparisonEntry(int Id, string Name, decimal BaseIncreasePercentage, decimal TotalCurrentRevenue, decimal TotalProjectedRevenue, decimal TotalVariance, decimal TotalVariancePercent);
public record ServiceComparisonRow(int ServiceCategoryId, string ServiceCategoryName, decimal CurrentRevenue, List<ScenarioRevenueEntry> ScenarioRevenues);
public record ScenarioRevenueEntry(int ScenarioId, string ScenarioName, decimal ProjectedRevenue, decimal Variance, decimal VariancePercent);

public record ConsumerCategoryDto(int Id, string Name, string Type, int ConsumerCount, decimal AvgMonthlyConsumption, decimal? PropertyValueMin, decimal? PropertyValueMax, string? GeographicArea, bool IsActive, bool IsFlagged, List<ConsumerServiceDto> Services);
public record CreateConsumerCategoryDto(string Name, string Type, int ConsumerCount, decimal AvgMonthlyConsumption, decimal? PropertyValueMin, decimal? PropertyValueMax, string? GeographicArea, bool IsFlagged, List<CreateConsumerServiceDto>? Services);
public record UpdateConsumerCategoryDto(string? Name, string? Type, int? ConsumerCount, decimal? AvgMonthlyConsumption, decimal? PropertyValueMin, decimal? PropertyValueMax, string? GeographicArea, bool? IsFlagged);
public record ConsumerServiceDto(int Id, int ServiceCategoryId, string ServiceCategoryName, decimal AvgConsumption, int ConsumerCount);
public record CreateConsumerServiceDto(int ServiceCategoryId, decimal AvgConsumption, int ConsumerCount);

public record ProjectedBillDto(int ConsumerCategoryId, string ConsumerCategoryName, string ConsumerType, List<ProjectedBillLineDto> BillLines, decimal TotalCurrentBill, decimal TotalProjectedBill, decimal TotalRebate, decimal NetBill);
public record ProjectedBillLineDto(int ServiceCategoryId, string ServiceCategoryName, decimal CurrentRate, decimal ProjectedRate, decimal Consumption, decimal CurrentAmount, decimal ProjectedAmount, decimal RebateAmount, decimal NetAmount);

public record RevenueProjectionDto(int Id, int FinancialYearId, int? BudgetVersionId, int ServiceCategoryId, string ServiceCategoryName, string ServiceType, int? ConsumerCategoryId, string? ConsumerCategoryName, int? TariffScenarioId, int ConsumerCount, decimal AvgConsumption, decimal TariffRate, decimal GrossRevenue, decimal RebateAmount, decimal NetRevenue, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount, decimal Month01, decimal Month02, decimal Month03, decimal Month04, decimal Month05, decimal Month06, decimal Month07, decimal Month08, decimal Month09, decimal Month10, decimal Month11, decimal Month12, string Status, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode);
public record RevenueProjectionSummaryDto(decimal TotalGrossRevenue, decimal TotalRebateAmount, decimal TotalNetRevenue, decimal Year1Total, decimal Year2Total, decimal Year3Total, List<RevenueByServiceDto> ByService);
public record RevenueByServiceDto(int ServiceCategoryId, string ServiceCategoryName, string ServiceType, decimal GrossRevenue, decimal RebateAmount, decimal NetRevenue, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount);
public record CalculateRevenueDto(int FinancialYearId, int? TariffScenarioId, decimal GrowthRateY2, decimal GrowthRateY3);

public record RebateTypeDto(int Id, string Name, string Category, int? ServiceCategoryId, string? ServiceCategoryName, decimal RebatePercent, decimal? FixedAmount, bool IsActive);
public record CreateRebateTypeDto(string Name, string Category, int? ServiceCategoryId, decimal RebatePercent, decimal? FixedAmount);

public record RebateProjectionDto(int Id, int FinancialYearId, int RebateTypeId, string RebateTypeName, string RebateCategory, int? ServiceCategoryId, string? ServiceCategoryName, int EligibleCount, decimal ProjectedUptakePercent, decimal TotalRebateAmount, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount, string Status);
public record CalculateRebateDto(int FinancialYearId, decimal GrowthRateY2, decimal GrowthRateY3);

public record DraftRevenueBudgetDto(decimal TotalGrossRevenue, decimal TotalRebates, decimal TotalNetRevenue, decimal Year1Total, decimal Year2Total, decimal Year3Total, List<DraftRevenueLineDto> Lines, int BudgetStringsGenerated);
public record DraftRevenueLineDto(int ServiceCategoryId, string ServiceCategoryName, string ServiceType, string? ScoaItemCode, string? ScoaItemDescription, string? ScoaFundCode, string? ScoaFunctionCode, decimal GrossRevenue, decimal Rebates, decimal NetRevenue, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount);

public record GenerateBudgetStringsDto(int BudgetVersionId, int FinancialYearId);
public record GenerateBudgetStringsResultDto(int StringsGenerated, int StringsUpdated, List<string> Warnings);
public record BillingIntegrationStatusDto(string Status, int ProjectionsApproved, int ProjectionsPending, int RebatesApproved, int RebatesPending, int BudgetStringsGenerated, DateTime? LastSyncOn);
