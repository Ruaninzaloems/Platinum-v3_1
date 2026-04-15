namespace PlatinumBudget.Api.DTOs;

public record ExpenditureCategoryDto(int Id, string Code, string Name, string Type, string? Department, string MeasurementUnit, bool IsActive, int CostItemCount);
public record CreateExpenditureCategoryDto(string Code, string Name, string Type, string? Department, string MeasurementUnit);

public record CostItemDto(int Id, int ExpenditureCategoryId, string ExpenditureCategoryName, string Name, string ItemType, decimal BasicCost, decimal UnitRate, string VatIndicator, decimal? BlockStart, decimal? BlockEnd, DateTime EffectiveFrom, DateTime? EffectiveTo, bool IsApproved, int FinancialYearId, string? SupplierName, string? SupplierVatNumber, string? ContractReference, bool IsVariabilityFlagged, string? VariabilityType);
public record CreateCostItemDto(int ExpenditureCategoryId, string Name, string ItemType, decimal BasicCost, decimal UnitRate, string VatIndicator, decimal? BlockStart, decimal? BlockEnd, DateTime EffectiveFrom, DateTime? EffectiveTo, int FinancialYearId, string? SupplierName, string? SupplierVatNumber, string? ContractReference, bool IsVariabilityFlagged, string? VariabilityType);
public record UpdateCostItemDto(string? Name, string? ItemType, decimal? BasicCost, decimal? UnitRate, string? VatIndicator, decimal? BlockStart, decimal? BlockEnd, DateTime? EffectiveFrom, DateTime? EffectiveTo, bool? IsApproved, string? SupplierName, string? ContractReference, bool? IsVariabilityFlagged, string? VariabilityType);

public record ExpenditureScenarioDto(int Id, string Name, string? Description, int FinancialYearId, string FinancialYear, string Status, decimal BaseInflationPercent, decimal? DemandAdjustmentPercent, string? Justification, string CreatedBy, DateTime CreatedOn, string? ApprovedBy, DateTime? ApprovedOn, List<ExpenditureScenarioLineDto> Lines);
public record ExpenditureScenarioSummaryDto(int Id, string Name, string Status, decimal BaseInflationPercent, decimal TotalCurrentExpenditure, decimal TotalProjectedExpenditure, decimal TotalVariance, int LineCount, DateTime CreatedOn);
public record CreateExpenditureScenarioDto(string Name, string? Description, int FinancialYearId, decimal BaseInflationPercent, decimal? DemandAdjustmentPercent, string? Justification, List<int>? ExpenditureCategoryIds);
public record ExpenditureScenarioLineDto(int Id, int ExpenditureCategoryId, string ExpenditureCategoryName, string ExpenditureCategoryType, int? BaseCostItemId, decimal CurrentUnitRate, decimal CurrentBasicCost, decimal ProjectedUnitRate, decimal ProjectedBasicCost, decimal InflationPercent, decimal DemandAdjustmentPercent, decimal CurrentExpenditure, decimal ProjectedExpenditure, decimal VarianceAmount, decimal VariancePercent, bool IsMaterialShift);

public record ExpenditureScenarioComparisonDto(List<ExpScenarioComparisonEntry> Scenarios, List<CategoryComparisonRow> CategoryComparisons);
public record ExpScenarioComparisonEntry(int Id, string Name, decimal BaseInflationPercent, decimal TotalCurrentExpenditure, decimal TotalProjectedExpenditure, decimal TotalVariance, decimal TotalVariancePercent);
public record CategoryComparisonRow(int ExpenditureCategoryId, string ExpenditureCategoryName, decimal CurrentExpenditure, List<ScenarioExpenditureEntry> ScenarioExpenditures);
public record ScenarioExpenditureEntry(int ScenarioId, string ScenarioName, decimal ProjectedExpenditure, decimal Variance, decimal VariancePercent);

public record CreditorCategoryDto(int Id, string Name, string Type, int PaymentTermDays, decimal? InterestRate, bool ChargesInterest, string? InterestCalculationMethod, bool IsActive, List<CreditorCategoryItemDto> Items);
public record CreateCreditorCategoryDto(string Name, string Type, int PaymentTermDays, decimal? InterestRate, bool ChargesInterest, string? InterestCalculationMethod);
public record CreditorCategoryItemDto(int Id, int CreditorCategoryId, int ExpenditureCategoryId, string ExpenditureCategoryName, decimal PaymentRate30Days, decimal PaymentRate60Days, decimal PaymentRate90Days, decimal PaymentRateOver90Days);
public record CreateCreditorCategoryItemDto(int CreditorCategoryId, int ExpenditureCategoryId, decimal PaymentRate30Days, decimal PaymentRate60Days, decimal PaymentRate90Days, decimal PaymentRateOver90Days);

