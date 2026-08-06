namespace PlatinumOvertime_API.DTOs.Responses;

public record ChainPreviewPersonDto(
    string? EmployeeId,
    string? EmployeeName,
    string? PositionId,
    string? PositionName,
    bool IsActing
);

public record ChainPreviewDto(
    ChainPreviewPersonDto? Recommender,
    ChainPreviewPersonDto? Approver,
    bool ExcessApproverConfigured,
    /// <summary>
    /// Non-null when the chain could not be fully resolved for the requested position.
    /// The UI should display this message and disable submission.
    /// </summary>
    string? ChainError = null
);
