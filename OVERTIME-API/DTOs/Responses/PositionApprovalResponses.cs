namespace PlatinumOvertime_API.DTOs.Responses;

public class PositionApprovalConfigDto
{
    public Guid Id { get; set; }
    public string PositionId { get; set; } = string.Empty;
    public string PositionDescription { get; set; } = string.Empty;

    public bool IsOvertimeRecommender { get; set; }
    public bool IsOvertimeApprover { get; set; }
    public bool IsDepartmentExcessOvertimeApprover { get; set; }

    public List<ReportingRelationshipDto> ReportingRelationships { get; set; } = new();
    public List<ActingAppointmentDto> ActingAppointments { get; set; } = new();

    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public class ReportingRelationshipDto
{
    public Guid Id { get; set; }
    public string ReportsToPositionId { get; set; } = string.Empty;
    public string ReportsToPositionDescription { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ActingAppointmentDto
{
    public Guid Id { get; set; }
    public string ActingEmployeeId { get; set; } = string.Empty;
    public string ActingEmployeeName { get; set; } = string.Empty;
    public string ActingInPositionId { get; set; } = string.Empty;
    public string ActingInPositionDescription { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
