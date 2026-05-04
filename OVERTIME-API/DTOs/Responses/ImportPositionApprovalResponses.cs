namespace PlatinumOvertime_API.DTOs.Responses;

public class PositionConfigChangeDto
{
    public string PositionId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsRecommender { get; set; }
    public bool IsApprover { get; set; }
    public bool IsDeptExcessApprover { get; set; }
}

public class ReportingRelationshipChangeDto
{
    public string PositionId { get; set; } = string.Empty;
    public string ReportsToPositionId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ActingAppointmentChangeDto
{
    public string ActingEmployeeId { get; set; } = string.Empty;
    public string ActingInPositionId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class ImportRowErrorDto
{
    public string Sheet { get; set; } = string.Empty;
    public int Row { get; set; }
    public string Error { get; set; } = string.Empty;
}

public class ImportPositionApprovalValidationResultDto
{
    public List<PositionConfigChangeDto> PositionConfigChanges { get; set; } = new();
    public List<ReportingRelationshipChangeDto> ReportingRelationshipChanges { get; set; } = new();
    public List<ActingAppointmentChangeDto> ActingAppointmentChanges { get; set; } = new();
    public List<ImportRowErrorDto> Errors { get; set; } = new();
    public int AcceptedRows { get; set; }
    public int ErrorRows { get; set; }
}

public class ImportPositionApprovalResultDto
{
    public int PositionsUpdated { get; set; }
    public int ReportingRelationshipsApplied { get; set; }
    public int ActingAppointmentsApplied { get; set; }
}
