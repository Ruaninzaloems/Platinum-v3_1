namespace PlatinumBudget.Api.DTOs;

public record VirementPolicyDto(
    int Id,
    int FinancialYearId,
    string FinancialYear,
    string PolicyVersion,
    bool IsActive,
    bool IsLocked,
    string? LockedBy,
    DateTime? LockedOn,
    string CreatedBy,
    DateTime CreatedOn,
    List<VirementPolicyRuleDto> Rules
);

public record VirementPolicyRuleDto(
    int Id,
    int VirementPolicyId,
    bool IsEnabled,
    string Principle,
    string Description,
    string ValidationRule,
    string Severity,
    string? SegmentType,
    string? FromSegmentFilter,
    string? ToSegmentFilter,
    decimal? ThresholdPercent,
    decimal? MaxAmount,
    bool RequiresCouncilApproval,
    int SortOrder
);

public record CreateVirementPolicyDto(
    int FinancialYearId
);

public record UpdateVirementPolicyRuleDto(
    int Id,
    bool IsEnabled,
    string Principle,
    string Description,
    string ValidationRule,
    string Severity,
    string? SegmentType,
    string? FromSegmentFilter,
    string? ToSegmentFilter,
    decimal? ThresholdPercent,
    decimal? MaxAmount,
    bool RequiresCouncilApproval,
    int SortOrder
);

public record CreateVirementPolicyRuleDto(
    int VirementPolicyId,
    string Principle,
    string Description,
    string ValidationRule,
    string Severity,
    string? SegmentType,
    string? FromSegmentFilter,
    string? ToSegmentFilter,
    decimal? ThresholdPercent,
    decimal? MaxAmount,
    bool RequiresCouncilApproval
);

public record VirementValidationResultDto(
    bool IsValid,
    List<VirementRuleViolationDto> Violations
);

public record VirementRuleViolationDto(
    string RulePrinciple,
    string Description,
    string Severity,
    string Message
);
