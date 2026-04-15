namespace PlatinumBudget.Api.Models;

public enum PostEmploymentType { Permanent, Temporary, Contract, Councillor }
public enum PostStatus { Filled, Vacant }
public enum PostPriorityStatus { NotRanked, Low, Medium, High, Critical }
public enum RemunerationType { Hourly, Monthly, Fixed }
public enum VariableBenefitType { Overtime, Standby, ShiftWork, Acting }
public enum CouncillorType { FullTime, PartTime }
public enum DeductionCalculationMethod { Percentage, FixedAmount, TaxTable, SlidingScale }
public enum DboBenefitType { PostRetirementMedical, LongServiceAward, PensionTopUp }
public enum HrBudgetStatus { Draft, Calculated, Submitted, Approved, Rejected, Returned }
public enum PayrollCostCategory { BasicSalary, Allowances, EmployerContributions, VariableBenefits, Travel, Provisions, CouncillorRemuneration, WardCommittee }
public enum TransportMode { OwnVehicle, CarHire, Flight, Bus, Other }
public enum TravelClassification { Local, Provincial, National }

public class PostEstablishment
{
    public int Id { get; set; }
    public string PostCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? JobLevel { get; set; }
    public int? SalaryGrade { get; set; }
    public int? SalaryNotch { get; set; }
    public PostEmploymentType EmploymentType { get; set; } = PostEmploymentType.Permanent;
    public PostStatus Status { get; set; } = PostStatus.Vacant;
    public bool IsFunded { get; set; }
    public bool IsActive { get; set; } = true;
    public string? FundingSource { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public decimal RankingScore { get; set; }
    public PostPriorityStatus PriorityStatus { get; set; } = PostPriorityStatus.NotRanked;
    public string? RecruitmentStrategy { get; set; }
    public string? JobDescription { get; set; }
    public string? BargainingUnit { get; set; }
    public string? EmployeeCategory { get; set; }
    public decimal AnnualSalary { get; set; }
    public decimal TotalCostToMunicipality { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string? ScoaCostingCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class SalaryStructure
{
    public int Id { get; set; }
    public int Grade { get; set; }
    public int Notch { get; set; }
    public decimal AnnualAmount { get; set; }
    public decimal? HourlyRate { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? BargainingUnit { get; set; }
    public string? EmployeeCategory { get; set; }
    public string? JobLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
}

public class SalaryIncrease
{
    public int Id { get; set; }
    public string? EmployeeCategory { get; set; }
    public string? BargainingUnit { get; set; }
    public string? PostLevel { get; set; }
    public decimal IncreasePercentage { get; set; }
    public DateTime EffectiveDate { get; set; }
    public int FinancialYearId { get; set; }
    public bool IsNotchProgression { get; set; }
    public bool IsLocked { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class TemporaryContract
{
    public int Id { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string? PostCode { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public DateTime ContractStartDate { get; set; }
    public DateTime ContractEndDate { get; set; }
    public RemunerationType RemunerationType { get; set; } = RemunerationType.Monthly;
    public decimal Rate { get; set; }
    public decimal CalculatedBudget { get; set; }
    public string? ContractStatus { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class CouncillorPosition
{
    public int Id { get; set; }
    public string PositionTitle { get; set; } = string.Empty;
    public CouncillorType CouncillorType { get; set; } = CouncillorType.FullTime;
    public int NumberOfPositions { get; set; } = 1;
    public decimal BasicSalary { get; set; }
    public decimal TravelAllowance { get; set; }
    public decimal CellphoneAllowance { get; set; }
    public decimal MedicalContribution { get; set; }
    public decimal OtherBenefits { get; set; }
    public decimal TotalRemuneration { get; set; }
    public decimal AnticipatedIncreasePercent { get; set; }
    public decimal AdjustedTotalRemuneration { get; set; }
    public decimal GazettedUpperLimit { get; set; }
    public bool ExceedsUpperLimit { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class WardCommitteeBudget
{
    public int Id { get; set; }
    public int WardNumber { get; set; }
    public string? WardName { get; set; }
    public string? Region { get; set; }
    public int NumberOfMembers { get; set; }
    public int NumberOfMeetings { get; set; }
    public decimal RatePerMeeting { get; set; }
    public decimal AnticipatedRateIncreasePercent { get; set; }
    public decimal AdjustedRatePerMeeting { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class VariableBenefitHours
{
    public int Id { get; set; }
    public string? Department { get; set; }
    public VariableBenefitType BenefitType { get; set; } = VariableBenefitType.Overtime;
    public decimal EstimatedHours { get; set; }
    public decimal AverageRate { get; set; }
    public decimal CalculatedCost { get; set; }
    public decimal? HistoricalHours { get; set; }
    public decimal? HistoricalCost { get; set; }
    public decimal? VariancePercent { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class TravelRequirement
{
    public int Id { get; set; }
    public string? Department { get; set; }
    public string? ProjectReference { get; set; }
    public string? Destination { get; set; }
    public string? PurposeOfTravel { get; set; }
    public int NumberOfOfficials { get; set; }
    public int NumberOfTrips { get; set; }
    public decimal EstimatedKilometres { get; set; }
    public int AccommodationNights { get; set; }
    public int TravelDuration { get; set; }
    public TransportMode TransportMode { get; set; } = TransportMode.OwnVehicle;
    public decimal EstimatedCost { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaProjectCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class TravelStandardRate
{
    public int Id { get; set; }
    public string RateType { get; set; } = string.Empty;
    public TravelClassification Classification { get; set; } = TravelClassification.Local;
    public string? EmployeeLevel { get; set; }
    public decimal RateAmount { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? PolicyReference { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
}

public class StatutoryDeduction
{
    public int Id { get; set; }
    public string DeductionType { get; set; } = string.Empty;
    public DeductionCalculationMethod CalculationMethod { get; set; } = DeductionCalculationMethod.Percentage;
    public decimal Rate { get; set; }
    public decimal? Threshold { get; set; }
    public decimal? EmployerContributionRate { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
}

public class PayrollLiability
{
    public int Id { get; set; }
    public string LiabilityType { get; set; } = string.Empty;
    public string? Department { get; set; }
    public decimal EmployeeContribution { get; set; }
    public decimal EmployerContribution { get; set; }
    public decimal TotalLiability { get; set; }
    public string? PaymentPeriod { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class DefinedBenefitObligation
{
    public int Id { get; set; }
    public DboBenefitType BenefitType { get; set; } = DboBenefitType.PostRetirementMedical;
    public string? Department { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal ServiceCost { get; set; }
    public decimal InterestCost { get; set; }
    public decimal BenefitPayments { get; set; }
    public decimal ActuarialGainLoss { get; set; }
    public decimal ClosingBalance { get; set; }
    public decimal CurrentPortion { get; set; }
    public decimal NonCurrentPortion { get; set; }
    public decimal DiscountRate { get; set; }
    public decimal InflationRate { get; set; }
    public decimal SalaryGrowthRate { get; set; }
    public decimal? MortalityRate { get; set; }
    public decimal? TurnoverRate { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class LongServiceAward
{
    public int Id { get; set; }
    public string? Department { get; set; }
    public int MilestoneYears { get; set; }
    public decimal BenefitAmount { get; set; }
    public int EligibleEmployees { get; set; }
    public decimal EstimatedPayments { get; set; }
    public decimal CurrentPortion { get; set; }
    public decimal NonCurrentPortion { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class PerformanceBonus
{
    public int Id { get; set; }
    public string? Department { get; set; }
    public string? EmployeeCategory { get; set; }
    public decimal BonusPercentage { get; set; }
    public int QualifyingEmployees { get; set; }
    public decimal AverageSalary { get; set; }
    public decimal EstimatedTotalCost { get; set; }
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class PayrollScenario
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal SalaryIncreasePercent { get; set; }
    public decimal VacancyFillingPercent { get; set; }
    public decimal BenefitAdjustmentPercent { get; set; }
    public decimal? OvertimeAdjustmentPercent { get; set; }
    public decimal? TravelAdjustmentPercent { get; set; }
    public decimal TotalBaselineCost { get; set; }
    public decimal TotalScenarioCost { get; set; }
    public decimal VarianceAmount { get; set; }
    public decimal VariancePercent { get; set; }
    public HrBudgetStatus Status { get; set; } = HrBudgetStatus.Draft;
    public int FinancialYearId { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class PayrollBudgetLine
{
    public int Id { get; set; }
    public string? Department { get; set; }
    public PayrollCostCategory CostCategory { get; set; } = PayrollCostCategory.BasicSalary;
    public string? SubCategory { get; set; }
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
    public HrBudgetStatus Status { get; set; } = HrBudgetStatus.Draft;
    public int FinancialYearId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string? ScoaCostingCode { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
}

public class HrPayrollBudgetApproval
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public ApprovalDecision Decision { get; set; } = ApprovalDecision.Submitted;
    public string? Comments { get; set; }
    public string ApprovedBy { get; set; } = "system";
    public DateTime ApprovedAt { get; set; } = DateTime.UtcNow;
}
