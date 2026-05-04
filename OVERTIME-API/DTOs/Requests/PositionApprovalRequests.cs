namespace PlatinumOvertime_API.DTOs.Requests;

public class UpdatePositionApprovalConfigRequest
{
    public bool IsOvertimeRecommender { get; set; }
    public bool IsOvertimeApprover { get; set; }
    public bool IsDepartmentExcessOvertimeApprover { get; set; }

    public List<ReportingRelationshipRequest> ReportingRelationships { get; set; } = new();
    public List<ActingAppointmentRequest> ActingAppointments { get; set; } = new();
}

public class ReportingRelationshipRequest
{
    public Guid? Id { get; set; }
    public string ReportsToPositionId { get; set; } = string.Empty;
    public string ReportsToPositionDescription { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ActingAppointmentRequest
{
    public Guid? Id { get; set; }
    public string ActingEmployeeId { get; set; } = string.Empty;
    public string ActingEmployeeName { get; set; } = string.Empty;
    public string ActingInPositionId { get; set; } = string.Empty;
    public string ActingInPositionDescription { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