public record ExpenditureProjectionDto(int Id, int FinancialYearId, int? BudgetVersionId, int ExpenditureCategoryId, string ExpenditureCategoryName, string ExpenditureCategoryType, int? CostItemId, string? CostItemName, int? ExpenditureScenarioId, decimal UnitRate, decimal BasicCost, decimal GrossExpenditure, decimal VatAmount, decimal NetExpenditure, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount, decimal Month01, decimal Month02, decimal Month03, decimal Month04, decimal Month05, decimal Month06, decimal Month07, decimal Month08, decimal Month09, decimal Month10, decimal Month11, decimal Month12, string Status, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode);
public record ExpenditureProjectionSummaryDto(decimal TotalGrossExpenditure, decimal TotalVatAmount, decimal TotalNetExpenditure, decimal Year1Total, decimal Year2Total, decimal Year3Total, List<ExpenditureByCategoryDto> ByCategory);
public record ExpenditureByCategoryDto(int ExpenditureCategoryId, string ExpenditureCategoryName, string ExpenditureCategoryType, decimal GrossExpenditure, decimal VatAmount, decimal NetExpenditure, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount);
public record CalculateExpenditureDto(int FinancialYearId, int? ExpenditureScenarioId, decimal GrowthRateY2, decimal GrowthRateY3);

public record CreditorLiabilityDto(int Id, int FinancialYearId, int ExpenditureCategoryId, string ExpenditureCategoryName, int? CreditorCategoryId, string? CreditorCategoryName, string LiabilityType, decimal OpeningBalance, decimal ProjectedExpenditure, decimal ProjectedPayments, decimal ClosingBalance, decimal PaymentRate, string? ContraBankAccount, bool IsPriorYearLiability, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount, string Status, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);
public record CreditorLiabilitySummaryDto(decimal TotalOpeningBalance, decimal TotalProjectedExpenditure, decimal TotalProjectedPayments, decimal TotalClosingBalance, decimal Year1Total, decimal Year2Total, decimal Year3Total, int LiabilityCount, List<CreditorLiabilityDto> Liabilities);

public record CreditorPaymentArrangementDto(int Id, string CreditorName, string ReferenceNumber, decimal TotalOutstanding, decimal InstalmentAmount, int PaymentIntervalDays, decimal RemainingBalance, decimal? InterestRate, string ArrangementStatus, DateTime StartDate, DateTime? EndDate, int? ExpenditureCategoryId, string? ExpenditureCategoryName);

public record ForecastAssumptionDto(int Id, string Name, string AssumptionType, int FinancialYearId, decimal Year1Value, decimal Year2Value, decimal Year3Value, string? Category, string? Justification, int Version, bool IsActive);
public record CreateForecastAssumptionDto(string Name, string AssumptionType, int FinancialYearId, decimal Year1Value, decimal Year2Value, decimal Year3Value, string? Category, string? Justification);
public record UpdateForecastAssumptionDto(string? Name, decimal? Year1Value, decimal? Year2Value, decimal? Year3Value, string? Category, string? Justification);

public record DraftExpenditureBudgetDto(decimal TotalGrossExpenditure, decimal TotalVat, decimal TotalNetExpenditure, decimal Year1Total, decimal Year2Total, decimal Year3Total, List<DraftExpenditureLineDto> Lines, int BudgetStringsGenerated);
public record DraftExpenditureLineDto(int ExpenditureCategoryId, string ExpenditureCategoryName, string ExpenditureCategoryType, string? ScoaItemCode, string? ScoaItemDescription, string? ScoaFundCode, string? ScoaFunctionCode, decimal GrossExpenditure, decimal Vat, decimal NetExpenditure, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount);

public record CreditorsIntegrationStatusDto(string Status, int ProjectionsApproved, int ProjectionsPending, int LiabilitiesApproved, int LiabilitiesPending, int BudgetStringsGenerated, DateTime? LastSyncOn);

public record AgeAnalysisDto(string Category, decimal Current, decimal ThirtyDay, decimal SixtyDay, decimal NinetyPlusDay, decimal Total);

public record SensitivityAnalysisDto(string ParameterName, decimal BaseValue, decimal LowValue, decimal HighValue, decimal BaseExpenditure, decimal LowExpenditure, decimal HighExpenditure, decimal Sensitivity);
