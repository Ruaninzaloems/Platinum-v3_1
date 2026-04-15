namespace PlatinumBudget.Api.DTOs;

public record PostEstablishmentResponseDto(int Id, string PostCode, string Title, string? Department, string? JobLevel, int? SalaryGrade, int? SalaryNotch, string EmploymentType, string Status, bool IsFunded, bool IsActive, string? FundingSource, DateTime? PlannedStartDate, decimal RankingScore, string PriorityStatus, string? RecruitmentStrategy, string? JobDescription, string? BargainingUnit, string? EmployeeCategory, decimal AnnualSalary, decimal TotalCostToMunicipality, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode, string CreatedBy, DateTime CreatedOn);
public record CreatePostEstablishmentDto(string PostCode, string Title, string? Department, string? JobLevel, int? SalaryGrade, int? SalaryNotch, string EmploymentType, string? FundingSource, DateTime? PlannedStartDate, string? RecruitmentStrategy, string? JobDescription, string? BargainingUnit, string? EmployeeCategory, bool IsFunded, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode);
public record UpdatePostEstablishmentDto(string? Title, string? Department, string? JobLevel, int? SalaryGrade, int? SalaryNotch, string? EmploymentType, string? Status, bool? IsFunded, bool? IsActive, string? FundingSource, DateTime? PlannedStartDate, decimal? RankingScore, string? PriorityStatus, string? RecruitmentStrategy, string? JobDescription, string? BargainingUnit, string? EmployeeCategory, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode);

public record SalaryStructureDto(int Id, int Grade, int Notch, decimal AnnualAmount, decimal? HourlyRate, DateTime EffectiveDate, string? BargainingUnit, string? EmployeeCategory, string? JobLevel, bool IsActive);
public record CreateSalaryStructureDto(int Grade, int Notch, decimal AnnualAmount, decimal? HourlyRate, DateTime EffectiveDate, string? BargainingUnit, string? EmployeeCategory, string? JobLevel);

public record SalaryIncreaseDto(int Id, string? EmployeeCategory, string? BargainingUnit, string? PostLevel, decimal IncreasePercentage, DateTime EffectiveDate, int FinancialYearId, bool IsNotchProgression, bool IsLocked, string? ApprovedBy, DateTime? ApprovedOn);
public record CreateSalaryIncreaseDto(string? EmployeeCategory, string? BargainingUnit, string? PostLevel, decimal IncreasePercentage, DateTime EffectiveDate, int FinancialYearId, bool IsNotchProgression);

public record TemporaryContractDto(int Id, string EmployeeName, string? PostCode, string? Department, string? JobTitle, DateTime ContractStartDate, DateTime ContractEndDate, string RemunerationType, decimal Rate, decimal CalculatedBudget, string? ContractStatus, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);
public record CreateTemporaryContractDto(string EmployeeName, string? PostCode, string? Department, string? JobTitle, DateTime ContractStartDate, DateTime ContractEndDate, string RemunerationType, decimal Rate, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);

public record CouncillorPositionDto(int Id, string PositionTitle, string CouncillorType, int NumberOfPositions, decimal BasicSalary, decimal TravelAllowance, decimal CellphoneAllowance, decimal MedicalContribution, decimal OtherBenefits, decimal TotalRemuneration, decimal AnticipatedIncreasePercent, decimal AdjustedTotalRemuneration, decimal GazettedUpperLimit, bool ExceedsUpperLimit, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);
public record CreateCouncillorPositionDto(string PositionTitle, string CouncillorType, int NumberOfPositions, decimal BasicSalary, decimal TravelAllowance, decimal CellphoneAllowance, decimal MedicalContribution, decimal OtherBenefits, decimal AnticipatedIncreasePercent, decimal GazettedUpperLimit, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);

public record WardCommitteeBudgetDto(int Id, int WardNumber, string? WardName, string? Region, int NumberOfMembers, int NumberOfMeetings, decimal RatePerMeeting, decimal AnticipatedRateIncreasePercent, decimal AdjustedRatePerMeeting, decimal TotalEstimatedCost, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);
public record CreateWardCommitteeBudgetDto(int WardNumber, string? WardName, string? Region, int NumberOfMembers, int NumberOfMeetings, decimal RatePerMeeting, decimal AnticipatedRateIncreasePercent, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);

public record VariableBenefitHoursDto(int Id, string? Department, string BenefitType, decimal EstimatedHours, decimal AverageRate, decimal CalculatedCost, decimal? HistoricalHours, decimal? HistoricalCost, decimal? VariancePercent, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);
public record CreateVariableBenefitHoursDto(string? Department, string BenefitType, decimal EstimatedHours, decimal AverageRate, decimal? HistoricalHours, decimal? HistoricalCost, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);

public record TravelRequirementDto(int Id, string? Department, string? ProjectReference, string? Destination, string? PurposeOfTravel, int NumberOfOfficials, int NumberOfTrips, decimal EstimatedKilometres, int AccommodationNights, int TravelDuration, string TransportMode, decimal EstimatedCost, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaProjectCode, string? ScoaRegionCode);
public record CreateTravelRequirementDto(string? Department, string? ProjectReference, string? Destination, string? PurposeOfTravel, int NumberOfOfficials, int NumberOfTrips, decimal EstimatedKilometres, int AccommodationNights, int TravelDuration, string TransportMode, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaProjectCode, string? ScoaRegionCode);

