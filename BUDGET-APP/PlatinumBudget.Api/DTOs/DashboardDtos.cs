namespace PlatinumBudget.Api.DTOs;

public record CfoDashboardDto(
    decimal TotalBudgetYear1,
    decimal TotalRevenueYear1,
    decimal TotalExpenditureYear1,
    decimal TotalCapitalYear1,
    decimal OperatingBudgetYear1,
    int UnfundedMandateCount,
    decimal BurnRatePercentage,
    int ActiveVersions,
    int PendingApprovals,
    int ValidationErrors,
    List<DepartmentBudgetDto> ByDepartment,
    List<FunctionBudgetDto> ByFunction,
    List<MonthlyTrendDto> MonthlyTrend,
    List<VersionStatusDto> VersionStatuses
);

public record DepartmentBudgetDto(
    string Department,
    decimal Revenue,
    decimal Expenditure,
    decimal Capital
);

public record FunctionBudgetDto(
    string Function,
    decimal Year1,
    decimal Year2,
    decimal Year3
);

public record MonthlyTrendDto(
    string Month,
    decimal Budget,
    decimal Actual
);

public record VersionStatusDto(
    int Id,
    string Name,
    string Type,
    string Status,
    DateTime CreatedOn,
    int StringCount
);

public record ValidationDashboardDto(
    int TotalRuns,
    int TotalStringsValidated,
    int PassCount,
    int WarningCount,
    int ErrorCount,
    decimal PassPercentage,
    List<RuleFailureDto> TopFailures,
    List<ValidationTrendDto> RecentRuns
);

public record RuleFailureDto(
    string RuleCode,
    string Description,
    int Count,
    string Severity
);

public record ValidationTrendDto(
    Guid RunId,
    DateTime Timestamp,
    int Passed,
    int Warnings,
    int Errors
);

public record BudgetOverviewDto(
    int VersionId,
    string VersionName,
    string VersionType,
    string Status,
    decimal TotalRevenue,
    decimal TotalExpenditure,
    decimal TotalCapital,
    decimal NetSurplusDeficit,
    decimal Year1Total,
    decimal Year2Total,
    decimal Year3Total,
    List<SegmentBreakdownDto> ByItem,
    List<SegmentBreakdownDto> ByFund
);

public record SegmentBreakdownDto(
    string Code,
    string Description,
    decimal Year1,
    decimal Year2,
    decimal Year3
);

public record ProjectDto(
    int Id,
    string ProjectCode,
    string ProjectName,
    string? Description,
    string? IdpLink,
    string? IdpPriorityArea,
    string? IdpStrategicObjective,
    string Status,
    string Type,
    int? DepartmentId,
    string? DepartmentName,
    string? Ward,
    string? GpsCoordinates,
    string? ProjectManager,
    string? ContractorName,
    string? ContractNumber,
    string? FundingSource,
    DateTime? StartDate,
    DateTime? EndDate,
    decimal? TotalProjectCost,
    decimal TotalBudgetYear1,
    decimal TotalBudgetYear2,
    decimal TotalBudgetYear3,
    int BudgetLineCount,
    int ScoaLineCount,
    DateTime CreatedOn,
    List<ProjectBudgetLineDto>? BudgetLines,
    bool IsRegistered
);

public record CreateProjectDto(
    string ProjectCode,
    string ProjectName,
    string? Description,
    string? IdpLink,
    string? IdpPriorityArea,
    string? IdpStrategicObjective,
    int Type,
    int? DepartmentId,
    string? Ward,
    string? GpsCoordinates,
    string? ProjectManager,
    string? ContractorName,
    string? ContractNumber,
    string? FundingSource,
    DateTime? StartDate,
    DateTime? EndDate,
    decimal? TotalProjectCost,
    List<CreateProjectBudgetLineDto>? BudgetLines
);

public record UpdateProjectDto(
    string? ProjectName,
    string? Description,
    string? IdpLink,
    string? IdpPriorityArea,
    string? IdpStrategicObjective,
    int? Status,
    int? Type,
    int? DepartmentId,
    string? Ward,
    string? GpsCoordinates,
    string? ProjectManager,
    string? ContractorName,
    string? ContractNumber,
    string? FundingSource,
    DateTime? StartDate,
    DateTime? EndDate,
    decimal? TotalProjectCost,
    bool? IsRegistered
);

