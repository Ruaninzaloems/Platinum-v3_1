using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.DTOs;

public record CreateBudgetVersionDto(
    int FinancialYearId,
    BudgetVersionType VersionType,
    string VersionName,
    string? Description,
    int? ParentVersionId
);

public record UpdateBudgetVersionDto(
    string? VersionName,
    string? Description,
    DateTime? CouncilAdoptionDate,
    string? LgdrsSubmissionRef
);

public record BudgetVersionSummaryDto(
    int Id,
    string FinancialYear,
    string VersionType,
    string VersionName,
    string Description,
    string Status,
    int? ParentVersionId,
    DateTime? CouncilAdoptionDate,
    string? LgdrsSubmissionRef,
    string? LockedBy,
    DateTime? LockedOn,
    string CreatedBy,
    DateTime CreatedOn,
    int TotalStrings,
    decimal TotalYear1,
    decimal TotalYear2,
    decimal TotalYear3
);

public record BudgetVersionDetailDto(
    int Id,
    int FinancialYearId,
    string FinancialYear,
    string VersionType,
    string VersionName,
    string Description,
    string Status,
    int? ParentVersionId,
    string? ParentVersionName,
    DateTime? CouncilAdoptionDate,
    string? LgdrsSubmissionRef,
    string? LockedBy,
    DateTime? LockedOn,
    string CreatedBy,
    DateTime CreatedOn,
    int TotalStrings,
    decimal TotalRevenue,
    decimal TotalExpenditure,
    decimal TotalCapital,
    decimal TotalYear1,
    decimal TotalYear2,
    decimal TotalYear3,
    List<ApprovalDto> Approvals
);

public record ApprovalDto(
    int Id,
    string EntityType,
    int Step,
    string? LevelName,
    string Decision,
    string? Comment,
    string UserId,
    string UserName,
    DateTime Timestamp
);

public record ApprovalActionDto(
    string? Comment,
    string UserId,
    string UserName,
    string? ApprovalLevel = null
);

public record CloneBudgetVersionDto(
    BudgetVersionType TargetVersionType,
    string VersionName,
    string? Description
);

public record VersionDiffDto(
    int VersionAId,
    string VersionAName,
    int VersionBId,
    string VersionBName,
    decimal VersionATotalYear1,
    decimal VersionBTotalYear1,
    decimal DifferenceYear1,
    int AddedStrings,
    int RemovedStrings,
    int ModifiedStrings,
    List<DiffLineDto> Lines
);

public record DiffLineDto(
    string SegmentString,
    string? Description,
    decimal? VersionAAmount,
    decimal? VersionBAmount,
    decimal Difference,
    string ChangeType
);