public record TravelStandardRateDto(int Id, string RateType, string Classification, string? EmployeeLevel, decimal RateAmount, DateTime EffectiveDate, string? PolicyReference, bool IsActive);
public record CreateTravelStandardRateDto(string RateType, string Classification, string? EmployeeLevel, decimal RateAmount, DateTime EffectiveDate, string? PolicyReference);

public record StatutoryDeductionDto(int Id, string DeductionType, string CalculationMethod, decimal Rate, decimal? Threshold, decimal? EmployerContributionRate, string? Description, bool IsActive);
public record CreateStatutoryDeductionDto(string DeductionType, string CalculationMethod, decimal Rate, decimal? Threshold, decimal? EmployerContributionRate, string? Description);

public record PayrollLiabilityDto(int Id, string LiabilityType, string? Department, decimal EmployeeContribution, decimal EmployerContribution, decimal TotalLiability, string? PaymentPeriod, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);
public record CreatePayrollLiabilityDto(string LiabilityType, string? Department, decimal EmployeeContribution, decimal EmployerContribution, string? PaymentPeriod, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);

public record DefinedBenefitObligationDto(int Id, string BenefitType, string? Department, decimal OpeningBalance, decimal ServiceCost, decimal InterestCost, decimal BenefitPayments, decimal ActuarialGainLoss, decimal ClosingBalance, decimal CurrentPortion, decimal NonCurrentPortion, decimal DiscountRate, decimal InflationRate, decimal SalaryGrowthRate, decimal? MortalityRate, decimal? TurnoverRate, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);
public record CreateDefinedBenefitObligationDto(string BenefitType, string? Department, decimal OpeningBalance, decimal ServiceCost, decimal InterestCost, decimal BenefitPayments, decimal ActuarialGainLoss, decimal DiscountRate, decimal InflationRate, decimal SalaryGrowthRate, decimal? MortalityRate, decimal? TurnoverRate, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode);
public record UpdateDefinedBenefitObligationDto(decimal? OpeningBalance, decimal? ServiceCost, decimal? InterestCost, decimal? BenefitPayments, decimal? ActuarialGainLoss, decimal? DiscountRate, decimal? InflationRate, decimal? SalaryGrowthRate, decimal? MortalityRate, decimal? TurnoverRate);

public record LongServiceAwardDto(int Id, string? Department, int MilestoneYears, decimal BenefitAmount, int EligibleEmployees, decimal EstimatedPayments, decimal CurrentPortion, decimal NonCurrentPortion, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);
public record CreateLongServiceAwardDto(string? Department, int MilestoneYears, decimal BenefitAmount, int EligibleEmployees, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);

public record PerformanceBonusDto(int Id, string? Department, string? EmployeeCategory, decimal BonusPercentage, int QualifyingEmployees, decimal AverageSalary, decimal EstimatedTotalCost, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);
public record CreatePerformanceBonusDto(string? Department, string? EmployeeCategory, decimal BonusPercentage, int QualifyingEmployees, decimal AverageSalary, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode);

public record PayrollScenarioDto(int Id, string Name, string? Description, decimal SalaryIncreasePercent, decimal VacancyFillingPercent, decimal BenefitAdjustmentPercent, decimal? OvertimeAdjustmentPercent, decimal? TravelAdjustmentPercent, decimal TotalBaselineCost, decimal TotalScenarioCost, decimal VarianceAmount, decimal VariancePercent, string Status, int FinancialYearId, string CreatedBy, DateTime CreatedOn, string? ApprovedBy, DateTime? ApprovedOn);
public record CreatePayrollScenarioDto(string Name, string? Description, decimal SalaryIncreasePercent, decimal VacancyFillingPercent, decimal BenefitAdjustmentPercent, decimal? OvertimeAdjustmentPercent, decimal? TravelAdjustmentPercent, int FinancialYearId);

public record PayrollBudgetLineDto(int Id, string? Department, string CostCategory, string? SubCategory, decimal Year1Amount, decimal Year2Amount, decimal Year3Amount, decimal Month01, decimal Month02, decimal Month03, decimal Month04, decimal Month05, decimal Month06, decimal Month07, decimal Month08, decimal Month09, decimal Month10, decimal Month11, decimal Month12, string Status, int FinancialYearId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode);

public record PayrollBudgetSummaryDto(decimal TotalFixedCosts, decimal TotalVariableCosts, decimal TotalCouncillorCosts, decimal TotalWardCommitteeCosts, decimal TotalPayrollBudget, decimal Year1Total, decimal Year2Total, decimal Year3Total, int TotalPosts, int FilledPosts, int VacantPosts, int FundedVacancies, List<PayrollBudgetLineDto> Lines);