public record ProjectBudgetLineDto(
    int Id,
    int ProjectId,
    int ScoaItemId,
    string? ScoaItemCode,
    string? ScoaItemDescription,
    int ScoaFundId,
    string? ScoaFundCode,
    string? ScoaFundDescription,
    int ScoaFunctionId,
    string? ScoaFunctionCode,
    string? ScoaFunctionDescription,
    int ScoaRegionId,
    string? ScoaRegionCode,
    string? ScoaRegionDescription,
    int ScoaCostingId,
    string? ScoaCostingCode,
    string? ScoaCostingDescription,
    int? DepartmentId,
    string? DepartmentName,
    decimal Year1Amount,
    decimal Year2Amount,
    decimal Year3Amount,
    decimal Month01, decimal Month02, decimal Month03, decimal Month04,
    decimal Month05, decimal Month06, decimal Month07, decimal Month08,
    decimal Month09, decimal Month10, decimal Month11, decimal Month12
);

public record CreateProjectBudgetLineDto(
    int ScoaItemId,
    int ScoaFundId,
    int ScoaFunctionId,
    int ScoaRegionId,
    int ScoaCostingId,
    int? DepartmentId,
    decimal Year1Amount,
    decimal Year2Amount,
    decimal Year3Amount,
    decimal Month01, decimal Month02, decimal Month03, decimal Month04,
    decimal Month05, decimal Month06, decimal Month07, decimal Month08,
    decimal Month09, decimal Month10, decimal Month11, decimal Month12
);

public record UpdateProjectBudgetLineDto(
    int? Id,
    int ScoaItemId,
    int ScoaFundId,
    int ScoaFunctionId,
    int ScoaRegionId,
    int ScoaCostingId,
    int? DepartmentId,
    decimal Year1Amount,
    decimal Year2Amount,
    decimal Year3Amount,
    decimal Month01, decimal Month02, decimal Month03, decimal Month04,
    decimal Month05, decimal Month06, decimal Month07, decimal Month08,
    decimal Month09, decimal Month10, decimal Month11, decimal Month12
);

public record ReportFilterDto
{
    public int? FinancialYearId { get; set; }
    public int? BudgetVersionId { get; set; }
    public int? DepartmentId { get; set; }
    public string? FundCode { get; set; }
    public string? FunctionCode { get; set; }
}

public record MtrefSummaryDto(
    string Category,
    string SubCategory,
    decimal Year1,
    decimal Year2,
    decimal Year3,
    decimal Year1Variance,
    decimal Year2Variance
);

public record BudgetVsActualDto(
    string Category,
    string SegmentString,
    decimal BudgetAmount,
    decimal ActualAmount,
    decimal Variance,
    decimal VariancePercentage
);

public record ScheduleALineDto(
    string Code,
    string Description,
    string Category,
    decimal Year1,
    decimal Year2,
    decimal Year3
);

public record ScheduleADto(
    List<ScheduleALineDto> Lines,
    decimal TotalRevenue,
    decimal TotalExpenditure,
    decimal NetSurplusDeficit,
    decimal TotalRevenueYear2,
    decimal TotalExpenditureYear2,
    decimal NetSurplusDeficitYear2,
    decimal TotalRevenueYear3,
    decimal TotalExpenditureYear3,
    decimal NetSurplusDeficitYear3
);

public record MscoaStringExportDto(
    int Id,
    string FullSegmentString,
    string ItemCode, string ItemDescription,
    string FundCode, string FundDescription,
    string FunctionCode, string FunctionDescription,
    string ProjectCode, string ProjectDescription,
    string RegionCode, string RegionDescription,
    string CostingCode, string CostingDescription,
    string MscCode, string MscDescription,
    decimal Year1, decimal Year2, decimal Year3,
    string Description
);

public record VirementRegisterDto(
    string VirementNumber,
    string BudgetVersionName,
    string FromSegment,
    string ToSegment,
    decimal Amount,
    string Status,
    string Motivation,
    string CreatedBy,
    DateTime CreatedOn,
    string? ApprovedBy,
    DateTime? ApprovedOn
);

public record AdjustmentRegisterDto(
    int VersionId,
    string VersionName,
    string Status,
    decimal TotalAmount,
    int StringCount,
    string CreatedBy,
    DateTime CreatedOn,
    DateTime? CouncilAdoptionDate,
    string? Description
);

public record AiInsightDto(
    string Category,
    string Icon,
    string Title,
    string Description,
    string Severity,
    decimal? Value,
    string? Recommendation
);

public record AiAnalyticsDto(
    List<AiInsightDto> Insights,
    string OverallRating,
    string OverallSummary,
    decimal FiscalHealthScore,
    List<RiskItemDto> Risks,
    List<OpportunityDto> Opportunities,
    string? AiNarrative
);

public record RiskItemDto(
    string Title,
    string Description,
    string Severity,
    string Impact
);

public record OpportunityDto(
    string Title,
    string Description,
    string Impact,
    decimal PotentialSaving
);
