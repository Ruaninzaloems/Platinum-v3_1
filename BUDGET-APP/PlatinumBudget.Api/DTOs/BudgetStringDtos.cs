using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.DTOs;

public record CreateBudgetStringDto(
    int BudgetVersionId,
    int? ProjectId,
    SourceModule SourceModule,
    int ScoaItemId,
    int ScoaFundId,
    int ScoaFunctionId,
    int ScoaProjectId,
    int ScoaRegionId,
    int ScoaCostingId,
    int ScoaMscId,
    decimal Year1Amount,
    decimal Year2Amount,
    decimal Year3Amount,
    decimal[]? MonthlySplit,
    string? Description,
    string? OriginRefId,
    string? AssumptionsRef
);

public record UpdateBudgetStringDto(
    decimal? Year1Amount,
    decimal? Year2Amount,
    decimal? Year3Amount,
    decimal[]? MonthlySplit,
    string? Description
);

public record BudgetStringListDto(
    int Id,
    int BudgetVersionId,
    int? ProjectId,
    string? ProjectCode,
    string? ProjectName,
    string SourceModule,
    string SegmentString,
    string ItemCode,
    string ItemDescription,
    string FundCode,
    string FundDescription,
    string FunctionCode,
    string FunctionDescription,
    string ProjectSegCode,
    string ProjectSegDescription,
    string RegionCode,
    string RegionDescription,
    string CostingCode,
    string CostingDescription,
    string MscCode,
    string MscDescription,
    decimal Year1Amount,
    decimal Year2Amount,
    decimal Year3Amount,
    string? Description,
    DateTime CreatedOn
);

public record BudgetStringDetailDto(
    int Id,
    int BudgetVersionId,
    int? ProjectId,
    string? ProjectCode,
    string SourceModule,
    int ScoaItemId,
    string ItemCode,
    string ItemDescription,
    int ScoaFundId,
    string FundCode,
    string FundDescription,
    int ScoaFunctionId,
    string FunctionCode,
    string FunctionDescription,
    int ScoaProjectId,
    string ProjectSegCode,
    string ProjectSegDescription,
    int ScoaRegionId,
    string RegionCode,
    string RegionDescription,
    int ScoaCostingId,
    string CostingCode,
    string CostingDescription,
    int ScoaMscId,
    string MscCode,
    string MscDescription,
    decimal Year1Amount,
    decimal Year2Amount,
    decimal Year3Amount,
    decimal[] MonthlySplit,
    string? Description,
    string? OriginRefId,
    string? AssumptionsRef,
    string CreatedBy,
    DateTime CreatedOn
);

public record BudgetStringSummaryDto(
    string GroupKey,
    string GroupLabel,
    int Count,
    decimal TotalYear1,
    decimal TotalYear2,
    decimal TotalYear3
);

public record ValidationRunDto(
    Guid RunId,
    int BudgetVersionId,
    int TotalStrings,
    int Passed,
    int Warnings,
    int Errors,
    List<ValidationResultDto> Results
);

public record ValidationResultDto(
    int Id,
    int? BudgetStringId,
    string? SegmentString,
    string Status,
    string RuleCode,
    string Message,
    string? SuggestedFix,
    DateTime Timestamp
);

public record ScoaSegmentDto(
    int Id,
    string Code,
    string Description,
    int? ParentId,
    int Level,
    bool IsActive
);

public record ValidateCombinationDto(
    int? ScoaItemId,
    int? ScoaFundId,
    int? ScoaFunctionId,
    int? ScoaProjectId,
    int? ScoaRegionId,
    int? ScoaCostingId,
    int? ScoaMscId
);

public record CombinationValidationResultDto(
    bool IsValid,
    List<string> Warnings,
    List<string> Errors
);