public record PostEstablishmentSummaryDto(int TotalPosts, int FilledPosts, int VacantPosts, int FundedVacancies, int UnfundedVacancies, decimal TotalPostBudget, decimal FilledPostBudget, decimal VacantPostBudget, List<PostEstablishmentResponseDto> Posts, List<DepartmentPostSummaryDto> ByDepartment);

public record DepartmentPostSummaryDto(string Department, int TotalPosts, int FilledPosts, int VacantPosts, int FundedVacancies, decimal TotalCost);

public record DboSummaryDto(decimal TotalDbo, decimal TotalCurrentPortion, decimal TotalNonCurrentPortion, decimal TotalLongServiceAwards, decimal TotalEstimatedPayments, decimal TotalServiceCost, decimal TotalInterestCost, decimal TotalActuarialGainLoss, List<DefinedBenefitObligationDto> Obligations, List<LongServiceAwardDto> LongServiceAwards);

public record CalculatePayrollBudgetDto(int FinancialYearId, decimal GrowthRateY2, decimal GrowthRateY3);
public record CalculateSalaryIncreaseDto(int FinancialYearId, string? EmployeeCategory, string? BargainingUnit, decimal IncreasePercentage);
public record CalculateNotchProgressionDto(int FinancialYearId, string? BargainingUnit);
public record CalculateDeductionsDto(int FinancialYearId, decimal TotalRemuneration);
public record CalculateDboDto(int FinancialYearId, decimal DiscountRate, decimal InflationRate, decimal SalaryGrowthRate);
public record CalculateCouncillorBudgetDto(int FinancialYearId, decimal AnticipatedIncreasePercent);
public record CalculateWardBudgetDto(int FinancialYearId, decimal AnticipatedRateIncreasePercent);
public record CalculateVariableBenefitsDto(int FinancialYearId);
public record CalculateTravelBudgetDto(int FinancialYearId);
public record CalculateBonusBudgetDto(int FinancialYearId);
public record CalculateLiabilitiesDto(int FinancialYearId);
public record CalculateLsaPaymentsDto(int FinancialYearId);

public record AmendBudgetDto(int FinancialYearId, string? Department, string? CostCategory, decimal AdjustmentAmount, string? Reason);
public record AmendDboEstimatesDto(int FinancialYearId, string BenefitType, decimal? ServiceCost, decimal? InterestCost, decimal? BenefitPayments, decimal? ActuarialGainLoss, string? Reason);
public record AmendMscoaLinkageDto(int EntityId, string EntityType, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string? ScoaRegionCode, string? ScoaCostingCode);
public record AmendVariableHoursDto(int Id, decimal EstimatedHours, decimal AverageRate, string? Reason);
public record AmendPaymentPercentagesDto(int FinancialYearId, string? Department, decimal Month01, decimal Month02, decimal Month03, decimal Month04, decimal Month05, decimal Month06, decimal Month07, decimal Month08, decimal Month09, decimal Month10, decimal Month11, decimal Month12);

public record PayrollScenarioComparisonDto(List<PayrollScenarioDto> Scenarios, decimal BaselineTotalCost, List<ScenarioCostBreakdownDto> CostBreakdowns);
public record ScenarioCostBreakdownDto(int ScenarioId, string ScenarioName, decimal BasicSalary, decimal Allowances, decimal EmployerContributions, decimal VariableBenefits, decimal Travel, decimal Provisions, decimal CouncillorRemuneration, decimal WardCommittee, decimal TotalCost, decimal VarianceFromBaseline, decimal VariancePercent);

public record HrPayrollBudgetApprovalDto(int Id, string EntityType, int EntityId, string Decision, string? Comments, string ApprovedBy, DateTime ApprovedAt);
public record CreateHrPayrollBudgetApprovalDto(string EntityType, int EntityId, string Decision, string? Comments);

public record FlagActivePostsDto(int FinancialYearId, List<int> PostIds);
public record RankVacantPostsDto(int FinancialYearId, List<VacantPostRankingDto> Rankings);
public record VacantPostRankingDto(int PostId, decimal RankingScore, string PriorityStatus, string? RecruitmentStrategy, DateTime? PlannedStartDate);

public record PayeCalculationResultDto(decimal TaxableIncome, decimal CalculatedPaye, decimal EffectiveRate, string TaxBracket);
public record UifCalculationResultDto(decimal EmployeeContribution, decimal EmployerContribution, decimal TotalUif, decimal Threshold);
public record SdlCalculationResultDto(decimal TotalRemuneration, decimal SdlAmount, decimal Rate);
public record AllDeductionsResultDto(PayeCalculationResultDto Paye, UifCalculationResultDto Uif, SdlCalculationResultDto Sdl, decimal TotalEmployeeDeductions, decimal TotalEmployerContributions, decimal TotalDeductions);

public record MscoaValidationResultDto(int TotalStrings, int ValidStrings, int WarningStrings, int ErrorStrings, List<MscoaValidationItemDto> Items);
public record MscoaValidationItemDto(string EntityType, int EntityId, string? ScoaItemCode, string? ScoaFundCode, string? ScoaFunctionCode, string ValidationStatus, string? ValidationMessage);
